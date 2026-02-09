import {
	getLocationSelectionNodeById,
	validateAndNormalizeLocationProfileData,
	type LocationProfileData
} from '$lib/location-hierarchy';

function hasSelectedAncestor(nodeId: string, selectedIds: Set<string>) {
	let parentId = getLocationSelectionNodeById(nodeId)?.parentId ?? null;
	while (parentId) {
		if (selectedIds.has(parentId)) return true;
		parentId = getLocationSelectionNodeById(parentId)?.parentId ?? null;
	}
	return false;
}

function normalizeDisplayIds(profile: LocationProfileData): string[] {
	const selectedSet = new Set(profile.selectedNodeIds);
	const normalizedIds = Array.from(selectedSet).filter((nodeId) => !hasSelectedAncestor(nodeId, selectedSet));
	if (normalizedIds.length > 0) return normalizedIds;
	if (profile.primary.id) return [profile.primary.id];
	return [];
}

function sortByBreadthAndName(a: string, b: string) {
	const aNode = getLocationSelectionNodeById(a);
	const bNode = getLocationSelectionNodeById(b);
	const rank = (type?: 'country' | 'province' | 'county') => {
		if (type === 'country') return 1;
		if (type === 'province') return 2;
		return 3;
	};
	const rankDiff = rank(aNode?.type) - rank(bNode?.type);
	if (rankDiff !== 0) return rankDiff;
	return (aNode?.name ?? a).localeCompare(bNode?.name ?? b, 'en-IE');
}

function formatSingleLocation(nodeId: string, includeProvince: boolean): string {
	const node = getLocationSelectionNodeById(nodeId);
	if (!node) return '';
	if (!includeProvince || node.type !== 'county') return node.name;
	const province =
		node.parentId && getLocationSelectionNodeById(node.parentId)?.type === 'province'
			? getLocationSelectionNodeById(node.parentId)
			: null;
	if (!province) return node.name;
	return `${node.name}, ${province.name}`;
}

export function asLocationProfileData(value: unknown): LocationProfileData | null {
	const result = validateAndNormalizeLocationProfileData(value);
	return result.data;
}

export function formatLocationSummary(value: unknown, includeProvince = false): string {
	const profile = asLocationProfileData(value);
	if (!profile) return '';
	if (profile.locality) {
		if (includeProvince && profile.province && profile.county) {
			return `${profile.locality.name}, ${profile.county.name}, ${profile.province.name}`;
		}
		if (profile.county) {
			return `${profile.locality.name}, ${profile.county.name}`;
		}
		return profile.locality.name;
	}

	const displayIds = normalizeDisplayIds(profile).sort(sortByBreadthAndName);
	if (displayIds.length === 0) return profile.primary.name;
	if (displayIds.length === 1) {
		return formatSingleLocation(displayIds[0], includeProvince);
	}

	const firstLabel = formatSingleLocation(displayIds[0], includeProvince);
	if (!firstLabel) return '';
	return `${firstLabel} +${displayIds.length - 1} more`;
}
