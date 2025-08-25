import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { access_token, refresh_token } = await request.json() as { access_token: string; refresh_token: string };

	if (!access_token || !refresh_token) {
		return new Response(JSON.stringify({ ok: false, message: 'Missing tokens' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// This writes the sb-* cookies that your server & SSR can read
	const { error } = await locals.supabase.auth.setSession({ access_token, refresh_token });
	if (error) {
		return new Response(JSON.stringify({ ok: false, message: error.message }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
};
