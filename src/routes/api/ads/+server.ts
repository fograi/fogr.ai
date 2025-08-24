// src/routes/api/ads/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import OpenAI from 'openai';
const { default: filter } = await import('leo-profanity');
const { RegExpMatcher, englishDataset, englishRecommendedTransformers } = await import('obscenity');
import {
	MIN_TITLE_LENGTH,
	MAX_TITLE_LENGTH,
	MIN_DESC_LENGTH,
	MAX_DESC_LENGTH,
	ALLOWED_IMAGE_TYPES,
	MAX_IMAGE_SIZE
} from '$lib/constants';
import { bannedWords } from '$lib/banned-words';

import { OPENAI_API_KEY } from '$env/static/private';

filter.add(bannedWords);
const obscenity = new RegExpMatcher({
	...englishDataset.build(),
	...englishRecommendedTransformers
});

function json(status: number, body: unknown) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}
const errorResponse = (message: string, status = 400) => json(status, { success: false, message });

function arrayBufferToBase64(buf: ArrayBuffer): string {
	const bytes = new Uint8Array(buf);
	const chunk = 0x8000;
	let binary = '';
	for (let i = 0; i < bytes.length; i += chunk) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
	}
	return btoa(binary);
}

async function fileToDataUrl(file: File): Promise<string> {
	const base64 = arrayBufferToBase64(await file.arrayBuffer());
	return `data:${file.type};base64,${base64}`;
}

function cleanDataUrlBase64(dataUrl: string): string {
	const base64 = dataUrl.split(',')[1]?.trim() || '';
	// strip whitespace and invalid chars, ensure padding
	let cleaned = base64.replace(/\s/g, '').replace(/[^A-Za-z0-9+/=]/g, '');
	while (cleaned.length % 4 !== 0) cleaned += '=';
	// quick sanity check
	if (cleaned.length < 1000) {
		// ~very small image; not fatal, just a warning if you log server-side
		console.warn('Decoded image seems small');
	}
	return cleaned;
}

// ----------------- OpenAI moderation helpers -----------------
async function moderateText(openai: OpenAI, text: string): Promise<boolean> {
	try {
		const res = await openai.moderations.create({
			model: 'omni-moderation-latest',
			input: text
		});
        console.info(res);
		return res.results.some((r) => r.flagged);
	} catch {
		return true; // fail closed
	}
}

type AnyModerationInput = Array<
	{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }
>;

async function moderateTextAndImage(
	openai: OpenAI,
	text: string,
	imageDataUrl: string
): Promise<boolean> {
	try {
		const input: AnyModerationInput = [
			{ type: 'text', text },
			{ type: 'image_url', image_url: { url: imageDataUrl } }
		];
		const res = await openai.moderations.create({
			model: 'omni-moderation-latest',
			input
		});
		return res.results.some((r) => r.flagged);
	} catch {
		return true;
	}
}

async function moderateSingleImage(openai: OpenAI, imageDataUrl: string): Promise<boolean> {
	try {
		const input: AnyModerationInput = [{ type: 'image_url', image_url: { url: imageDataUrl } }];
		const res = await openai.moderations.create({
			model: 'omni-moderation-latest',
			input
		});
		return res.results.some((r) => r.flagged);
	} catch {
		return true;
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const apiKey = OPENAI_API_KEY;
		if (!apiKey) return errorResponse('Missing OPENAI_API_KEY', 500);

		const openai = new OpenAI({ apiKey });

		const form = await request.formData();

		// accept either "image" (single) or "images" (multi) from legacy clients
		const category = form.get('category')?.toString() || '';
		const title = form.get('title')?.toString() || '';
		const description = form.get('description')?.toString() || '';
		const priceStr = form.get('price')?.toString() ?? null;

		// single file
		const imageSingle = form.get('image');
		// multi files
		const imagesMulti = form.getAll('images');

		const combinedImage = form.get('combinedImage')?.toString() || null;

		// unify files list
		const files: File[] = [];
		if (imageSingle instanceof File && imageSingle.size > 0) files.push(imageSingle);
		for (const f of imagesMulti) {
			if (f instanceof File && f.size > 0) files.push(f);
		}

		// ------------ validations ------------
		if (!category) return errorResponse('Category is required.');

		if (title.length < MIN_TITLE_LENGTH) return errorResponse('Title too short.');
		if (title.length > MAX_TITLE_LENGTH) return errorResponse('Title too long.', 413);

		if (description.length < MIN_DESC_LENGTH) return errorResponse('Description too short.');
		if (description.length > MAX_DESC_LENGTH) return errorResponse('Description too long.', 413);

		if (priceStr !== null) {
			const n = Number(priceStr);
			if (Number.isNaN(n) || n < 0) return errorResponse('Invalid price.');
		}

		// ------------ local moderation (fast) ------------
		const combinedText = `${title} ${description}`;

		if (filter.check(combinedText)) return errorResponse('Failed profanity filter.');
		if (obscenity.hasMatch(combinedText)) return errorResponse('Failed obscenity filter.');

		// ------------ image validations ------------
		if (files.length > 0) {
			const badType = files.find((f) => !ALLOWED_IMAGE_TYPES.includes(f.type));
			if (badType) return errorResponse('Invalid image type(s).', 415);

			const tooLarge = files.find((f) => f.size > MAX_IMAGE_SIZE);
			if (tooLarge) return errorResponse('Image(s) too large.', 413);
		}

		// ------------ OpenAI moderation (final gate) ------------
		if (files.length === 0) {
			// text-only
			const flagged = await moderateText(openai, combinedText);
			if (flagged) return errorResponse('Failed AI moderation.');
		} else if (files.length === 1) {
			// text + single image
			const dataUrl = await fileToDataUrl(files[0]);
			const flagged = await moderateTextAndImage(openai, combinedText, dataUrl);
			if (flagged) return errorResponse('Failed AI moderation.');
		} else {
			// multiple images
			if (combinedImage) {
				// client provided a collage/combined PNG
				const cleaned = cleanDataUrlBase64(combinedImage);
				const dataUrl = `data:image/png;base64,${cleaned}`;
				const flagged = await moderateTextAndImage(openai, combinedText, dataUrl);
				if (flagged) return errorResponse('Failed AI moderation.');
			} else {
				// fallback: check first N images individually (cheap + simple)
				const MAX_CHECK = Math.min(files.length, 3);
				for (let i = 0; i < MAX_CHECK; i++) {
					const dataUrl = await fileToDataUrl(files[i]);
					const flagged = await moderateSingleImage(openai, dataUrl);
					if (flagged) return errorResponse('Failed AI moderation.');
				}
			}
		}

		// done
		return json(200, { success: true, message: 'Ad submitted successfully!' });
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : 'Internal error';
		return errorResponse(msg, 500);
	}
};
