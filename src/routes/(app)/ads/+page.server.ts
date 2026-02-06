import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { E2E_MOCK_AD, isE2eMock } from '$lib/server/e2e-mocks';

type AdRow = {
	id: string;
	title: string;
	price: number | null;
	currency: string | null;
	category: string;
	image_keys: string[] | null;
	status: string;
	created_at: string;
	updated_at: string | null;
	expires_at: string;
};

export const load: PageServerLoad = async ({ locals, platform, url }) => {
	if (isE2eMock(platform)) {
		return {
			ads: [
				{
					id: E2E_MOCK_AD.id,
					title: E2E_MOCK_AD.title,
					price: E2E_MOCK_AD.price,
					currency: E2E_MOCK_AD.currency,
					category: E2E_MOCK_AD.category,
					image_keys: E2E_MOCK_AD.image_keys,
					status: E2E_MOCK_AD.status,
					created_at: E2E_MOCK_AD.created_at,
					updated_at: E2E_MOCK_AD.updated_at,
					expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
				}
			]
		};
	}

	const user = await locals.getUser();
	if (!user) throw redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);

	const { data, error: listError } = await locals.supabase
		.from('ads')
		.select('id,title,price,currency,category,image_keys,status,created_at,updated_at,expires_at')
		.eq('user_id', user.id)
		.order('updated_at', { ascending: false })
		.order('created_at', { ascending: false });

	if (listError) throw error(500, 'Could not load ads.');

	return { ads: (data ?? []) as AdRow[] };
};
