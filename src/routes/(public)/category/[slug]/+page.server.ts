import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { AdCard, ApiAdRow } from '../../../../types/ad-types';
import { getPagination } from '$lib/server/pagination';
import {
	asCategorySort,
	asPositiveIntString,
	CATEGORY_SORT_OPTIONS,
	type CategorySort,
	slugToCategory
} from '$lib/category-browse';
import {
	BIKE_ADULT_SIZE_PRESETS,
	BIKE_CONDITION_OPTIONS,
	BIKE_KIDS_SIZE_PRESETS,
	BIKE_SUBTYPE_OPTIONS,
	BIKE_SUBTYPES,
	getBikeSubtypeOptions,
	type BikeCondition,
	type BikeSizePreset,
	type BikeSubtype,
	type BikeType
} from '$lib/category-profiles';
import {
	getCountyOptionById,
	getCountyOptions,
	getLocalityOptionById,
	getLocalityOptionsByCountyId
} from '$lib/location-hierarchy';

const DEFAULT_LIMIT = 24;
const priceStateSet = new Set(['fixed', 'free', 'poa']);
const bikeSubtypeSet = new Set<string>(BIKE_SUBTYPES);
const bikeConditionSet = new Set<string>(BIKE_CONDITION_OPTIONS.map((option) => option.value));
const bikeSizeSet = new Set<string>([...BIKE_ADULT_SIZE_PRESETS, ...BIKE_KIDS_SIZE_PRESETS]);

function asPriceState(value: string | null | undefined): '' | 'fixed' | 'free' | 'poa' {
	const normalized = (value ?? '').trim().toLowerCase();
	return priceStateSet.has(normalized) ? (normalized as 'fixed' | 'free' | 'poa') : '';
}

const bikeTypeMap = new Map<BikeType, string>();
for (const subtype of BIKE_SUBTYPES) {
	for (const option of getBikeSubtypeOptions(subtype)) {
		bikeTypeMap.set(option.value, option.label);
	}
}
const allBikeTypeOptions = Array.from(bikeTypeMap.entries()).map(([value, label]) => ({
	value,
	label
}));

export const load: PageServerLoad = async ({ params, fetch, url }) => {
	const category = slugToCategory(params.slug);
	if (!category) throw error(404, 'Category not found.');

	const { page, limit } = getPagination(url.searchParams, DEFAULT_LIMIT, 100);
	const q = (url.searchParams.get('q') ?? '').trim();
	const sort = asCategorySort(url.searchParams.get('sort'));
	const priceState = asPriceState(url.searchParams.get('price_state'));
	const minPrice = asPositiveIntString(url.searchParams.get('min_price'));
	const maxPrice = asPositiveIntString(url.searchParams.get('max_price'));
	const rawCountyId = (url.searchParams.get('county_id') ?? '').trim();
	const countyId = getCountyOptionById(rawCountyId)?.id ?? '';
	const rawLocalityId = (url.searchParams.get('locality_id') ?? '').trim();
	const localityId = countyId ? (getLocalityOptionById(countyId, rawLocalityId)?.id ?? '') : '';

	const rawBikeSubtype = (url.searchParams.get('bike_subtype') ?? '').trim().toLowerCase();
	const bikeSubtype = bikeSubtypeSet.has(rawBikeSubtype) ? (rawBikeSubtype as BikeSubtype) : '';
	const bikeTypeOptions = bikeSubtype ? getBikeSubtypeOptions(bikeSubtype) : allBikeTypeOptions;
	const bikeTypeSet = new Set<string>(bikeTypeOptions.map((option) => option.value));
	const rawBikeType = (url.searchParams.get('bike_type') ?? '').trim().toLowerCase();
	const bikeType = bikeTypeSet.has(rawBikeType) ? (rawBikeType as BikeType) : '';
	const rawBikeCondition = (url.searchParams.get('bike_condition') ?? '').trim().toLowerCase();
	const bikeCondition = bikeConditionSet.has(rawBikeCondition)
		? (rawBikeCondition as BikeCondition)
		: '';
	const rawBikeSize = (url.searchParams.get('bike_size') ?? '').trim().toUpperCase();
	const bikeSize = bikeSizeSet.has(rawBikeSize) ? (rawBikeSize as BikeSizePreset) : '';

	const query = new URLSearchParams({
		page: String(page),
		limit: String(limit),
		category
	});
	if (q) query.set('q', q);
	if (sort !== ('newest' as CategorySort)) query.set('sort', sort);
	if (priceState) query.set('price_state', priceState);
	if (minPrice) query.set('min_price', minPrice);
	if (maxPrice) query.set('max_price', maxPrice);
	if (countyId) query.set('county_id', countyId);
	if (localityId) query.set('locality_id', localityId);
	if (bikeSubtype) query.set('bike_subtype', bikeSubtype);
	if (bikeType) query.set('bike_type', bikeType);
	if (bikeCondition) query.set('bike_condition', bikeCondition);
	if (bikeSize) query.set('bike_size', bikeSize);

	const res = await fetch(`/api/ads?${query.toString()}`);
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
			category,
			categorySlug: params.slug,
			ads: [],
			page,
			nextPage: null,
			requestId,
			error: { message, requestId },
			filters: {
				q,
				sort,
				priceState,
				minPrice,
				maxPrice,
				countyId,
				localityId,
				bikeSubtype,
				bikeType,
				bikeCondition,
				bikeSize
			},
			options: {
				sort: CATEGORY_SORT_OPTIONS,
				county: getCountyOptions(),
				locality: countyId ? getLocalityOptionsByCountyId(countyId) : [],
				bikeSubtype: BIKE_SUBTYPE_OPTIONS,
				bikeType: bikeTypeOptions,
				bikeCondition: BIKE_CONDITION_OPTIONS,
				bikeSize: [...BIKE_ADULT_SIZE_PRESETS, ...BIKE_KIDS_SIZE_PRESETS]
			}
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
		category,
		categorySlug: params.slug,
		ads: mapped,
		page,
		nextPage: nextPage ?? null,
		requestId,
		error: null,
		filters: {
			q,
			sort,
			priceState,
			minPrice,
			maxPrice,
			countyId,
			localityId,
			bikeSubtype,
			bikeType,
			bikeCondition,
			bikeSize
		},
		options: {
			sort: CATEGORY_SORT_OPTIONS,
			county: getCountyOptions(),
			locality: countyId ? getLocalityOptionsByCountyId(countyId) : [],
			bikeSubtype: BIKE_SUBTYPE_OPTIONS,
			bikeType: bikeTypeOptions,
			bikeCondition: BIKE_CONDITION_OPTIONS,
			bikeSize: [...BIKE_ADULT_SIZE_PRESETS, ...BIKE_KIDS_SIZE_PRESETS]
		}
	};
};
