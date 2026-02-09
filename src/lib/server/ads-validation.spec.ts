import { describe, expect, it } from 'vitest';
import {
	validateAdImages,
	validateAdMeta,
	validateCategoryProfileData,
	validateLocationProfileData,
	validateOfferRules
} from './ads-validation';
import {
	MAX_AD_PRICE,
	MAX_AD_PRICE_VALIDATION_MESSAGES,
	getWholeEuroValidationMessagesForAmount
} from '$lib/constants';

const expectWholeEuroVariant = (result: string | null, rawValue: string) => {
	expect(result).toBeTruthy();
	expect(getWholeEuroValidationMessagesForAmount(rawValue)).toContain(result as string);
};

const expectMaxPriceVariant = (result: string | null) => {
	expect(result).toBeTruthy();
	expect(MAX_AD_PRICE_VALIDATION_MESSAGES).toContain(result as string);
};

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

	it('rejects fixed price with cents', () => {
		const result = validateAdMeta({
			category: 'Electronics',
			currency: 'EUR',
			priceStr: '1.5',
			priceType: 'fixed'
		});
		expectWholeEuroVariant(result, '1.5');
	});

	it('rejects fixed price above max', () => {
		const result = validateAdMeta({
			category: 'Electronics',
			currency: 'EUR',
			priceStr: String(MAX_AD_PRICE + 1),
			priceType: 'fixed'
		});
		expectMaxPriceVariant(result);
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

	it('accepts Lost and Found with no reward', () => {
		const result = validateAdMeta({
			category: 'Lost and Found',
			currency: 'EUR',
			priceStr: '',
			priceType: 'fixed'
		});
		expect(result).toBeNull();
	});

	it('accepts Lost and Found with reward', () => {
		const result = validateAdMeta({
			category: 'Lost and Found',
			currency: 'EUR',
			priceStr: '50',
			priceType: 'fixed'
		});
		expect(result).toBeNull();
	});

	it('rejects Lost and Found reward at 0', () => {
		const result = validateAdMeta({
			category: 'Lost and Found',
			currency: 'EUR',
			priceStr: '0',
			priceType: 'fixed'
		});
		expect(result).toBe('Reward must be greater than 0.');
	});

	it('rejects Lost and Found reward with cents', () => {
		const result = validateAdMeta({
			category: 'Lost and Found',
			currency: 'EUR',
			priceStr: '10.50',
			priceType: 'fixed'
		});
		expectWholeEuroVariant(result, '10.50');
	});

	it('rejects Lost and Found reward above max', () => {
		const result = validateAdMeta({
			category: 'Lost and Found',
			currency: 'EUR',
			priceStr: String(MAX_AD_PRICE + 1),
			priceType: 'fixed'
		});
		expectMaxPriceVariant(result);
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

describe('validateOfferRules', () => {
	it('allows firm price without min offer', () => {
		const result = validateOfferRules({
			priceType: 'fixed',
			priceStr: '100',
			firmPrice: true,
			minOfferStr: ''
		});
		expect(result).toBeNull();
	});

	it('rejects firm price with min offer', () => {
		const result = validateOfferRules({
			priceType: 'fixed',
			priceStr: '100',
			firmPrice: true,
			minOfferStr: '50'
		});
		expect(result).toBe('Firm price listings cannot set a minimum offer.');
	});

	it('rejects min offer above price', () => {
		const result = validateOfferRules({
			priceType: 'fixed',
			priceStr: '100',
			firmPrice: false,
			minOfferStr: '150'
		});
		expect(result).toBe('Minimum offer must be less than the asking price.');
	});

	it('rejects min offer with cents', () => {
		const result = validateOfferRules({
			priceType: 'fixed',
			priceStr: '100',
			firmPrice: false,
			minOfferStr: '10.5'
		});
		expectWholeEuroVariant(result, '10.5');
	});

	it('rejects min offer above max', () => {
		const result = validateOfferRules({
			priceType: 'fixed',
			priceStr: String(MAX_AD_PRICE),
			firmPrice: false,
			minOfferStr: String(MAX_AD_PRICE + 1)
		});
		expectMaxPriceVariant(result);
	});
});

describe('validateCategoryProfileData (bikes)', () => {
	it('allows null profile for non-bike category', () => {
		const result = validateCategoryProfileData({
			category: 'Electronics',
			categoryProfileDataRaw: null
		});
		expect(result.error).toBeNull();
		expect(result.categoryProfileData).toBeNull();
	});

	it('rejects missing bike profile', () => {
		const result = validateCategoryProfileData({
			category: 'Bikes',
			categoryProfileDataRaw: null
		});
		expect(result.error).toBe('Bike details are required.');
		expect(result.categoryProfileData).toBeNull();
	});

	it('accepts valid adult bike profile', () => {
		const result = validateCategoryProfileData({
			category: 'Bikes',
			categoryProfileDataRaw: {
				version: 1,
				profile: 'bikes',
				subtype: 'adult',
				bikeType: 'road',
				condition: 'used_good',
				sizePreset: 'M'
			}
		});
		expect(result.error).toBeNull();
		expect(result.categoryProfileData?.subtype).toBe('adult');
		expect(result.categoryProfileData?.bikeType).toBe('road');
		expect(result.categoryProfileData?.sizePreset).toBe('M');
	});

	it('accepts and normalizes adult manual bike size with unit', () => {
		const result = validateCategoryProfileData({
			category: 'Bikes',
			categoryProfileDataRaw: {
				version: 1,
				profile: 'bikes',
				subtype: 'adult',
				bikeType: 'road',
				condition: 'used_good',
				sizeManual: '58 CM'
			}
		});
		expect(result.error).toBeNull();
		expect(result.categoryProfileData?.sizeManual).toBe('58 cm');
	});

	it('rejects missing bike subtype selection', () => {
		const result = validateCategoryProfileData({
			category: 'Bikes',
			categoryProfileDataRaw: {
				version: 1,
				profile: 'bikes',
				subtype: 'adult',
				condition: 'used_good',
				sizePreset: 'M'
			}
		});
		expect(result.error).toBe('Bike subtype is required.');
		expect(result.categoryProfileData).toBeNull();
	});

	it('rejects subtype mismatch for selected bike type', () => {
		const result = validateCategoryProfileData({
			category: 'Bikes',
			categoryProfileDataRaw: {
				version: 1,
				profile: 'bikes',
				subtype: 'kids',
				bikeType: 'touring',
				condition: 'used_good',
				sizePreset: '6-8'
			}
		});
		expect(result.error).toBe('Invalid bike subtype for selected bike type.');
		expect(result.categoryProfileData).toBeNull();
	});

	it('rejects kids profile without age-range size', () => {
		const result = validateCategoryProfileData({
			category: 'Bikes',
			categoryProfileDataRaw: {
				version: 1,
				profile: 'bikes',
				subtype: 'kids',
				bikeType: 'balance',
				condition: 'used_good'
			}
		});
		expect(result.error).toBe('Kids bikes must include an age range.');
		expect(result.categoryProfileData).toBeNull();
	});

	it('rejects adult manual bike size without unit', () => {
		const result = validateCategoryProfileData({
			category: 'Bikes',
			categoryProfileDataRaw: {
				version: 1,
				profile: 'bikes',
				subtype: 'adult',
				bikeType: 'road',
				condition: 'used_good',
				sizeManual: '58'
			}
		});
		expect(result.error).toBe('Manual bike size must include a number and unit (cm or in).');
		expect(result.categoryProfileData).toBeNull();
	});

	it('normalizes optional guided bike description fields', () => {
		const result = validateCategoryProfileData({
			category: 'Bikes',
			categoryProfileDataRaw: {
				version: 1,
				profile: 'bikes',
				subtype: 'adult',
				bikeType: 'road',
				condition: 'used_good',
				sizePreset: 'M',
				reasonForSelling: '  Upgrading bike  ',
				usageSummary: 'Weekend rides',
				knownIssues: '  No known issues  '
			}
		});
		expect(result.error).toBeNull();
		expect(result.categoryProfileData?.reasonForSelling).toBe('Upgrading bike');
		expect(result.categoryProfileData?.usageSummary).toBe('Weekend rides');
		expect(result.categoryProfileData?.knownIssues).toBe('No known issues');
	});
});

describe('validateLocationProfileData', () => {
	it('accepts selected county ids and matching locality ids', () => {
		const result = validateLocationProfileData({
			locationProfileDataRaw: {
				selectedNodeIds: ['ie/leinster/dublin'],
				locality: { id: 'ie/leinster/dublin/ard-na-greine', name: 'Wrong Locality Label' }
			}
		});
		expect(result.error).toBeNull();
		expect(result.locationProfileData).toMatchObject({
			version: 2,
			level: 'county',
			primary: { id: 'ie/leinster/dublin', name: 'Dublin', type: 'county' },
			island: { id: 'ie', name: 'Ireland' },
			province: { id: 'ie/leinster', name: 'Leinster' },
			county: { id: 'ie/leinster/dublin', name: 'Dublin' },
			locality: { id: 'ie/leinster/dublin/ard-na-greine', name: 'Ard Na Gréine' }
		});
	});

	it('accepts subtree selection and keeps the broadest selected level as primary', () => {
		const result = validateLocationProfileData({
			locationProfileDataRaw: {
				selectedNodeIds: ['ie', 'ie/leinster', 'ie/leinster/dublin']
			}
		});
		expect(result.error).toBeNull();
		expect(result.locationProfileData).toMatchObject({
			version: 2,
			level: 'country',
			primary: { id: 'ie', name: 'Ireland', type: 'country' },
			island: { id: 'ie', name: 'Ireland' },
			province: null,
			county: null,
			locality: null
		});
	});

	it('rejects missing location payload', () => {
		const result = validateLocationProfileData({
			locationProfileDataRaw: null
		});
		expect(result.error).toBe('Location details are required.');
		expect(result.locationProfileData).toBeNull();
	});

	it('rejects invalid location ids', () => {
		const result = validateLocationProfileData({
			locationProfileDataRaw: {
				selectedNodeIds: ['ie/leinster/not-a-county']
			}
		});
		expect(result.error).toBe('Select at least one location.');
		expect(result.locationProfileData).toBeNull();
	});

	it('rejects locality that does not belong to selected county', () => {
		const result = validateLocationProfileData({
			locationProfileDataRaw: {
				selectedNodeIds: ['ie/leinster/dublin'],
				locality: { id: 'ie/munster/cork/ballincollig', name: 'Ballincollig' }
			}
		});
		expect(result.error).toBe('Invalid locality for selected county.');
		expect(result.locationProfileData).toBeNull();
	});
});
