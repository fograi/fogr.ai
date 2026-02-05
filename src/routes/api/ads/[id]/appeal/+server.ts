import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { isSameOrigin } from '$lib/server/csrf';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase.types';

type Body = {
	details?: string;
};

const MIN_DETAILS_LENGTH = 20;

const errorResponse = (message: string, status = 400) =>
	json({ success: false, message }, { status });

export const POST: RequestHandler = async ({ params, request, url, locals, platform }) => {
	if (!isSameOrigin(request, url)) {
		return errorResponse('Forbidden', 403);
	}

	const {
		data: { user },
		error: authError
	} = await locals.supabase.auth.getUser();
	if (authError || !user) return errorResponse('Sign-in required.', 401);

	let body: Body = {};
	try {
		body = (await request.json()) as Body;
	} catch {
		return errorResponse('Invalid request.', 400);
	}

	const adId = (params.id ?? '').trim();
	const details = (body.details ?? '').trim();
	if (!adId) return errorResponse('Missing ad ID.', 400);
	if (details.length < MIN_DETAILS_LENGTH) {
		return errorResponse(`Add at least ${MIN_DETAILS_LENGTH} characters.`, 400);
	}

	const env = platform?.env as {
		PUBLIC_SUPABASE_URL?: string;
		SUPABASE_SERVICE_ROLE_KEY?: string;
	};
	const baseUrl = env?.PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
	const serviceKey = env?.SUPABASE_SERVICE_ROLE_KEY;
	if (!baseUrl || !serviceKey) {
		return errorResponse('Server misconfigured.', 500);
	}

	const admin = createClient<Database>(baseUrl, serviceKey, {
		auth: { persistSession: false, autoRefreshToken: false }
	});

	const { data: ad, error: adError } = await admin
		.from('ads')
		.select('id, user_id')
		.eq('id', adId)
		.maybeSingle();

	if (adError) {
		console.warn('Appeal ad lookup failed', adError);
		return errorResponse('We could not submit your appeal. Try again.', 500);
	}
	if (!ad) return errorResponse('Ad not found.', 404);
	if (ad.user_id !== user.id) return errorResponse('Forbidden', 403);

	const { data: action } = await admin
		.from('ad_moderation_actions')
		.select('id')
		.eq('ad_id', adId)
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	if (!action?.id) {
		return errorResponse('No moderation decision to appeal yet.', 400);
	}

	const { data: appeal, error: appealError } = await admin
		.from('ad_moderation_appeals')
		.insert({
			ad_id: adId,
			action_id: action.id,
			appellant_user_id: user.id,
			reason_details: details
		})
		.select('id')
		.single();

	if (appealError || !appeal) {
		console.warn('Appeal insert failed', appealError);
		return errorResponse('We could not submit your appeal. Try again.', 500);
	}

	return json({ success: true, appealId: appeal.id }, { status: 200 });
};
