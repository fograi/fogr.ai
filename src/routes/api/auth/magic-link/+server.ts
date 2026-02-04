import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { safeRedirectPath } from '$lib/server/redirect';
import { isDisposableEmail } from '$lib/disposable-email-domains';
import type { KVNamespace } from '@cloudflare/workers-types';
import { checkRateLimit } from '$lib/server/rate-limit';

const RATE_LIMIT_10M = 5;
const RATE_LIMIT_IP_10M = 20;
const RATE_LIMIT_DAY = 20;
const WINDOW_10M_SECONDS = 10 * 60;
const WINDOW_DAY_SECONDS = 24 * 60 * 60;
let warnedMissingRateLimit = false;

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
		console.warn('Failed to hash rate-limit key', err);
		return null;
	}
};

type Body = {
	email?: string;
	redirectTo?: string | null;
};

export const POST: RequestHandler = async ({ request, locals, url, platform }) => {
	let body: Body = {};
	try {
		body = (await request.json()) as Body;
	} catch {
		return json({ success: false, message: 'Invalid request.' }, { status: 400 });
	}

	const email = (body.email ?? '').trim().toLowerCase();
	if (!email) return json({ success: false, message: 'Email is required.' }, { status: 400 });
	if (isDisposableEmail(email)) {
		return json(
			{ success: false, message: 'Disposable email addresses aren’t allowed. Use a real inbox.' },
			{ status: 400 }
		);
	}

	const ip =
		request.headers.get('CF-Connecting-IP') ??
		request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
		'';
	const env = platform?.env as { RATE_LIMIT?: KVNamespace } | undefined;
	const rateLimitKv = env?.RATE_LIMIT;
	if (rateLimitKv) {
		const emailKey = await hashForKey(email);
		const dayKey = new Date().toISOString().slice(0, 10);
		if (ip) {
			const limitIp = await checkRateLimit(
				rateLimitKv,
				`auth:magic:10m:ip:${ip}`,
				RATE_LIMIT_IP_10M,
				WINDOW_10M_SECONDS
			);
			if (!limitIp.allowed) {
				return rateLimitResponse(limitIp.retryAfter ?? WINDOW_10M_SECONDS);
			}
		}

		if (emailKey) {
			const limitEmail10m = await checkRateLimit(
				rateLimitKv,
				`auth:magic:10m:email:${emailKey}`,
				RATE_LIMIT_10M,
				WINDOW_10M_SECONDS
			);
			if (!limitEmail10m.allowed) {
				return rateLimitResponse(limitEmail10m.retryAfter ?? WINDOW_10M_SECONDS);
			}

			const limitEmailDay = await checkRateLimit(
				rateLimitKv,
				`auth:magic:day:${dayKey}:email:${emailKey}`,
				RATE_LIMIT_DAY,
				WINDOW_DAY_SECONDS
			);
			if (!limitEmailDay.allowed) {
				return rateLimitResponse(limitEmailDay.retryAfter ?? WINDOW_DAY_SECONDS);
			}
		}
	} else if (!warnedMissingRateLimit) {
		console.warn('RATE_LIMIT KV binding missing; rate limiting disabled.');
		warnedMissingRateLimit = true;
	}

	const redirectTo = safeRedirectPath(body.redirectTo ?? '/', '/');
	const emailRedirectTo = `${url.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`;

	const { error } = await locals.supabase.auth.signInWithOtp({
		email,
		options: { emailRedirectTo }
	});

	if (error) {
		return json({ success: false, message: error.message }, { status: 400 });
	}

	return json({ success: true }, { status: 200 });
};
