// src/routes/login/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const prerender = false;

export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });

	const redirectTo = url.searchParams.get('redirectTo') ?? '/';

	// be defensive: don't 500 if auth check fails
	try {
		const { data, error } = await locals.supabase.auth.getUser();
		if (!error && data?.user) throw redirect(302, redirectTo);
	} catch {}

	return { redirectTo };
};
