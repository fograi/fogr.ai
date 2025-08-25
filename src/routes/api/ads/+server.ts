import type { RequestHandler } from '@sveltejs/kit';
import type { R2Bucket } from '@cloudflare/workers-types';
import { error } from '@sveltejs/kit';
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

// === NEW === small helper for R2 key extension
function extFromMime(type: string) {
	if (type === 'image/jpeg') return 'jpg';
	if (type === 'image/png') return 'png';
	if (type === 'image/webp') return 'webp';
	return 'bin';
}

// ----------------- OpenAI moderation helpers -----------------
function shouldFlag(
	res: OpenAI.Moderations.ModerationCreateResponse & {
		_request_id?: string | null;
	}
): boolean {
	if (res.results.some((r) => r.flagged)) return true;
	const scores = res.results[0]?.category_scores ?? {};

	if ((scores['sexual/minors'] ?? 0) > 0.005) return true;
	if ((scores['sexual'] ?? 0) >= 0.35) return true;
	if ((scores['violence/graphic'] ?? 0) >= 0.4) return true;
	if ((scores['hate/threatening'] ?? 0) >= 0.4) return true;
	if ((scores['harassment/threatening'] ?? 0) >= 0.4) return true;
	if ((scores['violence'] ?? 0) >= 0.5) return true;
	if ((scores['hate'] ?? 0) >= 0.4) return true;
	if ((scores['harassment'] ?? 0) >= 0.6) return true;
	if ((scores['illicit/violent'] ?? 0) >= 0.3) return true;
	if ((scores['illicit'] ?? 0) >= 0.35) return true;
	if ((scores['self-harm/instructions'] ?? 0) >= 0.15) return true;
	if ((scores['self-harm/intent'] ?? 0) >= 0.15) return true;
	if ((scores['self-harm'] ?? 0) >= 0.2) return true;

	return false;
}

async function moderateText(openai: OpenAI, text: string): Promise<boolean> {
	try {
		const res = await openai.moderations.create({
			model: 'omni-moderation-latest',
			input: text
		});
		return shouldFlag(res);
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
		return shouldFlag(res);
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
		return shouldFlag(res);
	} catch {
		return true;
	}
}

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	// Auth
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();
	if (!user) throw error(401, 'Auth required');

	try {
		const env = platform?.env as {
			R2_BUCKET?: R2Bucket;
			R2_PUBLIC_BASE?: string;
			OPENAI_API_KEY?: string;
		};
		// OpenAI key from CF env (you already used platform.env — keep that)
		const openAiApiKey = env?.OPENAI_API_KEY as string | undefined;
		if (!openAiApiKey) return errorResponse('Missing OPENAI_API_KEY', 500);

		// R2 + public base from CF env
		const bucket = env?.R2_BUCKET;
		if (!bucket || typeof bucket.put !== 'function') {
			console.warn('R2 bucket binding missing/invalid. Run with `wrangler dev` so bindings exist.');
			return errorResponse('Storage temporarily unavailable', 503);
		}
		const publicBase = (env?.R2_PUBLIC_BASE ?? '').replace(/\/+$/, '');
		if (!publicBase) return errorResponse('Missing R2_PUBLIC_BASE', 500);

		const openai = new OpenAI({ apiKey: openAiApiKey });

		const form = await request.formData();

		// accept either "image" (single) or "images" (multi) from legacy clients
		const category = form.get('category')?.toString() || '';
		const title = form.get('title')?.toString() || '';
		const description = form.get('description')?.toString() || '';
		const priceStr = form.get('price')?.toString() ?? null;
		// === NEW === optional passthroughs for DB
		const currency = form.get('currency')?.toString() || 'EUR';

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
			const flagged = await moderateText(openai, combinedText);
			if (flagged) return errorResponse('Failed AI moderation.');
		} else if (files.length === 1) {
			const dataUrl = await fileToDataUrl(files[0]);
			const flagged = await moderateTextAndImage(openai, combinedText, dataUrl);
			if (flagged) return errorResponse('Failed AI moderation.');
		} else {
			if (combinedImage) {
				const cleaned = cleanDataUrlBase64(combinedImage);
				const dataUrl = `data:image/png;base64,${cleaned}`;
				const flagged = await moderateTextAndImage(openai, combinedText, dataUrl);
				if (flagged) return errorResponse('Failed AI moderation.');
			} else {
				const MAX_CHECK = Math.min(files.length, 3);
				for (let i = 0; i < MAX_CHECK; i++) {
					const dataUrl = await fileToDataUrl(files[i]);
					const flagged = await moderateSingleImage(openai, dataUrl);
					if (flagged) return errorResponse('Failed AI moderation.');
				}
			}
		}

		// === NEW === 1) Insert row first to get id
		const { data: inserted, error: insErr } = await locals.supabase
			.from('ads')
			.insert({
				user_id: user.id,
				title,
				description,
				category,
				price: priceStr ? Number(priceStr) : 0,
				currency,
				image_urls: [] // fill after uploads (if any)
			})
			.select('id')
			.single();
		console.error('inserted', inserted, 'insErr', insErr);
		if (insErr || !inserted) {
			return errorResponse('Failed to save ad (insert).', 500);
		}

		const adId: string = inserted.id;

		// === NEW === 2) Upload to R2 and collect public URLs
		let image_urls: string[] = [];
		if (files.length > 0) {
			const uploads = files.map(async (file, idx) => {
				const ext =
					file.type === 'image/jpeg'
						? 'jpg'
						: file.type === 'image/png'
							? 'png'
							: file.type === 'image/webp'
								? 'webp'
								: 'bin';

				const key = `ads/${user.id}/${adId}/${String(idx).padStart(2, '0')}.${ext}`;

				// ✅ Pass File (Blob) directly
				await bucket.put(key, await file.arrayBuffer(), {
					httpMetadata: {
						contentType: file.type,
						cacheControl: 'public, max-age=31536000, immutable'
					}
				});

				return `${publicBase}/${key}`;
			});

			image_urls = await Promise.all(uploads);

			// === NEW === 3) Update row with image URLs
			const { error: updErr } = await locals.supabase
				.from('ads')
				.update({ image_urls })
				.eq('id', adId);

			if (updErr) {
				return errorResponse('Saved ad but failed to attach images.', 500);
			}
		}

		// === NEW === 4) Return the id so the client can redirect
		return json(200, {
			success: true,
			id: adId,
			message: 'Ad submitted successfully!',
			image_urls
		});
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : 'Internal error';
		return errorResponse(msg, 500);
	}
};
