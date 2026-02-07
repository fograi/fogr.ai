<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{ flag: void }>();
	export let adId: string;
	export let price: number | null = null;
	export let currency = 'EUR';
	export let firmPrice = false;

	type Kind = 'availability' | 'offer' | 'pickup' | 'question';
	let kind: Kind = 'availability';
	let message = '';
	let offerAmount: number | '' = '';
	let timing = '';
	let deliveryMethod: 'pickup' | 'shipping' = 'pickup';
	let loading = false;
	let err = '';
	let ok = '';
	let warning = '';
	let autoDeclined = false;
	let autoDeclineText = '';

	const formatMoney = (value: number) =>
		new Intl.NumberFormat('en-IE', {
			style: 'currency',
			currency,
			maximumFractionDigits: 0
		}).format(value);

	function defaultBody() {
		if (kind === 'availability') return 'Is this still available?';
		if (kind === 'pickup') return `Pickup time: ${timing.trim()}`;
		if (kind === 'offer' && offerAmount !== '') {
			return `I can offer ${formatMoney(Number(offerAmount))}.`;
		}
		return '';
	}

	async function submit() {
		err = '';
		ok = '';
		warning = '';
		autoDeclined = false;
		autoDeclineText = '';

		if (kind === 'offer') {
			const amount = Number(offerAmount);
			if (!Number.isFinite(amount) || amount <= 0) {
				err = 'Enter a valid offer amount.';
				return;
			}
		}
		if (kind === 'pickup' && !timing.trim()) {
			err = 'Add a pickup time window.';
			return;
		}
		if (kind === 'question' && !message.trim()) {
			err = 'Write your question.';
			return;
		}

		const body = message.trim() || defaultBody();
		if (!body) {
			err = 'Add a message.';
			return;
		}

		loading = true;
		try {
			const res = await fetch('/api/messages', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'same-origin',
				body: JSON.stringify({
					adId,
					kind,
					body,
					offerAmount: offerAmount === '' ? null : Number(offerAmount),
					timing: timing.trim() || null,
					deliveryMethod
				})
			});
			const data = (await res.json().catch(() => ({}))) as {
				success?: boolean;
				message?: string;
				autoDeclined?: boolean;
				autoDeclineMessage?: string;
				scamWarning?: boolean;
				scamReason?: string;
			};
			if (res.status === 401) {
				err = 'Sign in to message the seller.';
				return;
			}
			if (!res.ok || data?.success === false) {
				err = data?.message || 'Could not send message.';
				return;
			}
			ok = 'Message sent.';
			autoDeclined = data?.autoDeclined ?? false;
			autoDeclineText = data?.autoDeclineMessage || '';
			if (data?.scamWarning) warning = data?.scamReason || 'Be careful with off-platform payment requests.';
			message = '';
			timing = '';
			if (kind === 'offer') offerAmount = '';
		} finally {
			loading = false;
		}
	}

</script>

<section class="composer" aria-label="Message seller">
	<div class="header">
		<h2>Message seller</h2>
		<p class="muted">Keep communication in-app. Share contact details only if you choose.</p>
	</div>

	<div class="offer-rules">
		{#if firmPrice}
			<p class="rule">Firm price. Offers will be auto-declined.</p>
		{/if}
	</div>

	<div class="kind">
		<button type="button" class:active={kind === 'availability'} on:click={() => (kind = 'availability')}>
			Still available?
		</button>
		<button type="button" class:active={kind === 'offer'} on:click={() => (kind = 'offer')}>
			Make an offer
		</button>
		<button type="button" class:active={kind === 'pickup'} on:click={() => (kind = 'pickup')}>
			Pickup time
		</button>
		<button type="button" class:active={kind === 'question'} on:click={() => (kind = 'question')}>
			Ask a question
		</button>
	</div>

	{#if kind === 'offer'}
		<div class="row">
			<label for="offer-amount">Offer amount</label>
			<input
				id="offer-amount"
				type="number"
				min="1"
				step="1"
				inputmode="numeric"
				pattern="[0-9]*"
				bind:value={offerAmount}
				placeholder={price ? `e.g., ${Math.max(1, Math.floor(price * 0.9))}` : 'e.g., 50'}
			/>
		</div>
		<div class="row">
			<label for="delivery">Pickup or shipping</label>
			<select id="delivery" bind:value={deliveryMethod}>
				<option value="pickup">Pickup</option>
				<option value="shipping">Shipping</option>
			</select>
		</div>
	{/if}

	{#if kind === 'pickup'}
		<div class="row">
			<label for="timing">When can you collect?</label>
			<input
				id="timing"
				type="text"
				bind:value={timing}
				placeholder="e.g., Today after 6pm"
			/>
		</div>
	{/if}

	{#if kind === 'question' || kind === 'offer'}
		<div class="row">
			<label for="message">Message (optional)</label>
			<textarea
				id="message"
				rows="3"
				bind:value={message}
				placeholder="Add a note to the seller"
			></textarea>
		</div>
	{/if}

	{#if err}
		<p class="notice error" role="alert">{err}</p>
	{/if}
	{#if ok}
		<p class="notice ok" role="status">{ok}</p>
	{/if}
	{#if autoDeclined}
		<p class="notice warn" role="status">
			Offer auto-declined{autoDeclineText ? `: ${autoDeclineText}` : '.'}
		</p>
	{/if}
	{#if warning}
		<div class="warning-row" role="alert">
			<p class="notice warn">{warning}</p>
			<button type="button" class="btn ghost" on:click={() => dispatch('flag')}>
				Report
			</button>
		</div>
	{/if}

	<button type="button" class="btn primary" on:click={submit} disabled={loading}>
		{loading ? 'Sending…' : 'Send message'}
	</button>
</section>

<style>
	.composer {
		max-width: 720px;
		margin: 18px auto 24px;
		padding: 16px;
		border: 1px solid var(--hairline);
		border-radius: 16px;
		background: var(--surface);
		display: grid;
		gap: 12px;
	}
	.header h2 {
		margin: 0 0 4px;
		font-size: 1.2rem;
	}
	.muted {
		color: color-mix(in srgb, var(--fg) 65%, transparent);
		margin: 0;
	}
	.offer-rules .rule {
		margin: 0;
		font-weight: 600;
	}
	.kind {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.kind button {
		border: 1px solid var(--hairline);
		background: var(--surface);
		border-radius: 999px;
		padding: 6px 12px;
		font-weight: 700;
		cursor: pointer;
	}
	.kind button.active {
		background: var(--fg);
		color: var(--bg);
		border-color: var(--fg);
	}
	.row {
		display: grid;
		gap: 6px;
	}
	label {
		font-weight: 700;
	}
	input,
	select,
	textarea {
		border: 1px solid color-mix(in srgb, var(--fg) 18%, transparent);
		background: var(--bg);
		color: inherit;
		border-radius: 10px;
		padding: 10px 12px;
		font: inherit;
		width: 100%;
	}
	.notice {
		margin: 0;
		padding: 8px 10px;
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
	.notice.warn {
		background: color-mix(in srgb, #fde68a 100%, var(--bg));
		color: color-mix(in srgb, #b45309 90%, var(--fg));
		border: 1px solid color-mix(in srgb, #f59e0b 40%, transparent);
	}
	.warning-row {
		display: grid;
		gap: 8px;
	}
	.btn {
		display: inline-grid;
		place-items: center;
		padding: 8px 12px;
		border-radius: 10px;
		border: 1px solid color-mix(in srgb, var(--fg) 18%, transparent);
		background: var(--surface);
		color: inherit;
		font-weight: 700;
		cursor: pointer;
	}
	.btn.ghost {
		background: transparent;
	}
	.btn.primary {
		height: 44px;
		border: 0;
		border-radius: 10px;
		background: var(--fg);
		color: var(--bg);
		font-weight: 700;
		cursor: pointer;
	}
	.btn.primary[disabled] {
		opacity: 0.6;
		cursor: default;
	}
</style>
