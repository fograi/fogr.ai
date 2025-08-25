// src/hooks.server.ts
import { createSupabaseServerClient } from '@supabase/auth-helpers-sveltekit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createSupabaseServerClient<"public">({
		supabaseUrl: PUBLIC_SUPABASE_URL,
		supabaseKey: PUBLIC_SUPABASE_ANON_KEY,
		event
	});

	// Authoritative identity helper (contacts Supabase)
	event.locals.getUser = async () => {
		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error) return null;
		return user ?? null;
	};

	// Optional: if you really need expiry UI, you can expose minimal metadata
	// (does not use session.user for auth decisions)
	event.locals.getSessionMeta = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		return session ? { expires_at: session.expires_at ?? null } : null;
	};

	return resolve(event, {
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
};
