import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { E2E_MOCK_AD, E2E_MOCK_USER, isE2eMock } from '$lib/server/e2e-mocks';

export const GET: RequestHandler = async ({ locals, platform }) => {
	if (isE2eMock(platform)) {
		const payload = {
			generated_at: new Date().toISOString(),
			user: {
				id: E2E_MOCK_USER.id,
				email: E2E_MOCK_USER.email,
				created_at: new Date().toISOString(),
				last_sign_in_at: new Date().toISOString(),
				user_metadata: {},
				app_metadata: {}
			},
			age_confirmation: {
				user_id: E2E_MOCK_USER.id,
				age_confirmed_at: new Date().toISOString(),
				age_confirmed_ip: '127.0.0.1',
				age_confirmed_user_agent: 'Playwright',
				terms_version: null
			},
			ads: [E2E_MOCK_AD]
		};

		return new Response(JSON.stringify(payload, null, 2), {
			headers: {
				'content-type': 'application/json; charset=utf-8',
				'cache-control': 'no-store',
				'content-disposition': 'attachment; filename="fogr-ai-export-e2e.json"'
			}
		});
	}

	const { data, error } = await locals.supabase.auth.getUser();
	if (error || !data.user) {
		return json({ success: false, message: 'Auth required' }, { status: 401 });
	}

	const user = data.user;

	const { data: ads, error: adsError } = await locals.supabase
		.from('ads')
		.select('*')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	if (adsError) {
		return json({ success: false, message: 'Failed to fetch ads' }, { status: 500 });
	}

	const { data: ageConfirmation } = await locals.supabase
		.from('user_age_confirmations')
		.select('*')
		.eq('user_id', user.id)
		.maybeSingle();

	const payload = {
		generated_at: new Date().toISOString(),
		user: {
			id: user.id,
			email: user.email,
			created_at: user.created_at,
			last_sign_in_at: user.last_sign_in_at,
			user_metadata: user.user_metadata,
			app_metadata: user.app_metadata
		},
		age_confirmation: ageConfirmation ?? null,
		ads: ads ?? []
	};

	const stamp = new Date().toISOString().slice(0, 10);
	return new Response(JSON.stringify(payload, null, 2), {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store',
			'content-disposition': `attachment; filename="fogr-ai-export-${stamp}.json"`
		}
	});
};
