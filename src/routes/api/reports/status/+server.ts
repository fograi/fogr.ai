import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import type { KVNamespace } from '@cloudflare/workers-types';
import { checkRateLimit } from '$lib/server/rate-limit';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase.types';

type Body = {
	reportId?: string;
	email?: string;
};

const RATE_LIMIT_10M = 10;
const RATE_LIMIT_DAY = 60;
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
		console.warn('Failed to hash report status key', err);
		return null;
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	let body: Body = {};
	try {
		body = (await request.json()) as Body;
	} catch {
		return errorResponse('Invalid request.', 400);
	}

	const reportId = (body.reportId ?? '').trim();
	const email = (body.email ?? '').trim().toLowerCase();

	if (!reportId) return errorResponse('Report ID is required.', 400);
	if (!email) return errorResponse('Email is required.', 400);
	if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
		return errorResponse('Email looks invalid.', 400);

	const env = platform?.env as {
		RATE_LIMIT?: KVNamespace;
		PUBLIC_SUPABASE_URL?: string;
		SUPABASE_SERVICE_ROLE_KEY?: string;
	};
	const rateLimitKv = env?.RATE_LIMIT;

	if (rateLimitKv) {
		const dayKey = new Date().toISOString().slice(0, 10);
		const emailHash = await hashForKey(email);
		const ip =
			request.headers.get('CF-Connecting-IP') ??
			request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
			'';

		if (ip) {
			const limitIp10m = await checkRateLimit(
				rateLimitKv,
				`reports:status:10m:ip:${ip}`,
				RATE_LIMIT_10M,
				WINDOW_10M_SECONDS
			);
			if (!limitIp10m.allowed) {
				return rateLimitResponse(limitIp10m.retryAfter ?? WINDOW_10M_SECONDS);
			}
			const limitIpDay = await checkRateLimit(
				rateLimitKv,
				`reports:status:day:ip:${dayKey}:${ip}`,
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
				`reports:status:day:email:${dayKey}:${emailHash}`,
				RATE_LIMIT_DAY,
				WINDOW_DAY_SECONDS
			);
			if (!limitEmailDay.allowed) {
				return rateLimitResponse(limitEmailDay.retryAfter ?? WINDOW_DAY_SECONDS);
			}
		}
	} else if (!warnedMissingRateLimit) {
		console.warn('RATE_LIMIT KV binding missing; report status rate limiting disabled.');
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

	const { data: report, error: reportError } = await admin
		.from('ad_reports')
		.select('id, ad_id, reason_category, status, created_at, reporter_email')
		.eq('id', reportId)
		.maybeSingle();

	if (reportError) {
		console.warn('Report lookup failed', reportError);
		return errorResponse('Failed to lookup report.', 500);
	}
	if (!report || report.reporter_email.toLowerCase() !== email) {
		return errorResponse('Report not found.', 404);
	}

	const { data: action } = await admin
		.from('ad_moderation_actions')
		.select(
			'action_type, reason_category, reason_details, legal_basis, automated, created_at, report_id'
		)
		.eq('report_id', report.id)
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	const decisionSource = action
		? action.report_id
			? 'User report'
			: 'Own-initiative review'
		: null;

	return json(
		{
			success: true,
			report: {
				id: report.id,
				status: report.status,
				reason_category: report.reason_category,
				created_at: report.created_at
			},
			decision: action ?? null,
			decision_source: decisionSource
		},
		{ status: 200 }
	);
};
