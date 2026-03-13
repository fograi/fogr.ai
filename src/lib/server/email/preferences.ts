import type { EmailEnv } from './send';

function supabaseHeaders(env: EmailEnv): Record<string, string> {
	return {
		apikey: env.SUPABASE_SERVICE_ROLE_KEY,
		Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
		'Content-Type': 'application/json'
	};
}

/**
 * Check whether a user has suppressed a given email type.
 * Fail-open: if query errors, returns false (send the email if unsure).
 */
export async function isEmailSuppressed(
	env: EmailEnv,
	userId: string,
	emailType: string
): Promise<boolean> {
	try {
		const url = new URL('/rest/v1/email_preferences', env.PUBLIC_SUPABASE_URL);
		url.searchParams.set('user_id', `eq.${userId}`);
		url.searchParams.set('email_type', `eq.${emailType}`);
		url.searchParams.set('suppressed', 'eq.true');
		url.searchParams.set('select', 'id');
		url.searchParams.set('limit', '1');

		const res = await fetch(url, { headers: supabaseHeaders(env) });
		if (!res.ok) return false;
		const rows = (await res.json()) as Array<{ id: string }>;
		return rows.length > 0;
	} catch {
		return false;
	}
}

/**
 * Suppress a given email type for a user.
 * Upserts email_preferences row with suppressed=true.
 * Returns true on success, false on error.
 */
export async function suppressEmail(
	env: EmailEnv,
	userId: string,
	emailType: string
): Promise<boolean> {
	try {
		const url = new URL('/rest/v1/email_preferences', env.PUBLIC_SUPABASE_URL);
		const res = await fetch(url, {
			method: 'POST',
			headers: {
				...supabaseHeaders(env),
				Prefer: 'resolution=merge-duplicates'
			},
			body: JSON.stringify({
				user_id: userId,
				email_type: emailType,
				suppressed: true,
				updated_at: new Date().toISOString()
			})
		});
		return res.ok;
	} catch {
		return false;
	}
}

/**
 * Unsuppress a given email type for a user.
 * Updates existing row to suppressed=false, or does nothing if no row exists.
 * Returns true on success.
 */
export async function unsuppressEmail(
	env: EmailEnv,
	userId: string,
	emailType: string
): Promise<boolean> {
	try {
		const url = new URL('/rest/v1/email_preferences', env.PUBLIC_SUPABASE_URL);
		url.searchParams.set('user_id', `eq.${userId}`);
		url.searchParams.set('email_type', `eq.${emailType}`);
		const res = await fetch(url, {
			method: 'PATCH',
			headers: {
				...supabaseHeaders(env),
				Prefer: 'return=minimal'
			},
			body: JSON.stringify({
				suppressed: false,
				updated_at: new Date().toISOString()
			})
		});
		return res.ok;
	} catch {
		return false;
	}
}
