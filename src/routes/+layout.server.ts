export const load = async ({ locals }) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();
	return { user: user ? { id: user.id, email: user.email } : null };
};
