import type { RequestHandler } from '@sveltejs/kit';
import type { KVNamespace, R2Bucket } from '@cloudflare/workers-types';
import { error, json } from '@sveltejs/kit';
import OpenAI from 'openai';
import { dev } from '$app/environment';
const { default: filter } = await import('leo-profanity');
const { RegExpMatcher, englishDataset, englishRecommendedTransformers } = await import('obscenity');
import {
	MIN_TITLE_LENGTH,
	MAX_TITLE_LENGTH,
	MIN_DESC_LENGTH,
	MAX_DESC_LENGTH,
	ALLOWED_IMAGE_TYPES,
	MAX_IMAGE_SIZE,
	MAX_IMAGE_COUNT,
	MAX_TOTAL_IMAGE_SIZE
} from '$lib/constants';
import { bannedWords } from '$lib/banned-words';
import { validateAdMeta } from '$lib/server/ads-validation';
import { isSameOrigin } from '$lib/server/csrf';
import { E2E_MOCK_AD, isE2eMock } from '$lib/server/e2e-mocks';
import { getPagination } from '$lib/server/pagination';
import { checkRateLimit } from '$lib/server/rate-limit';

filter.add(bannedWords);
const obscenity = new RegExpMatcher({
	...englishDataset.build(),
	...englishRecommendedTransformers
});

const RATE_LIMIT_10M = 5;
const RATE_LIMIT_DAY = 30;
const WINDOW_10M_SECONDS = 10 * 60;
const WINDOW_DAY_SECONDS = 24 * 60 * 60;
const PUBLIC_AD_STATUS = 'active';
let warnedMissingRateLimit = false;

const errorResponse = (message: string, status = 400, requestId?: string) =>
	json(
		{ success: false, message, requestId },
		{
			status,
			headers: requestId ? { 'x-request-id': requestId } : undefined
		}
	);

const rateLimitResponse = (retryAfterSeconds: number, requestId?: string) =>
	json(
		{ success: false, message: 'Rate limit exceeded. Please try again later.', requestId },
		{
			status: 429,
			headers: {
				...(requestId ? { 'x-request-id': requestId } : {}),
				'Retry-After': String(retryAfterSeconds)
			}
		}
	);

const makeRequestId = () =>
	crypto?.randomUUID?.() ??
	`req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

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

function base64DecodedBytes(base64: string): number {
	if (!base64) return 0;
	const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
	return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

// ----------------- OpenAI moderation helpers -----------------
type ModerationDecision = 'allow' | 'flagged' | 'unavailable';

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

async function moderateText(openai: OpenAI, text: string): Promise<ModerationDecision> {
	try {
		const res = await openai.moderations.create({
			model: 'omni-moderation-latest',
			input: text
		});
		return shouldFlag(res) ? 'flagged' : 'allow';
	} catch {
		return 'unavailable';
	}
}

type AnyModerationInput = Array<
	{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }
>;

async function moderateTextAndImage(
	openai: OpenAI,
	text: string,
	imageDataUrl: string
): Promise<ModerationDecision> {
	try {
		const input: AnyModerationInput = [
			{ type: 'text', text },
			{ type: 'image_url', image_url: { url: imageDataUrl } }
		];
		const res = await openai.moderations.create({
			model: 'omni-moderation-latest',
			input
		});
		return shouldFlag(res) ? 'flagged' : 'allow';
	} catch {
		return 'unavailable';
	}
}

async function moderateSingleImage(
	openai: OpenAI,
	imageDataUrl: string
): Promise<ModerationDecision> {
	try {
		const input: AnyModerationInput = [{ type: 'image_url', image_url: { url: imageDataUrl } }];
		const res = await openai.moderations.create({
			model: 'omni-moderation-latest',
			input
		});
		return shouldFlag(res) ? 'flagged' : 'allow';
	} catch {
		return 'unavailable';
	}
}

export const POST: RequestHandler = async (event) => {
	const { request, locals, platform } = event;
	const requestId = makeRequestId();
	const log = (
		level: 'info' | 'warn' | 'error',
		message: string,
		extra: Record<string, unknown> = {}
	) => console[level](JSON.stringify({ level, message, requestId, ...extra }));
	if (!isSameOrigin(request, event.url)) {
		return errorResponse('Forbidden', 403, requestId);
	}
	// Auth
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();
	if (!user) throw error(401, 'Auth required');

	const email = user.email ?? null;
	log('info', 'ads_post_start', { userId: user.id });

	try {
		const env = platform?.env as {
			ADS_BUCKET?: R2Bucket;
			ADS_PENDING_BUCKET?: R2Bucket;
			PUBLIC_R2_BASE?: string;
			OPENAI_API_KEY?: string;
			RATE_LIMIT?: KVNamespace;
		};
		const rateLimitKv = env?.RATE_LIMIT;
		const openAiApiKey = env?.OPENAI_API_KEY as string | undefined;
		const publicBucket = env?.ADS_BUCKET;
		const pendingBucket = env?.ADS_PENDING_BUCKET;
		const publicBase = env?.PUBLIC_R2_BASE?.replace(/\/$/, '');

		if (!dev) {
			const missing: string[] = [];
			if (!openAiApiKey) missing.push('OPENAI_API_KEY');
			if (!publicBase) missing.push('PUBLIC_R2_BASE');
			if (!rateLimitKv) missing.push('RATE_LIMIT');
			if (!publicBucket || typeof publicBucket.put !== 'function') missing.push('ADS_BUCKET');
			if (!pendingBucket || typeof pendingBucket.put !== 'function') missing.push('ADS_PENDING_BUCKET');
			if (missing.length > 0) {
				log('error', 'ads_post_missing_bindings', { missing });
				return errorResponse(
					`Missing required bindings: ${missing.join(', ')}`,
					500,
					requestId
				);
			}
		}
		if (rateLimitKv) {
			const ip =
				request.headers.get('CF-Connecting-IP') ??
				request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
				'';
			const actorKey = user?.id ? `u:${user.id}` : ip ? `ip:${ip}` : 'anon';

			const limit10m = await checkRateLimit(
				rateLimitKv,
				`ads:post:10m:${actorKey}`,
				RATE_LIMIT_10M,
				WINDOW_10M_SECONDS
			);
			if (!limit10m.allowed) {
				log('warn', 'ads_post_rate_limited_10m', { userId: user.id });
				return rateLimitResponse(limit10m.retryAfter ?? WINDOW_10M_SECONDS, requestId);
			}

			const dayKey = new Date().toISOString().slice(0, 10);
			const limitDay = await checkRateLimit(
				rateLimitKv,
				`ads:post:day:${dayKey}:${actorKey}`,
				RATE_LIMIT_DAY,
				WINDOW_DAY_SECONDS
			);
			if (!limitDay.allowed) {
				log('warn', 'ads_post_rate_limited_day', { userId: user.id });
				return rateLimitResponse(limitDay.retryAfter ?? WINDOW_DAY_SECONDS, requestId);
			}
		} else if (!warnedMissingRateLimit) {
			console.warn('RATE_LIMIT KV binding missing; rate limiting disabled.');
			warnedMissingRateLimit = true;
		}
		// OpenAI key from CF env (you already used platform.env — keep that)
		if (!openAiApiKey) return errorResponse('Missing OPENAI_API_KEY', 500, requestId);

		// R2 buckets from CF env
		if (!publicBucket || typeof publicBucket.put !== 'function') {
			console.warn('Public R2 bucket binding missing/invalid. Run with `wrangler dev` so bindings exist.');
			return errorResponse('Storage temporarily unavailable', 503, requestId);
		}
		if (!publicBase) return errorResponse('Missing PUBLIC_R2_BASE', 500, requestId);

		const openai = new OpenAI({ apiKey: openAiApiKey });

		const form = await request.formData();

		// accept either "image" (single) or "images" (multi) from legacy clients
		const category = form.get('category')?.toString() || '';
		const title = form.get('title')?.toString() || '';
		const description = form.get('description')?.toString() || '';
		const priceStr = form.get('price')?.toString() ?? null;
		const ageConfirmed = form.get('age_confirmed')?.toString() === '1';
		// === NEW === optional passthroughs for DB
		const currencyRaw = form.get('currency')?.toString() || 'EUR';
		const currency = currencyRaw.trim().toUpperCase();

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
		if (files.length > MAX_IMAGE_COUNT) {
			return errorResponse(`Too many images (max ${MAX_IMAGE_COUNT}).`, 413, requestId);
		}
		const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
		if (totalBytes > MAX_TOTAL_IMAGE_SIZE) {
			return errorResponse('Total image size too large.', 413, requestId);
		}

		// ------------ validations ------------
		if (!ageConfirmed) return errorResponse('Must confirm you are 18 or older.', 400, requestId);
		const metaError = validateAdMeta({ category, currency, priceStr });
		if (metaError) return errorResponse(metaError, 400, requestId);

		if (title.length < MIN_TITLE_LENGTH) return errorResponse('Title too short.', 400, requestId);
		if (title.length > MAX_TITLE_LENGTH) return errorResponse('Title too long.', 413, requestId);

		if (description.length < MIN_DESC_LENGTH)
			return errorResponse('Description too short.', 400, requestId);
		if (description.length > MAX_DESC_LENGTH)
			return errorResponse('Description too long.', 413, requestId);

		// category, currency, and price are validated above

		// ------------ local moderation (fast) ------------
		const combinedText = `${title} ${description}`;
		if (filter.check(combinedText))
			return errorResponse('Failed profanity filter.', 400, requestId);
		if (obscenity.hasMatch(combinedText))
			return errorResponse('Failed obscenity filter.', 400, requestId);

		// ------------ image validations ------------
		if (files.length > 0) {
			const badType = files.find((f) => !ALLOWED_IMAGE_TYPES.includes(f.type));
			if (badType) return errorResponse('Invalid image type(s).', 415, requestId);

			const tooLarge = files.find((f) => f.size > MAX_IMAGE_SIZE);
			if (tooLarge) return errorResponse('Image(s) too large.', 413, requestId);
		}

		let moderationUnavailable = false;

		// ------------ OpenAI moderation (final gate) ------------
		if (files.length === 0) {
			const result = await moderateText(openai, combinedText);
			if (result === 'flagged') return errorResponse('Failed AI moderation.', 400, requestId);
			if (result === 'unavailable') moderationUnavailable = true;
		} else if (files.length === 1) {
			const dataUrl = await fileToDataUrl(files[0]);
			const result = await moderateTextAndImage(openai, combinedText, dataUrl);
			if (result === 'flagged') return errorResponse('Failed AI moderation.', 400, requestId);
			if (result === 'unavailable') moderationUnavailable = true;
		} else {
			if (combinedImage) {
				const cleaned = cleanDataUrlBase64(combinedImage);
				const combinedBytes = base64DecodedBytes(cleaned);
				if (combinedBytes > MAX_TOTAL_IMAGE_SIZE) {
					return errorResponse('Combined image too large.', 413, requestId);
				}
				const dataUrl = `data:image/png;base64,${cleaned}`;
				const result = await moderateTextAndImage(openai, combinedText, dataUrl);
				if (result === 'flagged') return errorResponse('Failed AI moderation.', 400, requestId);
				if (result === 'unavailable') moderationUnavailable = true;
			} else {
				const MAX_CHECK = Math.min(files.length, 3);
				for (let i = 0; i < MAX_CHECK; i++) {
					const dataUrl = await fileToDataUrl(files[i]);
					const result = await moderateSingleImage(openai, dataUrl);
					if (result === 'flagged') return errorResponse('Failed AI moderation.', 400, requestId);
					if (result === 'unavailable') {
						moderationUnavailable = true;
						break;
					}
				}
			}
		}

		const status = moderationUnavailable ? 'pending' : PUBLIC_AD_STATUS;

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
				image_keys: [],
				email,
				status
			})
			.select('id')
			.single();
		if (insErr || !inserted) {
			return errorResponse('Failed to save ad (insert).', 500, requestId);
		}

		const adId: string = inserted.id;

		// === NEW === 2) Upload to R2 and collect image keys
		let image_keys: string[] = [];
		if (files.length > 0) {
			const targetBucket = moderationUnavailable ? pendingBucket : publicBucket;
			const cacheControl = moderationUnavailable
				? 'private, max-age=86400'
				: 'public, max-age=31536000, immutable';
			if (!targetBucket || typeof targetBucket.put !== 'function') {
				const bucketLabel = moderationUnavailable ? 'Pending' : 'Public';
				console.warn(
					`${bucketLabel} R2 bucket binding missing/invalid. Run with \`wrangler dev\` so bindings exist.`
				);
				await locals.supabase.from('ads').delete().eq('id', adId);
				return errorResponse('Storage temporarily unavailable', 503, requestId);
			}

			const uploads = files.map(async (file, idx) => {
				const ext =
					file.type === 'image/jpeg'
						? 'jpg'
						: file.type === 'image/png'
							? 'png'
							: file.type === 'image/webp'
								? 'webp'
								: 'bin';

				const key = `${user.id}/${adId}/${String(idx).padStart(2, '0')}.${ext}`;

				await targetBucket.put(key, await file.arrayBuffer(), {
					httpMetadata: {
						contentType: file.type,
						cacheControl
					}
				});

				return key;
			});

			const results = await Promise.allSettled(uploads);
			image_keys = results
				.filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
				.map((r) => r.value);

			if (results.some((r) => r.status === 'rejected')) {
				await Promise.allSettled(image_keys.map((key) => targetBucket.delete(key)));
				await locals.supabase.from('ads').delete().eq('id', adId);
				return errorResponse('Failed to upload images.', 500, requestId);
			}

			// === NEW === 3) Update row with image keys
			const { error: updErr } = await locals.supabase
				.from('ads')
				.update({ image_keys })
				.eq('id', adId);

			if (updErr) {
				await Promise.allSettled(image_keys.map((key) => targetBucket.delete(key)));
				await locals.supabase.from('ads').delete().eq('id', adId);
				return errorResponse('Saved ad but failed to attach images.', 500, requestId);
			}
		}

		// === NEW === 4) Return the id so the client can redirect
		log('info', 'ads_post_success', { userId: user.id, adId, images: image_keys.length });
		const responseMessage = moderationUnavailable
			? 'Ad submitted and pending review.'
			: 'Ad submitted successfully!';
		return json(
			{
				success: true,
				id: adId,
				status,
				message: responseMessage,
				image_keys,
				requestId
			},
			{ status: 200, headers: { 'x-request-id': requestId } }
		);
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : 'Internal error';
		log('error', 'ads_post_error', { error: msg });
		return errorResponse(msg, 500, requestId);
	}
};

// === add GET handler for listing ads ===
export const GET: RequestHandler = async (event) => {
	const { locals, url, platform } = event;
	const requestId = makeRequestId();
	const { page, limit, from, to } = getPagination(url.searchParams, 24, 100);

	if (isE2eMock(platform)) {
		return json(
			{
				success: true,
				ads: [E2E_MOCK_AD],
				page: 1,
				limit: 1,
				nextPage: null,
				requestId
			},
			{
				headers: {
					'cache-control': 'no-store',
					'x-request-id': requestId
				}
			}
		);
	}

	// Cloudflare edge cache
	const cfCache = globalThis.caches?.default as Cache | undefined;
	const cacheKey = cfCache
		? new Request(new URL(url.pathname + url.search, url.origin), { method: 'GET' })
		: undefined;

	if (cfCache && cacheKey) {
		const hit = await cfCache.match(cacheKey);
		if (hit) return hit;
	}

	const { data, error } = await locals.supabase
		.from('ads')
		.select('id,title,description,price,currency,category,image_keys,created_at')
		.eq('status', PUBLIC_AD_STATUS)
		.order('created_at', { ascending: false })
		.range(from, to);

	if (error) {
		return json(
			{ success: false, message: 'DB error', requestId },
			{ status: 500, headers: { 'x-request-id': requestId } }
		);
	}

	const hasNext = (data?.length ?? 0) === limit;
	const res = json(
		{
			success: true,
			ads: data ?? [],
			page,
			limit,
			nextPage: hasNext ? page + 1 : null,
			requestId
		},
		{
			headers: {
				'cache-control': 'public, s-maxage=300, max-age=300, stale-while-revalidate=86400',
				'x-request-id': requestId
			}
		}
	);

	if (cfCache && cacheKey) await cfCache.put(cacheKey, res.clone());
	return res;
};
