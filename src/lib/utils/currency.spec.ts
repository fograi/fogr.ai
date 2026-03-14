import { describe, it, expect } from 'vitest';
import { getDefaultCurrency, NI_COUNTY_IDS } from './currency';

describe('NI_COUNTY_IDS', () => {
	it('contains exactly the 6 Northern Ireland counties', () => {
		expect(NI_COUNTY_IDS.size).toBe(6);
		expect(NI_COUNTY_IDS.has('ie/ulster/antrim')).toBe(true);
		expect(NI_COUNTY_IDS.has('ie/ulster/armagh')).toBe(true);
		expect(NI_COUNTY_IDS.has('ie/ulster/down')).toBe(true);
		expect(NI_COUNTY_IDS.has('ie/ulster/fermanagh')).toBe(true);
		expect(NI_COUNTY_IDS.has('ie/ulster/derry')).toBe(true);
		expect(NI_COUNTY_IDS.has('ie/ulster/tyrone')).toBe(true);
	});

	it('does not contain the 3 ROI Ulster counties', () => {
		expect(NI_COUNTY_IDS.has('ie/ulster/cavan')).toBe(false);
		expect(NI_COUNTY_IDS.has('ie/ulster/donegal')).toBe(false);
		expect(NI_COUNTY_IDS.has('ie/ulster/monaghan')).toBe(false);
	});
});

describe('getDefaultCurrency', () => {
	it('returns GBP for each of the 6 NI counties', () => {
		const niCounties = [
			'ie/ulster/antrim',
			'ie/ulster/armagh',
			'ie/ulster/down',
			'ie/ulster/fermanagh',
			'ie/ulster/derry',
			'ie/ulster/tyrone'
		];
		for (const countyId of niCounties) {
			expect(getDefaultCurrency(countyId)).toBe('GBP');
		}
	});

	it('returns EUR for a ROI county (Dublin)', () => {
		expect(getDefaultCurrency('ie/leinster/dublin')).toBe('EUR');
	});

	it('returns EUR for a ROI Ulster county (Donegal)', () => {
		expect(getDefaultCurrency('ie/ulster/donegal')).toBe('EUR');
	});

	it('returns EUR for a ROI Ulster county (Cavan)', () => {
		expect(getDefaultCurrency('ie/ulster/cavan')).toBe('EUR');
	});

	it('returns EUR for a ROI Ulster county (Monaghan)', () => {
		expect(getDefaultCurrency('ie/ulster/monaghan')).toBe('EUR');
	});

	it('returns EUR for an unknown county ID', () => {
		expect(getDefaultCurrency('ie/unknown/xyz')).toBe('EUR');
	});

	it('returns EUR when countyId is null', () => {
		expect(getDefaultCurrency(null)).toBe('EUR');
	});

	it('returns EUR when countyId is an empty string', () => {
		expect(getDefaultCurrency('')).toBe('EUR');
	});
});
