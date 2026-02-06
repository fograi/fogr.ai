import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { isSameOrigin } from '$lib/server/csrf';
import type { KVNamespace } from '@cloudflare/workers-types';
import { checkRateLimit } from '$lib/server/rate-limit';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase.types';
import { recordModerationEvent } from '$lib/server/moderation-events';

type Body = {
	name?: string;
	email?: string;
	reasonCategory?: string;
	details?: string;
	goodFaith?: boolean;
};

const REASON_CATEGORIES = new Set(['illegal', 'prohibited', 'scam', 'spam', 'other']);
const MIN_DETAILS_LENGTH = 20;
const RATE_LIMIT_10M = 5;
const RATE_LIMIT_DAY = 20;
const RATE_LIMIT_AD_DAY = 3;
const WINDOW_10M_SECONDS = 10 * 60;
const WINDOW_DAY_SECONDS = 24 * 60 * 60;
let warnedMissingRateLimit = false;

const errorResponse = (message: string, status = 400) =>
	json({ success: false, message }, { status });

const rateLimitResponse = (retryAfterSeconds: number) =>
	json(
		{ success: false, message: 'Rate limit exceeded. Please try again later.' },
		{
			status: 429,
			headers: { 'Retry-After': String(retryAfterSeconds) }
		}
	);

const hashForKey = async (input: string): Promise<string | null> => {
	try {
		const data = new TextEncoder().encode(input);
		const digest = await crypto.subtle.digest('SHA-256', data);
		return Array.from(new Uint8Array(digest))
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');
	} catch (err) {
		console.warn('Failed to hash report key', err);
		return null;
	}
};

export const POST: RequestHandler = async ({ params, request, url, platform, locals }) => {
	if (!isSameOrigin(request, url)) {
		return errorResponse('Forbidden', 403);
	}

	let body: Body = {};
	try {
		body = (await request.json()) as Body;
	} catch {
		return errorResponse('Invalid request.', 400);
	}

	const adId = params.id?.trim() || '';
	if (!adId) return errorResponse('Missing ad id.', 400);

	const name = (body.name ?? '').trim();
	const email = (body.email ?? '').trim().toLowerCase();
	const reasonCategory = (body.reasonCategory ?? '').trim().toLowerCase();
	const details = (body.details ?? '').trim();
	const goodFaith = body.goodFaith === true;

	if (!name) return errorResponse('Enter your name.', 400);
	if (!email) return errorResponse('Enter your email address.', 400);
	if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
		return errorResponse('Enter a valid email address.', 400);
	if (!REASON_CATEGORIES.has(reasonCategory))
		return errorResponse('Choose a valid reason.', 400);
	if (details.length < MIN_DETAILS_LENGTH)
		return errorResponse(`Add at least ${MIN_DETAILS_LENGTH} characters.`, 400);
	if (!goodFaith) return errorResponse('Confirm this report is made in good faith.', 400);

	const ip =
		request.headers.get('CF-Connecting-IP') ??
		request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
		'';
	const userAgent = request.headers.get('user-agent') ?? '';

	const env = platform?.env as {
		RATE_LIMIT?: KVNamespace;
		PUBLIC_SUPABASE_URL?: string;
		SUPABASE_SERVICE_ROLE_KEY?: string;
	};
	const rateLimitKv = env?.RATE_LIMIT;

	if (rateLimitKv) {
		const dayKey = new Date().toISOString().slice(0, 10);
		const emailHash = email ? await hashForKey(email) : null;
		const actorKey = ip ? `ip:${ip}` : emailHash ? `email:${emailHash}` : 'anon';

		if (ip) {
			const limitIp10m = await checkRateLimit(
				rateLimitKv,
				`reports:10m:ip:${ip}`,
				RATE_LIMIT_10M,
				WINDOW_10M_SECONDS
			);
			if (!limitIp10m.allowed) {
				return rateLimitResponse(limitIp10m.retryAfter ?? WINDOW_10M_SECONDS);
			}
			const limitIpDay = await checkRateLimit(
				rateLimitKv,
				`reports:day:ip:${dayKey}:${ip}`,
				RATE_LIMIT_DAY,
				WINDOW_DAY_SECONDS
			);
			if (!limitIpDay.allowed) {
				return rateLimitResponse(limitIpDay.retryAfter ?? WINDOW_DAY_SECONDS);
			}
		}

		if (emailHash) {
			const limitEmailDay = await checkRateLimit(
				rateLimitKv,
				`reports:day:email:${dayKey}:${emailHash}`,
				RATE_LIMIT_DAY,
				WINDOW_DAY_SECONDS
			);
			if (!limitEmailDay.allowed) {
				return rateLimitResponse(limitEmailDay.retryAfter ?? WINDOW_DAY_SECONDS);
			}
		}

		const limitPerAd = await checkRateLimit(
			rateLimitKv,
			`reports:day:ad:${dayKey}:${adId}:${actorKey}`,
			RATE_LIMIT_AD_DAY,
			WINDOW_DAY_SECONDS
		);
		if (!limitPerAd.allowed) {
			return rateLimitResponse(limitPerAd.retryAfter ?? WINDOW_DAY_SECONDS);
		}
	} else if (!warnedMissingRateLimit) {
		console.warn('RATE_LIMIT KV binding missing; report rate limiting disabled.');
		warnedMissingRateLimit = true;
	}

	const baseUrl = env?.PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
	const serviceKey = env?.SUPABASE_SERVICE_ROLE_KEY;
	if (!baseUrl || !serviceKey) {
		return errorResponse('Server misconfigured.', 500);
	}

	const admin = createClient<Database>(baseUrl, serviceKey, {
		auth: { persistSession: false, autoRefreshToken: false }
	});

	const { data: ad, error: adError } = await admin
		.from('ads')
		.select('id')
		.eq('id', adId)
		.maybeSingle();

	if (adError) {
		console.warn('Report ad lookup failed', adError);
		return errorResponse('We could not submit your report. Try again.', 500);
	}
	if (!ad) return errorResponse('Ad not found.', 404);

	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	const locationUrl = new URL(`/ad/${adId}`, url.origin).toString();
	const { data: report, error: reportError } = await admin
		.from('ad_reports')
		.insert({
			ad_id: adId,
			reporter_user_id: user?.id ?? null,
			reporter_name: name,
			reporter_email: email,
			reason_category: reasonCategory,
			reason_details: details,
			location_url: locationUrl,
			good_faith: true,
			reporter_ip: ip || null,
			reporter_user_agent: userAgent || null
		})
		.select('id')
		.single();

	if (reportError || !report) {
		console.warn('Report insert failed', reportError);
		return errorResponse('We could not submit your report. Try again.', 500);
	}

	await recordModerationEvent(admin, {
		contentId: adId,
		reportId: report.id,
		userId: user?.id ?? null,
		eventType: 'report_received',
		automatedFlag: false
	});

	return json({ success: true, reportId: report.id }, { status: 200 });
};
