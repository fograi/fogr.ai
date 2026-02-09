import crypto from 'crypto';

type NounGender = 'm' | 'f';
type NounType = 'myth' | 'nature' | 'place';

type NounEntry = {
	w: string;
	gender: NounGender;
	type: NounType;
};

type AdjectiveEntry = {
	lemma: string;
	fem?: string;
};

type IrishHandleOptions = {
	tagChars?: number;
	separator?: string;
};

const SHA256_DIGEST_BYTES = 32;
const TAG_SOURCE_OFFSET_BYTES = 2;
const MIN_TAG_CHARS = 2;
const MAX_TAG_CHARS = Math.floor(((SHA256_DIGEST_BYTES - TAG_SOURCE_OFFSET_BYTES) * 8) / 5);

/**
 * APPEND ONLY. Never reorder, or existing users’ names will change.
 * gender: "m" | "f"
 * type: "myth" | "nature" | "place"
 */
export const NOUNS: readonly NounEntry[] = [
	// --- Mythology / figures (gender = the figure’s gender in Irish tradition)
	{ w: 'Bríd', gender: 'f', type: 'myth' },
	{ w: 'Áine', gender: 'f', type: 'myth' },
	{ w: 'Ériu', gender: 'f', type: 'myth' },
	{ w: 'Banba', gender: 'f', type: 'myth' },
	{ w: 'Fódla', gender: 'f', type: 'myth' },
	{ w: 'Mórrígan', gender: 'f', type: 'myth' },
	{ w: 'Badhbh', gender: 'f', type: 'myth' },
	{ w: 'Boann', gender: 'f', type: 'myth' },
	{ w: 'Gráinne', gender: 'f', type: 'myth' },
	{ w: 'Deirdre', gender: 'f', type: 'myth' },
	{ w: 'Niamh', gender: 'f', type: 'myth' },
	{ w: 'Scáthach', gender: 'f', type: 'myth' },

	{ w: 'Lugh', gender: 'm', type: 'myth' },
	{ w: 'An Dagda', gender: 'm', type: 'myth' },
	{ w: 'Nuada', gender: 'm', type: 'myth' },
	{ w: 'Aonghus', gender: 'm', type: 'myth' },
	{ w: 'Manannán', gender: 'm', type: 'myth' },
	{ w: 'Goibniu', gender: 'm', type: 'myth' },
	{ w: 'Ogma', gender: 'm', type: 'myth' },
	{ w: 'Balor', gender: 'm', type: 'myth' },
	{ w: 'Fionn', gender: 'm', type: 'myth' },
	{ w: 'Oisín', gender: 'm', type: 'myth' },
	{ w: 'Oscar', gender: 'm', type: 'myth' },
	{ w: 'Diarmaid', gender: 'm', type: 'myth' },
	{ w: 'Cú Chulainn', gender: 'm', type: 'myth' },

	// --- Nature nouns (common nouns; gender per standard Irish usage)
	{ w: 'Abhainn', gender: 'f', type: 'nature' },
	{ w: 'Coill', gender: 'f', type: 'nature' },
	{ w: 'Gaoth', gender: 'f', type: 'nature' },
	{ w: 'Grian', gender: 'f', type: 'nature' },
	{ w: 'Gealach', gender: 'f', type: 'nature' },
	{ w: 'Réalt', gender: 'f', type: 'nature' },
	{ w: 'Oíche', gender: 'f', type: 'nature' },
	{ w: 'Trá', gender: 'f', type: 'nature' },
	{ w: 'Bá', gender: 'f', type: 'nature' },
	{ w: 'Cloch', gender: 'f', type: 'nature' },

	{ w: 'Loch', gender: 'm', type: 'nature' },
	{ w: 'Sliabh', gender: 'm', type: 'nature' },
	{ w: 'Gleann', gender: 'm', type: 'nature' },
	{ w: 'Cnoc', gender: 'm', type: 'nature' },
	{ w: 'Crann', gender: 'm', type: 'nature' },
	{ w: 'Féar', gender: 'm', type: 'nature' },
	{ w: 'Ceo', gender: 'm', type: 'nature' },
	{ w: 'Sneachta', gender: 'm', type: 'nature' },
	{ w: 'Lá', gender: 'm', type: 'nature' },

	// --- Place nouns (generic place-words; safe + consistent)
	{ w: 'Inis', gender: 'f', type: 'place' },
	{ w: 'Cathair', gender: 'f', type: 'place' },

	{ w: 'Dún', gender: 'm', type: 'place' },
	{ w: 'Caisleán', gender: 'm', type: 'place' },
	{ w: 'Túr', gender: 'm', type: 'place' },
	{ w: 'Tobar', gender: 'm', type: 'place' }
];

/**
 * Adjectives (lemmas). For any adjective where feminine form isn’t just lenition,
 * you can add { lemma, fem: "..." }.
 */
export const ADJ: readonly AdjectiveEntry[] = [
	{ lemma: 'ciúin' },
	{ lemma: 'dána' },
	{ lemma: 'cróga' },
	{ lemma: 'geal' },
	{ lemma: 'glan' },
	{ lemma: 'láidir' },
	{ lemma: 'tapa' },
	{ lemma: 'glic' },
	{ lemma: 'cliste' },
	{ lemma: 'ceolmhar' },
	{ lemma: 'misniúil' },
	{ lemma: 'spraíúil' },
	{ lemma: 'seiftiúil' },
	{ lemma: 'maorga' },
	{ lemma: 'fial' },
	{ lemma: 'séimh' },
	{ lemma: 'síochánta' },
	{ lemma: 'dílis' },
	{ lemma: 'ionraic' },
	{ lemma: 'uaillmhianach' },
	{ lemma: 'solúbtha' },
	{ lemma: 'críonna' },
	{ lemma: 'beo' },
	{ lemma: 'fíor' },
	{ lemma: 'fionnuar' }
];

// Keep this small + targeted. You can expand later.
const DENY = new Set<string>([
	// add any substrings you want to block in final output (lowercase)
]);

/** Crockford Base32 (no I/L/O/U) */
function base32Crockford(buf: Uint8Array): string {
	const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
	let bits = 0,
		value = 0,
		out = '';
	for (const b of buf) {
		value = (value << 8) | b;
		bits += 8;
		while (bits >= 5) {
			out += alphabet[(value >>> (bits - 5)) & 31];
			bits -= 5;
		}
	}
	if (bits > 0) out += alphabet[(value << (5 - bits)) & 31];
	return out;
}

const VOWELS = new Set([...'aáeéiíoóuú']);
function startsWithVowel(word: string): boolean {
	const c = word.trim().toLocaleLowerCase('ga-IE').charAt(0);
	return c.length > 0 ? VOWELS.has(c) : false;
}

/**
 * Séimhiú: insert 'h' after initial consonant where appropriate.
 * Also respects the common rule: s + c/f/m/p/t does not lenite.
 */
function seimhiu(word: string): string {
	const w = word.trim();
	if (!w) return w;

	const parts = w.split(/\s+/);
	const first = parts[0];
	if (!first) return w;
	const rest = parts.slice(1);

	const lower = first.toLocaleLowerCase('ga-IE');
	if (startsWithVowel(lower)) return w;
	const firstLetter = lower.charAt(0);
	const secondLetter = lower.charAt(1);
	if (secondLetter === 'h') return w;

	if (firstLetter === 's' && secondLetter && 'cfmpt'.includes(secondLetter)) return w;

	const lenitable = new Set(['b', 'c', 'd', 'f', 'g', 'm', 'p', 's', 't']);
	if (!firstLetter || !lenitable.has(firstLetter)) return w;

	const mutated = first.charAt(0) + 'h' + first.slice(1);
	return [mutated, ...rest].join(' ');
}

function makeTag(h: Uint8Array, tagChars: number): string {
	const bytesNeeded = Math.max(2, Math.ceil((tagChars * 5) / 8));
	return base32Crockford(h.subarray(TAG_SOURCE_OFFSET_BYTES, TAG_SOURCE_OFFSET_BYTES + bytesNeeded)).slice(
		0,
		tagChars
	);
}

function validateTagChars(tagChars: number): number {
	if (!Number.isFinite(tagChars) || !Number.isInteger(tagChars)) {
		throw new TypeError('tagChars must be a whole number.');
	}
	if (tagChars < MIN_TAG_CHARS || tagChars > MAX_TAG_CHARS) {
		throw new RangeError(`tagChars must be between ${MIN_TAG_CHARS} and ${MAX_TAG_CHARS}.`);
	}
	return tagChars;
}

function getByte(bytes: Uint8Array, index: number): number {
	return bytes[index] ?? 0;
}

function pickAt<T>(values: readonly T[], index: number): T {
	const value = values[index];
	if (value === undefined) {
		throw new Error(`Expected value at index ${index}`);
	}
	return value;
}

/**
 * Deterministic Irish pseudonym.
 * - uid: UUID string
 * - secret: server-side secret (env var); NEVER ship to client
 */
export function mythologise(
	uid: string,
	secret: crypto.BinaryLike,
	{ tagChars = 4, separator = '-' }: IrishHandleOptions = {}
): string {
	const safeTagChars = validateTagChars(tagChars);
	const h = crypto.createHmac('sha256', secret).update(uid).digest();

	// deterministic “reroll”: if denylist hit, shift indices using later bytes
	for (let attempt = 0; attempt < 8; attempt++) {
		const nIdx = (getByte(h, 0) + getByte(h, 10 + attempt)) % NOUNS.length;
		const aIdx = (getByte(h, 1) + getByte(h, 18 + attempt)) % ADJ.length;

		const noun = pickAt(NOUNS, nIdx);
		const adjEntry = pickAt(ADJ, aIdx);

		const adj = noun.gender === 'f' ? (adjEntry.fem ?? seimhiu(adjEntry.lemma)) : adjEntry.lemma;

		const tag = makeTag(h, safeTagChars);

		const out = `${noun.w}${separator}${adj}${separator}${tag}`.toLocaleLowerCase('ga-IE');

		let blocked = false;
		for (const bad of DENY) {
			if (bad && out.includes(bad)) {
				blocked = true;
				break;
			}
		}
		if (!blocked) return out;
	}

	// fallback (should be rare unless DENY is aggressive)
	const noun = pickAt(NOUNS, getByte(h, 0) % NOUNS.length);
	const adj =
		noun.gender === 'f'
			? seimhiu(pickAt(ADJ, getByte(h, 1) % ADJ.length).lemma)
			: pickAt(ADJ, getByte(h, 1) % ADJ.length).lemma;
	return `${noun.w}${separator}${adj}${separator}${makeTag(h, safeTagChars)}`.toLocaleLowerCase(
		'ga-IE'
	);
}
