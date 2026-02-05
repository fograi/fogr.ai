import {
	CATEGORIES,
	POA_CATEGORY_SET,
	getMinPhotosForCategory,
	type Category,
	type PriceType
} from '$lib/constants';

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
	const allowsPoa = POA_CATEGORY_SET.has(cat);

	if (priceType === 'poa') {
		if (!allowsPoa) return 'Price on application is not available for this category.';
		if (priceStr && priceStr.trim() !== '') return 'Do not enter a price for POA listings.';
		return null;
	}

	if (priceStr === null || priceStr.trim() === '') return 'Price is required.';
	const n = Number(priceStr);
	if (!Number.isFinite(n) || n < 0) return 'Invalid price.';
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
	const minOffer = Number(minOfferStr);
	if (!Number.isFinite(minOffer) || minOffer <= 0) {
		return 'Minimum offer must be greater than 0.';
	}
	if (priceStr && priceStr.trim() !== '') {
		const price = Number(priceStr);
		if (Number.isFinite(price) && minOffer >= price) {
			return 'Minimum offer must be less than the asking price.';
		}
	}
	return null;
}
