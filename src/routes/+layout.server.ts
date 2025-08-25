// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, depends }) => {
	depends('supabase:auth'); // <-- tells SvelteKit this data can be invalidated
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();
	return { user: user ? { id: user.id, email: user.email } : null };
};
