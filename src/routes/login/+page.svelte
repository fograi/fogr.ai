<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { createClient } from '@supabase/supabase-js';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

	const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

	let email = '';
	let msg = '';
	let err = '';
	let sending = false;

	// read ?redirectTo=/post (default '/')
	$: redirectTo = $page.url.searchParams.get('redirectTo') ?? '/';

	async function sendLink() {
		msg = err = '';
		if (!email) {
			err = 'Enter your email';
			return;
		}
		sending = true;

		// We land back on /login so this page can bridge the session then
		// push you on to the original destination.
		const emailRedirectTo = `${window.location.origin}/login?redirectTo=${encodeURIComponent(
			redirectTo
		)}`;

		const { error } = await supabase.auth.signInWithOtp({
			email,
			options: {
				emailRedirectTo
				// shouldCreateUser: true, // uncomment if you want “sign up” via magic link
			}
		});

		if (error) err = error.message;
		else msg = 'Check your email for the login link.';
		sending = false;
	}

	// Send tokens to the server so server-side guards (locals.supabase) see you
	async function bridgeSession(access_token: string, refresh_token: string) {
		try {
			await fetch('/auth/set-cookie', {
				method: 'POST',
				credentials: 'same-origin', // ensure Set-Cookie is applied
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ access_token, refresh_token })
			});
		} catch {
			// If this fails, client is still logged in; server guards will redirect if needed.
		}
	}

	let redirected = false;
	async function maybeRedirect() {
		if (!browser || redirected) return;

		// Use verified user, not plain session object
		const { data: userData } = await supabase.auth.getUser();
		const user = userData?.user;
		if (user) {
			// also bridge session cookies for SSR
			const { data: sessData } = await supabase.auth.getSession();
			const sess = sessData?.session;
			if (sess) await bridgeSession(sess.access_token, sess.refresh_token);

			redirected = true;
			await goto(redirectTo, { replaceState: true });
		}
	}

	onMount(() => {
		// 1) If we already have a session (coming back from the link), redirect.
		maybeRedirect();

		// 2) Otherwise wait for auth state to change, then redirect.
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange(async (event, sess) => {
			if (event === 'SIGNED_IN' && sess && !redirected) {
				await bridgeSession(sess.access_token, sess.refresh_token);
				redirected = true;
				await goto(redirectTo, { replaceState: true });
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

<h1>Sign in</h1>

<form on:submit|preventDefault={sendLink} aria-busy={sending}>
	<input type="email" bind:value={email} placeholder="you@example.com" required />
	<button type="submit" disabled={sending}>{sending ? 'Sending…' : 'Send magic link'}</button>
</form>

{#if msg}<p>{msg}</p>{/if}
{#if err}<p style="color:#b91c1c">{err}</p>{/if}
