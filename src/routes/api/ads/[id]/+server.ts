// src/routes/api/ads/[id]/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

const PUBLIC_AD_STATUS = 'approved';

export const GET: RequestHandler = async ({ params, locals, url }) => {
	const id = params.id ?? '';

	const {
		data: { user },
		error: authError
	} = await locals.supabase.auth.getUser();
	const authedUser = authError ? null : user;

	// Cloudflare edge cache if available (safe no-op locally)
	const cfCache = globalThis.caches?.default;
	const cacheKey = cfCache
		? new Request(new URL(`/api/ads/${id}`, url.origin), { method: 'GET' })
		: undefined;

	// 1) Try cache
	if (!authedUser && cfCache && cacheKey) {
		const hit = await cfCache.match(cacheKey);
		if (hit) return hit;
	}

	// 2) DB lookup
	const query = locals.supabase
		.from('ads')
		.select(
			'id, user_id, title, description, category, price, currency, image_keys, status, created_at, updated_at'
		)
		.eq('id', id);
	if (!authedUser) {
		query.eq('status', PUBLIC_AD_STATUS);
	}
	const { data, error } = await query.maybeSingle();

	if (error) {
		return json(
			{ error: 'DB error' },
			{
				status: 500,
				headers: {
					'Cache-Control': authedUser ? 'private, no-store' : 'public, max-age=30'
				}
			}
		);
	}
	if (!data) {
		return json(
			{ error: 'Not found' },
			{
				status: 404,
				headers: {
					'Cache-Control': authedUser ? 'private, no-store' : 'public, max-age=60'
				}
			}
		);
	}
	if (data.status !== PUBLIC_AD_STATUS && data.user_id !== authedUser?.id) {
		return json(
			{ error: 'Not found' },
			{
				status: 404,
				headers: { 'Cache-Control': 'private, no-store' }
			}
		);
	}

	const resp = json(
		{ ad: data },
		{
			status: 200,
			headers: {
				'Cache-Control': authedUser
					? 'private, no-store'
					: 'public, s-maxage=86400, stale-while-revalidate=604800',
				ETag: `W/"ad-${data.id}-${data.updated_at ?? data.created_at}"`
			}
		}
	);

	// 3) Populate cache
	if (!authedUser && data.status === PUBLIC_AD_STATUS && cfCache && cacheKey) {
		await cfCache.put(cacheKey, resp.clone());
	}

	return resp;
};
