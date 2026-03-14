import { describe, it, expect } from 'vitest';
import { productJsonLd, itemListJsonLd, breadcrumbJsonLd, type AdSeoData } from './jsonld';

const baseAd: AdSeoData = {
	title: 'Trek Domane Road Bike',
	description: 'Excellent condition road bike, barely used.',
	slug: 'trek-domane-road-bike-dublin-abc12345',
	price: 450,
	currency: 'EUR',
	imageUrl: null,
	category: 'Bikes',
	countyName: 'Dublin',
	isExpired: false
};

describe('productJsonLd', () => {
	it('builds a valid schema.org Product object with required fields', () => {
		const result = productJsonLd(baseAd, 'https://fogr.ai');
		expect(result['@context']).toBe('https://schema.org');
		expect(result['@type']).toBe('Product');
		expect(result.name).toBe('Trek Domane Road Bike');
		expect(result.description).toBe('Excellent condition road bike, barely used.');
		expect(result.url).toBe('https://fogr.ai/ad/trek-domane-road-bike-dublin-abc12345');
	});

	it('sets InStock availability for active (non-expired) ads', () => {
		const result = productJsonLd({ ...baseAd, isExpired: false }, 'https://fogr.ai');
		const offers = result.offers as Record<string, unknown>;
		expect(offers.availability).toBe('https://schema.org/InStock');
	});

	it('sets SoldOut availability for expired ads', () => {
		const result = productJsonLd({ ...baseAd, isExpired: true }, 'https://fogr.ai');
		const offers = result.offers as Record<string, unknown>;
		expect(offers.availability).toBe('https://schema.org/SoldOut');
	});

	it('includes price in offers when ad has a positive price', () => {
		const result = productJsonLd({ ...baseAd, price: 450 }, 'https://fogr.ai');
		const offers = result.offers as Record<string, unknown>;
		expect(offers.price).toBe(450);
	});

	it('omits price from offers when ad price is null (price on application)', () => {
		const result = productJsonLd({ ...baseAd, price: null }, 'https://fogr.ai');
		const offers = result.offers as Record<string, unknown>;
		expect(offers.price).toBeUndefined();
	});

	it('omits price from offers when price is zero (free item)', () => {
		const result = productJsonLd({ ...baseAd, price: 0 }, 'https://fogr.ai');
		const offers = result.offers as Record<string, unknown>;
		expect(offers.price).toBeUndefined();
	});

	it('sets UsedCondition item condition', () => {
		const result = productJsonLd(baseAd, 'https://fogr.ai');
		const offers = result.offers as Record<string, unknown>;
		expect(offers.itemCondition).toBe('https://schema.org/UsedCondition');
	});

	it('includes image URL when ad has an image', () => {
		const result = productJsonLd(
			{ ...baseAd, imageUrl: 'https://cdn.example.com/img.jpg' },
			'https://fogr.ai'
		);
		expect(result.image).toBe('https://cdn.example.com/img.jpg');
	});

	it('omits image field when ad has no image', () => {
		const result = productJsonLd({ ...baseAd, imageUrl: null }, 'https://fogr.ai');
		expect(result.image).toBeUndefined();
	});

	it('uses EUR as default currency when none is specified', () => {
		const result = productJsonLd({ ...baseAd, currency: '' }, 'https://fogr.ai');
		const offers = result.offers as Record<string, unknown>;
		expect(offers.priceCurrency).toBe('EUR');
	});
});

describe('itemListJsonLd', () => {
	it('builds a valid schema.org ItemList with correct structure', () => {
		const items = [
			{ name: 'Trek Bike', url: '/ad/trek-bike-abc12345' },
			{ name: 'Giant Bike', url: '/ad/giant-bike-def67890' }
		];
		const result = itemListJsonLd(items, 'https://fogr.ai');
		expect(result['@context']).toBe('https://schema.org');
		expect(result['@type']).toBe('ItemList');
		const elements = result.itemListElement as Array<Record<string, unknown>>;
		expect(elements).toHaveLength(2);
	});

	it('assigns 1-based sequential position to each list item', () => {
		const items = [
			{ name: 'Item A', url: '/ad/item-a-aaa11111' },
			{ name: 'Item B', url: '/ad/item-b-bbb22222' },
			{ name: 'Item C', url: '/ad/item-c-ccc33333' }
		];
		const result = itemListJsonLd(items, 'https://fogr.ai');
		const elements = result.itemListElement as Array<Record<string, unknown>>;
		expect(elements[0].position).toBe(1);
		expect(elements[1].position).toBe(2);
		expect(elements[2].position).toBe(3);
	});

	it('constructs absolute URL by combining origin and item url', () => {
		const items = [{ name: 'Trek Bike', url: '/ad/trek-bike-abc12345' }];
		const result = itemListJsonLd(items, 'https://fogr.ai');
		const elements = result.itemListElement as Array<Record<string, unknown>>;
		expect(elements[0].url).toBe('https://fogr.ai/ad/trek-bike-abc12345');
	});

	it('returns an empty itemListElement array for an empty items list', () => {
		const result = itemListJsonLd([], 'https://fogr.ai');
		expect(result.itemListElement).toEqual([]);
	});
});

describe('breadcrumbJsonLd', () => {
	it('builds a valid schema.org BreadcrumbList with correct structure', () => {
		const crumbs = [
			{ name: 'Home', url: '/' },
			{ name: 'Bikes', url: '/bikes' }
		];
		const result = breadcrumbJsonLd(crumbs, 'https://fogr.ai');
		expect(result['@context']).toBe('https://schema.org');
		expect(result['@type']).toBe('BreadcrumbList');
	});

	it('assigns 1-based sequential position to each breadcrumb', () => {
		const crumbs = [
			{ name: 'Home', url: '/' },
			{ name: 'Bikes', url: '/bikes' },
			{ name: 'Dublin', url: '/bikes/dublin' }
		];
		const result = breadcrumbJsonLd(crumbs, 'https://fogr.ai');
		const elements = result.itemListElement as Array<Record<string, unknown>>;
		expect(elements[0].position).toBe(1);
		expect(elements[1].position).toBe(2);
		expect(elements[2].position).toBe(3);
	});

	it('includes name and absolute item URL on each breadcrumb element', () => {
		const crumbs = [
			{ name: 'Home', url: '/' },
			{ name: 'Bikes', url: '/bikes' }
		];
		const result = breadcrumbJsonLd(crumbs, 'https://fogr.ai');
		const elements = result.itemListElement as Array<Record<string, unknown>>;
		expect(elements[0].name).toBe('Home');
		expect(elements[0].item).toBe('https://fogr.ai/');
		expect(elements[1].name).toBe('Bikes');
		expect(elements[1].item).toBe('https://fogr.ai/bikes');
	});

	it('supports a 3-level Home > Category > County breadcrumb path', () => {
		const crumbs = [
			{ name: 'Home', url: '/' },
			{ name: 'Bikes', url: '/bikes' },
			{ name: 'Dublin', url: '/bikes/dublin' }
		];
		const result = breadcrumbJsonLd(crumbs, 'https://fogr.ai');
		const elements = result.itemListElement as Array<Record<string, unknown>>;
		expect(elements).toHaveLength(3);
		expect(elements[2].item).toBe('https://fogr.ai/bikes/dublin');
	});
});
