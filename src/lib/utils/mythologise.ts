import { createHmac, type BinaryLike } from 'node:crypto';

type NounGender = 'm' | 'f';
type NounType = 'myth' | 'nature' | 'place';

type NounEntry = {
	w: string;
	gender: NounGender;
	type: NounType;
};

type AdjRole = 'core' | 'qualifier';
type AdjectiveEntry = { lemma: string; role: AdjRole; fem?: string };

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
	{ w: 'Danu', gender: 'f', type: 'myth' },
	{ w: 'Dian Cécht', gender: 'm', type: 'myth' },
	{ w: 'Airmid', gender: 'f', type: 'myth' },
	{ w: 'Miach', gender: 'm', type: 'myth' },
	{ w: 'Credne', gender: 'm', type: 'myth' },
	{ w: 'Luchta', gender: 'm', type: 'myth' },
	{ w: 'Bres', gender: 'm', type: 'myth' },
	{ w: 'Delbaeth', gender: 'm', type: 'myth' },
	{ w: 'Étan', gender: 'f', type: 'myth' },
	{ w: 'Midir', gender: 'm', type: 'myth' },
	{ w: 'Bóand', gender: 'f', type: 'myth' }, // alt spelling sometimes used; keep if you want variants
	{ w: 'Ailill', gender: 'm', type: 'myth' },
	{ w: 'Conall', gender: 'm', type: 'myth' },
	{ w: 'Cormac', gender: 'm', type: 'myth' },
	{ w: 'Eochaid Ollathair', gender: 'm', type: 'myth' }, // Dagda epithet
	{ w: 'The Morrígan', gender: 'f', type: 'myth' }, // if you want variant; otherwise omit (you already have Mórrígan)
	{ w: 'Lir', gender: 'm', type: 'myth' },
	{ w: 'Bodb Derg', gender: 'm', type: 'myth' },
	{ w: 'Aengus Óg', gender: 'm', type: 'myth' }, // variant of Aonghus
	{ w: 'Éibhear', gender: 'm', type: 'myth' },
	{ w: 'Amergin', gender: 'm', type: 'myth' },
	{ w: 'Cian', gender: 'm', type: 'myth' },
	{ w: 'Ethniu', gender: 'f', type: 'myth' },
	{ w: 'Tailtiu', gender: 'f', type: 'myth' },
	{ w: 'Macha', gender: 'f', type: 'myth' },
	{ w: 'Clíodhna', gender: 'f', type: 'myth' },
	{ w: 'Cailleach', gender: 'f', type: 'myth' },
	{ w: 'Sadb', gender: 'f', type: 'myth' },
	{ w: 'Tuirenn', gender: 'm', type: 'myth' },
	{ w: 'Lugh Lámhfhada', gender: 'm', type: 'myth' }, // variant/epithet of Lugh

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
	{ w: 'Dair', gender: 'f', type: 'nature' }, // oak tree
	{ w: 'Iúir', gender: 'f', type: 'nature' }, // yew
	{ w: 'Giúis', gender: 'f', type: 'nature' }, // pine/fir
	{ w: 'Crann Creathach', gender: 'm', type: 'nature' }, // aspen (lit. shaking tree)
	{ w: 'Rós', gender: 'm', type: 'nature' },
	{ w: 'Fraoch', gender: 'm', type: 'nature' },
	{ w: 'Neantóg', gender: 'f', type: 'nature' },
	{ w: 'Seamair', gender: 'f', type: 'nature' },
	{ w: 'Lus', gender: 'm', type: 'nature' },
	{ w: 'Loch', gender: 'm', type: 'nature' },
	{ w: 'Sliabh', gender: 'm', type: 'nature' },
	{ w: 'Gleann', gender: 'm', type: 'nature' },
	{ w: 'Cnoc', gender: 'm', type: 'nature' },
	{ w: 'Crann', gender: 'm', type: 'nature' },
	{ w: 'Féar', gender: 'm', type: 'nature' },
	{ w: 'Ceo', gender: 'm', type: 'nature' },
	{ w: 'Sneachta', gender: 'm', type: 'nature' },
	{ w: 'Lá', gender: 'm', type: 'nature' },
	{ w: 'Fia', gender: 'm', type: 'nature' },
	{ w: 'Rón', gender: 'm', type: 'nature' },
	{ w: 'Iolar', gender: 'm', type: 'nature' },
	{ w: 'Mac Tíre', gender: 'm', type: 'nature' },
	{ w: 'Madra Rua', gender: 'm', type: 'nature' }, // fox (lit. red dog)
	{ w: 'Dobharchú', gender: 'm', type: 'nature' },
	{ w: 'Broc', gender: 'm', type: 'nature' },
	{ w: 'Faoileán', gender: 'm', type: 'nature' },
	{ w: 'Corr', gender: 'm', type: 'nature' },
	{ w: 'Eala', gender: 'f', type: 'nature' },
	{ w: 'Ulchabhán', gender: 'm', type: 'nature' },
	{ w: 'Lacha', gender: 'f', type: 'nature' },
	{ w: 'Coinín', gender: 'm', type: 'nature' },
	{ w: 'Gráinneog', gender: 'f', type: 'nature' },
	{ w: 'Dreoilín', gender: 'm', type: 'nature' },
	{ w: 'Madra', gender: 'm', type: 'nature' },
	{ w: 'Cat', gender: 'm', type: 'nature' },
	{ w: 'Capall', gender: 'm', type: 'nature' },
	{ w: 'Bó', gender: 'f', type: 'nature' },
	{ w: 'Caora', gender: 'f', type: 'nature' },
	{ w: 'Gabhar', gender: 'm', type: 'nature' },
	{ w: 'Lachaín', gender: 'm', type: 'nature' },
	{ w: 'Gé', gender: 'f', type: 'nature' },
	{ w: 'Fiach', gender: 'm', type: 'nature' },
	{ w: 'Préachán', gender: 'm', type: 'nature' },
	{ w: 'Rírá', gender: 'm', type: 'nature' }, // if you want a playful “noise” noun; otherwise omit
	{ w: 'Breac', gender: 'm', type: 'nature' },
	{ w: 'Bradán', gender: 'm', type: 'nature' },
	{ w: 'Éan', gender: 'm', type: 'nature' },
	{ w: 'Dreoilínín', gender: 'm', type: 'nature' },
	{ w: 'Bláth', gender: 'm', type: 'nature' },
	{ w: 'Duilleog', gender: 'f', type: 'nature' },
	{ w: 'Síol', gender: 'm', type: 'nature' },
	{ w: 'Caonach', gender: 'm', type: 'nature' },
	{ w: 'Raithneach', gender: 'f', type: 'nature' },
	{ w: 'Caorthann', gender: 'f', type: 'nature' },
	{ w: 'Trom', gender: 'm', type: 'nature' },
	{ w: 'Beith', gender: 'f', type: 'nature' },
	{ w: 'Coll', gender: 'f', type: 'nature' },
	{ w: 'Sail', gender: 'f', type: 'nature' },
	{ w: 'Fuinnseog', gender: 'f', type: 'nature' },
	{ w: 'Caorthannán', gender: 'm', type: 'nature' },

	// --- Place nouns (generic place-words; safe + consistent)
	{ w: 'Inis', gender: 'f', type: 'place' },
	{ w: 'Cathair', gender: 'f', type: 'place' },
	{ w: 'Port', gender: 'm', type: 'place' },
	{ w: 'Droichead', gender: 'm', type: 'place' },
	{ w: 'Cuan', gender: 'm', type: 'place' },
	{ w: 'Oileán', gender: 'm', type: 'place' },
	{ w: 'Cladach', gender: 'm', type: 'place' },
	{ w: 'Carraig', gender: 'f', type: 'place' },
	{ w: 'Lios', gender: 'm', type: 'place' },
	{ w: 'Ráth', gender: 'm', type: 'place' },
	{ w: 'Dúnfort', gender: 'm', type: 'place' },
	{ w: 'Crosbhóthar', gender: 'm', type: 'place' },
	{ w: 'Machaire', gender: 'm', type: 'place' },
	{ w: 'Móinéar', gender: 'm', type: 'place' },
	{ w: 'Foraois', gender: 'f', type: 'place' },
	{ w: 'Coillte', gender: 'f', type: 'place' },
	{ w: 'Uaimh', gender: 'f', type: 'place' },
	{ w: 'Aill', gender: 'f', type: 'place' },
	{ w: 'Ceann Tíre', gender: 'm', type: 'place' },
	{ w: 'Dún', gender: 'm', type: 'place' },
	{ w: 'Caisleán', gender: 'm', type: 'place' },
	{ w: 'Túr', gender: 'm', type: 'place' },
	{ w: 'Tobar', gender: 'm', type: 'place' },
	{ w: 'Cnocán', gender: 'm', type: 'place' },
	{ w: 'Gleannán', gender: 'm', type: 'place' },
	{ w: 'Sruth', gender: 'm', type: 'place' },
	{ w: 'Eas', gender: 'm', type: 'place' },
	{ w: 'Bealach', gender: 'm', type: 'place' },
	{ w: 'Bóthar', gender: 'm', type: 'place' },
	{ w: 'Cosán', gender: 'm', type: 'place' },
	{ w: 'Páirc', gender: 'f', type: 'place' },
	{ w: 'Garraí', gender: 'm', type: 'place' },
	{ w: 'Gort', gender: 'm', type: 'place' },
	{ w: 'Móin', gender: 'f', type: 'place' },
	{ w: 'Carn', gender: 'm', type: 'place' },
	{ w: 'Druim', gender: 'm', type: 'place' },
	{ w: 'Leac', gender: 'f', type: 'place' },
	{ w: 'Aillín', gender: 'm', type: 'place' },
	{ w: 'Cuanán', gender: 'm', type: 'place' },
	{ w: 'Inbhear', gender: 'm', type: 'place' },
	{ w: 'Cé', gender: 'f', type: 'place' },
	{ w: 'Teach', gender: 'm', type: 'place' },
	{ w: 'Áras', gender: 'm', type: 'place' },
	{ w: 'Seanchaisleán', gender: 'm', type: 'place' }
];

/**
 * Adjectives (lemmas). For any adjective where feminine form isn’t just lenition,
 * you can add { lemma, fem: "..." }.
 */
export const ADJ: readonly AdjectiveEntry[] = [
	{ lemma: 'ciúin', role: 'core' },
	{ lemma: 'geal', role: 'core' },
	{ lemma: 'glan', role: 'core' },
	{ lemma: 'láidir', role: 'core' },
	{ lemma: 'tapa', role: 'core' },
	{ lemma: 'séimh', role: 'core' },
	{ lemma: 'beo', role: 'core' },
	{ lemma: 'fionnuar', role: 'core' },
	{ lemma: 'álainn', role: 'core' },
	{ lemma: 'mistéireach', role: 'core' },
	{ lemma: 'uaigneach', role: 'core' },
	{ lemma: 'glé', role: 'core' },
	{ lemma: 'lonnrach', role: 'core' },
	{ lemma: 'fiáin', role: 'core' },
	{ lemma: 'ceansa', role: 'core' },
	{ lemma: 'binbeach', role: 'core' },
	{ lemma: 'mór', role: 'core' },
	{ lemma: 'beag', role: 'core' },
	{ lemma: 'fada', role: 'core' },
	{ lemma: 'gearr', role: 'core' },
	{ lemma: 'nua', role: 'core' },
	{ lemma: 'sean', role: 'core' },
	{ lemma: 'bog', role: 'core' },
	{ lemma: 'crua', role: 'core' },
	{ lemma: 'te', role: 'core' },
	{ lemma: 'fuar', role: 'core' },
	{ lemma: 'tirim', role: 'core' },
	{ lemma: 'fliuch', role: 'core' },
	{ lemma: 'ard', role: 'core' },
	{ lemma: 'íseal', role: 'core' },
	{ lemma: 'garbh', role: 'core' },
	{ lemma: 'mín', role: 'core' },
	{ lemma: 'soiléir', role: 'core' },
	{ lemma: 'dorcha', role: 'core' },
	{ lemma: 'réidh', role: 'core' },
	{ lemma: 'dána', role: 'qualifier' },
	{ lemma: 'cróga', role: 'qualifier' },
	{ lemma: 'glic', role: 'qualifier' },
	{ lemma: 'cliste', role: 'qualifier' },
	{ lemma: 'ceolmhar', role: 'qualifier' },
	{ lemma: 'misniúil', role: 'qualifier' },
	{ lemma: 'spraíúil', role: 'qualifier' },
	{ lemma: 'seiftiúil', role: 'qualifier' },
	{ lemma: 'maorga', role: 'qualifier' },
	{ lemma: 'fial', role: 'qualifier' },
	{ lemma: 'síochánta', role: 'qualifier' },
	{ lemma: 'síochmhar', role: 'qualifier' },
	{ lemma: 'dílis', role: 'qualifier' },
	{ lemma: 'ionraic', role: 'qualifier' },
	{ lemma: 'uaillmhianach', role: 'qualifier' },
	{ lemma: 'solúbtha', role: 'qualifier' },
	{ lemma: 'críonna', role: 'qualifier' },
	{ lemma: 'fíor', role: 'qualifier' }, // better treated as “intensifier”; keep qualifier
	{ lemma: 'cumhachtach', role: 'qualifier' },
	{ lemma: 'draíochtúil', role: 'qualifier' },
	{ lemma: 'sóisialta', role: 'qualifier' },
	{ lemma: 'físiúil', role: 'qualifier' },
	{ lemma: 'dúthrachtach', role: 'qualifier' },
	{ lemma: 'flaithiúil', role: 'qualifier' },
	{ lemma: 'stuama', role: 'qualifier' },
	{ lemma: 'mórtasach', role: 'qualifier' },
	{ lemma: 'léannta', role: 'qualifier' },
	{ lemma: 'grinniúil', role: 'qualifier' },
	{ lemma: 'sármhaith', role: 'qualifier' },
	{ lemma: 'fairsing', role: 'qualifier' },
	{ lemma: 'uaibhreach', role: 'qualifier' },
	{ lemma: 'iontach', role: 'qualifier' },
	{ lemma: 'briomhar', role: 'qualifier' },
	{ lemma: 'cúramach', role: 'qualifier' },
	{ lemma: 'léir', role: 'qualifier' },
	{ lemma: 'sásta', role: 'qualifier' },
	{ lemma: 'líofa', role: 'qualifier' },
	{ lemma: 'cruthaitheach', role: 'qualifier' },
	{ lemma: 'sárchliste', role: 'qualifier' },
	{ lemma: 'sármhaorga', role: 'qualifier' },
	{ lemma: 'draíochta', role: 'qualifier' }, // nouny/poetic; treat as qualifier
	{ lemma: 'fíorthapa', role: 'qualifier' }, // intensifier compound; treat as qualifier
	{ lemma: 'níomhach', role: 'qualifier' }
];

for (const entry of NOUNS) Object.freeze(entry);
Object.freeze(NOUNS);
for (const entry of ADJ) Object.freeze(entry);
Object.freeze(ADJ);

const CORE_ADJ = ADJ.filter((a) => a.role === 'core');
const QUAL_ADJ = ADJ.filter((a) => a.role === 'qualifier');

// Keep this small + targeted. You can expand later.
const DENY = new Set<string>([
	// add any substrings you want to block in final output (lowercase)
]);

function adjRoot(lemma: string): string {
	// crude but effective: treat these as intensifier prefixes
	return lemma.toLocaleLowerCase('ga-IE').replace(/^fíor/, '').replace(/^sár/, '').trim();
}

function inflectAdj(noun: NounEntry, adj: AdjectiveEntry): string {
	return noun.gender === 'f' ? (adj.fem ?? seimhiu(adj.lemma)) : adj.lemma;
}

function pickAdjPair(
	h: Uint8Array,
	attempt: number
): { core: AdjectiveEntry; qual: AdjectiveEntry } {
	// Use different byte lanes so the two picks are independent.
	const coreIdx = (getByte(h, 1) + getByte(h, 18 + attempt)) % CORE_ADJ.length;
	const qualIdx0 = (getByte(h, 2) + getByte(h, 26 + attempt)) % QUAL_ADJ.length;

	const core = pickAt(CORE_ADJ, coreIdx);

	// Avoid same-ish root (e.g., tapa vs fíorthapa)
	let qualIdx = qualIdx0;
	let qual = pickAt(QUAL_ADJ, qualIdx);

	if (adjRoot(qual.lemma) === adjRoot(core.lemma)) {
		qualIdx = (qualIdx + 1) % QUAL_ADJ.length;
		qual = pickAt(QUAL_ADJ, qualIdx);
	}

	return { core, qual };
}

/**
 * Encodes bytes with the Crockford Base32 alphabet.
 * The alphabet intentionally omits I, L, O, and U to reduce ambiguity.
 *
 * @param buf Raw bytes to encode.
 * @returns Uppercase Base32 string without separators or padding.
 */
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

/**
 * Checks whether a word starts with an Irish vowel (including accented forms).
 *
 * @param word Input word or phrase.
 * @returns `true` when the first non-space character is a vowel.
 */
function startsWithVowel(word: string): boolean {
	const c = word.trim().toLocaleLowerCase('ga-IE').charAt(0);
	return c.length > 0 ? VOWELS.has(c) : false;
}

/**
 * Applies Irish lenition (séimhiú) to the first word in a phrase.
 * Inserts `h` after an initial lenitable consonant when grammar rules allow.
 * Also respects the common rule: `s + c/f/m/p/t` does not lenite.
 *
 * @param word Input word or multi-word phrase.
 * @returns Mutated text, or the original text when lenition does not apply.
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

/**
 * Builds a deterministic Base32 tag from the digest bytes.
 *
 * @param h SHA-256 HMAC digest bytes.
 * @param tagChars Number of output characters to emit.
 * @returns Fixed-length Crockford Base32 tag.
 */
function makeTag(h: Uint8Array, tagChars: number): string {
	const bytesNeeded = Math.max(2, Math.ceil((tagChars * 5) / 8));
	return base32Crockford(
		h.subarray(TAG_SOURCE_OFFSET_BYTES, TAG_SOURCE_OFFSET_BYTES + bytesNeeded)
	).slice(0, tagChars);
}

/**
 * Validates requested tag length.
 *
 * @param tagChars Requested number of tag characters.
 * @returns The same value when valid.
 * @throws {TypeError} When `tagChars` is not a finite integer.
 * @throws {RangeError} When `tagChars` is outside supported bounds.
 */
function validateTagChars(tagChars: number): number {
	if (!Number.isFinite(tagChars) || !Number.isInteger(tagChars)) {
		throw new TypeError('tagChars must be a whole number.');
	}
	if (tagChars < MIN_TAG_CHARS || tagChars > MAX_TAG_CHARS) {
		throw new RangeError(`tagChars must be between ${MIN_TAG_CHARS} and ${MAX_TAG_CHARS}.`);
	}
	return tagChars;
}

/**
 * Reads a byte safely from a digest-like byte array.
 *
 * @param bytes Source bytes.
 * @param index Zero-based byte index.
 * @returns Byte value at `index`, or `0` when missing.
 */
function getByte(bytes: Uint8Array, index: number): number {
	return bytes[index] ?? 0;
}

/**
 * Returns an element at a known index and fails fast if it is missing.
 *
 * @typeParam T Element type.
 * @param values Source list.
 * @param index Zero-based element index.
 * @returns Element value at `index`.
 * @throws {Error} When no value exists at `index`.
 */
function pickAt<T>(values: readonly T[], index: number): T {
	const value = values[index];
	if (value === undefined) {
		throw new Error(`Expected value at index ${index}`);
	}
	return value;
}

/**
 * Creates a deterministic Irish-style pseudonym for a stable user identifier.
 * Output format is `noun{separator}coreAdj{separator}qualAdj{separator}tag`
 * (lowercased with `ga-IE`).
 *
 * @param uid Stable user identifier (for example, a UUID string).
 * @param secret Server-side HMAC secret; never expose this to clients.
 * @param options Optional output controls.
 * @param options.tagChars Number of Base32 characters in the suffix tag.
 * Defaults to `12`; use higher values to further reduce collision risk at scale.
 * @param options.separator Delimiter between noun, adjective, and tag.
 * @returns Deterministic pseudonym string.
 * @throws {TypeError|RangeError} When `options.tagChars` is invalid.
 */
export function mythologise(
	uid: string,
	secret: BinaryLike,
	{ tagChars = 12, separator = '-' }: IrishHandleOptions = {}
): string {
	const safeTagChars = validateTagChars(tagChars);
	const h = createHmac('sha256', secret).update(uid).digest();

	// deterministic “reroll”: if denylist hit, shift indices using later bytes
	for (let attempt = 0; attempt < 8; attempt++) {
		const nIdx = (getByte(h, 0) + getByte(h, 10 + attempt)) % NOUNS.length;
		const noun = pickAt(NOUNS, nIdx);
		const { core, qual } = pickAdjPair(h, attempt);

		const adj1 = inflectAdj(noun, core);
		const adj2 = inflectAdj(noun, qual);

		const tag = makeTag(h, safeTagChars);

		const out =
			`${noun.w}${separator}${adj1}${separator}${adj2}${separator}${tag}`.toLocaleLowerCase(
				'ga-IE'
			);

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
	const { core, qual } = pickAdjPair(h, 0);

	const adj1 = inflectAdj(noun, core);
	const adj2 = inflectAdj(noun, qual);

	return `${noun.w}${separator}${adj1}${separator}${adj2}${separator}${makeTag(h, safeTagChars)}`.toLocaleLowerCase(
		'ga-IE'
	);
}
