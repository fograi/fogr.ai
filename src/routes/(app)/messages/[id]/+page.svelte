<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatPriceLabel } from '$lib/utils/price';
	import InlineSpinner from '$lib/components/loading/InlineSpinner.svelte';
	import SkeletonBlock from '$lib/components/loading/SkeletonBlock.svelte';

	type MessageView = {
		id: string;
		body: string;
		createdAt: string;
		isMine: boolean;
		kind: string;
		autoDeclined: boolean;
	};

	export let data: {
		conversation: {
			id: string;
			adId: string;
			adTitle: string;
			adPrice: number | null;
			adCurrency: string | null;
			adCategory: string | null;
			adStatus: string | null;
		};
		readMeta: { viewerRole: 'buyer' | 'seller'; otherLastReadAt: string | null; viewerLastReadAt: string };
		autoDeclineMessage?: string;
		streamed: { messages: Promise<MessageView[]> };
	};

	let message = '';
	let sending = false;
	let initialMessagesLoading = true;
	let initialMessagesError = '';
	let err = '';
	let ok = '';
	let messages: MessageView[] = [];
	$: isTyping = message.trim().length > 0;
	const skeletonRows = [1, 2, 3];

	const initialMessagesPromise = data.streamed.messages;
	void initialMessagesPromise
		.then((loadedMessages) => {
			messages = loadedMessages;
		})
		.catch(() => {
			initialMessagesError = 'Could not load messages.';
		})
		.finally(() => {
			initialMessagesLoading = false;
		});

	const dateKey = (iso: string) => new Date(iso).toDateString();
	const dateLabel = (iso: string) => {
		const d = new Date(iso);
		const today = new Date();
		const yesterday = new Date();
		yesterday.setDate(today.getDate() - 1);
		if (d.toDateString() === today.toDateString()) return 'Today';
		if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
		return new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium' }).format(d);
	};

	type ThreadItem =
		| { type: 'divider'; id: string; label: string }
		| { type: 'message'; id: string; msg: MessageView };

	$: items = (() => {
		const list: ThreadItem[] = [];
		let lastDay = '';
		for (const msg of messages) {
			const day = dateKey(msg.createdAt);
			if (day !== lastDay) {
				list.push({ type: 'divider', id: `day-${day}`, label: dateLabel(msg.createdAt) });
				lastDay = day;
			}
			list.push({ type: 'message', id: msg.id, msg });
		}
		return list;
	})();

	$: lastMineId = (() => {
		for (let i = messages.length - 1; i >= 0; i--) {
			if (messages[i]?.isMine) return messages[i].id;
		}
		return null;
	})();
	const hasBeenSeen = (createdAt: string) =>
		data.readMeta.otherLastReadAt ? data.readMeta.otherLastReadAt >= createdAt : false;

	const fmt = (iso: string) =>
		new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium', timeStyle: 'short' }).format(
			new Date(iso)
		);

	const formatPrice = () =>
		formatPriceLabel({
			price: data.conversation.adPrice,
			category: data.conversation.adCategory,
			currency: data.conversation.adCurrency ?? 'EUR',
			locale: 'en-IE',
			showRewardWhenMissing: true
		});

	async function send() {
		err = '';
		ok = '';
		if (initialMessagesLoading) return;
		if (!message.trim()) {
			err = 'Write a message.';
			return;
		}
		sending = true;
		try {
			const res = await fetch('/api/messages', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'same-origin',
				body: JSON.stringify({
					conversationId: data.conversation.id,
					kind: 'question',
					body: message.trim()
				})
			});
			const body = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
			if (!res.ok || body.success === false) {
				err = body.message || 'Could not send message.';
				return;
			}
			const now = new Date().toISOString();
			messages = [
				...messages,
				{
					id: `local-${now}`,
					body: message.trim(),
					createdAt: now,
					isMine: true,
					kind: 'question',
					autoDeclined: false
				}
			];
			message = '';
			ok = 'Message sent.';
		} finally {
			sending = false;
		}
	}
</script>

<section class="thread">
	<header class="head">
		<div>
			<a class="back" href={resolve('/(app)/messages')}>&lt;&nbsp;Messages</a>
			<h1>{data.conversation.adTitle}</h1>
			<details class="ad-summary">
				<summary>
					<span class="summary-label">Listing details</span>
					<span class="summary-price">{formatPrice()}</span>
				</summary>
				<div class="summary-body">
					{#if data.conversation.adCategory}
						<div class="summary-row">
							<span>Category</span>
							<span>{data.conversation.adCategory}</span>
						</div>
					{/if}
					{#if data.conversation.adStatus}
						<div class="summary-row">
							<span>Status</span>
							<span>{data.conversation.adStatus.replace('_', ' ')}</span>
						</div>
					{/if}
					<a class="summary-link" href={`/ad/${data.conversation.adId}`}>Open listing</a>
				</div>
			</details>
		</div>
	</header>

	<div class="messages" aria-busy={initialMessagesLoading}>
		{#if initialMessagesLoading}
			<div class="loading" aria-live="polite">
				<InlineSpinner label="Loading conversation." />
				<div class="message-skeletons" aria-hidden="true">
					{#each skeletonRows as row (row)}
						<div class={`bubble skeleton ${row % 2 === 0 ? 'mine' : 'theirs'}`}>
							<SkeletonBlock width="80%" height="0.95rem" />
							<SkeletonBlock width="60%" height="0.95rem" />
							<SkeletonBlock width="95px" height="0.75rem" />
						</div>
					{/each}
				</div>
			</div>
		{:else if initialMessagesError}
			<div class="empty" role="alert">
				<p>{initialMessagesError}</p>
				<p class="muted">Refresh and try again.</p>
			</div>
		{:else if messages.length === 0}
			<div class="empty">
				<p>No messages yet.</p>
				<p class="muted">Start the conversation below.</p>
			</div>
		{:else}
			{#each items as item (item.id)}
				{#if item.type === 'divider'}
					<div class="divider">{item.label}</div>
				{:else}
					<div class={`bubble ${item.msg.isMine ? 'mine' : 'theirs'}`}>
						<p class="body">{item.msg.body}</p>
						{#if item.msg.kind === 'offer' && item.msg.autoDeclined}
							<p class="auto-decline">
								Offer auto-declined{data.autoDeclineMessage ? `: ${data.autoDeclineMessage}` : '.'}
							</p>
						{/if}
						<span class="meta">
							{fmt(item.msg.createdAt)}
							{#if item.msg.isMine && item.msg.id === lastMineId && hasBeenSeen(item.msg.createdAt)}
								<span class="seen">Seen</span>
							{:else if item.msg.isMine && item.msg.id === lastMineId}
								<span class="delivered">Delivered</span>
							{/if}
						</span>
					</div>
				{/if}
			{/each}
		{/if}
	</div>

	<form class="composer" on:submit|preventDefault={send}>
		<label class="sr-only" for="reply">Reply</label>
		<textarea
			id="reply"
			rows="3"
			bind:value={message}
			placeholder="Write a message"
			disabled={sending || initialMessagesLoading}
		></textarea>
		<div class="actions">
			{#if err}<p class="notice error" role="alert">{err}</p>{/if}
			{#if ok}<p class="notice ok" role="status">{ok}</p>{/if}
			{#if isTyping && !sending && !initialMessagesLoading}
				<span class="typing" aria-live="polite">Typing…</span>
			{/if}
			<button type="submit" class="btn primary" disabled={sending || initialMessagesLoading}>
				{#if sending}
					<InlineSpinner label="Sending..." tone="default" size={12} />
				{:else}
					Send
				{/if}
			</button>
		</div>
	</form>
</section>

	<style>
		.thread {
			max-width: 840px;
			margin: 0 auto;
			padding: 24px var(--page-pad) 80px;
			display: grid;
			gap: 16px;
		}
		.head {
			display: grid;
			gap: 4px;
		}
		.back {
			font-size: 0.9rem;
			text-decoration: none;
			font-weight: 600;
		}
		.head h1 {
			margin: 0 0 4px;
			font-size: 1.5rem;
			font-weight: 800;
		}
	.ad-summary {
		margin-top: 6px;
	}
	.ad-summary summary {
		display: flex;
		align-items: center;
		gap: 10px;
		cursor: pointer;
		font-weight: 700;
		list-style: none;
	}
	.ad-summary summary::-webkit-details-marker {
		display: none;
	}
	.summary-label {
		color: color-mix(in srgb, var(--fg) 70%, transparent);
	}
	.summary-price {
		padding: 2px 8px;
		border-radius: 999px;
		border: 1px solid var(--hairline);
		background: color-mix(in srgb, var(--fg) 6%, var(--bg));
		font-weight: 800;
	}
	.summary-body {
		margin-top: 8px;
		border: 1px solid var(--hairline);
		border-radius: 12px;
		padding: 10px 12px;
		background: var(--surface);
		display: grid;
		gap: 6px;
	}
	.summary-row {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		color: color-mix(in srgb, var(--fg) 80%, transparent);
		font-weight: 600;
	}
	.summary-link {
		justify-self: start;
		margin-top: 6px;
		text-decoration: none;
		font-weight: 700;
		color: inherit;
		padding: 6px 10px;
		border-radius: 999px;
		border: 1px solid var(--hairline);
		background: var(--surface);
	}
	.messages {
		display: grid;
		gap: 10px;
	}
	.loading {
		display: grid;
		gap: 10px;
	}
	.message-skeletons {
		display: grid;
		gap: 10px;
	}
	.bubble.skeleton {
		pointer-events: none;
		gap: 8px;
	}
	.divider {
		text-align: center;
		font-weight: 700;
		color: color-mix(in srgb, var(--fg) 60%, transparent);
	}
	.empty {
		border: 1px dashed var(--hairline);
		border-radius: 12px;
		padding: 16px;
		text-align: center;
		display: grid;
		gap: 4px;
	}
	.muted {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 60%, transparent);
	}
	.bubble {
		max-width: 70%;
		padding: 10px 12px;
		border-radius: 12px;
		border: 1px solid var(--hairline);
		background: var(--surface);
		display: grid;
		gap: 6px;
	}
	.bubble.mine {
		margin-left: auto;
		background: color-mix(in srgb, var(--fg) 6%, var(--bg));
	}
	.body {
		margin: 0;
	}
	.auto-decline {
		margin: 0;
		font-size: 0.85rem;
		font-weight: 700;
		color: color-mix(in srgb, #b45309 85%, var(--fg));
	}
	.meta {
		font-size: 0.8rem;
		color: color-mix(in srgb, var(--fg) 60%, transparent);
		display: inline-flex;
		gap: 8px;
		align-items: center;
	}
	.seen {
		font-weight: 700;
		color: color-mix(in srgb, var(--fg) 70%, transparent);
	}
	.delivered {
		font-weight: 700;
		color: color-mix(in srgb, var(--fg) 60%, transparent);
	}
	.composer {
		display: grid;
		gap: 10px;
		border: 1px solid var(--hairline);
		border-radius: 14px;
		padding: 12px;
		background: var(--surface);
	}
	textarea {
		border: 1px solid color-mix(in srgb, var(--fg) 18%, transparent);
		background: var(--bg);
		color: inherit;
		border-radius: 10px;
		padding: 10px 12px;
		font: inherit;
		width: 100%;
		resize: vertical;
	}
	.actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10px;
	}
	.typing {
		color: color-mix(in srgb, var(--fg) 60%, transparent);
		font-weight: 600;
	}
	.notice {
		margin: 0;
		padding: 6px 8px;
		border-radius: 10px;
		font-weight: 700;
	}
	.notice.error {
		background: var(--tangerine-bg);
		color: var(--accent-orange);
		border: 1px solid color-mix(in srgb, var(--accent-orange) 35%, transparent);
	}
	.notice.ok {
		background: var(--mint-bg);
		color: var(--accent-green);
		border: 1px solid color-mix(in srgb, var(--accent-green) 35%, transparent);
	}
	.btn.primary {
		height: 40px;
		border: 0;
		border-radius: 10px;
		background: var(--fg);
		color: var(--bg);
		font-weight: 700;
		cursor: pointer;
		padding: 0 16px;
	}
	.btn.primary[disabled] {
		opacity: 0.6;
		cursor: default;
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
</style>
