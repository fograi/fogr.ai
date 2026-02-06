import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { isSameOrigin } from '$lib/server/csrf';
import { isE2eMock } from '$lib/server/e2e-mocks';
import { validateAdStatusChange } from '$lib/server/ad-status';

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
	if (!nextStatus) return errorResponse('Invalid status.', 400);

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

	const validation = validateAdStatusChange({
		currentStatus: ad.status,
		nextStatus,
		expiresAt: ad.expires_at
	});
	if (!validation.ok) {
		const message =
			validation.reason === 'invalid-target'
				? 'Invalid status.'
				: validation.reason === 'immutable-current'
					? 'Status cannot be changed.'
					: validation.reason === 'reactivation-not-allowed'
						? 'Only sold or archived ads can be reactivated.'
						: 'Expired ads cannot be reactivated.';
		return errorResponse(message, 400);
	}

	const { error: updateError } = await locals.supabase
		.from('ads')
		.update({ status: nextStatus, updated_at: new Date().toISOString() })
		.eq('id', adId);

	if (updateError) return errorResponse('Could not update status.', 500);

	return json({ success: true });
};
