import type { SupabaseClient } from '@supabase/supabase-js';

const NEW_ACCOUNT_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MIN_APPROVED_ADS = 3;

/**
 * Check if a user account is considered "new" (< 3 approved ads or < 7 days old).
 * Fail-open: returns false on error so users are not penalised by check failures.
 */
export async function isNewAccount(supabase: SupabaseClient, userId: string): Promise<boolean> {
	try {
		// Check 1: Account age < 7 days
		const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
		if (userError) {
			console.warn('new_account_check_failed', { userId, error: userError.message });
			return false;
		}
		const createdAt = userData?.user?.created_at;
		if (createdAt && Date.now() - new Date(createdAt).getTime() < NEW_ACCOUNT_AGE_MS) {
			return true;
		}

		// Check 2: Fewer than 3 approved (active) ads
		const { count, error: countError } = await supabase
			.from('ads')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', userId)
			.eq('status', 'active');

		if (countError) {
			console.warn('new_account_check_failed', { userId, error: countError.message });
			return false;
		}

		if ((count ?? 0) < MIN_APPROVED_ADS) {
			return true;
		}

		return false;
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		console.warn('new_account_check_failed', { userId, error: message });
		return false;
	}
}
