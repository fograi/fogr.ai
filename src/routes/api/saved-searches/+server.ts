import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { isSameOrigin } from '$lib/server/csrf';
import { generateSearchName } from '$lib/utils/search-name';
import { getCountyOptionById } from '$lib/location-hierarchy';

export const POST: RequestHandler = async ({ request, locals, url }) => {
	if (!isSameOrigin(request, url)) return json({ error: 'Forbidden' }, { status: 403 });

	const {
		data: { user }
	} = await locals.supabase.auth.getUser();
	if (!user) return json({ error: 'Auth required' }, { status: 401 });

	let body: {
		category?: string;
		county?: string;
		locality?: string;
		query?: string;
		name?: string;
	} = {};
	try {
		body = (await request.json()) as typeof body;
	} catch {
		return json({ error: 'Invalid request.' }, { status: 400 });
	}

	const category = body.category?.trim() || null;
	const county = body.county?.trim() || null;
	const locality = body.locality?.trim() || null;
	const query = body.query?.trim() || null;

	let name = body.name?.trim() || null;
	if (!name) {
		const countyOption = county ? getCountyOptionById(county) : null;
		name = generateSearchName({
			category,
			countyName: countyOption?.name ?? null,
			query
		});
	}

	const { data, error } = await locals.supabase
		.from('saved_searches')
		.insert({
			user_id: user.id,
			category,
			county,
			locality,
			query,
			name,
			notify: true
		})
		.select('id')
		.single();

	if (error) return json({ error: 'Could not save search.' }, { status: 500 });

	return json({ success: true, id: data.id });
};
