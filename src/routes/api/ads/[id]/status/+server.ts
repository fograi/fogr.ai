import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { isSameOrigin } from '$lib/server/csrf';
import { isE2eMock } from '$lib/server/e2e-mocks';

const ALLOWED_TARGETS = new Set(['active', 'sold', 'archived']);
const MUTABLE_STATUSES = new Set(['active', 'sold', 'archived', 'expired']);

const errorResponse = (message: string, status = 400) =>
	json({ success: false, message }, { status });

export const POST: RequestHandler = async ({ params, request, locals, url, platform }) => {
	if (!isSameOrigin(request, url)) return errorResponse('Forbidden', 403);

	const adId = params.id?.trim() ?? '';
	if (!adId) return errorResponse('Missing ad id.', 400);

	let body: { status?: string } = {};
	try {
		body = (await request.json()) as typeof body;
	} catch {
		return errorResponse('Invalid request.', 400);
	}

	const nextStatus = body.status?.trim().toLowerCase() ?? '';
	if (!ALLOWED_TARGETS.has(nextStatus)) return errorResponse('Invalid status.', 400);

	if (isE2eMock(platform)) {
		return json({ success: true });
	}

	const {
		data: { user }
	} = await locals.supabase.auth.getUser();
	if (!user) return errorResponse('Auth required.', 401);

	const { data: ad, error: adError } = await locals.supabase
		.from('ads')
		.select('id, user_id, status, expires_at')
		.eq('id', adId)
		.maybeSingle();

	if (adError) return errorResponse('Could not load ad.', 500);
	if (!ad) return errorResponse('Ad not found.', 404);
	if (ad.user_id !== user.id) return errorResponse('Not allowed.', 403);

	if (!MUTABLE_STATUSES.has(ad.status)) {
		return errorResponse('Status cannot be changed.', 400);
	}

	if (nextStatus === 'active') {
		if (!['sold', 'archived'].includes(ad.status)) {
			return errorResponse('Only sold or archived ads can be reactivated.', 400);
		}
		if (ad.expires_at && ad.expires_at <= new Date().toISOString()) {
			return errorResponse('Expired ads cannot be reactivated.', 400);
		}
	}

	const { error: updateError } = await locals.supabase
		.from('ads')
		.update({ status: nextStatus, updated_at: new Date().toISOString() })
		.eq('id', adId);

	if (updateError) return errorResponse('Could not update status.', 500);

	return json({ success: true });
};
