/**
 * Generate a human-readable name from search filters.
 * "Bicycles in Dublin" or "Electronics" or "All listings in Cork"
 */
export function generateSearchName(filters: {
	category?: string | null;
	countyName?: string | null;
	query?: string | null;
}): string {
	const parts: string[] = [];
	if (filters.category) parts.push(filters.category);
	if (filters.query) parts.push(`"${filters.query}"`);
	if (!parts.length) parts.push('All listings');
	if (filters.countyName) parts.push(`in ${filters.countyName}`);
	return parts.join(' ');
}
