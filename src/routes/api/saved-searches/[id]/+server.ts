import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { isSameOrigin } from '$lib/server/csrf';

export const PATCH: RequestHandler = async ({ params, request, locals, url }) => {
	if (!isSameOrigin(request, url)) return json({ error: 'Forbidden' }, { status: 403 });

	const {
		data: { user }
	} = await locals.supabase.auth.getUser();
	if (!user) return json({ error: 'Auth required' }, { status: 401 });

	const id = params.id?.trim() ?? '';
	if (!id) return json({ error: 'Missing id.' }, { status: 400 });

	let body: { name?: string; notify?: boolean } = {};
	try {
		body = (await request.json()) as typeof body;
	} catch {
		return json({ error: 'Invalid request.' }, { status: 400 });
	}

	const updates: Record<string, unknown> = {};
	if (typeof body.name === 'string') updates.name = body.name.trim() || null;
	if (typeof body.notify === 'boolean') updates.notify = body.notify;

	if (Object.keys(updates).length === 0) {
		return json({ error: 'Nothing to update.' }, { status: 400 });
	}

	const { error } = await locals.supabase
		.from('saved_searches')
		.update(updates)
		.eq('id', id)
		.eq('user_id', user.id);

	if (error) return json({ error: 'Could not update.' }, { status: 500 });

	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ params, request, locals, url }) => {
	if (!isSameOrigin(request, url)) return json({ error: 'Forbidden' }, { status: 403 });

	const {
		data: { user }
	} = await locals.supabase.auth.getUser();
	if (!user) return json({ error: 'Auth required' }, { status: 401 });

	const id = params.id?.trim() ?? '';
	if (!id) return json({ error: 'Missing id.' }, { status: 400 });

	const { error } = await locals.supabase
		.from('saved_searches')
		.delete()
		.eq('id', id)
		.eq('user_id', user.id);

	if (error) return json({ error: 'Could not delete.' }, { status: 500 });

	return json({ success: true });
};
