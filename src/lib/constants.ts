export const CATEGORIES = [
	'Home & Garden',
	'Electronics',
	'Baby & Kids',
	'Sports & Bikes',
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
	'Sports & Bikes': '#2A9D4B',
	'Clothing & Accessories': '#D64B8A',
	'Services & Gigs': '#7A5AF8',
	'Lessons & Tutoring': '#CD5C5C',
	'Lost and Found': '#EE6600',
	'Free / Giveaway': '#1EAD7B'
};
export const catIcon: Record<string, string> = {
	'Home & Garden': '🏠',
	Electronics: '💻',
	'Baby & Kids': '🧸',
	'Sports & Bikes': '🚲',
	'Clothing & Accessories': '👕',
	'Services & Gigs': '🧰',
	'Lessons & Tutoring': '🎓',
	'Lost and Found': '🔎',
	'Free / Giveaway': '🆓'
};

export const MIN_TITLE_LENGTH = 5;
export const MAX_TITLE_LENGTH = 128;
export const MIN_DESC_LENGTH = 20;
export const MAX_DESC_LENGTH = 1024;

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_IMAGE_COUNT = 4;
export const MAX_TOTAL_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
