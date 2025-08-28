<script lang="ts">
	import { onMount } from 'svelte';
	import { goto, invalidate, invalidateAll } from '$app/navigation';
	import { createClient } from '@supabase/supabase-js';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

	export let data: { redirectTo: string }; // from +page.server.ts

	const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

	let email = '';
	let success = false;
	let err = '';
	let sending = false;
	let redirected = false;

	async function sendLink() {
		success = false;
		err = '';
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
		else success = true;
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

<!-- replace markup below your </script> -->
<section class="auth-wrap">
	<div class="card">
		<header class="header">
			{#if success}
				<h1>Check your email</h1>
				<h2>✅</h2>
			{:else}
				<h1>Login</h1>
				<p class="sub">We'll email you a link to login.</p>
			{/if}
		</header>

		{#if success}
			<p class="success" aria-live="polite">We've emailed you a link to login.</p>
		{:else}
			<form on:submit|preventDefault={sendLink} aria-busy={sending} class="form">
				<label for="email" class="sr-only">Email</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					placeholder="you@example.com"
					required
					autocomplete="email"
					inputmode="email"
					aria-invalid={!!err}
				/>
				{#if err}<p class="err" aria-live="assertive">{err}</p>{/if}
				<button type="submit" disabled={sending || !email}>
					{sending ? 'Sending…' : 'Send link'}
				</button>
			</form>
		{/if}

		<footer class="foot">
			<small>
				By continuing you agree to our <a href="/terms">Terms</a> and
				<a href="/privacy">Privacy</a>.
			</small>
		</footer>
	</div>
</section>

<style>
	:root {
		--bg: hsl(0 0% 98%);
		--card: #fff;
		--text: hsl(222 47% 11%);
		--muted: hsl(215 16% 47%);
		--border: hsl(214 32% 91%);
		--brand: hsl(0, 0%, 0%);
		--brand-pressed: hsl(221 73% 47%);
		--danger: #b91c1c;
		--radius: 14px;
		--shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.auth-wrap {
		display: grid;
		place-items: center;
		background: var(--bg);
		padding: 24px;
	}

	.card {
		width: min(480px, 100%);
		background: var(--card);
		color: var(--text);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 28px;
		text-align: center;
	}

	.header,
	.form,
	.success,
	.err,
	.foot {
		text-align: center; /* ⬅️ Ensure these children are centered */
	}

	.header {
		margin-bottom: 18px;
	}
	h1 {
		margin: 0 0 6px 0;
		font-size: 1.6rem;
		line-height: 1.2;
		font-weight: 700;
		letter-spacing: -0.01em;
	}
	.sub {
		margin: 0;
		color: var(--muted);
		font-size: 0.95rem;
	}

	.form {
		display: grid;
		gap: 12px;
		margin-top: 10px;
	}
	.form > * {
		width: 100%;
	}
	.form input[type='email'],
	.form button[type='submit'] {
		width: 100%;
		box-sizing: border-box; /* 🔑 ensures borders + padding are included */
	}

	label {
		display: block; /* ⬅️ So it doesn’t shrink to left */
		margin-bottom: 4px;
		font-size: 0.9rem;
		color: var(--muted);
	}

	input[type='email'] {
		width: 100%;
		height: 44px;
		padding: 0 12px;
		border: 1px solid var(--border);
		border-radius: 10px;
		font-size: 1rem;
		outline: none;
		transition:
			box-shadow 0.15s,
			border-color 0.15s;
	}
	input[type='email']:focus {
		border-color: var(--brand);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand) 25%, transparent);
	}

	button[type='submit'] {
		height: 44px;
		border: 0;
		border-radius: 10px;
		background: var(--brand);
		color: white;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition:
			transform 0.02s ease,
			background 0.15s ease,
			opacity 0.15s ease;
	}
	button[disabled] {
		opacity: 0.6;
		cursor: default;
	}
	button:not([disabled]):active {
		transform: translateY(1px);
		background: var(--brand-pressed);
	}

	.success {
		margin: 12px 0 0;
		color: var(--muted);
	}
	.err {
		margin: 6px 0 0;
		color: var(--danger);
	}

	.foot {
		margin-top: 16px;
		color: var(--muted);
		font-size: 0.85rem;
	}
	.foot a {
		color: inherit;
		text-decoration: underline;
	}
</style>
