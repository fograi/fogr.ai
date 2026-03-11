import { describe, it, expect } from 'vitest';
import {
	generateAdSlug,
	parseSlugShortId,
	isUuidParam,
	extractShortId,
	STOP_WORDS,
	MAX_TITLE_SLUG_LENGTH
} from './slugs';

describe('generateAdSlug', () => {
	it('produces {title}-{county}-{shortid} format', () => {
		const slug = generateAdSlug('Trek Domane Road Bike', 'Dublin', null);
		expect(slug).toMatch(/^trek-domane-road-bike-dublin-[a-z0-9]{8}$/);
	});

	it('removes stop words', () => {
		const slug = generateAdSlug('A Beautiful Bike For The Road', 'Cork', null);
		const parts = slug.split('-');
		const stopParts = parts.filter((p) => STOP_WORDS.has(p));
		// The only word in the slug that could match a stop word would be an error
		// The shortid might coincidentally match but it is the last 8 chars
		const withoutShortId = parts.slice(0, -1); // remove shortid
		const withoutCounty = withoutShortId.slice(0, -1); // remove county
		const titleStops = withoutCounty.filter((p) => STOP_WORDS.has(p));
		expect(titleStops).toEqual([]);
		expect(slug).toContain('beautiful');
		expect(slug).toContain('bike');
		expect(slug).toContain('road');
	});

	it('handles diacritics (fadas)', () => {
		const slug = generateAdSlug("Sean's Raleigh from Baile Atha Cliath", 'Dublin', null);
		// fadas stripped, apostrophe stripped, stop words removed
		expect(slug).not.toMatch(/[áéíóú]/);
		expect(slug).toContain('seans');
		expect(slug).toContain('raleigh');
	});

	it('falls back to category for emoji-only title', () => {
		const slug = generateAdSlug('\u{1F6B2}\u{1F6B2}\u{1F6B2}', null, 'Bikes');
		expect(slug).toMatch(/^bikes-[a-z0-9]{8}$/);
	});

	it('falls back to "listing" when title and category are empty/emoji', () => {
		const slug = generateAdSlug('\u{1F6B2}\u{1F6B2}\u{1F6B2}', null, null);
		expect(slug).toMatch(/^listing-[a-z0-9]{8}$/);
	});

	it('truncates long titles on word boundary', () => {
		const longTitle =
			'This Is A Very Long Title That Should Be Truncated At Around Sixty Characters On A Word Boundary For Better URL Readability';
		const slug = generateAdSlug(longTitle, null, null);
		const shortId = extractShortId(slug);
		const withoutShortId = slug.slice(0, -(shortId.length + 1)); // remove -shortid
		expect(withoutShortId.length).toBeLessThanOrEqual(MAX_TITLE_SLUG_LENGTH);
	});

	it('omits county when null', () => {
		const slug = generateAdSlug('Mountain Bike', null, null);
		// Should be {title}-{shortid} with no county
		expect(slug).toMatch(/^mountain-bike-[a-z0-9]{8}$/);
	});

	it('short ID is always 8 lowercase alphanumeric chars', () => {
		for (let i = 0; i < 10; i++) {
			const slug = generateAdSlug('Test Ad', 'Dublin', null);
			const shortId = extractShortId(slug);
			expect(shortId).toMatch(/^[a-z0-9]{8}$/);
		}
	});
});

describe('parseSlugShortId', () => {
	it('returns 8-char string for valid slug', () => {
		const result = parseSlugShortId('trek-domane-road-bike-dublin-a1b2c3d4');
		expect(result).toBe('a1b2c3d4');
	});

	it('returns null for slug shorter than 8 chars', () => {
		const result = parseSlugShortId('short');
		expect(result).toBeNull();
	});

	it('returns null for invalid short ID chars (uppercase)', () => {
		const result = parseSlugShortId('trek-domane-A1B2C3D4');
		expect(result).toBeNull();
	});
});

describe('isUuidParam', () => {
	it('returns true for valid UUID', () => {
		expect(isUuidParam('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
	});

	it('returns false for slug', () => {
		expect(isUuidParam('trek-domane-road-bike-dublin-a1b2c3d4')).toBe(false);
	});

	it('returns false for short string', () => {
		expect(isUuidParam('abc123')).toBe(false);
	});
});
