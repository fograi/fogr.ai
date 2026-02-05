<script lang="ts">
	import { resolve } from '$app/paths';

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
	};

	export let data: { conversations: ConversationView[] };

	const fmt = (iso: string) =>
		new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium', timeStyle: 'short' }).format(
			new Date(iso)
		);
</script>

<section class="inbox">
	<header class="head">
		<h1>Messages</h1>
		<p class="sub">Your conversations with buyers and sellers.</p>
	</header>

	{#if data.conversations.length === 0}
		<div class="empty">
			<p>No messages yet.</p>
			<p class="muted">Message a seller and your conversation will appear here.</p>
			<a class="btn" href={resolve('/')}>Browse listings</a>
		</div>
	{:else}
		<ul class="threads">
			{#each data.conversations as convo (convo.id)}
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
						{#if convo.unread}
							<span class="badge">Unread</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	{/if}
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
		padding: 4px 8px;
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
