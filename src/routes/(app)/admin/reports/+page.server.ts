import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase.types';
import { isAdminUser } from '$lib/server/admin';

const STATUS_OPTIONS = new Set(['open', 'in_review', 'actioned', 'dismissed']);
const ACTION_TYPES = new Set(['reject', 'expire', 'restore']);
const REASON_CATEGORIES = new Set(['illegal', 'prohibited', 'scam', 'spam', 'other']);
const MIN_REASON_LENGTH = 20;

const ACTION_TO_STATUS: Record<string, string> = {
	reject: 'rejected',
	expire: 'expired',
	restore: 'active'
};

type Env = {
	PUBLIC_SUPABASE_URL?: string;
	SUPABASE_SERVICE_ROLE_KEY?: string;
	ADMIN_EMAILS?: string;
	ADMIN_EMAIL?: string;
};

const requireAdmin = async (locals: App.Locals, env?: Env, redirectTo?: string) => {
	const user = await locals.getUser();
	if (!user) {
		throw redirect(303, `/login?redirectTo=${encodeURIComponent(redirectTo ?? '/admin/reports')}`);
	}
	if (!isAdminUser(user, env)) {
		throw error(403, 'Forbidden');
	}
	return user;
};

const getAdminClient = (env?: Env) => {
	const baseUrl = env?.PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
	const serviceKey = env?.SUPABASE_SERVICE_ROLE_KEY;
	if (!baseUrl || !serviceKey) {
		throw error(500, 'Server misconfigured');
	}
	return createClient<Database>(baseUrl, serviceKey, {
		auth: { persistSession: false, autoRefreshToken: false }
	});
};

export const load: PageServerLoad = async ({ locals, platform, url }) => {
	const env = platform?.env as Env | undefined;
	await requireAdmin(locals, env, url.pathname);

	const admin = getAdminClient(env);
	const { data, error: listError } = await admin
		.from('ad_reports')
		.select(
			'id, ad_id, reporter_name, reporter_email, reason_category, reason_details, status, created_at, location_url'
		)
		.order('created_at', { ascending: false })
		.limit(200);

	if (listError) throw error(500, 'Failed to load reports');

	return {
		reports: data ?? []
	};
};

export const actions: Actions = {
	updateStatus: async ({ request, locals, platform, url }) => {
		const env = platform?.env as Env | undefined;
		await requireAdmin(locals, env, url.pathname);

		const form = await request.formData();
		const reportId = (form.get('report_id') ?? '').toString().trim();
		const status = (form.get('status') ?? '').toString().trim();

		if (!reportId || !STATUS_OPTIONS.has(status)) {
			return fail(400, { message: 'Invalid input.' });
		}

		const admin = getAdminClient(env);
		const { error: updateError } = await admin
			.from('ad_reports')
			.update({ status })
			.eq('id', reportId);

		if (updateError) {
			return fail(500, { message: 'Failed to update report.' });
		}

		return { success: true };
	},
	takeAction: async ({ request, locals, platform, url }) => {
		const env = platform?.env as Env | undefined;
		const adminUser = await requireAdmin(locals, env, url.pathname);

		const form = await request.formData();
		const reportId = (form.get('report_id') ?? '').toString().trim();
		const adId = (form.get('ad_id') ?? '').toString().trim();
		const actionType = (form.get('action_type') ?? '').toString().trim();
		const reasonCategory = (form.get('reason_category') ?? '').toString().trim();
		const reasonDetails = (form.get('reason_details') ?? '').toString().trim();
		const legalBasis = (form.get('legal_basis') ?? '').toString().trim();
		const noPersonalData = (form.get('no_personal_data') ?? '').toString().trim();

		if (!adId || !ACTION_TYPES.has(actionType)) {
			return fail(400, { message: 'Invalid action.' });
		}
		if (!REASON_CATEGORIES.has(reasonCategory)) {
			return fail(400, { message: 'Invalid reason category.' });
		}
		if (reasonDetails.length < MIN_REASON_LENGTH) {
			return fail(400, { message: `Reason must be at least ${MIN_REASON_LENGTH} characters.` });
		}
		if (!noPersonalData) {
			return fail(400, { message: 'You must confirm the statement contains no personal data.' });
		}

		const admin = getAdminClient(env);
		const status = ACTION_TO_STATUS[actionType];

		const { error: adError } = await admin.from('ads').update({ status }).eq('id', adId);
		if (adError) {
			return fail(500, { message: 'Failed to update ad.' });
		}

		const { error: actionError } = await admin.from('ad_moderation_actions').insert({
			ad_id: adId,
			report_id: reportId || null,
			action_type: actionType,
			reason_category: reasonCategory,
			reason_details: reasonDetails,
			legal_basis: legalBasis || null,
			automated: false,
			actor_user_id: adminUser.id,
			actor_email: adminUser.email ?? null
		});

		if (actionError) {
			return fail(500, { message: 'Failed to record moderation action.' });
		}

		if (reportId) {
			const { error: reportError } = await admin
				.from('ad_reports')
				.update({ status: 'actioned' })
				.eq('id', reportId);
			if (reportError) {
				return fail(500, { message: 'Action saved, but report status update failed.' });
			}
		}

		return { success: true };
	}
};
