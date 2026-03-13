import type { PageServerLoad } from './$types';
import { isE2eMock, E2E_MOCK_SAVED_SEARCH } from '$lib/server/e2e-mocks';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (isE2eMock(platform)) {
		return { searches: [E2E_MOCK_SAVED_SEARCH] };
	}
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();
	if (!user) return { searches: [] };

	const { data } = await locals.supabase
		.from('saved_searches')
		.select('id, name, category, county, locality, query, notify, created_at')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	return { searches: data ?? [] };
};
