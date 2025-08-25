import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, locals }) => {
	// Supabase sends a one-time code when you use emailRedirectTo to a server route
	const code = url.searchParams.get('code');
	const redirectTo = url.searchParams.get('redirectTo') ?? '/';

	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
		if (error) {
			// bounce back to login with a message
			throw redirect(
				303,
				`/login?message=${encodeURIComponent('Link expired or invalid')}&redirectTo=${encodeURIComponent(redirectTo)}`
			);
		}
	}

	throw redirect(303, redirectTo);
};
