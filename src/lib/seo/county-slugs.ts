/**
 * County slug utilities for programmatic SEO pages.
 *
 * Builds a lookup map from slugified county name to county option { id, name }
 * at module load time. Used by programmatic pages, sitemap generation, and
 * expired ad similar listings.
 */

import { getCountyOptions, type LocationOption } from '$lib/location-hierarchy';
import slugify from 'slugify';

type CountySlugEntry = {
	id: string;
	name: string;
	slug: string;
};

const entries: CountySlugEntry[] = getCountyOptions().map((c) => ({
	id: c.id,
	name: c.name,
	slug: slugify(c.name, { lower: true, strict: true })
}));

const SLUG_TO_COUNTY = new Map<string, CountySlugEntry>(entries.map((e) => [e.slug, e]));

const ID_TO_SLUG = new Map<string, string>(entries.map((e) => [e.id, e.slug]));

/**
 * Look up a county by its URL slug.
 * Returns { id, name, slug } or null if slug is invalid.
 */
export function countySlugToOption(slug: string): CountySlugEntry | null {
	return SLUG_TO_COUNTY.get(slug.toLowerCase()) ?? null;
}

/**
 * Convert a county ID to its URL slug.
 */
export function countyIdToSlug(countyId: string): string | null {
	return ID_TO_SLUG.get(countyId) ?? null;
}

/**
 * Get all county slug entries (for sitemap generation).
 */
export function getAllCountySlugs(): readonly CountySlugEntry[] {
	return entries;
}
