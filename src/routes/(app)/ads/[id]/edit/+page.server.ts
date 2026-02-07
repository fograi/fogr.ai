import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { E2E_MOCK_AD, E2E_MOCK_USER, isE2eMock } from '$lib/server/e2e-mocks';

const EDITABLE_STATUSES = new Set(['active', 'pending', 'archived']);

type EditAdRow = {
	id: string;
	user_id: string;
	title: string;
	description: string;
	category: string;
	category_profile_data: Record<string, unknown> | null;
	price: number | null;
	currency: string | null;
	image_keys: string[] | null;
	status: string;
	firm_price: boolean;
	min_offer: number | null;
	auto_decline_message: string | null;
	created_at: string;
	updated_at: string | null;
	expires_at: string;
};

export const load: PageServerLoad = async ({ locals, platform, params, url }) => {
	if (isE2eMock(platform)) {
		return {
			ad: {
				...E2E_MOCK_AD,
				category_profile_data: E2E_MOCK_AD.category_profile_data ?? null,
				status: E2E_MOCK_AD.status,
				firm_price: E2E_MOCK_AD.firm_price ?? false,
				min_offer: E2E_MOCK_AD.min_offer ?? null,
				auto_decline_message: E2E_MOCK_AD.auto_decline_message ?? null,
				expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
			},
			ageConfirmed: true,
			editable: true,
			user: E2E_MOCK_USER
		};
	}

	const user = await locals.getUser();
	if (!user) throw redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);

	const { data: ad, error: adError } = await locals.supabase
		.from('ads')
		.select(
			'id,user_id,title,description,category,category_profile_data,price,currency,image_keys,status,firm_price,min_offer,auto_decline_message,created_at,updated_at,expires_at'
		)
		.eq('id', params.id)
		.maybeSingle();

	if (adError) throw error(500, 'Could not load ad.');
	if (!ad) throw error(404, 'Ad not found.');
	if (ad.user_id !== user.id) throw error(403, 'Forbidden');

	let ageConfirmed = false;
	try {
		const { data: ageRow } = await locals.supabase
			.from('user_age_confirmations')
			.select('user_id')
			.eq('user_id', user.id)
			.maybeSingle();
		ageConfirmed = !!ageRow?.user_id;
	} catch {
		/* noop */
	}

	return {
		ad: ad as EditAdRow,
		ageConfirmed,
		editable: EDITABLE_STATUSES.has(ad.status),
		user: { id: user.id, email: user.email }
	};
};
