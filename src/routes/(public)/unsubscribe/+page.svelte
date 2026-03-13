<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';

	export let data: {
		success: boolean;
		emailType: string | null;
		error: string | null;
	};

	export let form: {
		resubscribed?: boolean;
		emailType?: string | null;
		error?: string | null;
	} | null;

	$: token = $page.url.searchParams.get('token') ?? '';
	$: type = $page.url.searchParams.get('type') ?? '';
</script>

<svelte:head>
	<title>Unsubscribe - fogr.ai</title>
</svelte:head>

<section class="unsub-wrap">
	<div class="card">
		{#if form?.resubscribed}
			<h1>Re-subscribed</h1>
			<p class="message">You have been re-subscribed to {form.emailType}.</p>
			<a href={resolve('/')} class="home-link">Return to fogr.ai</a>
		{:else if form?.error}
			<h1>Something went wrong</h1>
			<p class="message error">{form.error}</p>
			<a href={resolve('/')} class="home-link">Back to fogr.ai</a>
		{:else if data.error}
			<h1>Something went wrong</h1>
			<p class="message error">{data.error}</p>
			<a href={resolve('/')} class="home-link">Back to fogr.ai</a>
		{:else if data.success}
			<h1>Unsubscribed</h1>
			<p class="message">You have been unsubscribed from {data.emailType}.</p>
			<p class="detail">You will no longer receive these emails.</p>
			<form method="POST" action="?/resubscribe">
				<input type="hidden" name="token" value={token} />
				<input type="hidden" name="type" value={type} />
				<p class="resubscribe">
					Changed your mind? <button type="submit" class="link-btn">Re-subscribe</button>
				</p>
			</form>
			<a href={resolve('/')} class="home-link">Return to fogr.ai</a>
		{/if}
	</div>
</section>

<style>
	.unsub-wrap {
		display: grid;
		place-items: center;
		min-height: 50vh;
		padding: 24px var(--page-pad);
	}

	.card {
		width: min(480px, 100%);
		background: var(--surface);
		border: 1px solid var(--hairline);
		border-radius: 14px;
		box-shadow: 0 10px 30px color-mix(in srgb, var(--fg) 12%, transparent);
		padding: 32px 28px;
		text-align: center;
	}

	h1 {
		margin: 0 0 12px;
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	.message {
		margin: 0 0 8px;
		font-size: 1rem;
		line-height: 1.5;
	}

	.error {
		color: var(--danger);
	}

	.detail {
		margin: 0 0 16px;
		color: color-mix(in srgb, var(--fg) 60%, transparent);
		font-size: 0.9rem;
	}

	.resubscribe {
		margin: 0 0 16px;
		font-size: 0.9rem;
		color: color-mix(in srgb, var(--fg) 60%, transparent);
	}

	.link-btn {
		background: none;
		border: none;
		color: var(--link);
		text-decoration: underline;
		cursor: pointer;
		font-size: inherit;
		padding: 0;
	}

	.link-btn:hover {
		color: color-mix(in srgb, var(--link) 80%, var(--fg));
	}

	.home-link {
		display: inline-block;
		margin-top: 16px;
		color: var(--link);
		text-decoration: underline;
		font-size: 0.9rem;
	}

	form {
		margin: 0;
	}
</style>
