import type { RequestHandler } from '@sveltejs/kit';
import { verifyUnsubscribeToken } from '$lib/server/email/unsubscribe';
import { suppressEmail } from '$lib/server/email/preferences';
import type { EmailEnv } from '$lib/server/email/send';

type PlatformEnv = {
	RESEND_API_KEY?: string;
	PUBLIC_SUPABASE_URL?: string;
	SUPABASE_SERVICE_ROLE_KEY?: string;
	UNSUBSCRIBE_SECRET?: string;
};

const SUPPRESSIBLE_TYPES = new Set(['messages', 'search_alerts', 'ad_approved']);

export const POST: RequestHandler = async ({ url, platform }) => {
	const token = url.searchParams.get('token') ?? '';
	const type = url.searchParams.get('type') ?? '';

	if (!token || !type) {
		return new Response(JSON.stringify({ error: 'Missing parameters' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const penv = platform?.env as PlatformEnv | undefined;
	const secret = penv?.UNSUBSCRIBE_SECRET ?? '';
	if (!secret) {
		console.error('unsubscribe_api_error', { reason: 'UNSUBSCRIBE_SECRET not configured' });
		return new Response(JSON.stringify({ error: 'Server configuration error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const result = await verifyUnsubscribeToken(secret, token);
	if (!result) {
		return new Response(JSON.stringify({ error: 'Invalid token' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const { userId, emailType } = result;

	if (!SUPPRESSIBLE_TYPES.has(emailType)) {
		return new Response(JSON.stringify({ error: 'Invalid email type' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const env: EmailEnv = {
		RESEND_API_KEY: penv?.RESEND_API_KEY ?? '',
		PUBLIC_SUPABASE_URL: penv?.PUBLIC_SUPABASE_URL ?? '',
		SUPABASE_SERVICE_ROLE_KEY: penv?.SUPABASE_SERVICE_ROLE_KEY ?? '',
		UNSUBSCRIBE_SECRET: penv?.UNSUBSCRIBE_SECRET ?? ''
	};

	await suppressEmail(env, userId, emailType);
	console.log('unsubscribe_api_processed', { userId, emailType });

	return new Response('{}', {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
};
