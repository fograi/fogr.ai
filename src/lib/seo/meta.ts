/**
 * SEO meta tag builder utilities.
 *
 * Title patterns — short, brand-first:
 *   Ad pages:      "{Ad Title} | fógr.aí"
 *   Category:      "{Category} | fógr.aí"
 *   County:        "{County} | fógr.aí"
 *   Cat+County:    "{Category} in {County} | fógr.aí"
 *   Homepage:      "Buy & Sell Second-Hand in Ireland | fógr.aí"
 */

const BRAND = 'fógr.aí';

export function buildAdTitle(adTitle: string, _countyName: string | null): string {
	return `${adTitle} | ${BRAND}`;
}

export function buildCategoryTitle(
	categoryDisplayName: string,
	countyName?: string | null
): string {
	if (countyName) {
		return `${categoryDisplayName} in ${countyName} | ${BRAND}`;
	}
	return `${categoryDisplayName} | ${BRAND}`;
}

export function buildCountyTitle(countyName: string): string {
	return `${countyName} | ${BRAND}`;
}

export function buildHomepageTitle(): string {
	return `Buy & Sell Second-Hand in Ireland | ${BRAND}`;
}

export function buildDescription(text: string, maxLen = 155): string {
	const cleaned = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
	if (cleaned.length <= maxLen) return cleaned;
	const truncated = cleaned.slice(0, maxLen);
	const lastSpace = truncated.lastIndexOf(' ');
	if (lastSpace > maxLen * 0.6) {
		return truncated.slice(0, lastSpace) + '...';
	}
	return truncated + '...';
}

export function buildCanonical(origin: string, pathname: string): string {
	const cleanPath = pathname.split('?')[0].replace(/\/+$/, '') || '/';
	return origin + cleanPath;
}
