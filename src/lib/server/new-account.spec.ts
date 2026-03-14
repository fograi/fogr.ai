import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { isNewAccount } from './new-account';

// Helper to build a minimal Supabase admin mock
function makeSupabaseMock({
	createdAt,
	userError = null,
	activeAdCount,
	countError = null
}: {
	createdAt?: string;
	userError?: { message: string } | null;
	activeAdCount?: number;
	countError?: { message: string } | null;
}) {
	// Build a chainable mock: .select().eq('user_id').eq('status') → { count, error }
	const finalEq = vi.fn().mockResolvedValue({ count: activeAdCount ?? 0, error: countError });
	const firstEq = vi.fn().mockReturnValue({ eq: finalEq });
	const select = vi.fn().mockReturnValue({ eq: firstEq });
	const from = vi.fn().mockReturnValue({ select });

	const getUserById = vi.fn().mockResolvedValue({
		data: userError ? null : { user: { created_at: createdAt ?? new Date().toISOString() } },
		error: userError
	});

	return {
		auth: { admin: { getUserById } },
		from
	} as unknown as Parameters<typeof isNewAccount>[0];
}

describe('isNewAccount', () => {
	const userId = 'user-test-001';

	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('flags an account created 1 day ago as new (age < 7 days)', async () => {
		vi.setSystemTime(new Date('2026-01-08T12:00:00Z'));
		const supabase = makeSupabaseMock({
			createdAt: '2026-01-07T12:00:00Z', // 1 day ago
			activeAdCount: 5 // enough ads, but age fails
		});

		const result = await isNewAccount(supabase, userId);
		expect(result).toBe(true);
	});

	it('does not flag an account 8 days old with 3+ approved ads', async () => {
		vi.setSystemTime(new Date('2026-01-10T12:00:00Z'));
		const supabase = makeSupabaseMock({
			createdAt: '2026-01-02T12:00:00Z', // 8 days ago
			activeAdCount: 3 // exactly 3, not < 3
		});

		const result = await isNewAccount(supabase, userId);
		expect(result).toBe(false);
	});

	it('flags an established-age account with fewer than 3 approved ads', async () => {
		vi.setSystemTime(new Date('2026-02-01T12:00:00Z'));
		const supabase = makeSupabaseMock({
			createdAt: '2026-01-01T12:00:00Z', // 31 days ago — old account
			activeAdCount: 2 // only 2 approved ads
		});

		const result = await isNewAccount(supabase, userId);
		expect(result).toBe(true);
	});

	it('flags a new account with 0 approved ads', async () => {
		vi.setSystemTime(new Date('2026-01-02T12:00:00Z'));
		const supabase = makeSupabaseMock({
			createdAt: '2026-01-01T00:00:00Z', // 1 day ago
			activeAdCount: 0
		});

		const result = await isNewAccount(supabase, userId);
		expect(result).toBe(true);
	});

	it('does not flag account with exactly 3 approved ads that is 7+ days old', async () => {
		vi.setSystemTime(new Date('2026-01-15T00:00:00Z'));
		const supabase = makeSupabaseMock({
			createdAt: '2026-01-01T00:00:00Z', // 14 days ago
			activeAdCount: 3 // boundary: 3 is NOT < 3
		});

		const result = await isNewAccount(supabase, userId);
		expect(result).toBe(false);
	});

	it('fails open (returns false) when getUserById returns an error', async () => {
		vi.setSystemTime(new Date('2026-01-08T00:00:00Z'));
		const supabase = makeSupabaseMock({
			userError: { message: 'Supabase unavailable' },
			activeAdCount: 0
		});

		const result = await isNewAccount(supabase, userId);
		expect(result).toBe(false);
	});

	it('fails open (returns false) when the ad count query returns an error', async () => {
		vi.setSystemTime(new Date('2026-01-15T00:00:00Z'));
		const supabase = makeSupabaseMock({
			createdAt: '2026-01-01T00:00:00Z', // 14 days old — passes age check
			activeAdCount: 0,
			countError: { message: 'DB connection error' }
		});

		const result = await isNewAccount(supabase, userId);
		expect(result).toBe(false);
	});
});
