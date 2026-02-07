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
	'commuter',
	'touring',
	'cargo',
	'folding',
	'balance',
	'bmx',
	'training',
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
export const BIKE_MANUAL_SIZE_UNITS = ['cm', 'in'] as const;
export type BikeManualSizeUnit = (typeof BIKE_MANUAL_SIZE_UNITS)[number];

export const BIKE_MIN_OFFER_PRESET_RATIOS = [0.7, 0.8] as const;
export const BIKE_GUIDED_FIELD_MAX_LENGTH = 120 as const;

export const BIKE_SUBTYPE_OPTIONS: ReadonlyArray<{ value: BikeSubtype; label: string }> = [
	{ value: 'adult', label: 'Adult bike' },
	{ value: 'kids', label: 'Kids bike' },
	{ value: 'electric', label: 'Electric bike' }
];

export const BIKE_TYPE_OPTIONS_BY_SUBTYPE: Readonly<
	Record<BikeSubtype, ReadonlyArray<{ value: BikeType; label: string }>>
> = {
	adult: [
		{ value: 'road', label: 'Road' },
		{ value: 'mountain', label: 'Mountain' },
		{ value: 'hybrid', label: 'Hybrid' },
		{ value: 'gravel', label: 'Gravel' },
		{ value: 'commuter', label: 'Commuter' },
		{ value: 'touring', label: 'Touring' },
		{ value: 'cargo', label: 'Cargo' },
		{ value: 'folding', label: 'Folding' },
		{ value: 'bmx', label: 'BMX' },
		{ value: 'other', label: 'Other' }
	],
	kids: [
		{ value: 'balance', label: 'Balance' },
		{ value: 'training', label: 'Training wheels' },
		{ value: 'mountain', label: 'Mountain' },
		{ value: 'road', label: 'Road' },
		{ value: 'bmx', label: 'BMX' },
		{ value: 'hybrid', label: 'Hybrid' },
		{ value: 'other', label: 'Other' }
	],
	electric: [
		{ value: 'commuter', label: 'Commuter' },
		{ value: 'mountain', label: 'Mountain' },
		{ value: 'road', label: 'Road' },
		{ value: 'hybrid', label: 'Hybrid' },
		{ value: 'gravel', label: 'Gravel' },
		{ value: 'cargo', label: 'Cargo' },
		{ value: 'folding', label: 'Folding' },
		{ value: 'other', label: 'Other' }
	]
};

export const BIKE_CONDITION_OPTIONS: ReadonlyArray<{ value: BikeCondition; label: string }> = [
	{ value: 'new', label: 'New' },
	{ value: 'like_new', label: 'Like new' },
	{ value: 'used_good', label: 'Used - good' },
	{ value: 'used_fair', label: 'Used - fair' },
	{ value: 'needs_work', label: 'Needs work' }
];

export const BIKE_DESCRIPTION_ASSIST_PROMPTS = [
	{
		key: 'reasonForSelling',
		label: 'Reason for selling',
		options: [
			'Upgrading bike',
			'Not using it enough',
			'Child outgrew it',
			'Moving away',
			'Too small or too big now'
		]
	},
	{
		key: 'usageSummary',
		label: 'How it has been used',
		options: [
			'Weekend rides',
			'Daily commuting',
			'School runs',
			'Light trail riding',
			'Occasional use only'
		]
	},
	{
		key: 'knownIssues',
		label: 'Known issues or maintenance needed',
		options: [
			'No known issues',
			'Minor cosmetic scratches',
			'Needs brake tune-up',
			'Needs new tyres soon',
			'Recently serviced'
		]
	}
] as const;

export type BikeDescriptionAssistKey = (typeof BIKE_DESCRIPTION_ASSIST_PROMPTS)[number]['key'];

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
	bikeType: BikeType;
	sizePreset?: BikeSizePreset;
	sizeManual?: string;
	reasonForSelling?: string;
	usageSummary?: string;
	knownIssues?: string;
	titleAutoFilled?: boolean;
	descriptionTemplateUsed?: boolean;
};

export type BikeProfileSummary = {
	subtypeLabel: string;
	bikeTypeLabel: string;
	conditionLabel: string;
	sizeLabel: string | null;
	reasonForSelling?: string;
	usageSummary?: string;
	knownIssues?: string;
	narrativeSummary: string;
};

const bikeSubtypeSet = new Set<string>(BIKE_SUBTYPES);
const bikeConditionSet = new Set<string>(BIKE_CONDITIONS);
const bikeAdultSizePresetSet = new Set<string>(BIKE_ADULT_SIZE_PRESETS);
const bikeKidsSizePresetSet = new Set<string>(BIKE_KIDS_SIZE_PRESETS);
const bikeTypeSetBySubtype: Record<BikeSubtype, Set<string>> = {
	adult: new Set(BIKE_TYPE_OPTIONS_BY_SUBTYPE.adult.map((option) => option.value)),
	kids: new Set(BIKE_TYPE_OPTIONS_BY_SUBTYPE.kids.map((option) => option.value)),
	electric: new Set(BIKE_TYPE_OPTIONS_BY_SUBTYPE.electric.map((option) => option.value))
};

const BIKE_SUBTYPE_DISPLAY_LABEL: Record<BikeSubtype, string> = {
	adult: 'Adult',
	kids: 'Kids',
	electric: 'Electric'
};

const BIKE_TYPE_DISPLAY_LABEL: Record<BikeType, string> = {
	road: 'Road',
	mountain: 'Mountain',
	hybrid: 'Hybrid',
	gravel: 'Gravel',
	commuter: 'Commuter',
	touring: 'Touring',
	cargo: 'Cargo',
	folding: 'Folding',
	balance: 'Balance',
	bmx: 'BMX',
	training: 'Training wheels',
	other: 'Other'
};

const BIKE_CONDITION_DISPLAY_LABEL: Record<BikeCondition, string> = {
	new: 'New',
	like_new: 'Like new',
	used_good: 'Used - good',
	used_fair: 'Used - fair',
	needs_work: 'Needs work'
};

const BIKE_REASON_NARRATIVE_MAP: Record<string, string> = {
	'upgrading bike': "I'm upgrading to another bike",
	'not using it enough': "it isn't getting enough use",
	'child outgrew it': 'it has been outgrown',
	'moving away': "I'm moving away",
	'too small or too big now': 'the size no longer suits me'
};

const BIKE_USAGE_NARRATIVE_MAP: Record<string, string> = {
	'weekend rides': 'weekend rides',
	'daily commuting': 'daily commuting',
	'school runs': 'school runs',
	'light trail riding': 'light trail riding',
	'occasional use only': 'occasional use'
};

const BIKE_ISSUES_NARRATIVE_MAP: Record<string, string> = {
	'no known issues': 'No known issues to note.',
	'minor cosmetic scratches': 'There are minor cosmetic scratches.',
	'needs brake tune-up': 'It needs a brake tune-up.',
	'needs new tyres soon': 'It will likely need new tyres soon.',
	'recently serviced': 'It was recently serviced.'
};

const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const asOptionalTrimmedString = (value: unknown) => {
	if (typeof value !== 'string') return '';
	return value.trim();
};

const asOptionalBoolean = (value: unknown) => value === true;

const asOptionalGuidedValue = (value: unknown) => {
	const trimmed = asOptionalTrimmedString(value);
	if (!trimmed) return undefined;
	return trimmed.slice(0, BIKE_GUIDED_FIELD_MAX_LENGTH);
};

const withPeriod = (value: string) => {
	const trimmed = value.trim();
	if (!trimmed) return '';
	return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
};

const lowerStart = (value: string) => {
	const trimmed = value.trim();
	if (!trimmed) return '';
	return `${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
};

function buildReasonSentence(value?: string) {
	if (!value) return '';
	const mapped = BIKE_REASON_NARRATIVE_MAP[value.toLowerCase()];
	if (mapped) return withPeriod(`Selling because ${mapped}`);
	const normalized = lowerStart(value);
	return withPeriod(`Selling because ${normalized}`);
}

function buildUsageSentence(value?: string) {
	if (!value) return '';
	const mapped = BIKE_USAGE_NARRATIVE_MAP[value.toLowerCase()];
	if (mapped) return withPeriod(`Used mainly for ${mapped}`);
	const normalized = lowerStart(value);
	return withPeriod(`Used mainly for ${normalized}`);
}

function buildIssuesSentence(value?: string) {
	if (!value) return '';
	const mapped = BIKE_ISSUES_NARRATIVE_MAP[value.toLowerCase()];
	if (mapped) return mapped;
	return withPeriod(value);
}

const BIKE_TYPE_TITLE_LABEL: Record<BikeType, string> = {
	road: 'Road',
	mountain: 'Mountain',
	hybrid: 'Hybrid',
	gravel: 'Gravel',
	commuter: 'Commuter',
	touring: 'Touring',
	cargo: 'Cargo',
	folding: 'Folding',
	balance: 'Balance',
	bmx: 'BMX',
	training: 'Training',
	other: 'Bike'
};

export function getBikeSubtypeOptions(
	subtype: BikeSubtype | '' | null | undefined
): ReadonlyArray<{ value: BikeType; label: string }> {
	if (subtype === 'adult') return BIKE_TYPE_OPTIONS_BY_SUBTYPE.adult;
	if (subtype === 'kids') return BIKE_TYPE_OPTIONS_BY_SUBTYPE.kids;
	if (subtype === 'electric') return BIKE_TYPE_OPTIONS_BY_SUBTYPE.electric;
	return [];
}

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

export function getBikeDescriptionTemplate(values?: {
	reasonForSelling?: string;
	usageSummary?: string;
	knownIssues?: string;
}) {
	const narrative = buildBikeNarrativeSummary({
		reasonForSelling: values?.reasonForSelling,
		usageSummary: values?.usageSummary,
		knownIssues: values?.knownIssues
	});
	return narrative;
}

export function buildBikeNarrativeSummary(values: {
	reasonForSelling?: string;
	usageSummary?: string;
	knownIssues?: string;
}) {
	const reason = asOptionalGuidedValue(values.reasonForSelling);
	const usage = asOptionalGuidedValue(values.usageSummary);
	const issues = asOptionalGuidedValue(values.knownIssues);
	return [buildReasonSentence(reason), buildUsageSentence(usage), buildIssuesSentence(issues)]
		.filter((sentence) => sentence.length > 0)
		.join(' ');
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
	const typeSource = bikeType || 'other';
	const typeLabel = BIKE_TYPE_TITLE_LABEL[typeSource];
	const descriptor = typeLabel === 'BMX' ? 'BMX' : typeLabel.toLowerCase();
	const base =
		subtype === 'kids'
			? typeSource === 'other'
				? 'Kids bike'
				: `Kids ${descriptor} bike`
			: subtype === 'electric'
				? typeSource === 'other'
					? 'Electric bike'
					: `Electric ${descriptor} bike`
				: typeSource === 'other'
					? 'Bike'
					: `${typeLabel} bike`;

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
	const reasonForSelling = asOptionalGuidedValue(input.reasonForSelling);
	const usageSummary = asOptionalGuidedValue(input.usageSummary);
	const knownIssues = asOptionalGuidedValue(input.knownIssues);

	if (versionValue !== CATEGORY_PROFILE_VERSION) {
		return { data: null, error: 'Bike details are out of date. Please reselect bike details.' };
	}
	if (profileValue !== BIKES_PROFILE_KEY) {
		return { data: null, error: 'Invalid bike profile.' };
	}
	if (!bikeSubtypeSet.has(subtypeValue)) {
		return { data: null, error: 'Bike type is required.' };
	}
	if (!bikeConditionSet.has(conditionValue)) {
		return { data: null, error: 'Bike condition is required.' };
	}

	const subtype = subtypeValue as BikeSubtype;
	if (!bikeTypeValue) {
		return { data: null, error: 'Bike subtype is required.' };
	}
	if (!bikeTypeSetBySubtype[subtype].has(bikeTypeValue)) {
		return { data: null, error: 'Invalid bike subtype for selected bike type.' };
	}
	const hasManualSize = sizeManualValue.length > 0;
	const hasSizePreset = sizePresetValue.length > 0;
	const manualSizeMatch = hasManualSize
		? sizeManualValue.match(/^([0-9]{1,3}(?:\.[0-9]+)?)\s*(cm|in)$/i)
		: null;
	const manualSizeNormalized =
		manualSizeMatch && Number(manualSizeMatch[1]) > 0
			? `${manualSizeMatch[1]} ${(manualSizeMatch[2] as string).toLowerCase()}`
			: '';

	if (subtype === 'kids') {
		if (!hasSizePreset || !bikeKidsSizePresetSet.has(sizePresetValue)) {
			return { data: null, error: 'Kids bikes must include an age range.' };
		}
	} else {
		const presetIsValidAdult = hasSizePreset && bikeAdultSizePresetSet.has(sizePresetValue);
		if (!presetIsValidAdult && !hasManualSize) {
			return { data: null, error: 'Bike size is required.' };
		}
		if (hasManualSize && !manualSizeNormalized) {
			return { data: null, error: 'Manual bike size must include a number and unit (cm or in).' };
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
		bikeType: bikeTypeValue as BikeType,
		sizePreset: hasSizePreset ? (sizePresetValue as BikeSizePreset) : undefined,
		sizeManual: manualSizeNormalized ? manualSizeNormalized.slice(0, 32) : undefined,
		reasonForSelling,
		usageSummary,
		knownIssues,
		titleAutoFilled: asOptionalBoolean(input.titleAutoFilled),
		descriptionTemplateUsed: asOptionalBoolean(input.descriptionTemplateUsed)
	};

	return { data: normalized, error: null };
}

export function getBikeProfileSummary(profileData: unknown): BikeProfileSummary | null {
	const result = validateAndNormalizeBikesProfileData(profileData);
	if (!result.data) return null;
	const data = result.data;
	const sizeLabel =
		data.subtype === 'kids'
			? data.sizePreset
				? `Ages ${data.sizePreset}`
				: null
			: data.sizeManual
				? `Size ${data.sizeManual}`
				: data.sizePreset
					? `Size ${data.sizePreset}`
					: null;
	return {
		subtypeLabel: BIKE_SUBTYPE_DISPLAY_LABEL[data.subtype],
		bikeTypeLabel: BIKE_TYPE_DISPLAY_LABEL[data.bikeType],
		conditionLabel: BIKE_CONDITION_DISPLAY_LABEL[data.condition],
		sizeLabel,
		reasonForSelling: data.reasonForSelling,
		usageSummary: data.usageSummary,
		knownIssues: data.knownIssues,
		narrativeSummary: buildBikeNarrativeSummary({
			reasonForSelling: data.reasonForSelling,
			usageSummary: data.usageSummary,
			knownIssues: data.knownIssues
		})
	};
}
