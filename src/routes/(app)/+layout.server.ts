import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, setHeaders, depends }) => {
	depends('supabase:auth');
	setHeaders({ 'cache-control': 'private, no-store' });

	const { data, error } = await locals.supabase.auth.getUser();
	if (error) return { user: null };

	const u = data.user;
	return { user: u ? { id: u.id, email: u.email } : null };
};
