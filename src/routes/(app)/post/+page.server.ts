import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { E2E_MOCK_USER, isE2eMock } from '$lib/server/e2e-mocks';

export const load: PageServerLoad = async ({ locals, url, platform }) => {
	if (isE2eMock(platform)) {
		return { user: E2E_MOCK_USER, ageConfirmed: true };
	}
	const user = await locals.getUser(); // verified with Supabase
	if (!user) throw redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
	let ageConfirmed = false;
	try {
		const { data: ageRow } = await locals.supabase
			.from('user_age_confirmations')
			.select('user_id')
			.eq('user_id', user.id)
			.maybeSingle();
		ageConfirmed = !!ageRow?.user_id;
	} catch {
		/* noop */
	}
	return { user: { id: user.id, email: user.email }, ageConfirmed };
};
