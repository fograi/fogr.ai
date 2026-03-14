import { describe, it, expect } from 'vitest';
import {
	buildAdTitle,
	buildCategoryTitle,
	buildCountyTitle,
	buildHomepageTitle,
	buildDescription,
	buildCanonical
} from './meta';

describe('buildAdTitle', () => {
	it('includes ad title and brand', () => {
		const title = buildAdTitle('Trek Domane Road Bike', 'Dublin');
		expect(title).toContain('Trek Domane Road Bike');
		expect(title).toContain('fógr.aí');
	});

	it('still includes brand when county is null', () => {
		const title = buildAdTitle('Vintage Sofa', null);
		expect(title).toContain('Vintage Sofa');
		expect(title).toContain('fógr.aí');
	});
});

describe('buildCategoryTitle', () => {
	it('includes category name and brand without county', () => {
		const title = buildCategoryTitle('Bikes');
		expect(title).toContain('Bikes');
		expect(title).toContain('fógr.aí');
	});

	it('includes both category and county when county is provided', () => {
		const title = buildCategoryTitle('Bikes', 'Dublin');
		expect(title).toContain('Bikes');
		expect(title).toContain('Dublin');
		expect(title).toContain('fógr.aí');
	});

	it('omits county when county is null', () => {
		const title = buildCategoryTitle('Electronics', null);
		expect(title).not.toContain('null');
		expect(title).toContain('Electronics');
	});
});

describe('buildCountyTitle', () => {
	it('includes county name and brand', () => {
		const title = buildCountyTitle('Cork');
		expect(title).toContain('Cork');
		expect(title).toContain('fógr.aí');
	});
});

describe('buildHomepageTitle', () => {
	it('returns a branded buy-and-sell title for Ireland', () => {
		const title = buildHomepageTitle();
		expect(title).toContain('Ireland');
		expect(title).toContain('fógr.aí');
	});
});

describe('buildDescription', () => {
	it('returns short text unchanged', () => {
		const text = 'Nice bike for sale.';
		const result = buildDescription(text);
		expect(result).toBe('Nice bike for sale.');
	});

	it('truncates text longer than 155 characters at a word boundary and appends ellipsis', () => {
		// Construct a string that is definitely longer than the 155-character default limit
		const longText = 'A'.repeat(10) + ' ' + 'word '.repeat(30);
		// Verify our fixture is actually longer than 155
		expect(longText.length).toBeGreaterThan(155);
		const result = buildDescription(longText);
		expect(result.length).toBeLessThanOrEqual(160);
		expect(result.endsWith('...')).toBe(true);
	});

	it('strips newlines by replacing them with spaces', () => {
		const text = 'Line one.\nLine two.\r\nLine three.';
		const result = buildDescription(text);
		expect(result).not.toMatch(/[\r\n]/);
		expect(result).toContain('Line one.');
	});

	it('respects a custom maxLen parameter', () => {
		const text = 'A short sentence that is definitely over twenty characters long here.';
		const result = buildDescription(text, 20);
		expect(result.length).toBeLessThanOrEqual(24); // 20 + "..."
		expect(result.endsWith('...')).toBe(true);
	});
});

describe('buildCanonical', () => {
	it('concatenates origin and pathname', () => {
		const result = buildCanonical('https://fogr.ai', '/ad/trek-domane-abc12345');
		expect(result).toBe('https://fogr.ai/ad/trek-domane-abc12345');
	});

	it('strips query parameters from the canonical URL', () => {
		const result = buildCanonical('https://fogr.ai', '/bikes?page=2');
		expect(result).toBe('https://fogr.ai/bikes');
	});

	it('removes trailing slash from pathname', () => {
		const result = buildCanonical('https://fogr.ai', '/bikes/');
		expect(result).toBe('https://fogr.ai/bikes');
	});

	it('returns origin followed by / for root pathname', () => {
		const result = buildCanonical('https://fogr.ai', '/');
		expect(result).toBe('https://fogr.ai/');
	});
});
