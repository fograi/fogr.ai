import type { LocationProfileData } from '$lib/location-hierarchy';

function isObject(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}

function asLevel(value: unknown): { id: string; name: string } | null {
	if (!isObject(value)) return null;
	if (typeof value.id !== 'string' || !value.id.trim()) return null;
	if (typeof value.name !== 'string' || !value.name.trim()) return null;
	return {
		id: value.id,
		name: value.name
	};
}

export function asLocationProfileData(value: unknown): LocationProfileData | null {
	if (!isObject(value)) return null;

	const island = asLevel(value.island);
	const province = asLevel(value.province);
	const county = asLevel(value.county);
	const locality = asLevel(value.locality);
	if (!island || !province || !county || !locality) return null;

	const normalized: LocationProfileData = {
		version: 1,
		island,
		province,
		county,
		locality
	};

	if (isObject(value.geo) && typeof value.geo.lat === 'number' && typeof value.geo.lng === 'number') {
		normalized.geo = { lat: value.geo.lat, lng: value.geo.lng };
	}

	return normalized;
}

export function formatLocationSummary(value: unknown, includeProvince = false): string {
	const profile = asLocationProfileData(value);
	if (!profile) return '';
	if (includeProvince) {
		return `${profile.locality.name}, ${profile.county.name}, ${profile.province.name}`;
	}
	return `${profile.locality.name}, ${profile.county.name}`;
}
