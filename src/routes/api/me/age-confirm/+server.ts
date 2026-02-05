import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { isSameOrigin } from '$lib/server/csrf';
import { isE2eMock } from '$lib/server/e2e-mocks';

export const POST: RequestHandler = async ({ locals, request, url, platform }) => {
	if (!isSameOrigin(request, url)) {
		return json({ success: false, message: 'Forbidden' }, { status: 403 });
	}

	if (isE2eMock(platform)) {
		return json({ success: true }, { status: 200 });
	}

	const {
		data: { user },
		error
	} = await locals.supabase.auth.getUser();
	if (error || !user) {
		return json({ success: false, message: 'Sign-in required.' }, { status: 401 });
	}

	const ip =
		request.headers.get('CF-Connecting-IP') ??
		request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
		null;
	const userAgent = request.headers.get('user-agent') ?? null;

	const { error: upsertError } = await locals.supabase
		.from('user_age_confirmations')
		.upsert(
			{
				user_id: user.id,
				age_confirmed_ip: ip,
				age_confirmed_user_agent: userAgent
			},
			{ onConflict: 'user_id', ignoreDuplicates: true }
		);

	if (upsertError) {
		return json(
			{ success: false, message: 'We could not save your confirmation.' },
			{ status: 500 }
		);
	}

	return json({ success: true }, { status: 200 });
};
