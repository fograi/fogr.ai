import { describe, it, expect } from 'vitest';
import { buildAdOg, buildCategoryOg, buildHomepageOg } from './og';

describe('buildAdOg', () => {
	it('uses the ad image URL when the ad has an image', () => {
		const result = buildAdOg(
			{
				title: 'Trek Domane Road Bike',
				description: 'Great condition.',
				slug: 'trek-domane-dublin-abc12345',
				imageUrl: 'https://cdn.example.com/photo.jpg',
				categorySlug: 'bikes',
				countyName: 'Dublin'
			},
			'https://fogr.ai'
		);
		expect(result.image).toBe('https://cdn.example.com/photo.jpg');
	});

	it('falls back to category og-fallback image when ad has no image', () => {
		const result = buildAdOg(
			{
				title: 'Trek Domane Road Bike',
				description: 'Great condition.',
				slug: 'trek-domane-dublin-abc12345',
				imageUrl: null,
				categorySlug: 'bikes',
				countyName: 'Dublin'
			},
			'https://fogr.ai'
		);
		expect(result.image).toBe('https://fogr.ai/og-fallback/bikes.png');
	});

	it('sets og:url to the canonical ad URL', () => {
		const result = buildAdOg(
			{
				title: 'Trek Domane Road Bike',
				description: 'Great condition.',
				slug: 'trek-domane-dublin-abc12345',
				imageUrl: null,
				categorySlug: 'bikes',
				countyName: 'Dublin'
			},
			'https://fogr.ai'
		);
		expect(result.url).toBe('https://fogr.ai/ad/trek-domane-dublin-abc12345');
	});

	it('sets og:type to product', () => {
		const result = buildAdOg(
			{
				title: 'Trek Domane Road Bike',
				description: 'Great condition.',
				slug: 'trek-domane-dublin-abc12345',
				imageUrl: null,
				categorySlug: 'bikes',
				countyName: null
			},
			'https://fogr.ai'
		);
		expect(result.type).toBe('product');
	});

	it('includes siteName on the result', () => {
		const result = buildAdOg(
			{
				title: 'Vintage Chair',
				description: 'Oak chair.',
				slug: 'vintage-chair-cork-def67890',
				imageUrl: null,
				categorySlug: 'home-garden',
				countyName: 'Cork'
			},
			'https://fogr.ai'
		);
		expect(result.siteName).toBeTruthy();
	});

	it('includes a description on the result', () => {
		const result = buildAdOg(
			{
				title: 'Vintage Chair',
				description: 'Oak chair in excellent condition for sale.',
				slug: 'vintage-chair-cork-def67890',
				imageUrl: null,
				categorySlug: 'home-garden',
				countyName: 'Cork'
			},
			'https://fogr.ai'
		);
		expect(result.description).toBeTruthy();
	});
});

describe('buildCategoryOg', () => {
	it('sets og:type to website', () => {
		const result = buildCategoryOg('Bikes', null, 'https://fogr.ai', '/bikes');
		expect(result.type).toBe('website');
	});

	it('sets og:url to the category page URL', () => {
		const result = buildCategoryOg('Bikes', null, 'https://fogr.ai', '/bikes');
		expect(result.url).toBe('https://fogr.ai/bikes');
	});

	it('includes category name in og:title', () => {
		const result = buildCategoryOg('Electronics', null, 'https://fogr.ai', '/electronics');
		expect(result.title).toContain('Electronics');
	});

	it('includes both category and county in title when county is provided', () => {
		const result = buildCategoryOg('Bikes', 'Dublin', 'https://fogr.ai', '/bikes/dublin');
		expect(result.title).toContain('Bikes');
		expect(result.title).toContain('Dublin');
	});

	it('includes a fallback og:image', () => {
		const result = buildCategoryOg('Bikes', null, 'https://fogr.ai', '/bikes');
		expect(result.image).toContain('/og-fallback/');
	});

	it('includes a description referencing the category', () => {
		const result = buildCategoryOg('Bikes', null, 'https://fogr.ai', '/bikes');
		expect(result.description.toLowerCase()).toContain('bikes');
	});
});

describe('buildHomepageOg', () => {
	it('sets og:type to website', () => {
		const result = buildHomepageOg('https://fogr.ai');
		expect(result.type).toBe('website');
	});

	it('sets og:url to the site origin', () => {
		const result = buildHomepageOg('https://fogr.ai');
		expect(result.url).toBe('https://fogr.ai');
	});

	it('includes a non-empty og:title', () => {
		const result = buildHomepageOg('https://fogr.ai');
		expect(result.title.length).toBeGreaterThan(0);
	});

	it('includes a fallback og:image', () => {
		const result = buildHomepageOg('https://fogr.ai');
		expect(result.image).toContain('/og-fallback/');
	});

	it('includes a non-empty og:description', () => {
		const result = buildHomepageOg('https://fogr.ai');
		expect(result.description.length).toBeGreaterThan(0);
	});

	it('includes siteName on the result', () => {
		const result = buildHomepageOg('https://fogr.ai');
		expect(result.siteName).toBeTruthy();
	});
});
