import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { E2E_MOCK_AD, E2E_MOCK_AD_SOLD, isE2eMock } from '$lib/server/e2e-mocks';

type AdRow = {
	id: string;
	slug?: string | null;
	title: string;
	price: number | null;
	currency: string | null;
	category: string;
	image_keys: string[] | null;
	status: string;
	created_at: string;
	updated_at: string | null;
	expires_at: string;
	sale_price?: number | null;
};

export const load: PageServerLoad = async ({ locals, platform, url }) => {
	if (isE2eMock(platform)) {
		const mockAds = [E2E_MOCK_AD, E2E_MOCK_AD_SOLD];
		return {
			ads: mockAds.map((mock) => ({
				id: mock.id,
				slug: mock.slug,
				title: mock.title,
				price: mock.price,
				currency: mock.currency,
				category: mock.category,
				image_keys: mock.image_keys,
				status: mock.status,
				created_at: mock.created_at,
				updated_at: mock.updated_at,
				expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
				sale_price: mock.sale_price ?? null
			}))
		};
	}

	const user = await locals.getUser();
	if (!user) throw redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);

	const { data, error: listError } = await locals.supabase
		.from('ads')
		.select(
			'id,slug,title,price,currency,category,image_keys,status,created_at,updated_at,expires_at,sale_price'
		)
		.eq('user_id', user.id)
		.order('updated_at', { ascending: false })
		.order('created_at', { ascending: false });

	if (listError) throw error(500, 'Could not load ads.');

	return { ads: (data ?? []) as AdRow[] };
};
