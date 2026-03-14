import { describe, it, expect } from 'vitest';
import { match as categoryMatch } from './category';
import { match as countyMatch } from './county';

describe('category param matcher', () => {
	it('matches all known category slugs', () => {
		const categorySlugs = [
			'home-garden',
			'electronics',
			'baby-kids',
			'bikes',
			'clothing-accessories',
			'services-gigs',
			'lessons-tutoring',
			'lost-found',
			'free-giveaway'
		];
		for (const slug of categorySlugs) {
			expect(categoryMatch(slug), `expected "${slug}" to match`).toBe(true);
		}
	});

	it('does not match static route segments', () => {
		const staticRoutes = ['about', 'login', 'privacy', 'terms', 'ad', 'api', 'auth', 'post'];
		for (const route of staticRoutes) {
			expect(categoryMatch(route), `expected "${route}" NOT to match`).toBe(false);
		}
	});

	it('does not match county slugs', () => {
		expect(categoryMatch('dublin')).toBe(false);
		expect(categoryMatch('cork')).toBe(false);
		expect(categoryMatch('galway')).toBe(false);
	});

	it('does not match empty string', () => {
		expect(categoryMatch('')).toBe(false);
	});

	it('does not match a random string', () => {
		expect(categoryMatch('not-a-real-category')).toBe(false);
	});
});

describe('county param matcher', () => {
	it('matches all 26 Republic of Ireland counties', () => {
		// A representative sample covering Leinster, Munster, Connacht, Ulster
		const countySlugs = [
			'dublin',
			'cork',
			'galway',
			'limerick',
			'waterford',
			'wicklow',
			'wexford',
			'kildare',
			'meath',
			'louth',
			'kilkenny',
			'carlow',
			'laois',
			'offaly',
			'westmeath',
			'longford',
			'leitrim',
			'sligo',
			'mayo',
			'roscommon',
			'tipperary',
			'clare',
			'kerry',
			'donegal',
			'cavan',
			'monaghan'
		];
		for (const slug of countySlugs) {
			expect(countyMatch(slug), `expected "${slug}" to match`).toBe(true);
		}
	});

	it('does not match category slugs', () => {
		expect(countyMatch('bikes')).toBe(false);
		expect(countyMatch('electronics')).toBe(false);
		expect(countyMatch('home-garden')).toBe(false);
	});

	it('does not match static route segments', () => {
		const staticRoutes = ['about', 'login', 'privacy', 'terms', 'ad', 'api'];
		for (const route of staticRoutes) {
			expect(countyMatch(route), `expected "${route}" NOT to match`).toBe(false);
		}
	});

	it('does not match empty string', () => {
		expect(countyMatch('')).toBe(false);
	});

	it('does not match a random string', () => {
		expect(countyMatch('not-a-real-county')).toBe(false);
	});
});
