<script lang="ts">
	import { resolve } from '$app/paths';

	type MessageView = {
		id: string;
		body: string;
		createdAt: string;
		isMine: boolean;
		kind: string;
		autoDeclined: boolean;
	};

	export let data: {
		conversation: { id: string; adId: string; adTitle: string };
		readMeta: { viewerRole: 'buyer' | 'seller'; otherLastReadAt: string | null; viewerLastReadAt: string };
		autoDeclineMessage?: string;
		messages: MessageView[];
	};

	let message = '';
	let sending = false;
	let err = '';
	let ok = '';
	let messages = data.messages;
	$: isTyping = message.trim().length > 0;

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

	async function send() {
		err = '';
		ok = '';
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
				{ id: `local-${now}`, body: message.trim(), createdAt: now, isMine: true, kind: 'question' }
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
			<h1>{data.conversation.adTitle}</h1>
			<a class="link" href={`/ad/${data.conversation.adId}`}>View listing</a>
		</div>
	</header>

	<div class="messages">
		{#if messages.length === 0}
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
		></textarea>
		<div class="actions">
			{#if err}<p class="notice error" role="alert">{err}</p>{/if}
			{#if ok}<p class="notice ok" role="status">{ok}</p>{/if}
			{#if isTyping && !sending}
				<span class="typing" aria-live="polite">Typing…</span>
			{/if}
			<button type="submit" class="btn primary" disabled={sending}>
				{sending ? 'Sending…' : 'Send'}
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
	.head h1 {
		margin: 0 0 4px;
		font-size: 1.5rem;
		font-weight: 800;
	}
	.link {
		text-decoration: none;
		color: inherit;
		font-weight: 700;
	}
	.messages {
		display: grid;
		gap: 10px;
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
