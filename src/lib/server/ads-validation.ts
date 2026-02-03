import { CATEGORIES, MAX_PRICE } from '$lib/constants';

type AdValidationInput = {
	category: string;
	currency: string;
	priceStr: string | null;
};

export function validateAdMeta({ category, currency, priceStr }: AdValidationInput): string | null {
	if (!category) return 'Category is required.';
	if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) return 'Invalid category.';

	if (!/^[A-Z]{3}$/.test(currency)) return 'Invalid currency.';

	if (priceStr !== null) {
		const n = Number(priceStr);
		if (!Number.isFinite(n) || n < 0 || n > MAX_PRICE) return 'Invalid price.';
		if (category === 'Free / Giveaway' && n !== 0) return 'Free items must have a price of 0.';
	}

	return null;
}
