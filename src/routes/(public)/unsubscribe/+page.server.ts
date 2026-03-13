import type { Actions, PageServerLoad } from './$types';
import { verifyUnsubscribeToken } from '$lib/server/email/unsubscribe';
import { suppressEmail, unsuppressEmail } from '$lib/server/email/preferences';
import type { EmailEnv } from '$lib/server/email/send';

type PlatformEnv = {
	RESEND_API_KEY?: string;
	PUBLIC_SUPABASE_URL?: string;
	SUPABASE_SERVICE_ROLE_KEY?: string;
	UNSUBSCRIBE_SECRET?: string;
};

const EMAIL_TYPE_LABELS: Record<string, string> = {
	messages: 'message notifications',
	search_alerts: 'saved search alerts',
	ad_approved: 'listing approval notifications'
};

function buildEnv(penv: PlatformEnv | undefined): EmailEnv {
	return {
		RESEND_API_KEY: penv?.RESEND_API_KEY ?? '',
		PUBLIC_SUPABASE_URL: penv?.PUBLIC_SUPABASE_URL ?? '',
		SUPABASE_SERVICE_ROLE_KEY: penv?.SUPABASE_SERVICE_ROLE_KEY ?? '',
		UNSUBSCRIBE_SECRET: penv?.UNSUBSCRIBE_SECRET ?? ''
	};
}

export const load: PageServerLoad = async ({ url, platform }) => {
	const token = url.searchParams.get('token') ?? '';
	const type = url.searchParams.get('type') ?? '';

	if (!token || !type) {
		return { error: 'Missing parameters', success: false, emailType: null };
	}

	const penv = platform?.env as PlatformEnv | undefined;
	const secret = penv?.UNSUBSCRIBE_SECRET ?? '';
	if (!secret) {
		return { error: 'Server configuration error', success: false, emailType: null };
	}

	const result = await verifyUnsubscribeToken(secret, token);
	if (!result) {
		return { error: 'Invalid or expired link', success: false, emailType: null };
	}

	const env = buildEnv(penv);
	await suppressEmail(env, result.userId, result.emailType);

	const label = EMAIL_TYPE_LABELS[result.emailType] ?? result.emailType;
	return { success: true, emailType: label, error: null };
};

export const actions: Actions = {
	resubscribe: async ({ request, platform }) => {
		const formData = await request.formData();
		const token = formData.get('token')?.toString() ?? '';
		const type = formData.get('type')?.toString() ?? '';

		if (!token || !type) {
			return { resubscribed: false, emailType: null, error: 'Missing parameters' };
		}

		const penv = platform?.env as PlatformEnv | undefined;
		const secret = penv?.UNSUBSCRIBE_SECRET ?? '';
		if (!secret) {
			return { resubscribed: false, emailType: null, error: 'Server configuration error' };
		}

		const result = await verifyUnsubscribeToken(secret, token);
		if (!result) {
			return { resubscribed: false, emailType: null, error: 'Invalid or expired link' };
		}

		const env = buildEnv(penv);
		await unsuppressEmail(env, result.userId, result.emailType);

		const label = EMAIL_TYPE_LABELS[result.emailType] ?? result.emailType;
		return { resubscribed: true, emailType: label, error: null };
	}
};
