<script lang="ts">
	import { onMount } from 'svelte';
	import { goto, invalidate, invalidateAll } from '$app/navigation';
	import { createClient } from '@supabase/supabase-js';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

	export let data: { redirectTo: string }; // from +page.server.ts

	const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

	let email = '';
	let msg = '';
	let err = '';
	let sending = false;
	let redirected = false;

	async function sendLink() {
		msg = err = '';
		if (!email) {
			err = 'Enter your email';
			return;
		}
		sending = true;

		const emailRedirectTo = `${window.location.origin}/login?redirectTo=${encodeURIComponent(
			data.redirectTo
		)}`;

		const { error } = await supabase.auth.signInWithOtp({
			email,
			options: { emailRedirectTo }
		});

		if (error) err = error.message;
		else msg = 'Check your email for the login link.';
		sending = false;
	}

	async function bridgeSession(access_token: string, refresh_token: string) {
		try {
			await fetch('/auth/set-cookie', {
				method: 'POST',
				credentials: 'same-origin',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ access_token, refresh_token })
			});
		} catch {}
	}

	async function finishLoginAndGo() {
		await invalidate('supabase:auth');
		// Optional: if landing on same route, refresh all data
		if (data.redirectTo === window.location.pathname) await invalidateAll();
		redirected = true;
		await goto(data.redirectTo, { replaceState: true });
	}

	onMount(() => {
		// Rely on the auth state change; no client getUser() call
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
