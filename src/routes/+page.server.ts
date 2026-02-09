import type { PageServerLoad } from './$types';
import type { AdCard, ApiAdRow } from '../types/ad-types';
import { getPagination } from '$lib/server/pagination';
import {
	getCountyOptionById,
	getCountyOptions,
	getLocalityOptionById,
	getLocalityOptionsByCountyId
} from '$lib/location-hierarchy';

const DEFAULT_LIMIT = 24;

export const load: PageServerLoad = async ({ fetch, url }) => {
	const { page, limit } = getPagination(url.searchParams, DEFAULT_LIMIT, 100);
	const q = (url.searchParams.get('q') ?? '').trim();
	const category = (url.searchParams.get('category') ?? '').trim();
	const priceState = (url.searchParams.get('price_state') ?? '').trim();
	const rawCountyId = (url.searchParams.get('county_id') ?? '').trim();
	const countyId = getCountyOptionById(rawCountyId)?.id ?? '';
	const rawLocalityId = (url.searchParams.get('locality_id') ?? '').trim();
	const localityId = countyId ? (getLocalityOptionById(countyId, rawLocalityId)?.id ?? '') : '';
	const params = new URLSearchParams({
		page: String(page),
		limit: String(limit)
	});
	if (q) params.set('q', q);
	if (category) params.set('category', category);
	if (priceState) params.set('price_state', priceState);
	if (countyId) params.set('county_id', countyId);
	if (localityId) params.set('locality_id', localityId);

	const res = await fetch(`/api/ads?${params.toString()}`);
	if (!res.ok) {
		let message = 'Could not load listings.';
		let requestId: string | undefined;
		try {
			const body = (await res.json()) as { message?: string; requestId?: string };
			message = body?.message || message;
			requestId = body?.requestId;
		} catch {
			/* noop */
		}
		return {
			ads: [],
			page,
			q,
			category,
			priceState,
			countyId,
			localityId,
			locationOptions: {
				counties: getCountyOptions(),
				localities: countyId ? getLocalityOptionsByCountyId(countyId) : []
			},
			error: { message, requestId }
		};
	}

	const { ads, nextPage, requestId } = (await res.json()) as {
		ads: ApiAdRow[];
		nextPage?: number | null;
		requestId?: string;
	};

	const mapped: AdCard[] = ads.map((ad) => ({
		id: ad.id,
		title: ad.title,
		price: ad.price ?? null,
		img: ad.image_keys?.[0] ?? '',
		description: ad.description ?? '',
		category: ad.category ?? '',
		categoryProfileData: ad.category_profile_data ?? null,
		locationProfileData: ad.location_profile_data ?? null,
		currency: ad.currency ?? undefined,
		firmPrice: ad.firm_price ?? false,
		minOffer: ad.min_offer ?? null
	}));

	return {
		ads: mapped,
		page,
		nextPage: nextPage ?? null,
		requestId,
		q,
		category,
		priceState,
		countyId,
		localityId,
		locationOptions: {
			counties: getCountyOptions(),
			localities: countyId ? getLocalityOptionsByCountyId(countyId) : []
		}
	};
};
