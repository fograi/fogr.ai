import { describe, expect, it } from 'vitest';
import { mythologise } from './mythologise';

const TEST_SECRET = 'fogr-unit-test-secret-v1';

const SUPABASE_UID_EXPECTATIONS = [
	{
		uid: 'e9fdcc9a-e942-4620-b90b-e008a0eb1147',
		expected: 'iúir-réidh-uaibhreach-6jn3v2cd6xqq'
	},
	{
		uid: 'e4370108-786a-40c6-8f0e-b07fb4dd7946',
		expected: 'dobharchú-nua-ceolmhar-5n43ttpht4mc'
	},
	{
		uid: '351c1f1d-a5e7-48b4-8e51-6706a5428a70',
		expected: 'cat-fuar-síochmhar-8whhbxh369t1'
	},
	{
		uid: '53b4be17-e238-4e6a-adb3-595229ce134b',
		expected: 'bóthar-ceansa-cróga-1p4tygbryjdc'
	}
] as const;

describe('mythologise', () => {
	it('returns the expected default handles for the provided Supabase UIDs', () => {
		for (const testCase of SUPABASE_UID_EXPECTATIONS) {
			expect(mythologise(testCase.uid, TEST_SECRET)).toBe(testCase.expected);
		}
	});

	it('returns expected handles for option permutations (tagChars + separator)', () => {
		const uid = 'e9fdcc9a-e942-4620-b90b-e008a0eb1147';
		const cases: Array<{
			options?: { tagChars?: number; separator?: string };
			expected: string;
		}> = [
			{ expected: 'iúir-réidh-uaibhreach-6jn3v2cd6xqq' },
			{ options: { tagChars: 2 }, expected: 'iúir-réidh-uaibhreach-6j' },
			{ options: { tagChars: 6 }, expected: 'iúir-réidh-uaibhreach-6jn3v2' },
			{ options: { tagChars: 8 }, expected: 'iúir-réidh-uaibhreach-6jn3v2cd' },
			{ options: { tagChars: 12 }, expected: 'iúir-réidh-uaibhreach-6jn3v2cd6xqq' },
			{
				options: { tagChars: 48 },
				expected: 'iúir-réidh-uaibhreach-6jn3v2cd6xqq28s9e38sp19gceg2vt1c8p1gy53b9tabqsyp'
			},
			{ options: { separator: '_' }, expected: 'iúir_réidh_uaibhreach_6jn3v2cd6xqq' },
			{ options: { separator: '::' }, expected: 'iúir::réidh::uaibhreach::6jn3v2cd6xqq' },
			{ options: { separator: '' }, expected: 'iúirréidhuaibhreach6jn3v2cd6xqq' },
			{ options: { tagChars: 8, separator: '_' }, expected: 'iúir_réidh_uaibhreach_6jn3v2cd' }
		];

		for (const testCase of cases) {
			if (testCase.options) {
				expect(mythologise(uid, TEST_SECRET, testCase.options)).toBe(testCase.expected);
			} else {
				expect(mythologise(uid, TEST_SECRET)).toBe(testCase.expected);
			}
		}
	});

	it('supports BinaryLike secrets while preserving expected output', () => {
		const uid = 'e4370108-786a-40c6-8f0e-b07fb4dd7946';
		const secret = 'supabase-hmac-secret';
		const expected = 'seanchaisleán-uaigneach-grinniúil-qacn46zb97s1';

		expect(mythologise(uid, secret)).toBe(expected);
		expect(mythologise(uid, Buffer.from(secret, 'utf8'))).toBe(expected);
		expect(mythologise(uid, Uint8Array.from(Buffer.from(secret, 'utf8')))).toBe(expected);
	});

	it('throws TypeError when tagChars is not a whole finite number', () => {
		const uid = '351c1f1d-a5e7-48b4-8e51-6706a5428a70';
		const badValues = [3.5, Number.NaN, Number.POSITIVE_INFINITY, '4'] as const;

		for (const badValue of badValues) {
			expect(() => mythologise(uid, TEST_SECRET, { tagChars: badValue as unknown as number })).toThrow(
				TypeError
			);
		}
	});

	it('throws RangeError when tagChars is out of supported bounds', () => {
		const uid = '53b4be17-e238-4e6a-adb3-595229ce134b';
		const badValues = [1, 0, -1, 49] as const;

		for (const badValue of badValues) {
			expect(() => mythologise(uid, TEST_SECRET, { tagChars: badValue })).toThrow(RangeError);
		}
	});
});
