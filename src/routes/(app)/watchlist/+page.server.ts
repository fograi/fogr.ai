import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { AdCard } from '../../../types/ad-types';
import { isE2eMock, E2E_MOCK_AD } from '$lib/server/e2e-mocks';

export const load: PageServerLoad = async ({ locals, url, platform }) => {
	if (isE2eMock(platform)) {
		const ads: AdCard[] = [
			{
				id: E2E_MOCK_AD.id,
				slug: E2E_MOCK_AD.slug ?? undefined,
				title: E2E_MOCK_AD.title,
				price: E2E_MOCK_AD.price,
				img: E2E_MOCK_AD.image_keys?.[0] ?? '',
				description: E2E_MOCK_AD.description,
				category: E2E_MOCK_AD.category,
				categoryProfileData:
					(E2E_MOCK_AD.category_profile_data as Record<string, unknown> | null) ?? null,
				locationProfileData:
					(E2E_MOCK_AD.location_profile_data as Record<string, unknown> | null) ?? null,
				currency: E2E_MOCK_AD.currency ?? undefined,
				firmPrice: E2E_MOCK_AD.firm_price ?? false,
				minOffer: E2E_MOCK_AD.min_offer ?? null,
				createdAt: E2E_MOCK_AD.created_at ?? undefined,
				status: E2E_MOCK_AD.status ?? undefined,
				salePrice: E2E_MOCK_AD.sale_price ?? null
			}
		];
		return { ads };
	}
	const user = await locals.getUser();
	if (!user) throw redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);

	const { data, error } = await locals.supabase
		.from('watchlist')
		.select(
			'ad_id, created_at, ads(id, slug, title, description, price, currency, category, category_profile_data, location_profile_data, image_keys, created_at, status, firm_price, min_offer, sale_price)'
		)
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	if (error) {
		return { ads: [] as AdCard[] };
	}

	// Map joined ads data to AdCard format
	// Filter out any watchlist entries where the ad was deleted
	const ads: AdCard[] = (data ?? [])
		.filter((item) => item.ads)
		.map((item) => {
			const ad = item.ads as unknown as {
				id: string;
				slug: string | null;
				title: string;
				description: string | null;
				price: number | null;
				currency: string | null;
				category: string | null;
				category_profile_data: Record<string, unknown> | null;
				location_profile_data: Record<string, unknown> | null;
				image_keys: string[] | null;
				created_at: string | null;
				status: string | null;
				firm_price: boolean | null;
				min_offer: number | null;
				sale_price: number | null;
			};
			return {
				id: ad.id,
				slug: ad.slug ?? undefined,
				title: ad.title,
				price: ad.price ?? null,
				img: ad.image_keys?.[0] ?? '',
				description: ad.description ?? '',
				category: ad.category ?? '',
				categoryProfileData: ad.category_profile_data ?? null,
				locationProfileData: ad.location_profile_data ?? null,
				currency: ad.currency ?? undefined,
				firmPrice: ad.firm_price ?? false,
				minOffer: ad.min_offer ?? null,
				createdAt: ad.created_at ?? undefined,
				status: ad.status ?? undefined,
				salePrice: ad.sale_price ?? null
			};
		});

	return { ads };
};
