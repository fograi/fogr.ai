import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase.types';
import { isAdminUser } from '$lib/server/admin';
import { recordModerationEvent } from '$lib/server/moderation-events';
import { buildAppealOutcomeEmail, buildModerationEmailPreviews } from '$lib/server/moderation-emails';

const STATUS_OPTIONS = new Set(['open', 'resolved', 'dismissed']);
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
		throw redirect(303, `/login?redirectTo=${encodeURIComponent(redirectTo ?? '/admin/appeals')}`);
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
		.from('ad_moderation_appeals')
		.select('id, ad_id, action_id, appellant_user_id, reason_details, status, created_at')
		.order('created_at', { ascending: false })
		.limit(200);

	if (listError) throw error(500, 'Failed to load appeals');

	return { appeals: data ?? [] };
};

export const actions: Actions = {
	updateStatus: async ({ request, locals, platform, url }) => {
		const env = platform?.env as Env | undefined;
		const adminUser = await requireAdmin(locals, env, url.pathname);

		const form = await request.formData();
		const appealId = (form.get('appeal_id') ?? '').toString().trim();
		const status = (form.get('status') ?? '').toString().trim();

		if (!appealId || !STATUS_OPTIONS.has(status)) {
			return fail(400, { message: 'Invalid input.' });
		}

		const admin = getAdminClient(env);
		const { data: appeal, error: appealFetchError } = await admin
			.from('ad_moderation_appeals')
			.select('id, ad_id, status, action_id')
			.eq('id', appealId)
			.maybeSingle();

		if (appealFetchError || !appeal) {
			return fail(404, { message: 'Appeal not found.' });
		}

		let reportId: string | null = null;
		if (appeal.action_id) {
			const { data: action } = await admin
				.from('ad_moderation_actions')
				.select('report_id')
				.eq('id', appeal.action_id)
				.maybeSingle();
			reportId = action?.report_id ?? null;
		}

		const { error: updateError } = await admin
			.from('ad_moderation_appeals')
			.update({ status })
			.eq('id', appealId);

		if (updateError) {
			return fail(500, { message: 'Failed to update appeal.' });
		}

		if (appeal.status !== status) {
			if (status === 'resolved') {
				await recordModerationEvent(admin, {
					contentId: appeal.ad_id,
					reportId,
					userId: adminUser.id,
					eventType: 'appeal_resolved',
					decision: 'resolved',
					automatedFlag: false
				});
			}
			if (status === 'dismissed') {
				await recordModerationEvent(admin, {
					contentId: appeal.ad_id,
					reportId,
					userId: adminUser.id,
					eventType: 'appeal_dismissed',
					decision: 'dismissed',
					automatedFlag: false
				});
			}
		}

		let emailPreview: {
			appealId: string;
			adId: string;
			outcome: 'resolved' | 'dismissed';
			template: { subject: string; body: string };
		} | null = null;

		if (appeal.status !== status && (status === 'resolved' || status === 'dismissed')) {
			emailPreview = {
				appealId,
				adId: appeal.ad_id,
				outcome: status,
				template: buildAppealOutcomeEmail({
					adId: appeal.ad_id,
					outcome: status,
					appealId,
					baseUrl: url.origin
				})
			};
		}

		return { success: true, emailPreview };
	},
	takeAction: async ({ request, locals, platform, url }) => {
		const env = platform?.env as Env | undefined;
		const adminUser = await requireAdmin(locals, env, url.pathname);

		const form = await request.formData();
		const appealId = (form.get('appeal_id') ?? '').toString().trim();
		const actionType = (form.get('action_type') ?? '').toString().trim();
		const reasonCategory = (form.get('reason_category') ?? '').toString().trim();
		const reasonDetails = (form.get('reason_details') ?? '').toString().trim();
		const legalBasis = (form.get('legal_basis') ?? '').toString().trim();
		const noPersonalData = (form.get('no_personal_data') ?? '').toString().trim();

		if (!appealId) return fail(400, { message: 'Missing appeal id.' });
		if (!ACTION_TYPES.has(actionType)) return fail(400, { message: 'Invalid action.' });
		if (!REASON_CATEGORIES.has(reasonCategory))
			return fail(400, { message: 'Invalid reason category.' });
		if (reasonDetails.length < MIN_REASON_LENGTH) {
			return fail(400, { message: `Reason must be at least ${MIN_REASON_LENGTH} characters.` });
		}
		if (!noPersonalData) {
			return fail(400, { message: 'You must confirm the statement contains no personal data.' });
		}

		const admin = getAdminClient(env);
		const { data: appeal, error: appealError } = await admin
			.from('ad_moderation_appeals')
			.select('id, ad_id, action_id')
			.eq('id', appealId)
			.maybeSingle();

		if (appealError || !appeal) {
			return fail(404, { message: 'Appeal not found.' });
		}

		let reportId: string | null = null;
		if (appeal.action_id) {
			const { data: action } = await admin
				.from('ad_moderation_actions')
				.select('report_id')
				.eq('id', appeal.action_id)
				.maybeSingle();
			reportId = action?.report_id ?? null;
		}

		const status = ACTION_TO_STATUS[actionType];
		const { error: adError } = await admin
			.from('ads')
			.update({ status })
			.eq('id', appeal.ad_id);

		if (adError) {
			return fail(500, { message: 'Failed to update ad.' });
		}

		const { error: actionError } = await admin.from('ad_moderation_actions').insert({
			ad_id: appeal.ad_id,
			report_id: reportId,
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

		await recordModerationEvent(admin, {
			contentId: appeal.ad_id,
			reportId,
			userId: adminUser.id,
			eventType: 'decision_made',
			decision: actionType,
			legalBasis: legalBasis || null,
			automatedFlag: false
		});
		await recordModerationEvent(admin, {
			contentId: appeal.ad_id,
			reportId,
			userId: adminUser.id,
			eventType: 'statement_sent',
			decision: actionType,
			legalBasis: legalBasis || null,
			automatedFlag: false
		});

		const emailPreview = buildModerationEmailPreviews({
			adId: appeal.ad_id,
			decision: actionType,
			reasonCategory,
			reasonDetails,
			legalBasis: legalBasis || null,
			reportId,
			baseUrl: url.origin
		});

		return {
			success: true,
			moderationEmailPreview: {
				appealId: appeal.id,
				adId: appeal.ad_id,
				actionType,
				statement: emailPreview.statement,
				takedown: emailPreview.takedown ?? null
			}
		};
	}
};
