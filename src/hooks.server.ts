import type { Handle } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Database } from '$lib/supabase.types';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient<Database>(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: {
				getAll: () => event.cookies.getAll(), // [{ name, value }]
				setAll: (cookies) => {
					for (const { name, value, options } of cookies) {
						const withPath = { ...options, path: options?.path ?? '/' };
						if (value === '') {
							event.cookies.delete(name, withPath);
						} else {
							event.cookies.set(name, value, withPath);
						}
					}
				}
			}
		}
	);

	// (optional helpers—don’t let them throw)
	event.locals.getUser = async () => {
		const { data, error } = await event.locals.supabase.auth.getUser();
		return error ? null : (data.user ?? null);
	};

	// Optional: session expiry meta helper
	event.locals.getSessionMeta = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		return session ? { expires_at: session.expires_at ?? null } : null;
	};

	return resolve(event);
};
