/**
 * Open Graph and Twitter Card data builders for SEO.
 *
 * Each builder returns an OgData object consumed by svelte:head blocks.
 * Fallback images reference static/og-fallback/{categorySlug}.png.
 */

import { buildDescription } from './meta';

export type OgData = {
	title: string;
	description: string;
	image: string;
	url: string;
	type: string;
	siteName: string;
};

export function buildAdOg(
	ad: {
		title: string;
		description: string;
		slug: string;
		imageUrl: string | null;
		categorySlug: string;
		countyName: string | null;
	},
	origin: string
): OgData {
	return {
		title: ad.title,
		description: buildDescription(ad.description),
		image: ad.imageUrl || `${origin}/og-fallback/${ad.categorySlug}.png`,
		url: `${origin}/ad/${ad.slug}`,
		type: 'product',
		siteName: 'fógr.aí'
	};
}

export function buildCategoryOg(
	category: string,
	countyName: string | null,
	origin: string,
	pathname: string
): OgData {
	const location = countyName || 'Ireland';
	return {
		title: countyName ? `${category} in ${countyName}` : category,
		description: `Browse second-hand ${category.toLowerCase()} listings for sale in ${location} on fógr.aí`,
		image: `${origin}/og-fallback/home-garden.png`,
		url: `${origin}${pathname}`,
		type: 'website',
		siteName: 'fógr.aí'
	};
}

export function buildHomepageOg(origin: string): OgData {
	return {
		title: 'Buy & Sell Second-Hand in Ireland',
		description: 'Buy and sell second-hand items across Ireland. Browse classified ads for bicycles, electronics, home and garden, and more on fógr.aí.',
		image: `${origin}/og-fallback/home-garden.png`,
		url: origin,
		type: 'website',
		siteName: 'fógr.aí'
	};
}
