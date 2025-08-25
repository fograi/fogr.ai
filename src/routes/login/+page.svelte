<script lang="ts">
	import { onMount } from 'svelte';
	import { goto, invalidate, invalidateAll } from '$app/navigation';
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

		// Land back on /login so this page can bridge session & redirect onward
		const emailRedirectTo = `${window.location.origin}/login?redirectTo=${encodeURIComponent(
			redirectTo
		)}`;

		const { error } = await supabase.auth.signInWithOtp({
			email,
			options: {
				emailRedirectTo
				// shouldCreateUser: true, // enable if you want signup via magic link
			}
		});

		if (error) err = error.message;
		else msg = 'Check your email for the login link.';
		sending = false;
	}

	// Send tokens to the server so SSR (locals.supabase) sees the session
	async function bridgeSession(access_token: string, refresh_token: string) {
		try {
			await fetch('/auth/set-cookie', {
				method: 'POST',
				credentials: 'same-origin',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ access_token, refresh_token })
			});
		} catch {
			// If this fails, client is still logged in; server guards may still pass on next nav.
		}
	}

	let redirected = false;

	async function finishLoginAndGo() {
		// Make layout re-run so navbar updates immediately
		await invalidate('supabase:auth');
		// If redirecting to the same route, also refresh all data to force UI update
		if (redirectTo === window.location.pathname) {
			await invalidateAll();
		}
		redirected = true;
		await goto(redirectTo, { replaceState: true });
	}

	async function maybeRedirect() {
		if (!browser || redirected) return;

		// Use getUser() (verifies with Supabase) instead of trusting local session
		const { data: userData } = await supabase.auth.getUser();
		const user = userData?.user;
		if (user) {
			const { data: sessData } = await supabase.auth.getSession();
			const sess = sessData?.session;
			if (sess) await bridgeSession(sess.access_token, sess.refresh_token);
			await finishLoginAndGo();
		}
	}

	onMount(() => {
		// 1) If we already have a session (coming back from email), redirect.
		maybeRedirect();

		// 2) Or wait for the auth state callback and then redirect.
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange(async (event, sess) => {
			if (event === 'SIGNED_IN' && sess && !redirected) {
				await bridgeSession(sess.access_token, sess.refresh_token);
				await finishLoginAndGo();
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

{#if msg}<p aria-live="polite">{msg}</p>{/if}
{#if err}<p style="color:#b91c1c" aria-live="assertive">{err}</p>{/if}
