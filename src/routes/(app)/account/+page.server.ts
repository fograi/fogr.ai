import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { E2E_MOCK_USER, isE2eMock } from '$lib/server/e2e-mocks';
import { chatIdentityFromUserId } from '$lib/server/chat-display-name';

export const load: PageServerLoad = async ({ locals, url, platform }) => {
	if (isE2eMock(platform)) {
		const identity = chatIdentityFromUserId(E2E_MOCK_USER.id, platform);
		return {
			user: {
				id: E2E_MOCK_USER.id,
				email: E2E_MOCK_USER.email,
				displayName: identity.displayName,
				tag: identity.tag
			}
		};
	}

	const user = await locals.getUser();
	if (!user) {
		throw redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
	}
	const identity = chatIdentityFromUserId(user.id, platform);

	return {
		user: {
			id: user.id,
			email: user.email,
			displayName: identity.displayName,
			tag: identity.tag
		}
	};
};
