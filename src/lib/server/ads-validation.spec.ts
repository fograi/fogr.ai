import { describe, expect, it } from 'vitest';
import { validateAdImages, validateAdMeta } from './ads-validation';

describe('validateAdMeta (price rules)', () => {
	it('accepts fixed price over 0', () => {
		const result = validateAdMeta({
			category: 'Electronics',
			currency: 'EUR',
			priceStr: '120',
			priceType: 'fixed'
		});
		expect(result).toBeNull();
	});

	it('rejects fixed price at 0', () => {
		const result = validateAdMeta({
			category: 'Electronics',
			currency: 'EUR',
			priceStr: '0',
			priceType: 'fixed'
		});
		expect(result).toBe('Fixed price must be greater than 0.');
	});

	it('accepts free price at 0', () => {
		const result = validateAdMeta({
			category: 'Electronics',
			currency: 'EUR',
			priceStr: '0',
			priceType: 'free'
		});
		expect(result).toBeNull();
	});

	it('rejects free price when not 0', () => {
		const result = validateAdMeta({
			category: 'Electronics',
			currency: 'EUR',
			priceStr: '10',
			priceType: 'free'
		});
		expect(result).toBe('Free items must have a price of 0.');
	});

	it('accepts POA for allowed categories', () => {
		const result = validateAdMeta({
			category: 'Services & Gigs',
			currency: 'EUR',
			priceStr: null,
			priceType: 'poa'
		});
		expect(result).toBeNull();
	});

	it('rejects POA for disallowed categories', () => {
		const result = validateAdMeta({
			category: 'Electronics',
			currency: 'EUR',
			priceStr: null,
			priceType: 'poa'
		});
		expect(result).toBe('Price on application is not available for this category.');
	});

	it('rejects POA when price is provided', () => {
		const result = validateAdMeta({
			category: 'Services & Gigs',
			currency: 'EUR',
			priceStr: '20',
			priceType: 'poa'
		});
		expect(result).toBe('Do not enter a price for POA listings.');
	});
});

describe('validateAdImages (min photos)', () => {
	it('allows zero photos for Electronics', () => {
		const result = validateAdImages({ category: 'Electronics', imageCount: 0 });
		expect(result).toBeNull();
	});

	it('allows one photo for Free / Giveaway', () => {
		const result = validateAdImages({ category: 'Free / Giveaway', imageCount: 1 });
		expect(result).toBeNull();
	});
});
