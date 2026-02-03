import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { isSameOrigin } from '$lib/server/csrf';

export const POST: RequestHandler = async ({ request, locals, url }) => {
	if (!isSameOrigin(request, url)) {
		throw error(403, 'Forbidden');
	}
	const { access_token, refresh_token } = (await request.json()) as {
		access_token: string;
		refresh_token: string;
	};

	if (!access_token || !refresh_token) {
		return new Response(JSON.stringify({ ok: false, message: 'Missing tokens' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// This writes the sb-* cookies that your server & SSR can read
	const { error: sessionError } = await locals.supabase.auth.setSession({
		access_token,
		refresh_token
	});
	if (sessionError) {
		return new Response(JSON.stringify({ ok: false, message: sessionError.message }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
};
