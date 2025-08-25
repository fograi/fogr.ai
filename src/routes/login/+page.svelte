<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { createClient } from '@supabase/supabase-js';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

	const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

	let email = '';
	let msg = '';
	let err = '';

	// read ?redirectTo=/post (default to /)
	$: redirectTo = $page.url.searchParams.get('redirectTo') ?? '/';

	async function sendLink() {
		msg = err = '';

		const emailRedirectTo = `${window.location.origin}/login?redirectTo=${encodeURIComponent(
			redirectTo
		)}`;

		const { error } = await supabase.auth.signInWithOtp({
			email,
			options: { emailRedirectTo }
		});

		if (error) err = error.message;
		else msg = 'Check your email for the login link.';
	}

	async function bridgeSession(session: any) {
		try {
			await fetch('/auth/set-cookie', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					access_token: session.access_token,
					refresh_token: session.refresh_token
				})
			});
		} catch (_) {
			// ignore; client will still be logged in even if server cookie write failed
		}
	}

	onMount(() => {
		(async () => {
			// If we just returned from the magic link, the session may already be present.
			const {
				data: { session }
			} = await supabase.auth.getSession();
			if (session) {
				await bridgeSession(session);
				goto(redirectTo);
				return;
			}
		})();

		// Also handle the case where the session is established slightly later.
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange(async (event, sess) => {
			if (event === 'SIGNED_IN' && sess) {
				await bridgeSession(sess);
				goto(redirectTo);
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

<h1>Sign in</h1>

<form on:submit|preventDefault={sendLink}>
	<input type="email" bind:value={email} placeholder="you@example.com" required />
	<button type="submit">Send magic link</button>
</form>

{#if msg}<p>{msg}</p>{/if}
{#if err}<p style="color:#b91c1c">{err}</p>{/if}
