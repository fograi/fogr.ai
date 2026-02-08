<script lang="ts">
	import { resolve } from '$app/paths';
	import InlineSpinner from '$lib/components/loading/InlineSpinner.svelte';
	import SkeletonBlock from '$lib/components/loading/SkeletonBlock.svelte';

	type ConversationView = {
		id: string;
		adId: string;
		adTitle: string;
		adPrice: number | null;
		adCurrency: string | null;
		role: 'buyer' | 'seller';
		lastMessageAt: string;
		preview: string;
		unread: boolean;
		unreadCount: number;
	};

	export let data: { streamed: { conversations: Promise<ConversationView[]> } };

	const fmt = (iso: string) =>
		new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium', timeStyle: 'short' }).format(
			new Date(iso)
		);

	const skeletonRows = [1, 2, 3, 4];
</script>

<section class="inbox">
	<header class="head">
		<h1>Messages</h1>
		<p class="sub">Your conversations with buyers and sellers.</p>
	</header>

	{#await data.streamed.conversations}
		<div class="loading" aria-busy="true">
			<InlineSpinner label="Loading conversations." />
			<ul class="threads skeleton-list" aria-hidden="true">
				{#each skeletonRows as row (row)}
					<li class="thread skeleton-thread">
						<div class="meta">
							<SkeletonBlock width="58%" height="1.1rem" />
							<SkeletonBlock width="78px" height="0.95rem" radius="999px" />
						</div>
						<div class="submeta">
							<SkeletonBlock width="110px" height="0.85rem" />
							<SkeletonBlock width="36%" height="0.85rem" />
						</div>
					</li>
				{/each}
			</ul>
		</div>
	{:then conversations}
		{#if conversations.length === 0}
			<div class="empty">
				<p>No messages yet.</p>
				<p class="muted">Message a seller and your conversation will appear here.</p>
				<a class="btn" href={resolve('/')}>Browse listings</a>
			</div>
		{:else}
			<ul class="threads">
				{#each conversations as convo (convo.id)}
					<li>
						<a class="thread" href={resolve('/(app)/messages/[id]', { id: convo.id })}>
							<div class="meta">
								<h2>{convo.adTitle}</h2>
								<span class="role">{convo.role === 'seller' ? 'Selling' : 'Buying'}</span>
							</div>
							<div class="submeta">
								<span class="time">{fmt(convo.lastMessageAt)}</span>
								{#if convo.preview}
									<span class="preview">{convo.preview}</span>
								{/if}
							</div>
							{#if convo.unreadCount > 0}
								<span class="badge">{convo.unreadCount}</span>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	{:catch}
		<div class="empty" role="alert">
			<p>Could not load messages.</p>
			<p class="muted">Refresh and try again.</p>
		</div>
	{/await}
</section>

<style>
	.inbox {
		max-width: 840px;
		margin: 0 auto;
		padding: 24px var(--page-pad) 80px;
		display: grid;
		gap: 16px;
	}
	.head h1 {
		margin: 0 0 4px;
		font-size: 1.6rem;
		font-weight: 800;
	}
	.sub {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 60%, transparent);
	}
	.muted {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 60%, transparent);
	}
	.loading {
		display: grid;
		gap: 10px;
	}
	.skeleton-list {
		pointer-events: none;
	}
	.skeleton-thread {
		background: color-mix(in srgb, var(--fg) 4%, var(--surface));
	}
	.threads {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 12px;
	}
	.thread {
		display: grid;
		gap: 8px;
		padding: 14px;
		border: 1px solid var(--hairline);
		border-radius: 14px;
		background: var(--surface);
		text-decoration: none;
		color: inherit;
		position: relative;
	}
	.meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}
	.meta h2 {
		margin: 0;
		font-size: 1.1rem;
	}
	.role {
		font-weight: 700;
		color: color-mix(in srgb, var(--fg) 55%, transparent);
	}
	.submeta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		font-size: 0.9rem;
		color: color-mix(in srgb, var(--fg) 65%, transparent);
	}
	.preview {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 70%;
	}
	.badge {
		position: absolute;
		top: 12px;
		right: 12px;
		min-width: 22px;
		height: 22px;
		display: inline-grid;
		place-items: center;
		padding: 0 6px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--fg) 12%, var(--bg));
		font-weight: 700;
		font-size: 0.75rem;
	}
	.empty {
		padding: 24px;
		border: 1px dashed var(--hairline);
		border-radius: 14px;
		text-align: center;
		display: grid;
		gap: 10px;
	}
	.btn {
		justify-self: center;
		padding: 8px 14px;
		border-radius: 999px;
		border: 1px solid var(--hairline);
		text-decoration: none;
		color: inherit;
		font-weight: 700;
		background: var(--surface);
	}
</style>
