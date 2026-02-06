import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase.types';
import { isAdminUser } from '$lib/server/admin';
import { recordModerationEvent } from '$lib/server/moderation-events';

const STATUS_OPTIONS = new Set(['open', 'resolved', 'dismissed']);

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

		return { success: true };
	}
};
