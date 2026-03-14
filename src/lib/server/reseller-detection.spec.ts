import { describe, expect, it } from 'vitest';
import { detectResellerSignals, RESELLER_THRESHOLD } from './reseller-detection';

describe('detectResellerSignals', () => {
	it('returns no signals for a normal private seller ad', () => {
		const result = detectResellerSignals(
			'Selling my old bike',
			'Used it for commuting, great condition'
		);
		expect(result).toHaveLength(0);
	});

	it('flags call for price language as a single high-weight signal', () => {
		const result = detectResellerSignals('Mountain bike', 'Call for price');
		const signals = result.map((s) => s.signal);
		expect(signals).toContain('call_for_price');
	});

	it('flags stock number as a single high-weight signal', () => {
		const result = detectResellerSignals('Bike for sale', 'Stock #123 available');
		const signals = result.map((s) => s.signal);
		expect(signals).toContain('stock_number');
	});

	it('returns two signals with total weight >= 4 for clear dealer text', () => {
		const result = detectResellerSignals('Great bike for sale', 'Call for price, stock #123');
		expect(result.length).toBeGreaterThanOrEqual(2);
		const totalWeight = result.reduce((sum, s) => sum + s.weight, 0);
		expect(totalWeight).toBeGreaterThanOrEqual(4);
	});

	it('a single low-weight signal (phone number) alone does NOT reach the reseller threshold', () => {
		const result = detectResellerSignals('Bike for sale', 'Ring 087 1234567 to arrange viewing');
		const signals = result.map((s) => s.signal);
		expect(signals).toContain('phone_number');
		const totalWeight = result.reduce((sum, s) => sum + s.weight, 0);
		expect(totalWeight).toBeLessThan(RESELLER_THRESHOLD);
	});

	it('reaches threshold when two low-weight signals are combined', () => {
		// RRP (weight 1) + phone number (weight 1) = 2, which equals RESELLER_THRESHOLD
		const result = detectResellerSignals('Bike', 'Below RRP. Call 087 1234567 for details');
		const totalWeight = result.reduce((sum, s) => sum + s.weight, 0);
		expect(totalWeight).toBeGreaterThanOrEqual(RESELLER_THRESHOLD);
	});

	it('flags showroom keyword as a strong signal', () => {
		const result = detectResellerSignals('Come visit our showroom', 'Wide selection in stock');
		const signals = result.map((s) => s.signal);
		expect(signals).toContain('showroom');
	});

	it('flags finance available as a strong signal', () => {
		const result = detectResellerSignals('Finance available', 'We offer great payment plans');
		const signals = result.map((s) => s.signal);
		expect(signals).toContain('finance_available');
	});

	it('flags a website URL (www.) as a low-weight signal', () => {
		const result = detectResellerSignals('Visit us', 'See www.dealership.ie for our range');
		const signals = result.map((s) => s.signal);
		expect(signals).toContain('website_url');
	});

	it('flags an http URL as a low-weight signal', () => {
		const result = detectResellerSignals('Check online', 'https://example.ie/bikes');
		const signals = result.map((s) => s.signal);
		expect(signals).toContain('http_url');
	});

	it('each matched signal includes signal name, weight, and matched text', () => {
		const result = detectResellerSignals('Showroom quality', 'Finance available for all buyers');
		expect(result.length).toBeGreaterThan(0);
		for (const s of result) {
			expect(typeof s.signal).toBe('string');
			expect(typeof s.weight).toBe('number');
			expect(s.weight).toBeGreaterThan(0);
			expect(typeof s.matched).toBe('string');
			expect(s.matched.length).toBeGreaterThan(0);
		}
	});

	it('RESELLER_THRESHOLD is exported and equals 2', () => {
		expect(RESELLER_THRESHOLD).toBe(2);
	});

	it('each pattern only matches once per ad (no duplicate signals for same pattern)', () => {
		// Even if the phrase appears twice, each pattern fires at most once
		const result = detectResellerSignals('Call for price call for price', 'Call for price again');
		const callForPriceMatches = result.filter((s) => s.signal === 'call_for_price');
		expect(callForPriceMatches).toHaveLength(1);
	});
});
