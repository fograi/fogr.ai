import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, cookies, setHeaders, depends }) => {
	depends('supabase:auth');
	setHeaders({ 'cache-control': 'private, no-store' });

	// 🚫 Skip network call if there’s clearly no session
	const hasAccess = cookies.get('sb-access-token');
	const hasRefresh = cookies.get('sb-refresh-token'); // name used by auth-helpers v2
	if (!hasAccess || !hasRefresh) {
		return { user: null };
	}

	// Only now hit Supabase to verify the token
	const {
		data: { user },
		error
	} = await locals.supabase.auth.getUser();
	if (error) return { user: null };

	return { user: user ? { id: user.id, email: user.email } : null };
};
