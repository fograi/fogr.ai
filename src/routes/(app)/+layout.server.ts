import type { LayoutServerLoad } from './$types';
import { E2E_MOCK_USER, isE2eMock } from '$lib/server/e2e-mocks';

export const load: LayoutServerLoad = async ({ locals, depends, platform }) => {
	depends('supabase:auth');

	if (isE2eMock(platform)) {
		return { user: E2E_MOCK_USER };
	}

	const user = await locals.getUser();
	return { user: user ? { id: user.id, email: user.email } : null };
};
