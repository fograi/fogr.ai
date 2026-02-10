import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ADJ, NOUNS, mythologise } from './mythologise';
import { OPENMOJI_AVATAR_EMOJI } from './openmoji-avatar-map';
import { tagToAvatar, type TagToAvatarOptions } from './tag-to-avatar';

type MythologiseVector = {
	id: string;
	uid: string;
	secret: string;
	options?: {
		tagChars?: number;
		separator?: string;
	};
};

type AvatarVector = {
	id: string;
	tag: string;
	options?: TagToAvatarOptions | null;
};

const MYTHOLOGISE_VECTORS: readonly MythologiseVector[] = [
	{
		id: 'default-supabase-uid-1',
		uid: 'e9fdcc9a-e942-4620-b90b-e008a0eb1147',
		secret: 'fogr-unit-test-secret-v1'
	},
	{
		id: 'default-supabase-uid-2',
		uid: 'e4370108-786a-40c6-8f0e-b07fb4dd7946',
		secret: 'fogr-unit-test-secret-v1'
	},
	{
		id: 'default-supabase-uid-3',
		uid: '351c1f1d-a5e7-48b4-8e51-6706a5428a70',
		secret: 'fogr-unit-test-secret-v1'
	},
	{
		id: 'default-supabase-uid-4',
		uid: '53b4be17-e238-4e6a-adb3-595229ce134b',
		secret: 'fogr-unit-test-secret-v1'
	},
	{
		id: 'tagchars-2',
		uid: 'e9fdcc9a-e942-4620-b90b-e008a0eb1147',
		secret: 'fogr-unit-test-secret-v1',
		options: { tagChars: 2 }
	},
	{
		id: 'tagchars-48',
		uid: 'e9fdcc9a-e942-4620-b90b-e008a0eb1147',
		secret: 'fogr-unit-test-secret-v1',
		options: { tagChars: 48 }
	},
	{
		id: 'separator-double-colon',
		uid: 'e9fdcc9a-e942-4620-b90b-e008a0eb1147',
		secret: 'fogr-unit-test-secret-v1',
		options: { separator: '::' }
	},
	{
		id: 'binarylike-control-secret',
		uid: 'e4370108-786a-40c6-8f0e-b07fb4dd7946',
		secret: 'supabase-hmac-secret'
	}
] as const;

const AVATAR_VECTORS: readonly AvatarVector[] = [
	{
		id: 'default-options',
		tag: '6JN3V2CD6XQQ'
	},
	{
		id: 'normalized-tag-input',
		tag: '  6jn3v2cd6xqq  '
	},
	{
		id: 'explicit-auto-default-size',
		tag: '6JN3V2CD6XQQ',
		options: { format: 'auto', size: 64 }
	},
	{
		id: 'svg-custom-size-label',
		tag: '6JN3V2CD6XQQ',
		options: { format: 'svg', size: 72, label: 'Chat Avatar' }
	},
	{
		id: 'emoji-explicit',
		tag: '6JN3V2CD6XQQ',
		options: { format: 'emoji' }
	},
	{
		id: 'svg-invalid-size-fallback',
		tag: '6JN3V2CD6XQQ',
		options: { format: 'svg', size: Number.NaN }
	},
	{
		id: 'tag-variant-2-default',
		tag: 'QACN46ZB97S1'
	},
	{
		id: 'tag-variant-2-emoji',
		tag: 'QACN46ZB97S1',
		options: { format: 'emoji' }
	},
	{
		id: 'null-options',
		tag: 'QACN46ZB97S1',
		options: null
	}
] as const;

describe('Identity Lock Fixtures', () => {
	it('keeps identity source lists frozen at runtime', () => {
		expect(Object.isFrozen(NOUNS)).toBe(true);
		expect(Object.isFrozen(ADJ)).toBe(true);
		expect(Object.isFrozen(OPENMOJI_AVATAR_EMOJI)).toBe(true);
		expect(Object.isFrozen(NOUNS[0])).toBe(true);
		expect(Object.isFrozen(ADJ[0])).toBe(true);
	});

	it('locks mythologise word lists and order', () => {
		const nounRows = NOUNS.map((entry) => `${entry.w}|${entry.gender}|${entry.type}`);
		const adjectiveRows = ADJ.map((entry) => `${entry.lemma}|${entry.role}|${entry.fem ?? ''}`);

		expect({
			nouns: {
				count: nounRows.length,
				hash: hashRows(nounRows),
				firstThree: nounRows.slice(0, 3),
				lastThree: nounRows.slice(-3)
			},
			adjectives: {
				count: adjectiveRows.length,
				hash: hashRows(adjectiveRows),
				firstThree: adjectiveRows.slice(0, 3),
				lastThree: adjectiveRows.slice(-3)
			}
		}).toMatchInlineSnapshot(`
			{
			  "adjectives": {
			    "count": 78,
			    "firstThree": [
			      "ciúin|core|",
			      "geal|core|",
			      "glan|core|",
			    ],
			    "hash": "c7b2aac33b3ec5249f98b45c01102a2b028b5b616c29b08b2c732daf9f644195",
			    "lastThree": [
			      "draíochta|qualifier|",
			      "fíorthapa|qualifier|",
			      "níomhach|qualifier|",
			    ],
			  },
			  "nouns": {
			    "count": 169,
			    "firstThree": [
			      "Bríd|f|myth",
			      "Áine|f|myth",
			      "Ériu|f|myth",
			    ],
			    "hash": "33b33293d01c95e9dd6a4b772fbc13934ab3c72cd87b60a600ecadb497108885",
			    "lastThree": [
			      "Teach|m|place",
			      "Áras|m|place",
			      "Seanchaisleán|m|place",
			    ],
			  },
			}
		`);
	});

	it('locks mythologise deterministic outputs for canonical vectors', () => {
		const outputs = MYTHOLOGISE_VECTORS.map((vector) => {
			const output = vector.options
				? mythologise(vector.uid, vector.secret, vector.options)
				: mythologise(vector.uid, vector.secret);

			return {
				id: vector.id,
				output
			};
		});

		expect(outputs).toMatchInlineSnapshot(`
			[
			  {
			    "id": "default-supabase-uid-1",
			    "output": "iúir-réidh-uaibhreach-6jn3v2cd6xqq",
			  },
			  {
			    "id": "default-supabase-uid-2",
			    "output": "dobharchú-nua-ceolmhar-5n43ttpht4mc",
			  },
			  {
			    "id": "default-supabase-uid-3",
			    "output": "cat-fuar-síochmhar-8whhbxh369t1",
			  },
			  {
			    "id": "default-supabase-uid-4",
			    "output": "bóthar-ceansa-cróga-1p4tygbryjdc",
			  },
			  {
			    "id": "tagchars-2",
			    "output": "iúir-réidh-uaibhreach-6j",
			  },
			  {
			    "id": "tagchars-48",
			    "output": "iúir-réidh-uaibhreach-6jn3v2cd6xqq28s9e38sp19gceg2vt1c8p1gy53b9tabqsyp",
			  },
			  {
			    "id": "separator-double-colon",
			    "output": "iúir::réidh::uaibhreach::6jn3v2cd6xqq",
			  },
			  {
			    "id": "binarylike-control-secret",
			    "output": "seanchaisleán-uaigneach-grinniúil-qacn46zb97s1",
			  },
			]
		`);
	});

	it('locks emoji pool contents and order', () => {
		const emojiRows = OPENMOJI_AVATAR_EMOJI.map((emoji, index) => `${index}:${emoji}`);

		expect({
			count: emojiRows.length,
			hash: hashRows(emojiRows),
			firstFive: emojiRows.slice(0, 5),
			lastFive: emojiRows.slice(-5)
		}).toMatchInlineSnapshot(`
			{
			  "count": 154,
			  "firstFive": [
			    "0:🐵",
			    "1:🐒",
			    "2:🦍",
			    "3:🦧",
			    "4:🐶",
			  ],
			  "hash": "e7a1b72cc5b16d71b5449725ef3fa90549c4a4def777df3687608286f806add6",
			  "lastFive": [
			    "149:🍃",
			    "150:🪹",
			    "151:🪺",
			    "152:🍄",
			    "153:🪾",
			  ],
			}
		`);
	});

	it('locks tagToAvatar outputs and option defaults', () => {
		const outputs = AVATAR_VECTORS.map((vector) => {
			const avatar =
				vector.options === undefined
					? tagToAvatar(vector.tag)
					: tagToAvatar(vector.tag, vector.options);
			return {
				id: vector.id,
				format: avatar.format,
				emoji: avatar.emoji,
				valueHash: hashText(avatar.value),
				svgHash: hashText(avatar.svg),
				valueLength: avatar.value.length,
				svgLength: avatar.svg.length
			};
		});

		expect(outputs).toMatchInlineSnapshot(`
			[
			  {
			    "emoji": "🦋✨",
			    "format": "svg",
			    "id": "default-options",
			    "svgHash": "91fa1f48c98cad9519a97b3bbd58d61704fdeebeb8111926de7100e603c4239a",
			    "svgLength": 3213,
			    "valueHash": "91fa1f48c98cad9519a97b3bbd58d61704fdeebeb8111926de7100e603c4239a",
			    "valueLength": 3213,
			  },
			  {
			    "emoji": "🦋✨",
			    "format": "svg",
			    "id": "normalized-tag-input",
			    "svgHash": "91fa1f48c98cad9519a97b3bbd58d61704fdeebeb8111926de7100e603c4239a",
			    "svgLength": 3213,
			    "valueHash": "91fa1f48c98cad9519a97b3bbd58d61704fdeebeb8111926de7100e603c4239a",
			    "valueLength": 3213,
			  },
			  {
			    "emoji": "🦋✨",
			    "format": "svg",
			    "id": "explicit-auto-default-size",
			    "svgHash": "91fa1f48c98cad9519a97b3bbd58d61704fdeebeb8111926de7100e603c4239a",
			    "svgLength": 3213,
			    "valueHash": "91fa1f48c98cad9519a97b3bbd58d61704fdeebeb8111926de7100e603c4239a",
			    "valueLength": 3213,
			  },
			  {
			    "emoji": "🦋✨",
			    "format": "svg",
			    "id": "svg-custom-size-label",
			    "svgHash": "c4da66549e007eb4a54888e9c123d5394c2f71458a4542deedcee1dd47c0b909",
			    "svgLength": 3201,
			    "valueHash": "c4da66549e007eb4a54888e9c123d5394c2f71458a4542deedcee1dd47c0b909",
			    "valueLength": 3201,
			  },
			  {
			    "emoji": "🦋✨",
			    "format": "emoji",
			    "id": "emoji-explicit",
			    "svgHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
			    "svgLength": 0,
			    "valueHash": "68c115625c1744e1d6b0d8a42ed60bf600fbc8207d19e1f506a24d5aa824a572",
			    "valueLength": 3,
			  },
			  {
			    "emoji": "🦋✨",
			    "format": "emoji",
			    "id": "svg-invalid-size-fallback",
			    "svgHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
			    "svgLength": 0,
			    "valueHash": "68c115625c1744e1d6b0d8a42ed60bf600fbc8207d19e1f506a24d5aa824a572",
			    "valueLength": 3,
			  },
			  {
			    "emoji": "🐴🌊",
			    "format": "svg",
			    "id": "tag-variant-2-default",
			    "svgHash": "9155f6ce0e4d4a49b63e06a8e010b59f6f8fcc3d15b1caf80dadd24e4264c245",
			    "svgLength": 2707,
			    "valueHash": "9155f6ce0e4d4a49b63e06a8e010b59f6f8fcc3d15b1caf80dadd24e4264c245",
			    "valueLength": 2707,
			  },
			  {
			    "emoji": "🐴🌊",
			    "format": "emoji",
			    "id": "tag-variant-2-emoji",
			    "svgHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
			    "svgLength": 0,
			    "valueHash": "1b45cd19fc652a895af295cb4e3e4e3ff9c722d963dadc7d99d178acde49e8db",
			    "valueLength": 4,
			  },
			  {
			    "emoji": "🐴🌊",
			    "format": "svg",
			    "id": "null-options",
			    "svgHash": "9155f6ce0e4d4a49b63e06a8e010b59f6f8fcc3d15b1caf80dadd24e4264c245",
			    "svgLength": 2707,
			    "valueHash": "9155f6ce0e4d4a49b63e06a8e010b59f6f8fcc3d15b1caf80dadd24e4264c245",
			    "valueLength": 2707,
			  },
			]
		`);
	});
});

function hashRows(rows: readonly string[]): string {
	return hashText(rows.join('\n'));
}

function hashText(value: string): string {
	return createHash('sha256').update(value, 'utf8').digest('hex');
}
