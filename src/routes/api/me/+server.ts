import type { RequestHandler } from './$types';
import { E2E_MOCK_USER, isE2eMock } from '$lib/server/e2e-mocks';

export const GET: RequestHandler = async ({ locals, platform }) => {
	if (isE2eMock(platform)) {
		return new Response(JSON.stringify({ user: E2E_MOCK_USER }), {
			headers: {
				'content-type': 'application/json',
				'cache-control': 'no-store'
			}
		});
	}

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
