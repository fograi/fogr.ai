import type { RequestHandler } from '@sveltejs/kit';

function json(status: number, body: unknown, headers: Record<string, string> = {}) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json', ...headers }
	});
}

export const GET: RequestHandler = async ({ params, locals, url }) => {
	const id = params.slug;

	// Cloudflare edge cache if available (safe no-op locally)
	const cfCache = globalThis.caches?.default;
	const cacheKey = cfCache
		? new Request(new URL(`/api/ads/${id}`, url.origin), { method: 'GET' })
		: undefined;

	// 1) Try cache
	if (cfCache && cacheKey) {
		const hit = await cfCache.match(cacheKey);
		if (hit) return hit;
	}

	// 2) DB lookup
	const { data, error } = await locals.supabase
		.from('ads')
		.select(
			'id, user_id, title, description, category, price, currency, image_urls, created_at, updated_at'
		)
		.eq('id', id)
		.maybeSingle();

	if (error) {
		return json(500, { error: 'DB error' }, { 'Cache-Control': 'public, max-age=30' });
	}
	if (!data) {
		return json(404, { error: 'Not found' }, { 'Cache-Control': 'public, max-age=60' });
	}

	const resp = json(
		200,
		{ ad: data },
		{
			'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
			ETag: `W/"ad-${data.id}-${data.updated_at ?? data.created_at}"`
		}
	);

	// 3) Populate cache
	if (cfCache && cacheKey) {
		await cfCache.put(cacheKey, resp.clone());
	}

	return resp;
};
