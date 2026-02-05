import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { isSameOrigin } from '$lib/server/csrf';
import { isE2eMock } from '$lib/server/e2e-mocks';

const errorResponse = (message: string, status = 400) =>
	json({ success: false, message }, { status });

export const POST: RequestHandler = async ({ params, request, url, locals, platform }) => {
	if (!isSameOrigin(request, url)) return errorResponse('Forbidden', 403);

	const adId = params.id?.trim() ?? '';
	if (!adId) return errorResponse('Missing ad id.', 400);

	if (isE2eMock(platform)) {
		return json(
			{ success: true, email: 'e2e@example.com' },
			{ status: 200 }
		);
	}

	const {
		data: { user }
	} = await locals.supabase.auth.getUser();
	if (!user) return errorResponse('Auth required.', 401);

	const { data: ad, error: adError } = await locals.supabase
		.from('ads')
		.select('id, user_id, email, direct_contact_enabled')
		.eq('id', adId)
		.maybeSingle();

	if (adError) return errorResponse('Could not load listing.', 500);
	if (!ad) return errorResponse('Listing not found.', 404);
	if (!ad.direct_contact_enabled) return errorResponse('Direct contact is not enabled.', 403);

	if (ad.user_id !== user.id) {
		const { data: convo } = await locals.supabase
			.from('conversations')
			.select('id')
			.eq('ad_id', adId)
			.or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
			.maybeSingle();
		if (!convo) return errorResponse('Send a message first to unlock contact info.', 403);
	}

	return json({ success: true, email: ad.email ?? null }, { status: 200 });
};
