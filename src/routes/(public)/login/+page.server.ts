// src/routes/login/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { safeRedirectPath } from '$lib/server/redirect';

export const prerender = false;

export const load: PageServerLoad = async ({ locals, url }) => {
	const redirectTo = safeRedirectPath(url.searchParams.get('redirectTo'), '/');
	try {
		const { data, error } = await locals.supabase.auth.getUser();
		if (!error && data?.user) throw redirect(302, redirectTo);
	} catch {
		/* noop */
	}
	let ageConfirmed = false;
	try {
		const { data: ageRow } = await locals.supabase
			.from('user_age_confirmations')
			.select('user_id')
			.maybeSingle();
		ageConfirmed = !!ageRow?.user_id;
	} catch {
		/* noop */
	}
	return { redirectTo, ageConfirmed };
};
