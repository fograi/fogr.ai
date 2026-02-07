import type { Category } from '$lib/constants';

export const BIKES_CATEGORY = 'Bikes' as const;
export const CATEGORY_PROFILE_VERSION = 1 as const;
export const BIKES_PROFILE_KEY = 'bikes' as const;

export const BIKE_SUBTYPES = ['adult', 'kids', 'electric'] as const;
export type BikeSubtype = (typeof BIKE_SUBTYPES)[number];

export const BIKE_TYPES = [
	'road',
	'mountain',
	'hybrid',
	'gravel',
	'electric',
	'kids',
	'other'
] as const;
export type BikeType = (typeof BIKE_TYPES)[number];

export const BIKE_CONDITIONS = ['new', 'like_new', 'used_good', 'used_fair', 'needs_work'] as const;
export type BikeCondition = (typeof BIKE_CONDITIONS)[number];

export const BIKE_ADULT_SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL'] as const;
export type BikeAdultSizePreset = (typeof BIKE_ADULT_SIZE_PRESETS)[number];

export const BIKE_KIDS_SIZE_PRESETS = ['3-5', '6-8', '9-12'] as const;
export type BikeKidsSizePreset = (typeof BIKE_KIDS_SIZE_PRESETS)[number];

export type BikeSizePreset = BikeAdultSizePreset | BikeKidsSizePreset;

export const BIKE_MIN_OFFER_PRESET_RATIOS = [0.7, 0.8] as const;

export const BIKE_SUBTYPE_OPTIONS: ReadonlyArray<{ value: BikeSubtype; label: string }> = [
	{ value: 'adult', label: 'Adult bike' },
	{ value: 'kids', label: 'Kids bike' },
	{ value: 'electric', label: 'Electric bike' }
];

export const BIKE_TYPE_OPTIONS: ReadonlyArray<{ value: BikeType; label: string }> = [
	{ value: 'road', label: 'Road' },
	{ value: 'mountain', label: 'Mountain' },
	{ value: 'hybrid', label: 'Hybrid' },
	{ value: 'gravel', label: 'Gravel' },
	{ value: 'electric', label: 'Electric' },
	{ value: 'kids', label: 'Kids' },
	{ value: 'other', label: 'Other' }
];

export const BIKE_CONDITION_OPTIONS: ReadonlyArray<{ value: BikeCondition; label: string }> = [
	{ value: 'new', label: 'New' },
	{ value: 'like_new', label: 'Like new' },
	{ value: 'used_good', label: 'Used - good' },
	{ value: 'used_fair', label: 'Used - fair' },
	{ value: 'needs_work', label: 'Needs work' }
];

export const BIKE_PHOTO_CHECKLIST = [
	'Full bike (side view)',
	'Frame close-up',
	'Gears and drivetrain',
	'Serial area (optional)'
] as const;

export type BikesProfileData = {
	version: 1;
	profile: 'bikes';
	subtype: BikeSubtype;
	condition: BikeCondition;
	bikeType?: BikeType;
	sizePreset?: BikeSizePreset;
	sizeManual?: string;
	titleAutoFilled?: boolean;
	descriptionTemplateUsed?: boolean;
};

const bikeSubtypeSet = new Set<string>(BIKE_SUBTYPES);
const bikeTypeSet = new Set<string>(BIKE_TYPES);
const bikeConditionSet = new Set<string>(BIKE_CONDITIONS);
const bikeAdultSizePresetSet = new Set<string>(BIKE_ADULT_SIZE_PRESETS);
const bikeKidsSizePresetSet = new Set<string>(BIKE_KIDS_SIZE_PRESETS);

const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const asOptionalTrimmedString = (value: unknown) => {
	if (typeof value !== 'string') return '';
	return value.trim();
};

const asOptionalBoolean = (value: unknown) => value === true;

const BIKE_TYPE_TITLE_LABEL: Record<BikeType, string> = {
	road: 'Road',
	mountain: 'Mountain',
	hybrid: 'Hybrid',
	gravel: 'Gravel',
	electric: 'Electric',
	kids: 'Kids',
	other: 'Bike'
};

export function isBikesCategory(category: string | Category | '' | null | undefined): boolean {
	return (category ?? '').trim() === BIKES_CATEGORY;
}

export function getBikePriceHint(subtype: BikeSubtype | '' | null | undefined): string {
	switch (subtype) {
		case 'kids':
			return 'Hint: similar kids bikes are often listed around EUR 80-250.';
		case 'electric':
			return 'Hint: similar electric bikes are often listed around EUR 700-1800.';
		case 'adult':
			return 'Hint: similar adult bikes are often listed around EUR 150-600.';
		default:
			return 'Hint: bike prices vary by brand, condition, and size.';
	}
}

export function getBikeDescriptionTemplate() {
	return [
		'Reason for selling:',
		'How it has been used:',
		'Known issues or maintenance needed:'
	].join('\n');
}

export function buildBikeTitle({
	subtype,
	bikeType,
	sizePreset,
	sizeManual
}: {
	subtype: BikeSubtype | '';
	bikeType: BikeType | '';
	sizePreset: BikeSizePreset | '';
	sizeManual: string;
}) {
	if (!subtype) return '';

	const typeSource =
		bikeType || (subtype === 'electric' ? 'electric' : subtype === 'kids' ? 'kids' : 'other');
	const typeLabel = BIKE_TYPE_TITLE_LABEL[typeSource];
	const base = typeLabel === 'Bike' ? 'Bike' : `${typeLabel} bike`;

	if (subtype === 'kids') {
		return sizePreset ? `${base} - ages ${sizePreset}` : base;
	}

	const manual = sizeManual.trim();
	if (manual) return `${base} - size ${manual}`;
	return sizePreset ? `${base} - size ${sizePreset}` : base;
}

export function validateAndNormalizeBikesProfileData(input: unknown): {
	data: BikesProfileData | null;
	error: string | null;
} {
	if (!isObject(input)) {
		return { data: null, error: 'Bike details are required.' };
	}

	const versionValue = input.version;
	const profileValue = input.profile;
	const subtypeValue = asOptionalTrimmedString(input.subtype).toLowerCase();
	const bikeTypeValue = asOptionalTrimmedString(input.bikeType).toLowerCase();
	const conditionValue = asOptionalTrimmedString(input.condition).toLowerCase();
	const sizePresetValue = asOptionalTrimmedString(input.sizePreset);
	const sizeManualValue = asOptionalTrimmedString(input.sizeManual);

	if (versionValue !== CATEGORY_PROFILE_VERSION) {
		return { data: null, error: 'Bike details are out of date. Please reselect bike details.' };
	}
	if (profileValue !== BIKES_PROFILE_KEY) {
		return { data: null, error: 'Invalid bike profile.' };
	}
	if (!bikeSubtypeSet.has(subtypeValue)) {
		return { data: null, error: 'Bike subtype is required.' };
	}
	if (!bikeConditionSet.has(conditionValue)) {
		return { data: null, error: 'Bike condition is required.' };
	}
	if (bikeTypeValue && !bikeTypeSet.has(bikeTypeValue)) {
		return { data: null, error: 'Invalid bike type.' };
	}

	const subtype = subtypeValue as BikeSubtype;
	const hasManualSize = sizeManualValue.length > 0;
	const hasSizePreset = sizePresetValue.length > 0;

	if (subtype === 'kids') {
		if (!hasSizePreset || !bikeKidsSizePresetSet.has(sizePresetValue)) {
			return { data: null, error: 'Kids bikes must include an age range.' };
		}
	} else {
		const presetIsValidAdult = hasSizePreset && bikeAdultSizePresetSet.has(sizePresetValue);
		if (!presetIsValidAdult && !hasManualSize) {
			return { data: null, error: 'Bike size is required.' };
		}
		if (hasSizePreset && !presetIsValidAdult) {
			return { data: null, error: 'Invalid bike size.' };
		}
	}

	const normalized: BikesProfileData = {
		version: CATEGORY_PROFILE_VERSION,
		profile: BIKES_PROFILE_KEY,
		subtype,
		condition: conditionValue as BikeCondition,
		bikeType: bikeTypeValue ? (bikeTypeValue as BikeType) : undefined,
		sizePreset: hasSizePreset ? (sizePresetValue as BikeSizePreset) : undefined,
		sizeManual: hasManualSize ? sizeManualValue.slice(0, 32) : undefined,
		titleAutoFilled: asOptionalBoolean(input.titleAutoFilled),
		descriptionTemplateUsed: asOptionalBoolean(input.descriptionTemplateUsed)
	};

	return { data: normalized, error: null };
}
