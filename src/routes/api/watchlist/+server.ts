import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { isSameOrigin } from '$lib/server/csrf';

const errorResponse = (message: string, status = 400) =>
	json({ success: false, message }, { status });

/** Save an ad to the user's watchlist (idempotent). */
export const POST: RequestHandler = async ({ request, locals, url }) => {
	if (!isSameOrigin(request, url)) return errorResponse('Forbidden', 403);

	const {
		data: { user }
	} = await locals.supabase.auth.getUser();
	if (!user) return errorResponse('Auth required.', 401);

	let body: { ad_id?: string } = {};
	try {
		body = (await request.json()) as typeof body;
	} catch {
		return errorResponse('Invalid request.', 400);
	}

	const adId = body.ad_id?.trim() ?? '';
	if (!adId) return errorResponse('Missing ad_id.', 400);

	const { error: insertError } = await locals.supabase
		.from('watchlist')
		.insert({ user_id: user.id, ad_id: adId });

	// 23505 = unique constraint violation — already saved, treat as success
	if (insertError && insertError.code !== '23505') {
		return errorResponse('Could not save ad.', 500);
	}

	return json({ success: true });
};

/** Remove an ad from the user's watchlist (idempotent). */
export const DELETE: RequestHandler = async ({ request, locals, url }) => {
	if (!isSameOrigin(request, url)) return errorResponse('Forbidden', 403);

	const {
		data: { user }
	} = await locals.supabase.auth.getUser();
	if (!user) return errorResponse('Auth required.', 401);

	let body: { ad_id?: string } = {};
	try {
		body = (await request.json()) as typeof body;
	} catch {
		return errorResponse('Invalid request.', 400);
	}

	const adId = body.ad_id?.trim() ?? '';
	if (!adId) return errorResponse('Missing ad_id.', 400);

	const { error: deleteError } = await locals.supabase
		.from('watchlist')
		.delete()
		.eq('user_id', user.id)
		.eq('ad_id', adId);

	if (deleteError) {
		return errorResponse('Could not remove ad.', 500);
	}

	return json({ success: true });
};

/** Check whether the logged-in user has saved a specific ad. */
export const GET: RequestHandler = async ({ locals, url }) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	// Not logged in — just return false (no error)
	if (!user) return json({ saved: false });

	const adId = url.searchParams.get('ad_id')?.trim() ?? '';
	if (!adId) return json({ saved: false });

	const { data } = await locals.supabase
		.from('watchlist')
		.select('id')
		.eq('user_id', user.id)
		.eq('ad_id', adId)
		.maybeSingle();

	return json({ saved: !!data });
};
