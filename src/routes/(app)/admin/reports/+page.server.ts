import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase.types';
import { isAdminUser } from '$lib/server/admin';

const STATUS_OPTIONS = new Set(['open', 'in_review', 'actioned', 'dismissed']);

type Env = {
	SUPABASE_URL?: string;
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
	const baseUrl = env?.SUPABASE_URL?.replace(/\/$/, '');
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
	}
};
