// src/routes/login/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });

	const redirectTo = url.searchParams.get('redirectTo') ?? '/';

	// Server-side auth check (does NOT hit the browser)
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();
	if (user) throw redirect(302, redirectTo);

	return { redirectTo }; // use in the page; no user fetch in the browser
};
