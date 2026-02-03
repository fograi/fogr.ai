import { describe, it, expect } from 'vitest';
import { validateAdMeta } from './ads-validation';

describe('validateAdMeta', () => {
	it('rejects missing category', () => {
		expect(validateAdMeta({ category: '', currency: 'EUR', priceStr: '10' })).toBe(
			'Category is required.'
		);
	});

	it('rejects invalid category', () => {
		expect(
			validateAdMeta({ category: 'Not a real category', currency: 'EUR', priceStr: '10' })
		).toBe('Invalid category.');
	});

	it('rejects invalid currency', () => {
		expect(validateAdMeta({ category: 'Electronics', currency: 'eu', priceStr: '10' })).toBe(
			'Invalid currency.'
		);
	});

	it('rejects invalid price', () => {
		expect(validateAdMeta({ category: 'Electronics', currency: 'EUR', priceStr: '-1' })).toBe(
			'Invalid price.'
		);
	});

	it('enforces free category price', () => {
		expect(validateAdMeta({ category: 'Free / Giveaway', currency: 'EUR', priceStr: '5' })).toBe(
			'Free items must have a price of 0.'
		);
	});

	it('accepts valid inputs', () => {
		expect(validateAdMeta({ category: 'Electronics', currency: 'EUR', priceStr: '10' })).toBeNull();
	});
});
