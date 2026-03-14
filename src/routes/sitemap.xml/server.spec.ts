import { describe, it, expect } from 'vitest';
import { GET } from './+server';

type AdRow = {
	slug: string | null;
	updated_at: string;
	category: string;
	location_profile_data: Record<string, unknown> | null;
};

function mockSupabase(ads: AdRow[], dbError = false) {
	return {
		from: () => ({
			select: () => ({
				eq: () => ({
					gt: () => ({
						not: () =>
							Promise.resolve({
								data: dbError ? null : ads,
								error: dbError ? new Error('db error') : null
							})
					})
				})
			})
		})
	};
}

function makeEvent(ads: AdRow[], dbError = false) {
	return {
		locals: { supabase: mockSupabase(ads, dbError) }
	} as Parameters<typeof GET>[0];
}

const dublinLocation = {
	county: { id: 'ie/leinster/dublin', name: 'Dublin' },
	province: { id: 'ie/leinster', name: 'Leinster' }
};

describe('GET /sitemap.xml', () => {
	it('returns a 200 response with XML content-type', async () => {
		const res = await GET(makeEvent([]));
		expect(res.status).toBe(200);
		expect(res.headers.get('Content-Type')).toBe('application/xml');
	});

	it('returns valid XML with the sitemap namespace declaration', async () => {
		const res = await GET(makeEvent([]));
		const body = await res.text();
		expect(body).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(body).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
	});

	it('always includes the homepage URL', async () => {
		const res = await GET(makeEvent([]));
		const body = await res.text();
		expect(body).toContain('<loc>https://fogr.ai</loc>');
	});

	it('includes active ad URLs with their slug paths', async () => {
		const ads: AdRow[] = [
			{
				slug: 'trek-bike-dublin-abc12345',
				updated_at: '2026-03-10T12:00:00Z',
				category: 'Bikes',
				location_profile_data: dublinLocation
			}
		];
		const res = await GET(makeEvent(ads));
		const body = await res.text();
		expect(body).toContain('/ad/trek-bike-dublin-abc12345');
	});

	it('includes lastmod dates for active ads', async () => {
		const ads: AdRow[] = [
			{
				slug: 'trek-bike-dublin-abc12345',
				updated_at: '2026-03-10T12:00:00Z',
				category: 'Bikes',
				location_profile_data: dublinLocation
			}
		];
		const res = await GET(makeEvent(ads));
		const body = await res.text();
		expect(body).toContain('<lastmod>2026-03-10</lastmod>');
	});

	it('excludes ads with null slugs from the sitemap', async () => {
		const ads: AdRow[] = [
			{
				slug: null,
				updated_at: '2026-03-10T12:00:00Z',
				category: 'Bikes',
				location_profile_data: dublinLocation
			}
		];
		const res = await GET(makeEvent(ads));
		const body = await res.text();
		// No /ad/ paths should appear since the only ad has a null slug
		const adEntries = (body.match(/<loc>https:\/\/fogr\.ai\/ad\//g) ?? []).length;
		expect(adEntries).toBe(0);
	});

	it('includes a category programmatic page only when it has 3 or more active listings', async () => {
		const bikeAds: AdRow[] = Array.from({ length: 3 }, (_, i) => ({
			slug: `bike-slug-${i}`,
			updated_at: '2026-03-10T12:00:00Z',
			category: 'Bikes',
			location_profile_data: null
		}));
		const res = await GET(makeEvent(bikeAds));
		const body = await res.text();
		expect(body).toContain('https://fogr.ai/bikes');
	});

	it('excludes a category programmatic page when it has fewer than 3 active listings', async () => {
		const bikeAds: AdRow[] = [
			{
				slug: 'bike-slug-only-one',
				updated_at: '2026-03-10T12:00:00Z',
				category: 'Bikes',
				location_profile_data: null
			}
		];
		const res = await GET(makeEvent(bikeAds));
		const body = await res.text();
		// /bikes appears in ad URL too, so check for exact category page URL pattern
		const categoryPageEntries = (body.match(/<loc>https:\/\/fogr\.ai\/bikes<\/loc>/g) ?? []).length;
		expect(categoryPageEntries).toBe(0);
	});

	it('includes a county programmatic page only when it has 3 or more active listings', async () => {
		const dublinAds: AdRow[] = Array.from({ length: 3 }, (_, i) => ({
			slug: `ad-dublin-${i}`,
			updated_at: '2026-03-10T12:00:00Z',
			category: 'Bikes',
			location_profile_data: dublinLocation
		}));
		const res = await GET(makeEvent(dublinAds));
		const body = await res.text();
		expect(body).toContain('https://fogr.ai/dublin');
	});

	it('includes a category+county combo page only when it has 3 or more active listings', async () => {
		const dublinBikeAds: AdRow[] = Array.from({ length: 3 }, (_, i) => ({
			slug: `bike-dublin-${i}`,
			updated_at: '2026-03-10T12:00:00Z',
			category: 'Bikes',
			location_profile_data: dublinLocation
		}));
		const res = await GET(makeEvent(dublinBikeAds));
		const body = await res.text();
		expect(body).toContain('https://fogr.ai/bikes/dublin');
	});

	it('sets Cache-Control header to public with 1-hour max-age', async () => {
		const res = await GET(makeEvent([]));
		expect(res.headers.get('Cache-Control')).toBe('public, max-age=3600');
	});

	it('returns 500 when the database query fails', async () => {
		const res = await GET(makeEvent([], true));
		expect(res.status).toBe(500);
	});
});
