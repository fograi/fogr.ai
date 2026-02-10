import { describe, expect, it } from 'vitest';
import { mythologise } from './mythologise';

const TEST_SECRET = 'fogr-unit-test-secret-v1';

const SUPABASE_UID_EXPECTATIONS = [
	{
		uid: 'e9fdcc9a-e942-4620-b90b-e008a0eb1147',
		expected: 'manannán-fionnuar-6jn3'
	},
	{
		uid: 'e4370108-786a-40c6-8f0e-b07fb4dd7946',
		expected: 'boann-sholúbtha-5n43'
	},
	{
		uid: '351c1f1d-a5e7-48b4-8e51-6706a5428a70',
		expected: 'ogma-ciúin-8whh'
	},
	{
		uid: '53b4be17-e238-4e6a-adb3-595229ce134b',
		expected: 'oscar-uaillmhianach-1p4t'
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
			{ expected: 'manannán-fionnuar-6jn3' },
			{ options: { tagChars: 2 }, expected: 'manannán-fionnuar-6j' },
			{ options: { tagChars: 8 }, expected: 'manannán-fionnuar-6jn3v2cd' },
			{ options: { tagChars: 12 }, expected: 'manannán-fionnuar-6jn3v2cd6xqq' },
			{
				options: { tagChars: 48 },
				expected: 'manannán-fionnuar-6jn3v2cd6xqq28s9e38sp19gceg2vt1c8p1gy53b9tabqsyp'
			},
			{ options: { separator: '_' }, expected: 'manannán_fionnuar_6jn3' },
			{ options: { separator: '::' }, expected: 'manannán::fionnuar::6jn3' },
			{ options: { separator: '' }, expected: 'manannánfionnuar6jn3' },
			{ options: { tagChars: 8, separator: '_' }, expected: 'manannán_fionnuar_6jn3v2cd' }
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
		const expected = 'gleann-séimh-qacn';

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
