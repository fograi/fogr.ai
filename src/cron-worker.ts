import type {
	ExecutionContext,
	R2Bucket,
	R2ObjectBody,
	ScheduledController
} from '@cloudflare/workers-types';
import OpenAI from 'openai';
import { sendEmail } from './lib/server/email/send';
import type { EmailEnv } from './lib/server/email/send';
import {
	renderEmail,
	buildAdApprovedEmailHtml,
	buildAdRejectedEmailHtml,
	buildSearchAlertEmailHtml
} from './lib/server/email/templates';
import { generateUnsubscribeToken, buildUnsubscribeHeaders } from './lib/server/email/unsubscribe';
import { isEmailSuppressed } from './lib/server/email/preferences';

type Env = {
	PUBLIC_SUPABASE_URL?: string;
	SUPABASE_SERVICE_ROLE_KEY?: string;
	OPENAI_API_KEY?: string;
	ADS_BUCKET?: R2Bucket;
	ADS_PENDING_BUCKET?: R2Bucket;
	RESEND_API_KEY?: string;
	UNSUBSCRIBE_SECRET?: string;
};

type PendingAd = {
	id: string;
	title: string;
	description: string;
	image_keys: string[] | null;
	user_id: string;
	slug?: string;
};

type SavedSearch = {
	id: string;
	user_id: string;
	name: string | null;
	category: string | null;
	county: string | null;
	locality: string | null;
	query: string | null;
	last_notified_at: string;
};

type MatchingAd = {
	id: string;
	title: string;
	price: number | null;
	currency: string | null;
	slug: string | null;
};

type ModerationDecision = 'allow' | 'flagged' | 'unavailable';

const BATCH_LIMIT = 25;
const MAX_IMAGE_CHECK = 3;
const PENDING_STATUS = 'pending';
const ACTIVE_STATUS = 'active';
const REJECTED_STATUS = 'rejected';
const EXPIRED_STATUS = 'expired';
const METRICS_KEEP_DAYS = 90;

const supabaseHeaders = (env: Env) => ({
	apikey: env.SUPABASE_SERVICE_ROLE_KEY as string,
	Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
	'Content-Type': 'application/json'
});

function arrayBufferToBase64(buf: ArrayBuffer): string {
	const bytes = new Uint8Array(buf);
	const chunk = 0x8000;
	let binary = '';
	for (let i = 0; i < bytes.length; i += chunk) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
	}
	return btoa(binary);
}

async function objectToDataUrl(obj: R2ObjectBody): Promise<string> {
	const base64 = arrayBufferToBase64(await obj.arrayBuffer());
	const contentType = obj.httpMetadata?.contentType || 'image/jpeg';
	return `data:${contentType};base64,${base64}`;
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

async function fetchPendingAds(env: Env): Promise<PendingAd[]> {
	const url = new URL('/rest/v1/ads', env.PUBLIC_SUPABASE_URL);
	url.searchParams.set('select', 'id,title,description,image_keys,user_id,slug');
	url.searchParams.set('status', `eq.${PENDING_STATUS}`);
	url.searchParams.set('order', 'created_at.asc');
	url.searchParams.set('limit', String(BATCH_LIMIT));

	const res = await fetch(url, { headers: supabaseHeaders(env) });
	if (!res.ok) {
		console.error('cron_supabase_fetch_failed', await res.text());
		return [];
	}
	return (await res.json()) as PendingAd[];
}

async function updateAdStatus(env: Env, id: string, status: string): Promise<void> {
	const url = new URL('/rest/v1/ads', env.PUBLIC_SUPABASE_URL);
	url.searchParams.set('id', `eq.${id}`);
	const res = await fetch(url, {
		method: 'PATCH',
		headers: { ...supabaseHeaders(env), Prefer: 'return=minimal' },
		body: JSON.stringify({ status })
	});
	if (!res.ok) {
		console.error('cron_supabase_update_failed', { id, status, body: await res.text() });
	}
}

async function expireActiveAds(env: Env): Promise<void> {
	const url = new URL('/rest/v1/ads', env.PUBLIC_SUPABASE_URL);
	url.searchParams.set('select', 'id');
	url.searchParams.set('status', `eq.${ACTIVE_STATUS}`);
	url.searchParams.set('expires_at', `lte.${new Date().toISOString()}`);
	url.searchParams.set('order', 'expires_at.asc');
	url.searchParams.set('limit', String(BATCH_LIMIT));

	const res = await fetch(url, { headers: supabaseHeaders(env) });
	if (!res.ok) {
		console.error('cron_expire_fetch_failed', await res.text());
		return;
	}

	const expired = (await res.json()) as Array<{ id: string }>;
	if (expired.length === 0) return;

	for (const row of expired) {
		await updateAdStatus(env, row.id, EXPIRED_STATUS);
	}
}

async function copyPendingToPublic(
	pendingBucket: R2Bucket,
	publicBucket: R2Bucket,
	keys: string[]
): Promise<void> {
	for (const key of keys) {
		const obj = await pendingBucket.get(key);
		if (!obj) throw new Error(`missing_pending_object:${key}`);
		await publicBucket.put(key, obj.body, {
			httpMetadata: {
				contentType: obj.httpMetadata?.contentType || 'application/octet-stream',
				cacheControl: 'public, max-age=31536000, immutable'
			}
		});
	}
}

async function deletePendingImages(pendingBucket: R2Bucket, keys: string[]): Promise<void> {
	await Promise.allSettled(keys.map((key) => pendingBucket.delete(key)));
}

// ----------------- Email helpers -----------------

async function getUserEmail(env: Env, userId: string): Promise<string | null> {
	try {
		const url = new URL(`/auth/v1/admin/users/${userId}`, env.PUBLIC_SUPABASE_URL);
		const res = await fetch(url, {
			headers: {
				apikey: env.SUPABASE_SERVICE_ROLE_KEY as string,
				Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
			}
		});
		if (!res.ok) {
			console.error('auth_user_lookup_failed', { userId, status: res.status });
			return null;
		}
		const data = (await res.json()) as { email?: string };
		return data.email ?? null;
	} catch (err) {
		console.error('auth_user_lookup_failed', { userId, error: String(err) });
		return null;
	}
}

function buildEmailEnv(env: Env): EmailEnv {
	return {
		RESEND_API_KEY: env.RESEND_API_KEY ?? '',
		PUBLIC_SUPABASE_URL: env.PUBLIC_SUPABASE_URL ?? '',
		SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY ?? '',
		UNSUBSCRIBE_SECRET: env.UNSUBSCRIBE_SECRET ?? ''
	};
}

async function sendApprovalEmail(env: Env, ad: PendingAd): Promise<void> {
	const emailEnv = buildEmailEnv(env);
	if (!env.RESEND_API_KEY) return; // Silently skip if email not configured

	// Check preferences -- ad_approved is suppressible
	const suppressed = await isEmailSuppressed(emailEnv, ad.user_id, 'ad_approved');
	if (suppressed) return;

	const userEmail = await getUserEmail(env, ad.user_id);
	if (!userEmail) return;

	const adUrl = `https://fogr.ai/ad/${ad.slug ?? ad.id}`;
	const token = await generateUnsubscribeToken(
		env.UNSUBSCRIBE_SECRET ?? '',
		ad.user_id,
		'ad_approved'
	);
	const unsubUrl = `https://fogr.ai/api/unsubscribe?token=${encodeURIComponent(token)}&type=ad_approved`;

	const html = renderEmail(
		'Your listing is live on fogr.ai',
		buildAdApprovedEmailHtml({ adTitle: ad.title, adUrl, unsubscribeUrl: unsubUrl })
	);

	await sendEmail(emailEnv, {
		to: userEmail,
		subject: 'Your listing is live on fogr.ai',
		html,
		headers: buildUnsubscribeHeaders(unsubUrl)
	});
}

async function sendRejectionEmail(env: Env, ad: PendingAd): Promise<void> {
	const emailEnv = buildEmailEnv(env);
	if (!env.RESEND_API_KEY) return;

	// Rejection is a moderation/DSA email -- do NOT check preferences, do NOT add unsubscribe headers
	const userEmail = await getUserEmail(env, ad.user_id);
	if (!userEmail) return;

	const html = renderEmail(
		'Your fogr.ai listing was not approved',
		buildAdRejectedEmailHtml({
			adTitle: ad.title,
			adId: ad.id,
			reason: 'Content does not meet community guidelines.'
		})
	);

	await sendEmail(emailEnv, {
		to: userEmail,
		subject: 'Your fogr.ai listing was not approved',
		html
		// No headers -- no List-Unsubscribe on DSA/moderation emails
	});
}

// ----------------- Saved search digest helpers -----------------

async function fetchNotifiableSearches(env: Env): Promise<SavedSearch[]> {
	const url = new URL('/rest/v1/saved_searches', env.PUBLIC_SUPABASE_URL);
	url.searchParams.set('select', 'id,user_id,name,category,county,locality,query,last_notified_at');
	url.searchParams.set('notify', 'eq.true');
	url.searchParams.set('limit', '100'); // Process up to 100 per tick to stay within CPU limits

	const res = await fetch(url, { headers: supabaseHeaders(env) });
	if (!res.ok) {
		console.error('cron_saved_search_fetch_failed', await res.text());
		return [];
	}
	return (await res.json()) as SavedSearch[];
}

async function findMatchingAds(env: Env, search: SavedSearch): Promise<MatchingAd[]> {
	const url = new URL('/rest/v1/ads', env.PUBLIC_SUPABASE_URL);
	url.searchParams.set('select', 'id,title,price,currency,slug');
	url.searchParams.set('status', 'eq.active');
	url.searchParams.set('created_at', `gt.${search.last_notified_at}`);
	url.searchParams.set('order', 'created_at.desc');
	url.searchParams.set('limit', '20'); // Fetch more than needed to get accurate count

	// Apply filters based on saved search criteria
	if (search.category) url.searchParams.set('category', `eq.${search.category}`);
	// Fixed: use JSONB path syntax; ads table has no flat county/locality columns
	if (search.county) {
		url.searchParams.set('location_profile_data->county->>id', `eq.${search.county}`);
	}
	if (search.locality) {
		url.searchParams.set('location_profile_data->locality->>id', `eq.${search.locality}`);
	}

	const res = await fetch(url, { headers: supabaseHeaders(env) });
	if (!res.ok) return [];
	return (await res.json()) as MatchingAd[];
}

async function runSavedSearchDigest(env: Env): Promise<void> {
	if (!env.RESEND_API_KEY) return; // Email not configured

	const searches = await fetchNotifiableSearches(env);
	if (searches.length === 0) return;

	const emailEnv = buildEmailEnv(env);
	let sentCount = 0;

	for (const search of searches) {
		const matches = await findMatchingAds(env, search);
		if (matches.length === 0) continue;

		// Check if user has suppressed search alerts
		const suppressed = await isEmailSuppressed(emailEnv, search.user_id, 'search_alerts');
		if (suppressed) continue;

		// Look up user email
		const userEmail = await getUserEmail(env, search.user_id);
		if (!userEmail) continue;

		// Build top 3 listings for the email
		const topListings = matches.slice(0, 3).map((ad) => ({
			title: ad.title,
			price:
				ad.price !== null
					? new Intl.NumberFormat('en-IE', {
							style: 'currency',
							currency: ad.currency ?? 'EUR',
							maximumFractionDigits: 0
						}).format(ad.price)
					: 'Price on application',
			url: `https://fogr.ai/ad/${ad.slug ?? ad.id}`
		}));

		// Build "View all" URL based on search criteria
		const searchParams = new URLSearchParams();
		if (search.category) searchParams.set('category', search.category);
		if (search.county) searchParams.set('county', search.county);
		if (search.query) searchParams.set('q', search.query);
		const viewAllUrl = `https://fogr.ai/?${searchParams.toString()}`;

		const searchName =
			(search.name ?? [search.category, search.county].filter(Boolean).join(' in ')) ||
			'your saved search';

		// Generate unsubscribe token and URL
		const token = await generateUnsubscribeToken(
			env.UNSUBSCRIBE_SECRET ?? '',
			search.user_id,
			'search_alerts'
		);
		const unsubUrl = `https://fogr.ai/api/unsubscribe?token=${encodeURIComponent(token)}&type=search_alerts`;

		const bodyHtml = buildSearchAlertEmailHtml({
			searchName,
			matchCount: matches.length,
			topListings,
			viewAllUrl,
			unsubscribeUrl: unsubUrl
		});
		const html = renderEmail(
			`${matches.length} new listing${matches.length === 1 ? '' : 's'} matching ${searchName}`,
			bodyHtml
		);

		await sendEmail(emailEnv, {
			to: userEmail,
			subject: `${matches.length} new listing${matches.length === 1 ? '' : 's'} matching ${searchName}`,
			html,
			headers: buildUnsubscribeHeaders(unsubUrl)
		});

		// Update last_notified_at to now
		const updateUrl = new URL('/rest/v1/saved_searches', env.PUBLIC_SUPABASE_URL);
		updateUrl.searchParams.set('id', `eq.${search.id}`);
		await fetch(updateUrl, {
			method: 'PATCH',
			headers: { ...supabaseHeaders(env), Prefer: 'return=minimal' },
			body: JSON.stringify({ last_notified_at: new Date().toISOString() })
		});

		sentCount++;
	}

	if (sentCount > 0) {
		console.log('cron_search_digest_sent', { count: sentCount });
	}
}

async function retryPendingAds(env: Env): Promise<void> {
	const publicBucket = env.ADS_BUCKET;
	const pendingBucket = env.ADS_PENDING_BUCKET;
	const publicSupabaseUrl = env.PUBLIC_SUPABASE_URL;
	const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
	const openAiApiKey = env.OPENAI_API_KEY;
	const missing: string[] = [];
	if (!publicBucket) missing.push('ADS_BUCKET');
	if (!pendingBucket) missing.push('ADS_PENDING_BUCKET');
	if (!publicSupabaseUrl) missing.push('PUBLIC_SUPABASE_URL');
	if (!supabaseServiceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
	if (!openAiApiKey) missing.push('OPENAI_API_KEY');
	if (missing.length > 0) {
		throw new Error(`cron_missing_env: ${missing.join(', ')}`);
	}
	if (
		!publicBucket ||
		!pendingBucket ||
		!publicSupabaseUrl ||
		!supabaseServiceRoleKey ||
		!openAiApiKey
	) {
		throw new Error('cron_missing_env');
	}

	const openai = new OpenAI({ apiKey: openAiApiKey });
	const pendingAds = await fetchPendingAds(env);
	if (pendingAds.length === 0) return;

	for (const ad of pendingAds) {
		const text = `${ad.title} ${ad.description}`;
		const keys = ad.image_keys ?? [];
		let decision: ModerationDecision = 'allow';

		if (keys.length === 0) {
			decision = await moderateText(openai, text);
		} else if (keys.length === 1) {
			const obj = await pendingBucket.get(keys[0]);
			if (!obj) {
				console.warn('cron_missing_image', { id: ad.id, key: keys[0] });
				continue;
			}
			const dataUrl = await objectToDataUrl(obj);
			decision = await moderateTextAndImage(openai, text, dataUrl);
		} else {
			const maxCheck = Math.min(keys.length, MAX_IMAGE_CHECK);
			for (let i = 0; i < maxCheck; i++) {
				const obj = await pendingBucket.get(keys[i]);
				if (!obj) {
					console.warn('cron_missing_image', { id: ad.id, key: keys[i] });
					decision = 'unavailable';
					break;
				}
				const dataUrl = await objectToDataUrl(obj);
				const res = await moderateSingleImage(openai, dataUrl);
				if (res === 'flagged' || res === 'unavailable') {
					decision = res;
					break;
				}
			}
		}

		if (decision === 'unavailable') {
			console.warn('cron_moderation_unavailable', { id: ad.id });
			continue;
		}
		if (decision === 'flagged') {
			await updateAdStatus(env, ad.id, REJECTED_STATUS);
			await sendRejectionEmail(env, ad);
			if (keys.length > 0) await deletePendingImages(pendingBucket, keys);
			continue;
		}

		try {
			if (keys.length > 0) {
				await copyPendingToPublic(pendingBucket, publicBucket, keys);
				await deletePendingImages(pendingBucket, keys);
			}
			await updateAdStatus(env, ad.id, ACTIVE_STATUS);
			console.log('cron_ad_activated', { id: ad.id });
			await sendApprovalEmail(env, ad);
		} catch (err) {
			console.error('cron_publish_failed', { id: ad.id, error: String(err) });
		}
	}
}

async function callSupabaseRpc<T extends Record<string, unknown> | undefined>(
	env: Env,
	fnName: string,
	body?: T
): Promise<Response> {
	const url = new URL(`/rest/v1/rpc/${fnName}`, env.PUBLIC_SUPABASE_URL);
	return fetch(url, {
		method: 'POST',
		headers: supabaseHeaders(env),
		body: JSON.stringify(body ?? {})
	});
}

async function runMetricsRollup(env: Env): Promise<void> {
	const res = await callSupabaseRpc(env, 'rollup_event_metrics_daily');
	if (!res.ok) {
		console.error('cron_metrics_rollup_failed', await res.text());
		return;
	}
	console.log('cron_metrics_rollup_ok');
}

async function runMetricsPurge(env: Env): Promise<void> {
	const res = await callSupabaseRpc(env, 'purge_event_metrics', { keep_days: METRICS_KEEP_DAYS });
	if (!res.ok) {
		console.error('cron_metrics_purge_failed', await res.text());
		return;
	}
	console.log('cron_metrics_purge_ok');
}

export default {
	async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
		ctx.waitUntil(
			(async () => {
				try {
					if (!env.PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
						console.warn('cron_missing_supabase_env');
						return;
					}
					console.log('cron_tick', { scheduledTime: controller.scheduledTime });
					const scheduledAt = new Date(controller.scheduledTime);
					const utcHour = scheduledAt.getUTCHours();
					const utcMinute = scheduledAt.getUTCMinutes();
					const utcDay = scheduledAt.getUTCDay(); // 0 = Sunday
					const isDailyWindow = utcHour === 0 && utcMinute === 15;
					const isWeeklyWindow = utcDay === 0 && utcHour === 0 && utcMinute === 30;
					const isDigestWindow = utcHour === 8 && utcMinute === 0;

					await expireActiveAds(env);
					await retryPendingAds(env);

					if (isDailyWindow) {
						await runMetricsRollup(env);
					}
					if (isWeeklyWindow) {
						await runMetricsPurge(env);
					}
					if (isDigestWindow) {
						await runSavedSearchDigest(env);
					}
				} catch (err) {
					console.error('cron_error', err);
				}
			})()
		);
	}
};
