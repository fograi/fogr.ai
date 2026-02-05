import { CATEGORIES, POA_CATEGORY_SET, type Category, type PriceType } from '$lib/constants';

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
