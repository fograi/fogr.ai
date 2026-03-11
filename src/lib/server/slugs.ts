import slugify from 'slugify';
import { customAlphabet } from 'nanoid';

const generateShortId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

export const STOP_WORDS = new Set([
	// Articles
	'a',
	'an',
	'the',
	// Conjunctions
	'and',
	'or',
	'but',
	'nor',
	'so',
	'yet',
	// Prepositions (common)
	'in',
	'on',
	'at',
	'to',
	'for',
	'of',
	'with',
	'by',
	'from',
	'up',
	'about',
	'into',
	'over',
	'after',
	// Pronouns
	'i',
	'me',
	'my',
	'we',
	'us',
	'our',
	'you',
	'your',
	'he',
	'him',
	'his',
	'she',
	'her',
	'it',
	'its',
	'they',
	'them',
	'their',
	// Be verbs
	'is',
	'am',
	'are',
	'was',
	'were',
	'be',
	'been',
	'being',
	// Common verbs
	'has',
	'have',
	'had',
	'do',
	'does',
	'did',
	'will',
	'would',
	'could',
	'should',
	'may',
	'might',
	// Other
	'this',
	'that',
	'these',
	'those',
	'not',
	'no',
	'if',
	'as'
]);

export const MAX_TITLE_SLUG_LENGTH = 60;

const SHORT_ID_LENGTH = 8;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function truncateOnWordBoundary(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	const truncated = text.slice(0, maxLength);
	const lastDash = truncated.lastIndexOf('-');
	return lastDash > 0 ? truncated.slice(0, lastDash) : truncated;
}

export function generateAdSlug(
	title: string,
	countyName: string | null,
	categoryName: string | null
): string {
	// 1. Slugify the title (handles diacritics, special chars)
	let titleSlug = slugify(title, { lower: true, strict: true, trim: true });

	// 2. Remove stop words
	const words = titleSlug.split('-').filter((w) => w && !STOP_WORDS.has(w));
	titleSlug = words.join('-');

	// 3. Fallback if title produced empty slug (all non-Latin chars / emoji)
	if (!titleSlug) {
		titleSlug = categoryName
			? slugify(categoryName, { lower: true, strict: true, trim: true })
			: 'listing';
	}

	// 4. Truncate on word boundary
	titleSlug = truncateOnWordBoundary(titleSlug, MAX_TITLE_SLUG_LENGTH);

	// 5. Append county if available
	const countySlug = countyName
		? slugify(countyName, { lower: true, strict: true, trim: true })
		: '';

	// 6. Generate short ID
	const shortId = generateShortId();

	// 7. Assemble: {title}-{county}-{shortid}
	const parts = [titleSlug, countySlug, shortId].filter(Boolean);
	return parts.join('-');
}

export function extractShortId(slug: string): string {
	return slug.slice(-SHORT_ID_LENGTH);
}

export function parseSlugShortId(slug: string): string | null {
	if (slug.length < SHORT_ID_LENGTH) return null;
	const shortId = slug.slice(-SHORT_ID_LENGTH);
	if (!/^[a-z0-9]{8}$/.test(shortId)) return null;
	return shortId;
}

export function isUuidParam(param: string): boolean {
	return UUID_REGEX.test(param);
}
