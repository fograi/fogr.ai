import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { safeRedirectPath } from '$lib/server/redirect';
import { isDisposableEmail } from '$lib/disposable-email-domains';

type Body = {
	email?: string;
	redirectTo?: string | null;
};

export const POST: RequestHandler = async ({ request, locals, url }) => {
	let body: Body = {};
	try {
		body = (await request.json()) as Body;
	} catch {
		return json({ success: false, message: 'Invalid request.' }, { status: 400 });
	}

	const email = (body.email ?? '').trim().toLowerCase();
	if (!email) return json({ success: false, message: 'Email is required.' }, { status: 400 });
	if (isDisposableEmail(email)) {
		return json(
			{ success: false, message: 'Disposable email addresses aren’t allowed. Use a real inbox.' },
			{ status: 400 }
		);
	}

	const redirectTo = safeRedirectPath(body.redirectTo ?? '/', '/');
	const emailRedirectTo = `${url.origin}/login?redirectTo=${encodeURIComponent(redirectTo)}`;

	const { error } = await locals.supabase.auth.signInWithOtp({
		email,
		options: { emailRedirectTo }
	});

	if (error) {
		return json({ success: false, message: error.message }, { status: 400 });
	}

	return json({ success: true }, { status: 200 });
};
