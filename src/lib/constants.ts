export const CATEGORIES = [
	'Home & Garden',
	'Electronics',
	'Baby & Kids',
	'Bikes',
	'Clothing & Accessories',
	'Services & Gigs',
	'Lessons & Tutoring',
	'Lost and Found',
	'Free / Giveaway'
] as const;

export type Category = (typeof CATEGORIES)[number];

export const PRICE_TYPES = ['fixed', 'free', 'poa'] as const;
export type PriceType = (typeof PRICE_TYPES)[number];

export const POA_CATEGORIES = ['Services & Gigs', 'Lessons & Tutoring'] as const;
export const POA_CATEGORY_SET = new Set<Category>(POA_CATEGORIES);

export const catBase: Record<Category, string> = {
	'Home & Garden': '#5A9C3E',
	Electronics: '#117AB5',
	'Baby & Kids': '#5DA9E9',
	Bikes: '#2A9D4B',
	'Clothing & Accessories': '#D64B8A',
	'Services & Gigs': '#7A5AF8',
	'Lessons & Tutoring': '#CD5C5C',
	'Lost and Found': '#EE6600',
	'Free / Giveaway': '#1EAD7B'
};

export const MIN_TITLE_LENGTH = 5;
export const MAX_TITLE_LENGTH = 128;
export const MIN_DESC_LENGTH = 20;
export const MAX_DESC_LENGTH = 1024;
export const MAX_AD_PRICE = 2_147_483_647;
export const MAX_AD_PRICE_LABEL = new Intl.NumberFormat('en-IE', {
	style: 'currency',
	currency: 'EUR',
	maximumFractionDigits: 0
}).format(MAX_AD_PRICE);
export const MAX_AD_PRICE_VALIDATION_MESSAGES = [
	`Good luck with that! ${MAX_AD_PRICE_LABEL} is the max price.`,
	`Quit messing around now! ${MAX_AD_PRICE_LABEL} is the max price.`
] as const;
const WHOLE_EURO_FALLBACK_AMOUNT = 1;
const formatWholeEuroSuggestion = (amount: number) =>
	new Intl.NumberFormat('en-IE', {
		style: 'currency',
		currency: 'EUR',
		maximumFractionDigits: 0
	}).format(amount);
const normalizeMoneyInput = (value: string | number | null | undefined) => {
	if (typeof value === 'number') return value;
	const trimmed = value?.trim() ?? '';
	if (!trimmed) return Number.NaN;
	return Number(trimmed.replace(',', '.'));
};
const getWholeEuroSuggestion = (value: string | number | null | undefined) => {
	const normalized = normalizeMoneyInput(value);
	if (!Number.isFinite(normalized)) return WHOLE_EURO_FALLBACK_AMOUNT;
	return Math.max(WHOLE_EURO_FALLBACK_AMOUNT, Math.ceil(normalized));
};
const pickMessageVariant = (messages: readonly string[]) => {
	const index = Math.floor(Math.random() * messages.length);
	return messages[index] ?? messages[0] ?? '';
};
export const getMaxAdPriceValidationMessage = () =>
	pickMessageVariant(MAX_AD_PRICE_VALIDATION_MESSAGES);
export const getWholeEuroValidationMessagesForAmount = (
	value: string | number | null | undefined
) => {
	const suggested = formatWholeEuroSuggestion(getWholeEuroSuggestion(value));
	return [
		`Non-Cents! Noone wants to deal with that! Just make it ${suggested}.`,
		`No price psychology games here, just make it ${suggested}.`
	] as const;
};
export const getWholeEuroValidationMessage = (value: string | number | null | undefined) =>
	pickMessageVariant(getWholeEuroValidationMessagesForAmount(value));
export const MAX_AD_PRICE_TOOLTIP_TEXT =
	'The number 2,147,483,647 is the maximum positive value for a 32-bit signed binary integer in computing.';

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_IMAGE_COUNT = 1;
export const MAX_TOTAL_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const CONTACT_REVEAL_DEFAULT = false;

export const MIN_PHOTOS_BY_CATEGORY: Record<Category, number> = {
	'Home & Garden': 0,
	Electronics: 0,
	'Baby & Kids': 0,
	Bikes: 0,
	'Clothing & Accessories': 0,
	'Services & Gigs': 0,
	'Lessons & Tutoring': 0,
	'Lost and Found': 0,
	'Free / Giveaway': 0
};

export const getMinPhotosForCategory = (category: Category | '' | null | undefined) => {
	if (!category) return 0;
	return MIN_PHOTOS_BY_CATEGORY[category] ?? 0;
};
