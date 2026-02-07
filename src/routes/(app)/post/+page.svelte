<script lang="ts">
	import { onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { type Category, type PriceType, POA_CATEGORY_SET } from '$lib/constants';
	import {
		CATEGORY_PROFILE_VERSION,
		BIKES_PROFILE_KEY,
		buildBikeTitle,
		getBikeDescriptionTemplate,
		isBikesCategory,
		validateAndNormalizeBikesProfileData,
		type BikeCondition,
		type BikeSizePreset,
		type BikeSubtype,
		type BikeType
	} from '$lib/category-profiles';

	import PostFields from '$lib/components/post/PostFields.svelte';
	import ImageDrop from '$lib/components/post/ImageDrop.svelte';
	import { createModerationClient } from '$lib/clients/moderationClient';
	import { formatPriceLabel } from '$lib/utils/price';

	export let data: { ageConfirmed?: boolean };

	// ---- Form state ----
	let title = '';
	let description = '';
	let category: Category | '' = '';
	let price: number | '' = '';
	let priceType: PriceType = 'fixed';
	let firmPrice = false;
	let minOffer: number | '' = '';
	let autoDeclineMessage = '';
	let bikeSubtype: BikeSubtype | '' = '';
	let bikeType: BikeType | '' = '';
	let bikeCondition: BikeCondition | '' = '';
	let bikeSizePreset: BikeSizePreset | '' = '';
	let bikeSizeManual = '';
	let bikeSizeManualUnit: 'cm' | 'in' | '' = '';
	let bikeReasonForSelling = '';
	let bikeUsageSummary = '';
	let bikeKnownIssues = '';
	let bikeSizeManualEdited = false;
	let titleManuallyEdited = false;
	let descriptionManuallyEdited = false;
	let bikeTitleAutoFilled = false;
	let bikeDescriptionTemplateUsed = false;
	let lastBikeTitleSeed = '';
	let lastBikeDescriptionSeed = '';
	let currency = 'EUR';
	let locale = 'en-IE';
	let ageConfirmed = data?.ageConfirmed ?? false;
	let step = 1;
	const totalSteps = 3;
	let showErrors = false;
	let previewOpen = false;

	// one image (optional)
	let file: File | null = null;
	let previewUrl: string | null = null;

	// moderation
	const mod = createModerationClient();
	let debounce: number | undefined;

	// derived
	$: isBikes = isBikesCategory(category);
	$: isLostAndFound = category === 'Lost and Found';
	$: if (category === 'Free / Giveaway' && priceType !== 'free') priceType = 'free';
	$: if (isLostAndFound && priceType !== 'fixed') priceType = 'fixed';
	$: if (priceType === 'poa' && category && !POA_CATEGORY_SET.has(category)) priceType = 'fixed';
	$: if (priceType === 'free' && price !== 0) price = 0;
	$: if (priceType === 'poa') price = '';
	$: if (priceType === 'fixed' && price === 0) price = '';
	$: if (priceType !== 'fixed') {
		firmPrice = true;
		minOffer = '';
		autoDeclineMessage = '';
	}
	$: if (isLostAndFound) {
		firmPrice = false;
		minOffer = '';
		autoDeclineMessage = '';
	}
	$: if (!isBikes) {
		bikeSubtype = '';
		bikeType = '';
		bikeCondition = '';
		bikeSizePreset = '';
		bikeSizeManual = '';
		bikeSizeManualUnit = '';
		bikeReasonForSelling = '';
		bikeUsageSummary = '';
		bikeKnownIssues = '';
		bikeSizeManualEdited = false;
		bikeTitleAutoFilled = false;
		bikeDescriptionTemplateUsed = false;
		lastBikeTitleSeed = '';
		lastBikeDescriptionSeed = '';
	}
	$: bikeSizeManualWithUnit = bikeSizeManual.trim()
		? `${bikeSizeManual.trim()}${bikeSizeManualUnit ? ` ${bikeSizeManualUnit}` : ''}`.trim()
		: '';
	$: bikeTitleSeed = `${bikeSubtype}|${bikeType}|${bikeSizePreset}|${bikeSizeManualWithUnit}`;
	$: suggestedBikeTitle = buildBikeTitle({
		subtype: bikeSubtype,
		bikeType,
		sizePreset: bikeSizePreset,
		sizeManual: bikeSizeManualWithUnit
	});
	$: if (
		isBikes &&
		suggestedBikeTitle &&
		!titleManuallyEdited &&
		bikeTitleSeed !== lastBikeTitleSeed
	) {
		title = suggestedBikeTitle;
		bikeTitleAutoFilled = true;
		lastBikeTitleSeed = bikeTitleSeed;
	}
	$: bikeDescriptionSeed = [
		bikeReasonForSelling.trim(),
		bikeUsageSummary.trim(),
		bikeKnownIssues.trim()
	].join('|');
	$: hasBikeDescriptionAssist = bikeDescriptionSeed.length > 0;
	$: bikeDescriptionTemplate = getBikeDescriptionTemplate({
		reasonForSelling: bikeReasonForSelling,
		usageSummary: bikeUsageSummary,
		knownIssues: bikeKnownIssues
	});
	$: if (isBikes && !descriptionManuallyEdited && bikeDescriptionSeed !== lastBikeDescriptionSeed) {
		description = hasBikeDescriptionAssist ? bikeDescriptionTemplate : '';
		bikeDescriptionTemplateUsed = hasBikeDescriptionAssist;
		lastBikeDescriptionSeed = bikeDescriptionSeed;
	}
	$: usedPresetOnly =
		isBikes && !titleManuallyEdited && !descriptionManuallyEdited && !bikeSizeManualEdited;

	// live moderation check while typing
	$: {
		if (browser) {
			const text = `${title ?? ''} ${description ?? ''}`.trim();
			clearTimeout(debounce);
			if (text) {
				debounce = window.setTimeout(() => mod.postLive(text), 250);
			}
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

	function buildBikeProfileCandidate() {
		return {
			version: CATEGORY_PROFILE_VERSION,
			profile: BIKES_PROFILE_KEY,
			subtype: bikeSubtype || undefined,
			bikeType: bikeType || undefined,
			condition: bikeCondition || undefined,
			sizePreset: bikeSizePreset || undefined,
			sizeManual: bikeSizeManualWithUnit || undefined,
			reasonForSelling: bikeReasonForSelling.trim() || undefined,
			usageSummary: bikeUsageSummary.trim() || undefined,
			knownIssues: bikeKnownIssues.trim() || undefined,
			titleAutoFilled: bikeTitleAutoFilled,
			descriptionTemplateUsed: bikeDescriptionTemplateUsed
		};
	}

	function validateBasics() {
		if (!category) return 'Choose a category.';
		if (isBikes) {
			const bikeProfileCheck = validateAndNormalizeBikesProfileData(buildBikeProfileCandidate());
			if (bikeProfileCheck.error) return bikeProfileCheck.error;
		}
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
		if (category === 'Lost and Found') {
			if (price === '') return '';
			const reward = Number(price);
			if (Number.isNaN(reward) || reward <= 0) return 'Reward must be greater than 0.';
			return '';
		}
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
			// client-side moderation preflight
			const flagged = await mod.check(`${title ?? ''} ${description ?? ''}`);
			if (flagged) {
				err = 'That text may break our language rules. Edit it and try again.';
				return;
			}

			// server call
			const form = new FormData();
			form.append('title', title.trim());
			form.append('description', description.trim());
			form.append('category', category as string);
			if (isBikes) {
				const bikeProfileCheck = validateAndNormalizeBikesProfileData(buildBikeProfileCandidate());
				if (bikeProfileCheck.error || !bikeProfileCheck.data) {
					throw new Error(bikeProfileCheck.error ?? 'Bike details are required.');
				}
				form.append('category_profile_data', JSON.stringify(bikeProfileCheck.data));
				form.append('used_preset_only', usedPresetOnly ? '1' : '0');
			}
			form.append('price_type', priceType);
			form.append('firm_price', priceType === 'fixed' && firmPrice ? '1' : '0');
			if (priceType === 'fixed' && minOffer !== '') {
				form.append('min_offer', String(minOffer));
			}
			if (priceType === 'fixed' && (firmPrice || minOffer !== '')) {
				form.append('auto_decline_message', autoDeclineMessage.trim());
			}
			if (priceType === 'free') {
				form.append('price', '0');
			} else if (priceType === 'fixed' && price !== '') {
				form.append('price', String(price));
			}
			form.append('currency', currency);
			form.append('locale', locale);
			form.append('age_confirmed', ageConfirmed ? '1' : '0');
			if (file) form.append('image', file);

			const res = await fetch('/api/ads', { method: 'POST', body: form });
			const retryAfter = res.headers.get('Retry-After');
			const raw = await res.text();
			let data: ApiResponse;
			try {
				data = JSON.parse(raw) as ApiResponse;
			} catch {
				data = { message: raw };
			}
			if (res.status === 429 && retryAfter) {
				const seconds = Number(retryAfter);
				if (Number.isFinite(seconds)) {
					const minutes = Math.ceil(seconds / 60);
					if (minutes >= 24 * 60) {
						const days = Math.ceil(minutes / (24 * 60));
						data.message =
							days <= 1
								? 'Please wait about a day before trying again.'
								: `Please wait about ${days} days before trying again.`;
					} else if (minutes >= 60) {
						const hours = Math.ceil(minutes / 60);
						data.message =
							hours <= 1
								? 'Please wait about an hour before trying again.'
								: `Please wait about ${hours} hours before trying again.`;
					} else {
						data.message =
							minutes <= 1
								? 'Please wait about a minute before trying again.'
								: `Please wait about ${minutes} minutes before trying again.`;
					}
				}
			}
			if (!res.ok || data?.success === false)
				throw new Error(data?.message || 'We could not post your ad. Try again.');

			if (data?.id) {
				window.location.href = `/ad/${data.id}`;
				return;
			}

			ok = data?.message || 'Ad submitted. You can post another if you like.';
			// reset
			title = '';
			description = '';
			category = '';
			price = '';
			firmPrice = false;
			minOffer = '';
			autoDeclineMessage = '';
			bikeSubtype = '';
			bikeType = '';
			bikeCondition = '';
			bikeSizePreset = '';
			bikeSizeManual = '';
			bikeSizeManualUnit = '';
			bikeReasonForSelling = '';
			bikeUsageSummary = '';
			bikeKnownIssues = '';
			bikeSizeManualEdited = false;
			titleManuallyEdited = false;
			descriptionManuallyEdited = false;
			bikeTitleAutoFilled = false;
			bikeDescriptionTemplateUsed = false;
			lastBikeTitleSeed = '';
			lastBikeDescriptionSeed = '';
			// clear image
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			previewUrl = null;
			file = null;
		} catch (e: unknown) {
			err = e instanceof Error ? e.message : 'We could not post your ad. Try again.';
		} finally {
			loading = false;
		}
	}

	function openPreview() {
		err = '';
		ok = '';
		showErrors = true;
		const v = validateBasics() || validateDetails();
		if (v) {
			err = v;
			return;
		}
		previewOpen = true;
	}

	function handleFormSubmit() {
		if (step < totalSteps) {
			goNext();
			return;
		}
		openPreview();
	}

	onDestroy(() => mod.destroy());

	$: previewPrice = formatPriceLabel({
		price: price === '' ? null : Number(price),
		category,
		currency,
		locale,
		showRewardWhenMissing: true
	});
</script>

<form class="post" on:submit|preventDefault={handleFormSubmit} aria-busy={loading}>
	<header class="head">
		<h1>Post an ad</h1>
	</header>

	<ol class="steps" aria-label="Posting steps">
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
				bind:bikeSubtype
				bind:bikeType
				bind:bikeCondition
				bind:bikeSizePreset
				bind:bikeSizeManual
				bind:bikeSizeManualUnit
				bind:bikeReasonForSelling
				bind:bikeUsageSummary
				bind:bikeKnownIssues
				bind:bikeSizeManualEdited
				bind:titleManuallyEdited
				bind:descriptionManuallyEdited
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
				bind:bikeSubtype
				bind:bikeType
				bind:bikeCondition
				bind:bikeSizePreset
				bind:bikeSizeManual
				bind:bikeSizeManualUnit
				bind:bikeReasonForSelling
				bind:bikeUsageSummary
				bind:bikeKnownIssues
				bind:bikeSizeManualEdited
				bind:titleManuallyEdited
				bind:descriptionManuallyEdited
				{loading}
				{showErrors}
			/>
			<div class="actions">
				<button type="button" class="btn ghost" on:click={goBack} disabled={loading}> Back </button>
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
				showMeta={false}
				{title}
				{category}
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
				bind:bikeSubtype
				bind:bikeType
				bind:bikeCondition
				bind:bikeSizePreset
				bind:bikeSizeManual
				bind:bikeSizeManualUnit
				bind:bikeReasonForSelling
				bind:bikeUsageSummary
				bind:bikeKnownIssues
				bind:bikeSizeManualEdited
				bind:titleManuallyEdited
				bind:descriptionManuallyEdited
				{loading}
				{showErrors}
			/>
			<div class="actions">
				<button type="button" class="btn ghost" on:click={goBack} disabled={loading}> Back </button>
				<button type="button" class="btn primary" on:click={openPreview} disabled={loading}>
					Preview
				</button>
			</div>
		</section>
	{/if}
</form>

{#if previewOpen}
	<div class="modal-backdrop" role="presentation" on:click={() => (previewOpen = false)}>
		<div
			class="modal"
			role="dialog"
			aria-modal="true"
			aria-label="Ad preview"
			on:click|stopPropagation
			on:keydown={(event) => {
				if (event.key === 'Escape') previewOpen = false;
			}}
			tabindex="-1"
		>
			<header class="modal-head">
				<h2>Preview</h2>
				<button
					type="button"
					class="btn ghost"
					on:click={() => (previewOpen = false)}
					disabled={loading}
				>
					Close
				</button>
			</header>
			<div class="modal-body">
				{#if err}
					<p class="notice error" role="alert">{err}</p>
				{/if}
				<div class="preview-card">
					{#if previewUrl}
						<img src={previewUrl} alt="" class="preview-img" />
					{/if}
					<div class="preview-meta">
						<div class="preview-category">{category || 'Category'}</div>
						<h3>{title || 'Your title'}</h3>
						{#if previewPrice}
							<div class="preview-price">{previewPrice}</div>
						{/if}
						<p>{description || 'Your description will appear here.'}</p>
					</div>
				</div>
				<div class="preview-confirm">
					<label class="checkbox">
						<input type="checkbox" bind:checked={ageConfirmed} disabled={loading} />
						<span>I am 18 or older.</span>
					</label>
				</div>
			</div>
			<footer class="modal-actions">
				<button
					type="button"
					class="btn ghost"
					on:click={() => (previewOpen = false)}
					disabled={loading}
				>
					Edit
				</button>
				<button type="button" class="btn primary" on:click={handleSubmit} disabled={loading}>
					Post ad
				</button>
			</footer>
		</div>
	</div>
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

	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: color-mix(in srgb, var(--bg) 25%, rgba(0, 0, 0, 0.6));
		display: grid;
		place-items: center;
		padding: 20px;
		z-index: 50;
	}
	.modal {
		width: min(720px, 100%);
		max-height: 90vh;
		overflow: auto;
		background: var(--surface);
		border: 1px solid var(--hairline);
		border-radius: 18px;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
		display: grid;
		gap: 16px;
		padding: 18px;
	}
	.modal-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	.modal-head h2 {
		margin: 0;
		font-size: 1.3rem;
	}
	.modal-body {
		display: grid;
		gap: 12px;
	}
	.preview-card {
		display: grid;
		gap: 16px;
		grid-template-columns: minmax(0, 1fr);
	}
	.preview-img {
		width: 100%;
		border-radius: 14px;
		aspect-ratio: 4 / 3;
		object-fit: cover;
		background: color-mix(in srgb, var(--fg) 6%, transparent);
	}
	.preview-meta {
		display: grid;
		gap: 8px;
	}
	.preview-meta h3 {
		margin: 0;
		font-size: 1.2rem;
	}
	.preview-category {
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		font-size: 0.75rem;
		color: color-mix(in srgb, var(--fg) 70%, transparent);
	}
	.preview-price {
		font-weight: 800;
		font-size: 1.1rem;
	}
	.preview-confirm {
		display: flex;
		align-items: center;
		gap: 8px;
		padding-top: 4px;
	}
	.preview-confirm .checkbox {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-weight: 600;
	}
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
	}
</style>
