import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { AdCard, ApiAdRow } from '../../../types/ad-types';
import { getPagination } from '$lib/server/pagination';
import { countySlugToOption } from '$lib/seo/county-slugs';
import { buildCountyTitle, buildDescription, buildCanonical } from '$lib/seo/meta';
import { itemListJsonLd, breadcrumbJsonLd } from '$lib/seo/jsonld';

const DEFAULT_LIMIT = 24;
const NOINDEX_THRESHOLD = 3;

export const load: PageServerLoad = async ({ params, fetch, url }) => {
	const county = countySlugToOption(params.county);
	if (!county) throw error(404, 'County not found.');

	const { page, limit } = getPagination(url.searchParams, DEFAULT_LIMIT, 100);

	const query = new URLSearchParams({
		page: String(page),
		limit: String(limit),
		county_id: county.id
	});

	const res = await fetch(`/api/ads?${query.toString()}`);
	if (!res.ok) {
		return {
			ads: [] as AdCard[],
			category: null,
			categorySlug: null,
			countyName: county.name,
			countySlug: county.slug,
			listingCount: 0,
			priceRange: { min: null, max: null },
			seo: {
				title: buildCountyTitle(county.name),
				description: `Browse second-hand classifieds for sale in ${county.name} on Fogr.ai.`,
				canonical: buildCanonical(url.origin, url.pathname),
				robots: 'noindex',
				jsonLd: [
					itemListJsonLd([], url.origin),
					breadcrumbJsonLd(
						[
							{ name: 'Home', url: '/' },
							{ name: county.name, url: `/${county.slug}` }
						],
						url.origin
					)
				]
			},
			page,
			nextPage: null
		};
	}

	const { ads: rawAds, nextPage } = (await res.json()) as {
		ads: ApiAdRow[];
		nextPage?: number | null;
	};

	const ads: AdCard[] = rawAds.map((ad) => ({
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
		minOffer: ad.min_offer ?? null
	}));

	const prices = rawAds
		.map((ad) => ad.price)
		.filter((p): p is number => typeof p === 'number' && p > 0);
	const priceRange = {
		min: prices.length > 0 ? Math.min(...prices) : null,
		max: prices.length > 0 ? Math.max(...prices) : null
	};

	const listingCount = rawAds.length;
	const shouldNoindex = listingCount < NOINDEX_THRESHOLD;

	const descParts = [`Browse ${listingCount} second-hand classifieds for sale in ${county.name} on Fogr.ai.`];
	if (priceRange.min !== null && priceRange.max !== null) {
		descParts.push(`Prices from EUR ${priceRange.min} to EUR ${priceRange.max}.`);
	}

	return {
		ads,
		category: null,
		categorySlug: null,
		countyName: county.name,
		countySlug: county.slug,
		listingCount,
		priceRange,
		seo: {
			title: buildCountyTitle(county.name),
			description: buildDescription(descParts.join(' ')),
			canonical: buildCanonical(url.origin, url.pathname),
			robots: shouldNoindex ? 'noindex' : 'index, follow',
			jsonLd: [
				itemListJsonLd(
					ads.map((ad) => ({ name: ad.title, url: `/ad/${ad.slug}` })),
					url.origin
				),
				breadcrumbJsonLd(
					[
						{ name: 'Home', url: '/' },
						{ name: county.name, url: `/${county.slug}` }
					],
					url.origin
				)
			]
		},
		page,
		nextPage: nextPage ?? null
	};
};
