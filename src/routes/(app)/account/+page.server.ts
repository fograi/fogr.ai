import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { E2E_MOCK_USER, isE2eMock } from '$lib/server/e2e-mocks';

export const load: PageServerLoad = async ({ locals, url, platform }) => {
	if (isE2eMock(platform)) {
		return { user: E2E_MOCK_USER };
	}

	const user = await locals.getUser();
	if (!user) {
		throw redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
	}

	return {
		user: {
			id: user.id,
			email: user.email
		}
	};
};
