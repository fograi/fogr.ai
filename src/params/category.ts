import { slugToCategory } from '$lib/category-browse';
import type { ParamMatcher } from '@sveltejs/kit';

export const match: ParamMatcher = (param) => {
	return slugToCategory(param) !== null;
};
