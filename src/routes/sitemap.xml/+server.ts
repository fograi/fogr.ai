/**
 * Dynamic XML sitemap endpoint.
 *
 * Returns a valid sitemap containing:
 * - Homepage
 * - Active ad pages (with lastmod from updated_at)
 * - Category pages (only when listing count >= 3)
 * - County pages (only when listing count >= 3)
 * - Category+county combo pages (only when listing count >= 3)
 *
 * Cached for 1 hour. Hand-rolled XML because super-sitemap's directory-tree
 * dependency requires filesystem access that is unavailable on Cloudflare Workers.
 */

import type { RequestHandler } from '@sveltejs/kit';
import { CATEGORIES, type Category } from '$lib/constants';
import { categoryToSlug } from '$lib/category-browse';
import { getAllCountySlugs, countyIdToSlug } from '$lib/seo/county-slugs';

const ORIGIN = 'https://fogr.ai';
const NOINDEX_THRESHOLD = 3;

/** Escape special XML characters in text content */
function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/** Format a date string as YYYY-MM-DD for sitemap lastmod */
function formatDate(isoDate: string): string {
	return isoDate.slice(0, 10);
}

function buildUrlEntry(loc: string, lastmod?: string): string {
	let entry = `  <url>\n    <loc>${escapeXml(loc)}</loc>`;
	if (lastmod) {
		entry += `\n    <lastmod>${formatDate(lastmod)}</lastmod>`;
	}
	entry += '\n  </url>';
	return entry;
}

type ActiveAd = {
	slug: string | null;
	updated_at: string;
	category: string;
	location_profile_data: Record<string, unknown> | null;
};

export const GET: RequestHandler = async ({ locals }) => {
	const nowIso = new Date().toISOString();

	// Fetch all active ads with the minimal columns needed for sitemap
	const { data: ads, error: dbError } = await locals.supabase
		.from('ads')
		.select('slug, updated_at, category, location_profile_data')
		.eq('status', 'active')
		.gt('expires_at', nowIso)
		.not('slug', 'is', null);

	if (dbError) {
		return new Response('Internal Server Error', { status: 500 });
	}

	const activeAds = (ads ?? []) as unknown as ActiveAd[];

	// Build aggregate counts for programmatic pages
	const categoryCounts = new Map<string, number>();
	const countyCounts = new Map<string, number>();
	const comboCounts = new Map<string, number>();

	for (const ad of activeAds) {
		const catSlug = categoryToSlug(ad.category as Category);
		if (catSlug) {
			categoryCounts.set(catSlug, (categoryCounts.get(catSlug) ?? 0) + 1);
		}

		const locationData = ad.location_profile_data;
		const countyObj = locationData?.county as { id?: string } | null | undefined;
		const countyId = countyObj?.id;
		if (countyId) {
			const countySlug = countyIdToSlug(countyId);
			if (countySlug) {
				countyCounts.set(countySlug, (countyCounts.get(countySlug) ?? 0) + 1);

				if (catSlug) {
					const comboKey = `${catSlug}/${countySlug}`;
					comboCounts.set(comboKey, (comboCounts.get(comboKey) ?? 0) + 1);
				}
			}
		}
	}

	// Build sitemap entries
	const entries: string[] = [];

	// 1. Homepage
	entries.push(buildUrlEntry(ORIGIN));

	// 2. Active ad pages
	for (const ad of activeAds) {
		if (ad.slug) {
			entries.push(buildUrlEntry(`${ORIGIN}/ad/${ad.slug}`, ad.updated_at));
		}
	}

	// 3. Category pages with >= NOINDEX_THRESHOLD listings
	const allCategorySlugs = CATEGORIES.map((c) => categoryToSlug(c)).filter(Boolean);
	for (const catSlug of allCategorySlugs) {
		if ((categoryCounts.get(catSlug) ?? 0) >= NOINDEX_THRESHOLD) {
			entries.push(buildUrlEntry(`${ORIGIN}/${catSlug}`));
		}
	}

	// 4. County pages with >= NOINDEX_THRESHOLD listings
	const allCountySlugs = getAllCountySlugs();
	for (const entry of allCountySlugs) {
		if ((countyCounts.get(entry.slug) ?? 0) >= NOINDEX_THRESHOLD) {
			entries.push(buildUrlEntry(`${ORIGIN}/${entry.slug}`));
		}
	}

	// 5. Category+county combo pages with >= NOINDEX_THRESHOLD listings
	for (const [comboKey, count] of comboCounts) {
		if (count >= NOINDEX_THRESHOLD) {
			entries.push(buildUrlEntry(`${ORIGIN}/${comboKey}`));
		}
	}

	const xml = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...entries,
		'</urlset>'
	].join('\n');

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
