import {
	CATEGORIES,
	POA_CATEGORY_SET,
	MAX_AD_PRICE,
	MAX_AD_PRICE_VALIDATION_MESSAGE,
	WHOLE_EURO_VALIDATION_MESSAGE,
	getMinPhotosForCategory,
	type Category,
	type PriceType
} from '$lib/constants';
import {
	isBikesCategory,
	validateAndNormalizeBikesProfileData,
	type BikesProfileData
} from '$lib/category-profiles';

type AdValidationInput = {
	category: string;
	currency: string;
	priceStr: string | null;
	priceType?: string | null;
};

const normalizePriceType = (value?: string | null): PriceType | null => {
	if (!value) return null;
	const lowered = value.toLowerCase().trim();
	if (lowered === 'fixed' || lowered === 'free' || lowered === 'poa') return lowered;
	return null;
};

const WHOLE_EURO_PATTERN = /^\d+$/;

const parseWholeEuro = (value: string | null | undefined) => {
	const trimmed = value?.trim() ?? '';
	if (!trimmed) return null;
	if (!WHOLE_EURO_PATTERN.test(trimmed)) return null;
	return Number(trimmed);
};

export function validateAdMeta({
	category,
	currency,
	priceStr,
	priceType: priceTypeRaw
}: AdValidationInput): string | null {
	if (!category) return 'Category is required.';
	if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) return 'Invalid category.';

	if (!/^[A-Z]{3}$/.test(currency)) return 'Invalid currency.';

	const priceType = normalizePriceType(priceTypeRaw);
	const cat = category as Category;
	const isFreeCategory = cat === 'Free / Giveaway';
	const isLostAndFound = cat === 'Lost and Found';
	const allowsPoa = POA_CATEGORY_SET.has(cat);

	if (isLostAndFound) {
		if (!priceStr || priceStr.trim() === '') return null;
		const reward = parseWholeEuro(priceStr);
		if (reward === null) return WHOLE_EURO_VALIDATION_MESSAGE;
		if (!Number.isFinite(reward) || reward <= 0) return 'Reward must be greater than 0.';
		if (reward > MAX_AD_PRICE) return MAX_AD_PRICE_VALIDATION_MESSAGE;
		return null;
	}

	if (priceType === 'poa') {
		if (!allowsPoa) return 'Price on application is not available for this category.';
		if (priceStr && priceStr.trim() !== '') return 'Do not enter a price for POA listings.';
		return null;
	}

	if (priceStr === null || priceStr.trim() === '') return 'Price is required.';
	const n = parseWholeEuro(priceStr);
	if (n === null) return WHOLE_EURO_VALIDATION_MESSAGE;
	if (!Number.isFinite(n) || n < 0) return 'Invalid price.';
	if (n > MAX_AD_PRICE) return MAX_AD_PRICE_VALIDATION_MESSAGE;
	if (priceType === 'fixed' && n <= 0) return 'Fixed price must be greater than 0.';
	if (priceType === 'free' && n !== 0) return 'Free items must have a price of 0.';
	if (isFreeCategory && n !== 0) return 'Free items must have a price of 0.';

	return null;
}

type AdImageValidationInput = {
	category: string;
	imageCount: number;
};

export function validateAdImages({ category, imageCount }: AdImageValidationInput): string | null {
	if (!category) return 'Category is required.';
	if (!CATEGORIES.includes(category as Category)) return 'Invalid category.';
	const min = getMinPhotosForCategory(category as Category);
	if (imageCount < min) return `Add at least ${min} photo${min === 1 ? '' : 's'}.`;
	return null;
}

type OfferRulesInput = {
	priceType?: string | null;
	priceStr?: string | null;
	firmPrice: boolean;
	minOfferStr?: string | null;
};

export function validateOfferRules({
	priceType,
	priceStr,
	firmPrice,
	minOfferStr
}: OfferRulesInput): string | null {
	const normalizedType = (priceType ?? '').toLowerCase().trim();
	if (normalizedType !== 'fixed') return null;
	if (firmPrice && minOfferStr && minOfferStr.trim() !== '') {
		return 'Firm price listings cannot set a minimum offer.';
	}
	if (!minOfferStr || minOfferStr.trim() === '') return null;
	const minOffer = parseWholeEuro(minOfferStr);
	if (minOffer === null) {
		return WHOLE_EURO_VALIDATION_MESSAGE;
	}
	if (!Number.isFinite(minOffer) || minOffer <= 0) {
		return 'Minimum offer must be greater than 0.';
	}
	if (minOffer > MAX_AD_PRICE) {
		return MAX_AD_PRICE_VALIDATION_MESSAGE;
	}
	if (priceStr && priceStr.trim() !== '') {
		const price = parseWholeEuro(priceStr);
		if (price !== null && minOffer >= price) {
			return 'Minimum offer must be less than the asking price.';
		}
	}
	return null;
}

type CategoryProfileValidationInput = {
	category: string;
	categoryProfileDataRaw: unknown;
};

type CategoryProfileValidationResult = {
	error: string | null;
	categoryProfileData: BikesProfileData | null;
};

export function validateCategoryProfileData({
	category,
	categoryProfileDataRaw
}: CategoryProfileValidationInput): CategoryProfileValidationResult {
	if (!isBikesCategory(category)) {
		return { error: null, categoryProfileData: null };
	}
	const result = validateAndNormalizeBikesProfileData(categoryProfileDataRaw);
	if (result.error) {
		return { error: result.error, categoryProfileData: null };
	}
	return { error: null, categoryProfileData: result.data };
}
