<script lang="ts">
	import { onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { PUBLIC_R2_BASE } from '$env/static/public';
	import {
		type Category,
		type PriceType,
		POA_CATEGORY_SET
	} from '$lib/constants';
	import PostFields from '$lib/components/post/PostFields.svelte';
	import ImageDrop from '$lib/components/post/ImageDrop.svelte';
	import StickyCTA from '$lib/components/post/StickyCTA.svelte';
	import { createModerationClient } from '$lib/clients/moderationClient';

	type EditAdRow = {
		id: string;
		title: string;
		description: string;
		category: Category;
		price: number | null;
		currency: string | null;
		image_keys: string[] | null;
		status: string;
		firm_price: boolean;
		min_offer: number | null;
		auto_decline_message: string | null;
		direct_contact_enabled: boolean;
		created_at: string;
		updated_at: string | null;
		expires_at: string;
	};

	export let data: {
		ad: EditAdRow;
		ageConfirmed?: boolean;
		editable?: boolean;
	};

	const ad = data.ad;
	const editable = data.editable ?? true;
	const existingImageKey = ad.image_keys?.[0] ?? '';
	const publicR2Base = PUBLIC_R2_BASE.replace(/\/+$/, '');
	const existingImageUrl = existingImageKey
		? `${publicR2Base}/${existingImageKey.replace(/^\/+/, '')}`
		: null;

	let title = ad.title ?? '';
	let description = ad.description ?? '';
	let category: Category | '' = ad.category ?? '';
	let price: number | '' = ad.price ?? '';
	let priceType: PriceType =
		ad.price === null ? 'poa' : ad.price === 0 || ad.category === 'Free / Giveaway' ? 'free' : 'fixed';
	let firmPrice = ad.firm_price ?? false;
	let minOffer: number | '' = ad.min_offer ?? '';
	let autoDeclineMessage = ad.auto_decline_message ?? '';
	let directContactEnabled = ad.direct_contact_enabled ?? false;
	let currency = ad.currency ?? 'EUR';
	let locale = 'en-IE';
	let ageConfirmed = data?.ageConfirmed ?? false;
	let step = 1;
	const totalSteps = 3;
	let showErrors = false;

	let file: File | null = null;
	let previewUrl: string | null = existingImageUrl;

	const mod = createModerationClient();
	let debounce: number | undefined;

	$: if (category === 'Free / Giveaway' && priceType !== 'free') priceType = 'free';
	$: if (priceType === 'poa' && category && !POA_CATEGORY_SET.has(category)) priceType = 'fixed';
	$: if (priceType === 'free' && price !== 0) price = 0;
	$: if (priceType === 'poa') price = '';
	$: if (priceType === 'fixed' && price === 0) price = '';
	$: if (priceType !== 'fixed') {
		firmPrice = true;
		minOffer = '';
		autoDeclineMessage = '';
	}

	$: {
		if (browser) {
			const text = `${title ?? ''} ${description ?? ''}`.trim();
			clearTimeout(debounce);
			if (text) {
				debounce = window.setTimeout(() => mod.postLive(text), 250);
			}
		}
	}

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
	};

	let err = '';
	let ok = '';
	let loading = false;

	function validateBasics() {
		if (!category) return 'Choose a category.';
		if (!title.trim()) return 'Add a title.';
		if (title.trim().length < MIN_TITLE_LENGTH)
			return `Title must be at least ${MIN_TITLE_LENGTH} characters.`;
		if (title.length > MAX_TITLE_LENGTH)
			return `Title must be no more than ${MAX_TITLE_LENGTH} characters.`;
		if (!description.trim()) return 'Add a description.';
		if (description.trim().length < MIN_DESC_LENGTH)
			return `Description must be at least ${MIN_DESC_LENGTH} characters.`;
		if (description.length > MAX_DESC_LENGTH)
			return `Description must be no more than ${MAX_DESC_LENGTH} characters.`;
		return '';
	}

	function validateDetails() {
		if (priceType === 'poa' && category && !POA_CATEGORY_SET.has(category)) {
			return 'Price on application is not available for this category.';
		}
		if (priceType === 'fixed' && price === '') return 'Enter a price.';
		if (priceType === 'fixed') {
			const n = Number(price);
			if (Number.isNaN(n) || n <= 0) return 'Price must be greater than 0.';
		}
		if (priceType === 'free') {
			const n = Number(price);
			if (Number.isNaN(n) || n !== 0) return 'Free listings must be 0.';
		}
		if (priceType === 'fixed') {
			if (firmPrice && minOffer !== '') {
				return 'Firm price listings cannot set a minimum offer.';
			}
			if (minOffer !== '') {
				const m = Number(minOffer);
				if (Number.isNaN(m) || m <= 0) return 'Minimum offer must be greater than 0.';
				const n = Number(price);
				if (Number.isFinite(n) && m >= n)
					return 'Minimum offer must be less than the asking price.';
			}
		}
		return '';
	}

	function validateFinal() {
		if (!ageConfirmed) return 'Confirm you are 18 or older.';
		return '';
	}

	function validateAll() {
		return validateBasics() || validateDetails() || validateFinal();
	}

	function goNext() {
		err = '';
		ok = '';
		showErrors = true;
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
		if (!editable) return;
		err = '';
		ok = '';
		showErrors = true;
		const v = validateAll();
		if (v) {
			err = v;
			return;
		}

		loading = true;
		try {
			const flagged = await mod.check(`${title ?? ''} ${description ?? ''}`);
			if (flagged) {
				err = 'That text may break our language rules. Edit it and try again.';
				return;
			}

			const form = new FormData();
			form.append('title', title.trim());
			form.append('description', description.trim());
			form.append('category', category as string);
			form.append('price_type', priceType);
			form.append('firm_price', priceType === 'fixed' && firmPrice ? '1' : '0');
			if (priceType === 'fixed' && minOffer !== '') {
				form.append('min_offer', String(minOffer));
			}
			if (priceType === 'fixed' && (firmPrice || minOffer !== '')) {
				form.append('auto_decline_message', autoDeclineMessage.trim());
			}
			form.append('direct_contact_enabled', directContactEnabled ? '1' : '0');
			if (priceType === 'free') {
				form.append('price', '0');
			} else if (priceType === 'fixed' && price !== '') {
				form.append('price', String(price));
			}
			form.append('currency', currency);
			form.append('locale', locale);
			form.append('age_confirmed', ageConfirmed ? '1' : '0');

			const removingExisting = !!existingImageKey && !previewUrl && !file;
			if (removingExisting) {
				form.append('remove_image', '1');
			}
			if (file) form.append('image', file);

			const res = await fetch(`/api/ads/${ad.id}`, { method: 'PATCH', body: form });
			const raw = await res.text();
			let payload: ApiResponse;
			try {
				payload = JSON.parse(raw) as ApiResponse;
			} catch {
				payload = { message: raw };
			}
			if (!res.ok || payload?.success === false)
				throw new Error(payload?.message || 'We could not save your changes.');

			if (payload?.id) {
				window.location.href = `/ad/${payload.id}`;
				return;
			}
			ok = payload?.message || 'Changes saved.';
		} catch (e: unknown) {
			err = e instanceof Error ? e.message : 'We could not save your changes.';
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

{#if !editable}
	<section class="post">
		<header class="head">
			<h1>Edit ad</h1>
			<p class="sub">This ad can’t be edited while it is {ad.status}.</p>
		</header>
		<a class="btn ghost" href="/ads">Back to My ads</a>
	</section>
{:else}
	<form class="post" on:submit|preventDefault={handleFormSubmit} aria-busy={loading}>
		<header class="head">
			<h1>Edit ad</h1>
			<p class="sub">Update the details, price, or photo.</p>
		</header>

		<ol class="steps" aria-label="Edit steps">
			<li class:active={step === 1} class:done={step > 1}>
			<button type="button" on:click={() => jumpTo(1)} aria-current={step === 1}>
				<span class="num">1</span>
				<span class="label">Details</span>
			</button>
		</li>
			<li class:active={step === 2} class:done={step > 2}>
				<button type="button" on:click={() => jumpTo(2)} aria-current={step === 2}>
					<span class="num">2</span>
					<span class="label">Price</span>
				</button>
			</li>
			<li class:active={step === 3} class:done={step > 3}>
				<button type="button" on:click={() => jumpTo(3)} aria-current={step === 3}>
					<span class="num">3</span>
					<span class="label">Photo</span>
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
				<PostFields
					step={1}
					bind:category
					bind:title
					bind:description
					bind:price
					bind:priceType
					bind:firmPrice
					bind:minOffer
					bind:autoDeclineMessage
					bind:directContactEnabled
					bind:ageConfirmed
					{loading}
					{showErrors}
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
				<PostFields
					step={2}
					bind:category
					bind:title
					bind:description
					bind:price
					bind:priceType
					bind:firmPrice
					bind:minOffer
					bind:autoDeclineMessage
					bind:directContactEnabled
					bind:ageConfirmed
					{loading}
					{showErrors}
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
				<ImageDrop
					bind:file
					bind:previewUrl
					{title}
					{category}
					{priceType}
					{price}
					{currency}
					{locale}
				/>
				<PostFields
					step={3}
					bind:category
					bind:title
					bind:description
					bind:price
					bind:priceType
					bind:firmPrice
					bind:minOffer
					bind:autoDeclineMessage
					bind:directContactEnabled
					bind:ageConfirmed
					{loading}
					{showErrors}
				/>
				<div class="actions">
					<button type="button" class="btn ghost" on:click={goBack} disabled={loading}>
						Back
					</button>
				</div>
				<StickyCTA label="Save changes" loadingLabel="Saving…" {loading} />
			</section>
		{/if}
	</form>
{/if}

<style>
	.post {
		padding: 0 var(--page-pad) calc(72px + env(safe-area-inset-bottom));
		max-width: var(--page-max);
		margin: 0 auto;
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
	.sub {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 55%, transparent);
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
		background: var(--tangerine-bg);
		color: var(--accent-orange);
		border: 1px solid color-mix(in srgb, var(--accent-orange) 35%, transparent);
	}
	.notice.ok {
		background: var(--mint-bg);
		color: var(--accent-green);
		border: 1px solid color-mix(in srgb, var(--accent-green) 35%, transparent);
	}

	.panel {
		border: 1px solid var(--hairline);
		border-radius: 16px;
		padding: 16px;
		background: var(--surface);
		display: grid;
		gap: 12px;
		width: 100%;
	}

	.actions {
		display: flex;
		gap: 10px;
		justify-content: flex-end;
		width: 100%;
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
</style>
