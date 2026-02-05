<script lang="ts">
	import { resolve } from '$app/paths';

	type MessageView = {
		id: string;
		body: string;
		createdAt: string;
		isMine: boolean;
		kind: string;
	};

	export let data: {
		conversation: { id: string; adId: string; adTitle: string };
		messages: MessageView[];
	};

	let message = '';
	let sending = false;
	let err = '';
	let ok = '';
	let messages = data.messages;
	$: isTyping = message.trim().length > 0;

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
			{#each messages as msg (msg.id)}
				<div class={`bubble ${msg.isMine ? 'mine' : 'theirs'}`}>
					<p class="body">{msg.body}</p>
					<span class="meta">{fmt(msg.createdAt)}</span>
				</div>
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
	.meta {
		font-size: 0.8rem;
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
