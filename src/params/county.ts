import { getCountyOptions } from '$lib/location-hierarchy';
import slugify from 'slugify';
import type { ParamMatcher } from '@sveltejs/kit';

const COUNTY_SLUGS = new Set(
	getCountyOptions().map((c) => slugify(c.name, { lower: true, strict: true }))
);

export const match: ParamMatcher = (param) => {
	return COUNTY_SLUGS.has(param.toLowerCase());
};
