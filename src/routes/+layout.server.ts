import type { LayoutServerLoad } from './$types';
import { E2E_MOCK_USER, isE2eMock } from '$lib/server/e2e-mocks';
import { isAdminUser } from '$lib/server/admin';

export const load: LayoutServerLoad = async ({ locals, depends, setHeaders, platform }) => {
	depends('supabase:auth');
	setHeaders({ 'cache-control': 'private, no-store' });

	if (isE2eMock(platform)) {
		return { user: E2E_MOCK_USER, isAdmin: false };
	}

	const user = await locals.getUser();
	const env = platform?.env as { ADMIN_EMAILS?: string; ADMIN_EMAIL?: string } | undefined;
	const isAdmin = isAdminUser(user, env);
	return { user: user ? { id: user.id, email: user.email } : null, isAdmin };
};
