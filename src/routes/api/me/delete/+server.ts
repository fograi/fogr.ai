import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { isSameOrigin } from '$lib/server/csrf';
import { isE2eMock } from '$lib/server/e2e-mocks';

export const POST: RequestHandler = async ({ locals, platform, request, url }) => {
	if (isE2eMock(platform)) {
		return json({ success: true }, { status: 200 });
	}

	if (!isSameOrigin(request, url)) {
		return json({ success: false, message: 'Forbidden' }, { status: 403 });
	}

	const { data, error } = await locals.supabase.auth.getUser();
	if (error || !data.user) {
		return json({ success: false, message: 'Sign-in required.' }, { status: 401 });
	}

	const env = platform?.env as {
		PUBLIC_SUPABASE_URL?: string;
		SUPABASE_SERVICE_ROLE_KEY?: string;
	};
	const baseUrl = env?.PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
	const serviceKey = env?.SUPABASE_SERVICE_ROLE_KEY;

	if (!baseUrl || !serviceKey) {
		return json({ success: false, message: 'Server misconfigured.' }, { status: 500 });
	}

	const res = await fetch(`${baseUrl}/auth/v1/admin/users/${data.user.id}`, {
		method: 'DELETE',
		headers: {
			apikey: serviceKey,
			Authorization: `Bearer ${serviceKey}`
		}
	});

	if (!res.ok) {
		return json(
			{ success: false, message: 'We could not delete the account. Try again.' },
			{ status: 500 }
		);
	}

	await locals.supabase.auth.signOut();
	return json({ success: true }, { status: 200 });
};
