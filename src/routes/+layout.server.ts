import type { LayoutServerLoad } from './$types';
import { E2E_MOCK_USER, isE2eMock } from '$lib/server/e2e-mocks';

export const load: LayoutServerLoad = async ({ locals, depends, setHeaders, platform }) => {
	depends('supabase:auth');
	setHeaders({ 'cache-control': 'private, no-store' });

	if (isE2eMock(platform)) {
		return { user: E2E_MOCK_USER };
	}

	const user = await locals.getUser();
	return { user: user ? { id: user.id, email: user.email } : null };
};
