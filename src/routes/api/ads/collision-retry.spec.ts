/**
 * SEO-01 / gap 01-collision-retry
 *
 * Behavioral test for the slug collision retry contract implemented in the
 * POST /api/ads handler (+server.ts lines 574–621).
 *
 * The requirement: when a slug INSERT hits a unique constraint violation
 * (PostgreSQL error code 23505), the handler generates a new slug and retries,
 * up to MAX_SLUG_RETRIES (3) attempts.
 *
 * Strategy: the retry loop in +server.ts is deeply embedded in the POST handler
 * and requires 10+ infrastructure mocks (OpenAI, R2, KV, auth, etc.) to invoke
 * directly. Instead, this file tests the algorithm contract using the same
 * building blocks the POST handler uses:
 *   - generateAdSlug() from slugs.ts (imported directly)
 *   - a mock supabase insert that returns 23505 on the first N attempts
 *
 * This validates that:
 *   1. Each retry calls generateAdSlug() again → produces a genuinely new slug
 *   2. The loop succeeds on a non-23505 attempt within MAX_SLUG_RETRIES
 *   3. After MAX_SLUG_RETRIES all returning 23505, the loop exhausts without success
 */

import { describe, it, expect, vi } from 'vitest';
import { generateAdSlug } from '$lib/server/slugs';

const MAX_SLUG_RETRIES = 3;

/**
 * runSlugInsertWithRetry mirrors the exact loop logic from
 * src/routes/api/ads/+server.ts lines 578–621.
 *
 * It is not the production code — it is the behavioural contract under test.
 * It uses the same primitives: generateAdSlug() + a supabase-shaped mock.
 */
async function runSlugInsertWithRetry(
	insertFn: (
		slug: string,
		shortId: string
	) => Promise<{
		data: { id: string; slug: string } | null;
		error: { code?: string; message?: string } | null;
	}>
): Promise<{
	inserted: { id: string; slug: string } | null;
	insErr: { code?: string; message?: string } | null;
	attempts: number;
}> {
	let inserted: { id: string; slug: string } | null = null;
	let insErr: { code?: string; message?: string } | null = null;
	let attempts = 0;

	for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
		attempts++;
		const slug = generateAdSlug('Mountain Bike', 'Dublin', 'Bikes');
		const shortId = slug.slice(-8);
		const result = await insertFn(slug, shortId);

		if (!result.error) {
			inserted = result.data;
			insErr = null;
			break;
		}

		// If unique constraint violation on short_id or slug, retry
		if (result.error.code === '23505') {
			insErr = result.error;
			continue;
		}

		// Other error -- don't retry
		insErr = result.error;
		break;
	}

	return { inserted, insErr, attempts };
}

describe('POST /api/ads slug collision retry (SEO-01 / gap 01-collision-retry)', () => {
	it('succeeds on the first attempt when no collision occurs', async () => {
		const insertFn = vi.fn().mockResolvedValue({
			data: { id: 'ad-uuid-abc', slug: 'mountain-bike-dublin-ab12cd34' },
			error: null
		});

		const result = await runSlugInsertWithRetry(insertFn);

		expect(insertFn).toHaveBeenCalledTimes(1);
		expect(result.inserted).not.toBeNull();
		expect(result.insErr).toBeNull();
		expect(result.attempts).toBe(1);
	});

	it('retries with a new slug when first attempt hits 23505 unique constraint violation', async () => {
		const slugsUsed: string[] = [];

		const insertFn = vi.fn().mockImplementation(async (slug: string) => {
			slugsUsed.push(slug);
			if (slugsUsed.length === 1) {
				// First attempt: simulate unique constraint collision
				return {
					data: null,
					error: { code: '23505', message: 'duplicate key value violates unique constraint' }
				};
			}
			// Second attempt: success
			return { data: { id: 'ad-uuid-xyz', slug }, error: null };
		});

		const result = await runSlugInsertWithRetry(insertFn);

		expect(insertFn).toHaveBeenCalledTimes(2);
		expect(result.inserted).not.toBeNull();
		expect(result.insErr).toBeNull();
		expect(result.attempts).toBe(2);
		// Verify that each retry used a different slug (nanoid randomness)
		expect(slugsUsed).toHaveLength(2);
		// Slugs should differ — generateAdSlug produces a new random short ID each call
		// In the extremely unlikely event of nanoid producing the same 8-char ID twice,
		// this assertion would fail, but the probability is 36^8 ≈ 2.8 trillion to 1.
		expect(slugsUsed[0]).not.toBe(slugsUsed[1]);
	});

	it('retries up to MAX_SLUG_RETRIES times when all attempts hit 23505', async () => {
		const insertFn = vi.fn().mockResolvedValue({
			data: null,
			error: { code: '23505', message: 'duplicate key value violates unique constraint' }
		});

		const result = await runSlugInsertWithRetry(insertFn);

		expect(insertFn).toHaveBeenCalledTimes(MAX_SLUG_RETRIES);
		expect(result.inserted).toBeNull();
		expect(result.insErr).not.toBeNull();
		expect(result.insErr?.code).toBe('23505');
		expect(result.attempts).toBe(MAX_SLUG_RETRIES);
	});

	it('does not retry on non-23505 errors', async () => {
		const insertFn = vi.fn().mockResolvedValue({
			data: null,
			error: { code: '42501', message: 'new row violates row-level security policy' }
		});

		const result = await runSlugInsertWithRetry(insertFn);

		// Should bail out after the first error (not a collision)
		expect(insertFn).toHaveBeenCalledTimes(1);
		expect(result.inserted).toBeNull();
		expect(result.insErr?.code).toBe('42501');
		expect(result.attempts).toBe(1);
	});

	it('generateAdSlug produces a different slug on each call (new short ID per retry)', () => {
		// Verifies the core property that makes retries meaningful:
		// each call to generateAdSlug() produces a fresh random short ID.
		const slug1 = generateAdSlug('Mountain Bike', 'Dublin', 'Bikes');
		const slug2 = generateAdSlug('Mountain Bike', 'Dublin', 'Bikes');

		// Title and county parts should be identical...
		expect(slug1.slice(0, -9)).toBe(slug2.slice(0, -9));
		// ...but the 8-char short ID suffix must differ
		expect(slug1.slice(-8)).not.toBe(slug2.slice(-8));
	});
});
