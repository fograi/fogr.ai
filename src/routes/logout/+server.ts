import { redirect } from '@sveltejs/kit';

export const GET = async ({ locals }) => {
	await locals.supabase.auth.signOut();
	throw redirect(303, '/');
};
