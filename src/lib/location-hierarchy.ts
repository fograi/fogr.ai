import rawIrelandLocationTree from '../../ireland_counties.json';

export type LocationNodeType = 'country' | 'province' | 'county' | 'area';
export type LocationSelectableType = 'country' | 'province' | 'county';

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

export type LocationProfileSelection = LocationProfileLevel & {
	type: LocationSelectableType;
};

export type LocationProfileData = {
	version: 2;
	level: LocationSelectableType;
	primary: LocationProfileSelection;
	selected: LocationProfileSelection[];
	selectedNodeIds: string[];
	island: LocationProfileLevel;
	province: LocationProfileLevel | null;
	county: LocationProfileLevel | null;
	locality: LocationProfileLevel | null;
	geo?: {
		lat: number;
		lng: number;
	};
};

type LocationSelectionTreeNode = {
	id: string;
	name: string;
	type: LocationSelectableType;
	children: LocationSelectionTreeNode[];
};

type SelectionNodeRecord = {
	id: string;
	name: string;
	type: LocationSelectableType;
	parentId: string | null;
	childIds: string[];
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

function asId(value: unknown): string {
	return typeof value === 'string' ? value.trim() : '';
}

function asFiniteNumber(value: unknown): number | null {
	if (typeof value !== 'number') return null;
	if (!Number.isFinite(value)) return null;
	return value;
}

function asSelectionIdsFromInput(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	const ids: string[] = [];
	for (const entry of value) {
		if (typeof entry === 'string' && entry.trim()) {
			ids.push(entry.trim());
			continue;
		}
		if (isObject(entry)) {
			const id = asId(entry.id);
			if (id) ids.push(id);
		}
	}
	return ids;
}

function getGeoFromInput(input: Record<string, unknown>): LocationProfileData['geo'] | undefined {
	const geo = input.geo;
	if (!isObject(geo)) return undefined;
	const lat = asFiniteNumber(geo.lat);
	const lng = asFiniteNumber(geo.lng);
	if (lat === null || lng === null) return undefined;
	return { lat, lng };
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

const selectionNodes = new Map<string, SelectionNodeRecord>();
const addSelectionNode = (node: SelectionNodeRecord) => {
	selectionNodes.set(node.id, node);
};

addSelectionNode({
	id: LOCATION_ROOT.id,
	name: LOCATION_ROOT.name,
	type: 'country',
	parentId: null,
	childIds: provinceNodes.map((province) => province.id)
});

const selectionTree: LocationSelectionTreeNode = {
	id: LOCATION_ROOT.id,
	name: LOCATION_ROOT.name,
	type: 'country',
	children: provinceNodes.map((provinceNode) => {
		const countyNodes = provinceNode.children.filter((countyNode) => countyNode.type === 'county');
		addSelectionNode({
			id: provinceNode.id,
			name: provinceNode.name,
			type: 'province',
			parentId: LOCATION_ROOT.id,
			childIds: countyNodes.map((countyNode) => countyNode.id)
		});

		const provinceOption: LocationOption = {
			id: provinceNode.id,
			name: provinceNode.name
		};

		for (const countyNode of countyNodes) {
			addSelectionNode({
				id: countyNode.id,
				name: countyNode.name,
				type: 'county',
				parentId: provinceNode.id,
				childIds: []
			});

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

		return {
			id: provinceNode.id,
			name: provinceNode.name,
			type: 'province' as const,
			children: countyNodes.map((countyNode) => ({
				id: countyNode.id,
				name: countyNode.name,
				type: 'county' as const,
				children: []
			}))
		};
	})
};

const countyOptions = Array.from(countyRecords.values())
	.map((entry) => entry.county)
	.sort(byNameAsc);

function selectionRank(type: LocationSelectableType): number {
	if (type === 'county') return 3;
	if (type === 'province') return 2;
	return 1;
}

function selectionByBreadthAndNameAsc(a: LocationProfileSelection, b: LocationProfileSelection) {
	const rankDiff = selectionRank(a.type) - selectionRank(b.type);
	if (rankDiff !== 0) return rankDiff;
	return a.name.localeCompare(b.name, 'en-IE');
}

function selectionByNameAsc(a: LocationProfileSelection, b: LocationProfileSelection) {
	return a.name.localeCompare(b.name, 'en-IE');
}

function getSelectionFromRecord(node: SelectionNodeRecord): LocationProfileSelection {
	return {
		id: node.id,
		name: node.name,
		type: node.type
	};
}

function getProvinceForSelection(node: SelectionNodeRecord): LocationProfileLevel | null {
	if (node.type === 'province') {
		return { id: node.id, name: node.name };
	}
	if (node.type === 'county' && node.parentId) {
		const province = selectionNodes.get(node.parentId);
		if (province && province.type === 'province') {
			return { id: province.id, name: province.name };
		}
	}
	return null;
}

function normalizeSelectionIds(ids: readonly string[]): string[] {
	const unique = new Set<string>();
	for (const id of ids) {
		if (!id || !selectionNodes.has(id)) continue;
		unique.add(id);
	}
	return Array.from(unique).sort((a, b) => {
		const aNode = selectionNodes.get(a);
		const bNode = selectionNodes.get(b);
		if (!aNode || !bNode) return a.localeCompare(b, 'en-IE');
		const rankDiff = selectionRank(aNode.type) - selectionRank(bNode.type);
		if (rankDiff !== 0) return rankDiff;
		return aNode.name.localeCompare(bNode.name, 'en-IE');
	});
}

function getLegacySelectionIds(input: Record<string, unknown>): string[] {
	const ids: string[] = [];
	if (isObject(input.county)) {
		const countyId = asId(input.county.id);
		if (countyId) ids.push(countyId);
	}
	if (ids.length > 0) return ids;
	if (isObject(input.province)) {
		const provinceId = asId(input.province.id);
		if (provinceId) ids.push(provinceId);
	}
	if (ids.length > 0) return ids;
	if (isObject(input.island)) {
		const islandId = asId(input.island.id);
		if (islandId) ids.push(islandId);
	}
	return ids;
}

function getLocalityIdFromInput(input: Record<string, unknown>): string {
	if (isObject(input.locality)) {
		const localityId = asId(input.locality.id);
		if (localityId) return localityId;
	}
	return asId(input.localityId);
}

export const ISLAND_OPTION: LocationOption = {
	id: LOCATION_ROOT.id,
	name: LOCATION_ROOT.name
};

export const PROVINCE_OPTIONS: readonly LocationOption[] = provinceOptions;

export function getLocationSelectionTree(): LocationSelectionTreeNode {
	return selectionTree;
}

export function getLocationSelectionNodeById(id: string | null | undefined): SelectionNodeRecord | null {
	if (!id) return null;
	return selectionNodes.get(id) ?? null;
}

export function getLocationSelectionDescendantIds(id: string | null | undefined): string[] {
	if (!id) return [];
	const node = selectionNodes.get(id);
	if (!node) return [];
	const descendants: string[] = [];
	const stack = [...node.childIds];
	while (stack.length > 0) {
		const nextId = stack.pop() as string;
		descendants.push(nextId);
		const nextNode = selectionNodes.get(nextId);
		if (!nextNode) continue;
		stack.push(...nextNode.childIds);
	}
	return descendants;
}

export function normalizeLocationSelectionIds(ids: readonly string[]): string[] {
	return normalizeSelectionIds(ids);
}

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
	selectedNodeIds: readonly string[],
	localityId?: string | null
): LocationProfileData | null {
	const normalizedIds = normalizeSelectionIds(selectedNodeIds);
	if (normalizedIds.length === 0) return null;

	const selectedNodes = normalizedIds
		.map((id) => selectionNodes.get(id))
		.filter((node): node is SelectionNodeRecord => !!node)
		.map((node) => getSelectionFromRecord(node))
		.sort(selectionByNameAsc);
	if (selectedNodes.length === 0) return null;

	const primary = [...selectedNodes].sort(selectionByBreadthAndNameAsc)[0];
	const primaryNode = selectionNodes.get(primary.id);
	if (!primaryNode) return null;

	const profile: LocationProfileData = {
		version: 2,
		level: primary.type,
		primary,
		selected: selectedNodes,
		selectedNodeIds: normalizedIds,
		island: { id: LOCATION_ROOT.id, name: LOCATION_ROOT.name },
		province: getProvinceForSelection(primaryNode),
		county: primaryNode.type === 'county' ? { id: primaryNode.id, name: primaryNode.name } : null,
		locality: null
	};

	const normalizedLocalityId = localityId?.trim() ?? '';
	if (normalizedLocalityId && profile.county) {
		const locality = getLocalityOptionById(profile.county.id, normalizedLocalityId);
		if (locality) {
			profile.locality = {
				id: locality.id,
				name: locality.name
			};
		}
	}

	return profile;
}

export function validateAndNormalizeLocationProfileData(input: unknown): {
	error: string | null;
	data: LocationProfileData | null;
} {
	if (!isObject(input)) {
		return { error: 'Location details are required.', data: null };
	}

	const selectedNodeIds = [
		...asSelectionIdsFromInput(input.selectedNodeIds),
		...asSelectionIdsFromInput(input.selected)
	];
	if (isObject(input.primary)) {
		const primaryId = asId(input.primary.id);
		if (primaryId) selectedNodeIds.push(primaryId);
	}
	if (selectedNodeIds.length === 0) {
		selectedNodeIds.push(...getLegacySelectionIds(input));
	}
	const localityId = getLocalityIdFromInput(input);

	const normalizedIds = normalizeSelectionIds(selectedNodeIds);
	if (normalizedIds.length === 0) {
		return { error: 'Select at least one location.', data: null };
	}
	if (normalizedIds.length > 200) {
		return { error: 'Too many location selections.', data: null };
	}

	const profile = buildLocationProfileData(normalizedIds, localityId);
	if (!profile) {
		return { error: 'Invalid location selection.', data: null };
	}
	if (localityId) {
		const expectedCountyId = getCountyIdForLocalityId(localityId);
		if (!expectedCountyId) {
			return { error: 'Invalid locality.', data: null };
		}
		if (!profile.county || profile.county.id !== expectedCountyId || !profile.locality) {
			return { error: 'Invalid locality for selected county.', data: null };
		}
	}

	const geo = getGeoFromInput(input);
	if (geo) profile.geo = geo;

	return { error: null, data: profile };
}
