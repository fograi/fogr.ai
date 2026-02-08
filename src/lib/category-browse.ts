import { CATEGORIES, type Category } from '$lib/constants';

export const CATEGORY_SORT_OPTIONS = [
	{ value: 'newest', label: 'Newest first' },
	{ value: 'price_low', label: 'Price: low to high' },
	{ value: 'price_high', label: 'Price: high to low' }
] as const;

export type CategorySort = (typeof CATEGORY_SORT_OPTIONS)[number]['value'];
export const DEFAULT_CATEGORY_SORT: CategorySort = 'newest';

const CATEGORY_SLUG_BY_NAME: Record<Category, string> = {
	'Home & Garden': 'home-garden',
	Electronics: 'electronics',
	'Baby & Kids': 'baby-kids',
	Bikes: 'bikes',
	'Clothing & Accessories': 'clothing-accessories',
	'Services & Gigs': 'services-gigs',
	'Lessons & Tutoring': 'lessons-tutoring',
	'Lost and Found': 'lost-found',
	'Free / Giveaway': 'free-giveaway'
};

const CATEGORY_NAME_BY_SLUG = new Map<string, Category>(
	Object.entries(CATEGORY_SLUG_BY_NAME).map(([category, slug]) => [slug, category as Category])
);

const categorySet = new Set<string>(CATEGORIES);
const sortSet = new Set<string>(CATEGORY_SORT_OPTIONS.map((option) => option.value));

export function categoryToSlug(category: Category): string {
	return CATEGORY_SLUG_BY_NAME[category];
}

export function slugToCategory(slug: string): Category | null {
	if (!slug) return null;
	return CATEGORY_NAME_BY_SLUG.get(slug.trim().toLowerCase()) ?? null;
}

export function asCategory(value: string | null | undefined): Category | '' {
	const normalized = (value ?? '').trim();
	return categorySet.has(normalized) ? (normalized as Category) : '';
}

export function asCategorySort(value: string | null | undefined): CategorySort {
	const normalized = (value ?? '').trim().toLowerCase();
	return sortSet.has(normalized) ? (normalized as CategorySort) : DEFAULT_CATEGORY_SORT;
}

export function asPositiveIntString(value: string | null | undefined): string {
	const normalized = (value ?? '').trim();
	if (!normalized) return '';
	if (!/^[0-9]+$/.test(normalized)) return '';
	return String(Number(normalized));
}
