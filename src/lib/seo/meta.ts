/**
 * SEO meta tag builder utilities.
 *
 * Title patterns follow user decisions:
 *   Ad pages:      "{Ad Title} for Sale in {County} | Fogr.ai"
 *   Category:      "Second-Hand {Category} for Sale in Ireland | Fogr.ai"
 *   County:        "Second-Hand Classifieds in {County} | Fogr.ai"
 *   Homepage:      "Buy & Sell Second-Hand in Ireland | Fogr.ai -- Fograi"
 */

const BRAND = 'Fogr.ai';
const BRAND_FULL = 'Fogr.ai \u2014 F\u00f3gra\u00ed';

export function buildAdTitle(adTitle: string, countyName: string | null): string {
	if (countyName) {
		return `${adTitle} for Sale in ${countyName} | ${BRAND}`;
	}
	return `${adTitle} for Sale | ${BRAND}`;
}

export function buildCategoryTitle(
	categoryDisplayName: string,
	countyName?: string | null
): string {
	if (countyName) {
		return `Second-Hand ${categoryDisplayName} for Sale in ${countyName} | ${BRAND}`;
	}
	return `Second-Hand ${categoryDisplayName} for Sale in Ireland | ${BRAND}`;
}

export function buildCountyTitle(countyName: string): string {
	return `Second-Hand Classifieds in ${countyName} | ${BRAND}`;
}

export function buildHomepageTitle(): string {
	return `Buy & Sell Second-Hand in Ireland | ${BRAND_FULL}`;
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
