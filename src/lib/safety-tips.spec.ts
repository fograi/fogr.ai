import { describe, expect, it } from 'vitest';
import { QUICK_SAFETY_TIPS, FULL_SAFETY_SECTIONS } from './safety-tips';

describe('QUICK_SAFETY_TIPS', () => {
	it('exports exactly 4 quick safety tips', () => {
		expect(QUICK_SAFETY_TIPS).toHaveLength(4);
	});

	it('every quick tip is a non-empty string', () => {
		for (const tip of QUICK_SAFETY_TIPS) {
			expect(typeof tip).toBe('string');
			expect(tip.trim().length).toBeGreaterThan(0);
		}
	});
});

describe('FULL_SAFETY_SECTIONS', () => {
	it('exports exactly 4 safety sections', () => {
		expect(FULL_SAFETY_SECTIONS).toHaveLength(4);
	});

	it('every section has a non-empty title', () => {
		for (const section of FULL_SAFETY_SECTIONS) {
			expect(typeof section.title).toBe('string');
			expect(section.title.trim().length).toBeGreaterThan(0);
		}
	});

	it('every section has a tips array with at least one tip', () => {
		for (const section of FULL_SAFETY_SECTIONS) {
			expect(Array.isArray(section.tips)).toBe(true);
			expect(section.tips.length).toBeGreaterThan(0);
		}
	});

	it('every tip in every section is a non-empty string', () => {
		for (const section of FULL_SAFETY_SECTIONS) {
			for (const tip of section.tips) {
				expect(typeof tip).toBe('string');
				expect(tip.trim().length).toBeGreaterThan(0);
			}
		}
	});

	it('section titles are the expected four categories', () => {
		const titles = FULL_SAFETY_SECTIONS.map((s) => s.title);
		expect(titles).toContain('Meeting the seller or buyer');
		expect(titles).toContain('Payment safety');
		expect(titles).toContain('Spotting scams');
		expect(titles).toContain('Protecting your information');
	});
});
