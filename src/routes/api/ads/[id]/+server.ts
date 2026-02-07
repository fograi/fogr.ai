// src/routes/api/ads/[id]/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import type { KVNamespace, R2Bucket } from '@cloudflare/workers-types';
import { json } from '@sveltejs/kit';
import OpenAI from 'openai';
import { E2E_MOCK_AD, isE2eMock } from '$lib/server/e2e-mocks';
import { isSameOrigin } from '$lib/server/csrf';
import {
	ALLOWED_IMAGE_TYPES,
	MAX_IMAGE_SIZE,
	MAX_IMAGE_COUNT,
	MIN_TITLE_LENGTH,
	MAX_TITLE_LENGTH,
	MIN_DESC_LENGTH,
	MAX_DESC_LENGTH
} from '$lib/constants';
import { bannedWords } from '$lib/banned-words';
import {
	validateAdImages,
	validateAdMeta,
	validateOfferRules,
	validateCategoryProfileData
} from '$lib/server/ads-validation';
const { default: filter } = await import('leo-profanity');
const { RegExpMatcher, englishDataset, englishRecommendedTransformers } = await import('obscenity');
filter.add(bannedWords);
const obscenity = new RegExpMatcher({
	...englishDataset.build(),
	...englishRecommendedTransformers
});

const PUBLIC_AD_STATUS = 'active';
const EDITABLE_STATUSES = new Set(['active', 'pending', 'archived']);
const EDIT_BACKOFF_TTL_SECONDS = 35 * 24 * 60 * 60; // 35 days
let warnedMissingRateLimit = false;

type ModerationDecision = 'allow' | 'flagged' | 'unavailable';
type AnyModerationInput = Array<
	{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }
>;

const errorResponse = (message: string, status = 400) =>
	json({ success: false, message }, { status });
const cooldownResponse = (retryAfterSeconds: number) =>
	json(
		{
			success: false,
			message: 'Please wait before editing again.'
		},
		{
			status: 429,
			headers: { 'Retry-After': String(retryAfterSeconds) }
		}
	);

type EditBackoffState = {
	count: number;
	nextAllowedAt: number;
};

function arrayBufferToBase64(buf: ArrayBuffer): string {
	const bufferCtor = (
		globalThis as {
			Buffer?: { from: (data: ArrayBuffer) => { toString: (encoding: string) => string } };
		}
	).Buffer;
	if (typeof btoa !== 'function' && bufferCtor?.from) {
		return bufferCtor.from(buf).toString('base64');
	}
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

function shouldFlag(
	res: OpenAI.Moderations.ModerationCreateResponse & { _request_id?: string | null }
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

export const GET: RequestHandler = async ({ params, locals, url, platform }) => {
	const id = params.id ?? '';
	const nowIso = new Date().toISOString();

	if (isE2eMock(platform)) {
		if (id !== E2E_MOCK_AD.id) {
			return json(
				{ error: 'Not found' },
				{
					status: 404,
					headers: { 'Cache-Control': 'no-store' }
				}
			);
		}
		return json(
			{ ad: E2E_MOCK_AD },
			{
				status: 200,
				headers: { 'Cache-Control': 'no-store' }
			}
		);
	}

	const {
		data: { user },
		error: authError
	} = await locals.supabase.auth.getUser();
	const authedUser = authError ? null : user;

	// Cloudflare edge cache if available (safe no-op locally)
	const cfCache = globalThis.caches?.default;
	const cacheKey = cfCache
		? new Request(new URL(`/api/ads/${id}`, url.origin), { method: 'GET' })
		: undefined;

	// 1) Try cache
	if (!authedUser && cfCache && cacheKey) {
		const hit = await cfCache.match(cacheKey);
		if (hit) return hit;
	}

	// 2) DB lookup
	const query = locals.supabase
		.from('ads')
		.select(
			'id, user_id, title, description, category, price, currency, image_keys, status, created_at, updated_at, expires_at, firm_price, min_offer, auto_decline_message'
		)
		.eq('id', id);
	if (!authedUser) {
		query.eq('status', PUBLIC_AD_STATUS);
		query.gt('expires_at', nowIso);
	}
	const { data, error } = await query.maybeSingle();

	if (error) {
		return json(
			{ error: 'DB error' },
			{
				status: 500,
				headers: {
					'Cache-Control': authedUser ? 'private, no-store' : 'public, max-age=30'
				}
			}
		);
	}
	if (!data) {
		return json(
			{ error: 'Not found' },
			{
				status: 404,
				headers: {
					'Cache-Control': authedUser ? 'private, no-store' : 'public, max-age=60'
				}
			}
		);
	}
	if (data.status !== PUBLIC_AD_STATUS && data.user_id !== authedUser?.id) {
		return json(
			{ error: 'Not found' },
			{
				status: 404,
				headers: { 'Cache-Control': 'private, no-store' }
			}
		);
	}
	if (data.expires_at && data.expires_at <= nowIso && data.user_id !== authedUser?.id) {
		return json(
			{ error: 'Not found' },
			{
				status: 404,
				headers: { 'Cache-Control': 'private, no-store' }
			}
		);
	}

	let moderation: {
		action_type: string;
		reason_category: string;
		reason_details: string;
		legal_basis: string | null;
		automated: boolean;
		created_at: string;
		report_id: string | null;
	} | null = null;
	if (authedUser && data.user_id === authedUser.id) {
		const { data: mod } = await locals.supabase
			.from('ad_moderation_actions')
			.select(
				'action_type, reason_category, reason_details, legal_basis, automated, created_at, report_id'
			)
			.eq('ad_id', id)
			.order('created_at', { ascending: false })
			.limit(1)
			.maybeSingle();
		moderation = mod ?? null;
	}

	const resp = json(
		{ ad: data, moderation },
		{
			status: 200,
			headers: {
				'Cache-Control': authedUser
					? 'private, no-store'
					: (() => {
							const expiresAtMs = data.expires_at ? Date.parse(data.expires_at) : null;
							const ttl = expiresAtMs
								? Math.max(0, Math.min(86400, Math.floor((expiresAtMs - Date.now()) / 1000)))
								: 86400;
							return `public, s-maxage=${ttl}, stale-while-revalidate=604800`;
						})(),
				ETag: `W/"ad-${data.id}-${data.updated_at ?? data.created_at}"`
			}
		}
	);

	// 3) Populate cache
	if (!authedUser && data.status === PUBLIC_AD_STATUS && cfCache && cacheKey) {
		await cfCache.put(cacheKey, resp.clone());
	}

	return resp;
};

export const PATCH: RequestHandler = async ({ params, locals, platform, request, url }) => {
	if (!isSameOrigin(request, url)) return errorResponse('Forbidden', 403);

	const adId = params.id?.trim() ?? '';
	if (!adId) return errorResponse('Missing ad id.', 400);
	const debugRequested = url.searchParams.get('debug') === '1';
	let debugAllowed = false;
	let stage = 'start';

	try {
		if (isE2eMock(platform)) {
			return json({ success: true, id: adId });
		}

		stage = 'auth';
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();
		if (!user) return errorResponse('Auth required.', 401);

		stage = 'load_ad';
		const { data: ad, error: adError } = await locals.supabase
			.from('ads')
			.select(
				'id,user_id,title,description,category,category_profile_data,price,currency,image_keys,status,firm_price,min_offer,auto_decline_message,expires_at'
			)
			.eq('id', adId)
			.maybeSingle();

		if (adError) return errorResponse('Could not load ad.', 500);
		if (!ad) return errorResponse('Ad not found.', 404);
		if (ad.user_id !== user.id) return errorResponse('Not allowed.', 403);
		if (!EDITABLE_STATUSES.has(ad.status)) return errorResponse('This ad cannot be edited.', 400);
		debugAllowed = debugRequested && ad.user_id === user.id;

		const envLimits = platform?.env as { RATE_LIMIT?: KVNamespace } | undefined;
		const rateLimitKv = envLimits?.RATE_LIMIT;
		const backoffKey = `ads:edit:backoff:${adId}:${user.id}`;
		let backoffState: EditBackoffState | null = null;
		if (rateLimitKv) {
			try {
				backoffState = await rateLimitKv.get<EditBackoffState>(backoffKey, { type: 'json' });
				if (backoffState?.nextAllowedAt && Date.now() < backoffState.nextAllowedAt) {
					const retryAfter = Math.ceil((backoffState.nextAllowedAt - Date.now()) / 1000);
					return cooldownResponse(retryAfter);
				}
			} catch (err) {
				console.warn('Edit backoff KV error', err);
			}
		} else if (!warnedMissingRateLimit) {
			console.warn('RATE_LIMIT KV binding missing; edit backoff disabled.');
			warnedMissingRateLimit = true;
		}

		stage = 'parse_body';
		let form: FormData | null = null;
		let body: Record<string, unknown> | null = null;
		const contentType = request.headers.get('content-type') ?? '';
		try {
			if (contentType.includes('application/json')) {
				body = (await request.json()) as Record<string, unknown>;
			} else {
				form = await request.formData();
			}
		} catch (err) {
			console.error('ads_patch_body_parse_failed', err);
			return errorResponse('Invalid form data.', 400);
		}

		const readString = (key: string) => {
			const value = form ? form.get(key) : body?.[key];
			if (value == null) return null;
			if (typeof value === 'string') return value;
			if (typeof value === 'number' || typeof value === 'boolean') return String(value);
			return null;
		};

		const category = readString('category') || '';
		const isLostAndFound = category.trim() === 'Lost and Found';
		const title = readString('title') || '';
		const description = readString('description') || '';
		const priceStr = readString('price');
		const priceType = readString('price_type');
		const firmPrice = readString('firm_price') === '1' || readString('firm_price') === 'true';
		const minOfferStr = readString('min_offer');
		const autoDeclineMessageRaw = readString('auto_decline_message');
		const autoDeclineMessage =
			autoDeclineMessageRaw && autoDeclineMessageRaw.trim().length > 0
				? autoDeclineMessageRaw.trim()
				: null;
		const ageConfirmed =
			readString('age_confirmed') === '1' || readString('age_confirmed') === 'true';
		const currencyRaw = readString('currency') || ad.currency || 'EUR';
		const currency = currencyRaw.trim().toUpperCase();
		const removeImage = readString('remove_image') === '1' || readString('remove_image') === 'true';
		const categoryProfileRawValue = form
			? form.get('category_profile_data')
			: (body?.category_profile_data ?? null);
		let categoryProfilePayload: unknown = null;
		if (typeof categoryProfileRawValue === 'string') {
			if (categoryProfileRawValue.trim() !== '') {
				try {
					categoryProfilePayload = JSON.parse(categoryProfileRawValue);
				} catch {
					return errorResponse('Invalid category profile data.', 400);
				}
			}
		} else if (categoryProfileRawValue && typeof categoryProfileRawValue === 'object') {
			categoryProfilePayload = categoryProfileRawValue;
		}

		const imageFile = form ? form.get('image') : null;
		const files: File[] = [];
		if (imageFile instanceof File && imageFile.size > 0) files.push(imageFile);
		if (files.length > MAX_IMAGE_COUNT) {
			return errorResponse(`Too many images (max ${MAX_IMAGE_COUNT}).`, 413);
		}

		if (!ageConfirmed) return errorResponse('Must confirm you are 18 or older.', 400);
		const { error: ageConfirmError } = await locals.supabase
			.from('user_age_confirmations')
			.upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true });
		if (ageConfirmError) {
			console.warn('age_confirmation_upsert_failed', ageConfirmError.message);
		}

		stage = 'validate';
		const priceMetaError = validateAdMeta({ category, currency, priceStr, priceType });
		if (priceMetaError) return errorResponse(priceMetaError, 400);

		const imageCount =
			files.length > 0 ? files.length : removeImage ? 0 : (ad.image_keys?.length ?? 0);
		const imageError = validateAdImages({ category, imageCount });
		if (imageError) return errorResponse(imageError, 400);
		const categoryProfileValidation = validateCategoryProfileData({
			category,
			categoryProfileDataRaw: categoryProfilePayload
		});
		if (categoryProfileValidation.error) return errorResponse(categoryProfileValidation.error, 400);

		if (!isLostAndFound) {
			const offerError = validateOfferRules({
				priceType,
				priceStr,
				firmPrice,
				minOfferStr
			});
			if (offerError) return errorResponse(offerError, 400);
		}

		if (title.length < MIN_TITLE_LENGTH) return errorResponse('Title too short.', 400);
		if (title.length > MAX_TITLE_LENGTH) return errorResponse('Title too long.', 413);
		if (description.length < MIN_DESC_LENGTH) return errorResponse('Description too short.', 400);
		if (description.length > MAX_DESC_LENGTH) return errorResponse('Description too long.', 413);

		if (files.length > 0) {
			const badType = files.find((f) => !ALLOWED_IMAGE_TYPES.includes(f.type));
			if (badType) return errorResponse('Invalid image type(s).', 415);
			const tooLarge = files.find((f) => f.size > MAX_IMAGE_SIZE);
			if (tooLarge) return errorResponse('Image(s) too large.', 413);
		}

		const normalizedPriceType = priceType?.toLowerCase();
		const price = isLostAndFound
			? priceStr && priceStr.trim() !== ''
				? Number(priceStr)
				: null
			: normalizedPriceType === 'poa'
				? null
				: Number(priceStr ?? 0);
		const minOffer =
			!isLostAndFound && normalizedPriceType === 'fixed' && minOfferStr && minOfferStr.trim() !== ''
				? Number(minOfferStr)
				: null;

		const titleTrimmed = title.trim();
		const descTrimmed = description.trim();
		const categoryTrimmed = category.trim();
		const textChanged = titleTrimmed !== ad.title || descTrimmed !== ad.description;
		const categoryChanged = categoryTrimmed !== ad.category;
		const imageChanged = files.length > 0 || removeImage;
		const needsModeration = textChanged || categoryChanged || imageChanged;

		let moderationResult: ModerationDecision = 'allow';
		let moderationUnavailable = false;
		let moderationFlagged = false;

		stage = 'moderation';
		if (needsModeration) {
			const combinedText = `${titleTrimmed} ${descTrimmed}`;
			if (filter.check(combinedText)) return errorResponse('Failed profanity filter.', 400);
			if (obscenity.hasMatch(combinedText)) return errorResponse('Failed obscenity filter.', 400);

			const env = platform?.env as {
				OPENAI_API_KEY?: string;
				ADS_BUCKET?: R2Bucket;
				ADS_PENDING_BUCKET?: R2Bucket;
			};
			const openAiApiKey = env?.OPENAI_API_KEY;
			if (!openAiApiKey) {
				moderationUnavailable = true;
			} else {
				try {
					const openai = new OpenAI({ apiKey: openAiApiKey });
					if (files.length > 0) {
						const dataUrl = await fileToDataUrl(files[0]);
						moderationResult = await moderateTextAndImage(openai, combinedText, dataUrl);
					} else {
						moderationResult = await moderateText(openai, combinedText);
					}
				} catch (err) {
					console.error('ads_patch_moderation_failed', err);
					moderationResult = 'unavailable';
				}
				if (moderationResult === 'flagged') moderationFlagged = true;
				if (moderationResult === 'unavailable') moderationUnavailable = true;
			}
		}

		let nextStatus = ad.status;
		if (needsModeration && (moderationFlagged || moderationUnavailable)) {
			if (ad.status !== 'archived') {
				nextStatus = 'pending';
			}
		}

		stage = 'storage';
		const env = platform?.env as {
			ADS_BUCKET?: R2Bucket;
			ADS_PENDING_BUCKET?: R2Bucket;
		};
		const publicBucket = env?.ADS_BUCKET;
		const pendingBucket = env?.ADS_PENDING_BUCKET;

		let nextImageKeys = ad.image_keys ?? [];

		if (files.length > 0) {
			const targetBucket = nextStatus === 'pending' ? pendingBucket : publicBucket;
			if (!targetBucket || typeof targetBucket.put !== 'function') {
				return errorResponse('Storage temporarily unavailable.', 503);
			}
			const ext =
				files[0].type === 'image/jpeg'
					? 'jpg'
					: files[0].type === 'image/png'
						? 'png'
						: files[0].type === 'image/webp'
							? 'webp'
							: 'bin';
			const key = `${user.id}/${ad.id}/edit-${Date.now()}.${ext}`;
			try {
				await targetBucket.put(key, await files[0].arrayBuffer(), {
					httpMetadata: { contentType: files[0].type }
				});
			} catch (err) {
				console.error('ads_patch_upload_failed', err);
				return errorResponse('We could not upload the image. Try again.', 503);
			}
			nextImageKeys = [key];
		} else if (removeImage) {
			nextImageKeys = [];
		}

		if ((files.length > 0 || removeImage) && (publicBucket || pendingBucket)) {
			const keysToDelete = ad.image_keys ?? [];
			if (keysToDelete.length > 0) {
				await Promise.allSettled([
					...(publicBucket ? keysToDelete.map((key) => publicBucket.delete(key)) : []),
					...(pendingBucket ? keysToDelete.map((key) => pendingBucket.delete(key)) : [])
				]);
			}
		}

		const firmPriceValue = isLostAndFound
			? false
			: normalizedPriceType === 'fixed'
				? firmPrice
				: true;
		const minOfferValue = isLostAndFound ? null : normalizedPriceType === 'fixed' ? minOffer : null;

		stage = 'update';
		const { error: updateError } = await locals.supabase
			.from('ads')
			.update({
				title: titleTrimmed,
				description: descTrimmed,
				category: categoryTrimmed,
				category_profile_data: categoryProfileValidation.categoryProfileData,
				price,
				currency,
				firm_price: firmPriceValue,
				min_offer: minOfferValue,
				auto_decline_message:
					!isLostAndFound &&
					normalizedPriceType === 'fixed' &&
					(firmPriceValue || minOfferValue !== null)
						? autoDeclineMessage
						: null,
				image_keys: nextImageKeys,
				status: nextStatus,
				updated_at: new Date().toISOString()
			})
			.eq('id', ad.id);

		if (updateError) {
			console.error('ads_patch_update_failed', updateError);
			if (debugAllowed) {
				return errorResponse(`Debug: ${updateError.message} (stage: update)`, 500);
			}
			return errorResponse('Could not update ad.', 500);
		}

		if (rateLimitKv) {
			try {
				const prevCount = backoffState?.count ?? 0;
				const nextCount = prevCount + 1;
				const waitMinutes = Math.pow(2, nextCount - 1);
				const nextAllowedAt = Date.now() + waitMinutes * 60 * 1000;
				await rateLimitKv.put(backoffKey, JSON.stringify({ count: nextCount, nextAllowedAt }), {
					expirationTtl: EDIT_BACKOFF_TTL_SECONDS
				});
			} catch (err) {
				console.warn('Edit backoff KV update failed', err);
			}
		}

		stage = 'done';
		return json({
			success: true,
			id: ad.id,
			message:
				needsModeration && (moderationFlagged || moderationUnavailable) && ad.status !== 'archived'
					? 'Changes saved and queued for review.'
					: 'Changes saved.'
		});
	} catch (err) {
		console.error('ads_patch_unhandled_error', { adId, stage, err });
		if (debugAllowed) {
			const message = err instanceof Error ? err.message : 'Unknown error';
			return errorResponse(`Debug: ${message} (stage: ${stage})`, 500);
		}
		return errorResponse('We could not save your changes.', 500);
	}
};
