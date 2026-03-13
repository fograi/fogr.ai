import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
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
