import { redirect, error } from '@sveltejs/kit';
import { isSameOrigin } from '$lib/server/csrf';

export const POST = async ({ locals, request, url }) => {
	if (!isSameOrigin(request, url)) {
		throw error(403, 'Forbidden');
	}
	await locals.supabase.auth.signOut();
	throw redirect(303, '/');
};
