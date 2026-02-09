import rawIrelandLocationTree from '../../ireland_counties.json';

export type LocationNodeType = 'country' | 'province' | 'county' | 'area';

type LocationTreeNode = {
	id: string;
	name: string;
	type: LocationNodeType;
	children: LocationTreeNode[];
};

export type LocationOption = {
	id: string;
	name: string;
};

export type LocationProfileLevel = {
	id: string;
	name: string;
};

export type LocationProfileData = {
	version: 1;
	island: LocationProfileLevel;
	province: LocationProfileLevel;
	county: LocationProfileLevel;
	locality: LocationProfileLevel;
	geo?: {
		lat: number;
		lng: number;
	};
};

type CountyRecord = {
	county: LocationOption;
	province: LocationOption;
	localities: LocationOption[];
	localityById: Map<string, LocationOption>;
};

type LocalityRecord = {
	province: LocationOption;
	county: LocationOption;
	locality: LocationOption;
};

function isObject(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isTreeNode(value: unknown): value is LocationTreeNode {
	if (!isObject(value)) return false;
	if (typeof value.id !== 'string') return false;
	if (typeof value.name !== 'string') return false;
	if (value.type !== 'country' && value.type !== 'province' && value.type !== 'county' && value.type !== 'area') {
		return false;
	}
	if (!Array.isArray(value.children)) return false;
	return value.children.every((child) => isTreeNode(child));
}

function byNameAsc(a: LocationOption, b: LocationOption) {
	return a.name.localeCompare(b.name, 'en-IE');
}

const rootTreeCandidate: unknown = rawIrelandLocationTree;
if (!isTreeNode(rootTreeCandidate)) {
	throw new Error('Invalid ireland_counties.json tree shape.');
}
if (rootTreeCandidate.type !== 'country') {
	throw new Error('Location root must be a country node.');
}

const LOCATION_ROOT = {
	id: rootTreeCandidate.id,
	name: rootTreeCandidate.name
} as const;

const provinceNodes = rootTreeCandidate.children.filter((child) => child.type === 'province');
if (provinceNodes.length === 0) {
	throw new Error('No provinces found in location tree.');
}

const provinceOptions = provinceNodes
	.map((province) => ({ id: province.id, name: province.name }))
	.sort(byNameAsc);

const countyRecords = new Map<string, CountyRecord>();
const localityRecords = new Map<string, LocalityRecord>();

for (const provinceNode of provinceNodes) {
	const provinceOption: LocationOption = {
		id: provinceNode.id,
		name: provinceNode.name
	};
	for (const countyNode of provinceNode.children) {
		if (countyNode.type !== 'county') continue;
		const countyOption: LocationOption = {
			id: countyNode.id,
			name: countyNode.name
		};
		const localities = countyNode.children
			.filter((localityNode) => localityNode.type === 'area')
			.map((localityNode) => ({
				id: localityNode.id,
				name: localityNode.name
			}))
			.sort(byNameAsc);
		const localityById = new Map(localities.map((locality) => [locality.id, locality]));

		countyRecords.set(countyOption.id, {
			county: countyOption,
			province: provinceOption,
			localities,
			localityById
		});

		for (const locality of localities) {
			localityRecords.set(locality.id, {
				province: provinceOption,
				county: countyOption,
				locality
			});
		}
	}
}

const countyOptions = Array.from(countyRecords.values())
	.map((entry) => entry.county)
	.sort(byNameAsc);

function asId(value: unknown): string {
	return typeof value === 'string' ? value.trim() : '';
}

function asFiniteNumber(value: unknown): number | null {
	if (typeof value !== 'number') return null;
	if (!Number.isFinite(value)) return null;
	return value;
}

function getGeoFromInput(input: Record<string, unknown>): LocationProfileData['geo'] | undefined {
	const geo = input.geo;
	if (!isObject(geo)) return undefined;
	const lat = asFiniteNumber(geo.lat);
	const lng = asFiniteNumber(geo.lng);
	if (lat === null || lng === null) return undefined;
	return { lat, lng };
}

function getCountyIdFromInput(input: Record<string, unknown>): string {
	const nestedCounty = isObject(input.county) ? asId(input.county.id) : '';
	if (nestedCounty) return nestedCounty;
	return asId(input.countyId);
}

function getLocalityIdFromInput(input: Record<string, unknown>): string {
	const nestedLocality = isObject(input.locality) ? asId(input.locality.id) : '';
	if (nestedLocality) return nestedLocality;
	return asId(input.localityId);
}

export const ISLAND_OPTION: LocationOption = {
	id: LOCATION_ROOT.id,
	name: LOCATION_ROOT.name
};

export const PROVINCE_OPTIONS: readonly LocationOption[] = provinceOptions;

export function getCountyOptions(): readonly LocationOption[] {
	return countyOptions;
}

export function getCountyOptionById(countyId: string | null | undefined): LocationOption | null {
	if (!countyId) return null;
	return countyRecords.get(countyId)?.county ?? null;
}

export function getProvinceForCountyId(countyId: string | null | undefined): LocationOption | null {
	if (!countyId) return null;
	return countyRecords.get(countyId)?.province ?? null;
}

export function getLocalityOptionsByCountyId(
	countyId: string | null | undefined
): readonly LocationOption[] {
	if (!countyId) return [];
	return countyRecords.get(countyId)?.localities ?? [];
}

export function getLocalityOptionById(
	countyId: string | null | undefined,
	localityId: string | null | undefined
): LocationOption | null {
	if (!countyId || !localityId) return null;
	const county = countyRecords.get(countyId);
	if (!county) return null;
	return county.localityById.get(localityId) ?? null;
}

export function getCountyIdForLocalityId(localityId: string | null | undefined): string | null {
	if (!localityId) return null;
	const locality = localityRecords.get(localityId);
	return locality?.county.id ?? null;
}

export function buildLocationProfileData(
	countyId: string,
	localityId: string
): LocationProfileData | null {
	const countyRecord = countyRecords.get(countyId);
	if (!countyRecord) return null;
	const locality = countyRecord.localityById.get(localityId);
	if (!locality) return null;

	return {
		version: 1,
		island: { id: LOCATION_ROOT.id, name: LOCATION_ROOT.name },
		province: {
			id: countyRecord.province.id,
			name: countyRecord.province.name
		},
		county: {
			id: countyRecord.county.id,
			name: countyRecord.county.name
		},
		locality: {
			id: locality.id,
			name: locality.name
		}
	};
}

export function validateAndNormalizeLocationProfileData(input: unknown): {
	error: string | null;
	data: LocationProfileData | null;
} {
	if (!isObject(input)) {
		return { error: 'Location details are required.', data: null };
	}

	const countyId = getCountyIdFromInput(input);
	if (!countyId) {
		return { error: 'County is required.', data: null };
	}

	const countyRecord = countyRecords.get(countyId);
	if (!countyRecord) {
		return { error: 'Invalid county.', data: null };
	}

	const localityId = getLocalityIdFromInput(input);
	if (!localityId) {
		return { error: 'Locality is required.', data: null };
	}

	const locality = countyRecord.localityById.get(localityId);
	if (!locality) {
		return { error: 'Invalid locality for selected county.', data: null };
	}

	const normalized: LocationProfileData = {
		version: 1,
		island: { id: LOCATION_ROOT.id, name: LOCATION_ROOT.name },
		province: {
			id: countyRecord.province.id,
			name: countyRecord.province.name
		},
		county: {
			id: countyRecord.county.id,
			name: countyRecord.county.name
		},
		locality: {
			id: locality.id,
			name: locality.name
		}
	};

	const geo = getGeoFromInput(input);
	if (geo) normalized.geo = geo;

	return { error: null, data: normalized };
}
