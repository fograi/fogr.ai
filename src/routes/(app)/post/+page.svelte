<script lang="ts">
	import { onDestroy } from 'svelte';
	import { type Category } from '$lib/constants';

	import PostFields from '$lib/components/post/PostFields.svelte';
	import ImageDrop from '$lib/components/post/ImageDrop.svelte';
	import StickyCTA from '$lib/components/post/StickyCTA.svelte';
	import { createModerationClient } from '$lib/clients/moderationClient';

	export let data: { ageConfirmed?: boolean };

	// ---- Form state ----
	let title = '';
	let description = '';
	let category: Category | '' = '';
	let price: number | '' = '';
	let currency = 'EUR';
	let locale = 'en-IE';
	let ageConfirmed = data?.ageConfirmed ?? false;
	let step = 1;
	const totalSteps = 3;

	// one image (optional)
	let file: File | null = null;
	let previewUrl: string | null = null;

	// moderation
	const mod = createModerationClient();
	let debounce: number | undefined;

	// derived
	$: isFree = category === 'Free / Giveaway';
	$: if (isFree && price !== 0) price = 0;

	// live moderation check while typing
	$: {
		const text = `${title ?? ''} ${description ?? ''}`.trim();
		clearTimeout(debounce);
		if (text) {
			debounce = window.setTimeout(() => mod.postLive(text), 250);
		}
	}

	// ---- Validation + submit ----
	import {
		MIN_TITLE_LENGTH,
		MAX_TITLE_LENGTH,
		MIN_DESC_LENGTH,
		MAX_DESC_LENGTH
	} from '$lib/constants';

	type ApiResponse = {
		success?: boolean;
		message?: string;
		id?: string;
		requestId?: string;
	};

	let err = '';
	let ok = '';
	let loading = false;

	function validateBasics() {
		if (!category) return 'Choose a category.';
		if (!title.trim()) return 'Title is required.';
		if (title.trim().length < MIN_TITLE_LENGTH) return `Title must be ≥ ${MIN_TITLE_LENGTH} chars.`;
		if (title.length > MAX_TITLE_LENGTH) return `Title ≤ ${MAX_TITLE_LENGTH} chars.`;
		if (!isFree && price === '') return 'Price is required.';
		if (!isFree) {
			const n = Number(price);
			if (Number.isNaN(n) || n < 0) return 'Price must be 0 or more.';
		}
		return '';
	}

	function validateDetails() {
		if (!description.trim()) return 'Description is required.';
		if (description.trim().length < MIN_DESC_LENGTH)
			return `Description must be ≥ ${MIN_DESC_LENGTH} chars.`;
		if (description.length > MAX_DESC_LENGTH) return `Description ≤ ${MAX_DESC_LENGTH} chars.`;
		if (!ageConfirmed) return 'You must confirm you are 18 or older.';
		return '';
	}

	function validateAll() {
		return validateBasics() || validateDetails();
	}

	function goNext() {
		err = '';
		ok = '';
		const v = step === 1 ? validateBasics() : validateDetails();
		if (v) {
			err = v;
			return;
		}
		step = Math.min(step + 1, totalSteps);
	}

	function goBack() {
		err = '';
		ok = '';
		step = Math.max(step - 1, 1);
	}

	function jumpTo(target: number) {
		if (target >= step) return;
		err = '';
		ok = '';
		step = target;
	}

	async function handleSubmit() {
		err = '';
		ok = '';
		const v = validateAll();
		if (v) {
			err = v;
			return;
		}

		loading = true;
		try {
			// client-side moderation preflight
			const flagged = await mod.check(`${title ?? ''} ${description ?? ''}`);
			if (flagged) {
				err = 'Your ad likely violates our language rules. Please edit and resubmit.';
				return;
			}

			// server call
			const form = new FormData();
			form.append('title', title.trim());
			form.append('description', description.trim());
			form.append('category', category as string);
			if (isFree) {
				form.append('price', '0');
			} else if (price !== '') {
				form.append('price', String(price));
			}
			form.append('currency', currency);
			form.append('locale', locale);
			form.append('age_confirmed', ageConfirmed ? '1' : '0');
			if (file) form.append('image', file);

			const res = await fetch('/api/ads', { method: 'POST', body: form });
			const raw = await res.text();
			let data: ApiResponse;
			try {
				data = JSON.parse(raw) as ApiResponse;
			} catch {
				data = { message: raw };
			}
			if (!res.ok || data?.success === false) throw new Error(data?.message || 'Failed to post.');

			if (data?.id) {
				window.location.href = `/ad/${data.id}`;
				return;
			}

			ok = data?.message || 'Ad submitted successfully!';
			// reset
			title = '';
			description = '';
			category = '';
			price = '';
			// clear image
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			previewUrl = null;
			file = null;
		} catch (e: unknown) {
			err = e instanceof Error ? e.message : 'Failed to post. Try again.';
		} finally {
			loading = false;
		}
	}

	function handleFormSubmit() {
		if (step < totalSteps) {
			goNext();
			return;
		}
		void handleSubmit();
	}

	onDestroy(() => mod.destroy());
</script>

<form class="post" on:submit|preventDefault={handleFormSubmit} aria-busy={loading}>
	<header class="head">
		<h1>Post an ad</h1>
		<p class="sub">Step {step} of {totalSteps} • Keep it short, clear, and real.</p>
	</header>

	<ol class="steps" aria-label="Posting steps">
		<li class:active={step === 1} class:done={step > 1}>
			<button type="button" on:click={() => jumpTo(1)} aria-current={step === 1}>
				<span class="num">1</span>
				<span class="label">Basics</span>
			</button>
		</li>
		<li class:active={step === 2} class:done={step > 2}>
			<button type="button" on:click={() => jumpTo(2)} aria-current={step === 2}>
				<span class="num">2</span>
				<span class="label">Details</span>
			</button>
		</li>
		<li class:active={step === 3} class:done={step > 3}>
			<button type="button" on:click={() => jumpTo(3)} aria-current={step === 3}>
				<span class="num">3</span>
				<span class="label">Photo + Review</span>
			</button>
		</li>
	</ol>

	{#if err}
		<p class="notice error" role="alert">{err}</p>
	{/if}
	{#if ok}
		<p class="notice ok" role="status">{ok}</p>
	{/if}

	{#if step === 1}
		<section class="panel">
			<h2>Basics</h2>
			<p class="hint">Title, category, and price — the essentials.</p>
			<PostFields
				step={1}
				bind:category
				bind:title
				bind:description
				bind:price
				bind:ageConfirmed
				{isFree}
				{loading}
			/>
			<div class="actions">
				<button type="button" class="btn primary" on:click={goNext} disabled={loading}>
					Continue
				</button>
			</div>
		</section>
	{/if}

	{#if step === 2}
		<section class="panel">
			<h2>Details</h2>
			<p class="hint">Share enough detail for real buyers.</p>
			<PostFields
				step={2}
				bind:category
				bind:title
				bind:description
				bind:price
				bind:ageConfirmed
				{isFree}
				{loading}
			/>
			<div class="actions">
				<button type="button" class="btn ghost" on:click={goBack} disabled={loading}>
					Back
				</button>
				<button type="button" class="btn primary" on:click={goNext} disabled={loading}>
					Continue
				</button>
			</div>
		</section>
	{/if}

	{#if step === 3}
		<section class="panel">
			<h2>Photo + review</h2>
			<p class="hint">Optional photo, then publish.</p>
			<div class="review-grid">
				<div class="review-card">
					<h3>Ad preview</h3>
					<p class="title">{title || 'Untitled listing'}</p>
					<p class="meta">
						{category || 'Category'} · {isFree ? 'Free' : price ? `€${price}` : 'Price'}
					</p>
					<p class="desc">
						{description
							? description.length > 140
								? `${description.slice(0, 140)}…`
								: description
							: 'Add a clear description so buyers know what to expect.'}
					</p>
					<p class="mini">You can go back to edit any step.</p>
				</div>
				<ImageDrop
					bind:file
					bind:previewUrl
					{title}
					{category}
					{isFree}
					{price}
					{currency}
					{locale}
				/>
			</div>
			<div class="actions">
				<button type="button" class="btn ghost" on:click={goBack} disabled={loading}>
					Back
				</button>
			</div>
			<StickyCTA label="Post ad" {loading} />
		</section>
	{/if}
</form>

<style>
	.post {
		padding: 0 16px calc(72px + env(safe-area-inset-bottom));
	}
	.head {
		text-align: center;
		display: grid;
		gap: 6px;
	}
	.head h1 {
		margin: 0;
		font-size: 1.7rem;
		font-weight: 800;
	}
	.head .sub {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 60%, transparent);
		font-weight: 600;
	}

	.steps {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
		padding: 0;
		margin: 16px 0 12px;
	}
	.steps li button {
		width: 100%;
		border: 1px solid var(--hairline);
		background: var(--surface);
		border-radius: 12px;
		padding: 10px;
		display: grid;
		gap: 4px;
		place-items: center;
		font-weight: 700;
		cursor: pointer;
	}
	.steps li.done button {
		border-color: color-mix(in srgb, var(--fg) 30%, transparent);
	}
	.steps li.active button {
		border-color: var(--fg);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--fg) 12%, transparent);
	}
	.steps .num {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: var(--fg);
		color: var(--bg);
		font-weight: 800;
	}
	.steps .label {
		font-size: 0.9rem;
	}

	.notice {
		margin: 12px 0;
		padding: 10px 12px;
		border-radius: 10px;
		font-weight: 700;
	}
	.notice.error {
		background: color-mix(in srgb, var(--danger) 12%, var(--bg));
		color: var(--danger);
	}
	.notice.ok {
		background: color-mix(in srgb, var(--success) 12%, var(--bg));
		color: var(--success);
	}

	.panel {
		border: 1px solid var(--hairline);
		border-radius: 16px;
		padding: 16px;
		background: var(--surface);
		display: grid;
		gap: 12px;
	}
	.panel h2 {
		margin: 0;
		font-size: 1.2rem;
	}
	.hint {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 65%, transparent);
	}

	.actions {
		display: flex;
		gap: 10px;
		justify-content: flex-end;
	}
	.btn {
		display: inline-grid;
		place-items: center;
		gap: 6px;
		padding: 10px 14px;
		border-radius: 10px;
		border: 1px solid color-mix(in srgb, var(--fg) 18%, transparent);
		background: var(--surface);
		cursor: pointer;
		font-weight: 700;
	}
	.btn.primary {
		background: var(--fg);
		color: var(--bg);
		border-color: var(--fg);
	}
	.btn.ghost {
		background: transparent;
	}

	.review-grid {
		display: grid;
		gap: 16px;
	}
	.review-card {
		border: 1px solid color-mix(in srgb, var(--fg) 15%, transparent);
		border-radius: 14px;
		padding: 14px;
		display: grid;
		gap: 8px;
		background: color-mix(in srgb, var(--bg) 92%, var(--surface));
	}
	.review-card .title {
		margin: 0;
		font-weight: 800;
		font-size: 1.1rem;
	}
	.review-card .meta {
		margin: 0;
		font-weight: 700;
		color: color-mix(in srgb, var(--fg) 70%, transparent);
	}
	.review-card .desc {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 80%, transparent);
	}
	.review-card .mini {
		margin: 6px 0 0;
		font-size: 0.85rem;
		color: color-mix(in srgb, var(--fg) 60%, transparent);
	}

	@media (min-width: 820px) {
		.review-grid {
			grid-template-columns: 1fr 1fr;
			align-items: start;
		}
	}
</style>
