import { describe, expect, it } from 'vitest';
import {
	clampPercent,
	getCompressionStageLabel,
	getCompressionStageProgress,
	getExportStageTarget,
	stepTowardPercent
} from './loading';

describe('loading utilities', () => {
	it('clamps percentages to 0-100', () => {
		expect(clampPercent(-10)).toBe(0);
		expect(clampPercent(55.4)).toBe(55);
		expect(clampPercent(130)).toBe(100);
		expect(clampPercent(Number.NaN)).toBe(0);
	});

	it('returns deterministic compression stage metadata', () => {
		expect(getCompressionStageProgress('validating')).toBe(10);
		expect(getCompressionStageProgress('resizing')).toBe(56);
		expect(getCompressionStageProgress('complete')).toBe(100);
		expect(getCompressionStageLabel('encoding')).toBe('Encoding optimized image.');
	});

	it('returns deterministic export stage targets', () => {
		expect(getExportStageTarget('idle')).toBe(0);
		expect(getExportStageTarget('collecting')).toBe(62);
		expect(getExportStageTarget('complete')).toBe(100);
	});

	it('steps progress toward a target', () => {
		expect(stepTowardPercent(10, 40, 7)).toBe(17);
		expect(stepTowardPercent(90, 42, 11)).toBe(79);
		expect(stepTowardPercent(96, 100, 10)).toBe(100);
		expect(stepTowardPercent(3, 0, 5)).toBe(0);
	});
});
