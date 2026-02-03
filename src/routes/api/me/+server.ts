import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const { data, error } = await locals.supabase.auth.getUser();
	const user = error ? null : data.user ? { id: data.user.id, email: data.user.email } : null;

	return new Response(JSON.stringify({ user }), {
		headers: {
			'content-type': 'application/json',
			'cache-control': 'private, no-store',
			vary: 'cookie'
		}
	});
};
