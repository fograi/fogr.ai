<script lang="ts">
	import {
		CATEGORIES,
		type Category,
		type PriceType,
		POA_CATEGORY_SET,
		MIN_TITLE_LENGTH,
		MAX_TITLE_LENGTH,
		MIN_DESC_LENGTH,
		MAX_DESC_LENGTH
	} from '$lib/constants';

	// two-way bind from parent
	export let category: Category | '' = '';
	export let title = '';
	export let description = '';
	export let price: number | '' = '';
	export let priceType: PriceType = 'fixed';
	export let firmPrice = false;
	export let minOffer: number | '' = '';
	export let autoDeclineMessage = '';
	export let directContactEnabled = false;
	export let ageConfirmed = false;
	export let step = 1;
	export let showErrors = false;

	// validation messages from parent (optional)
	export let loading = false;

	$: titleLen = title.length;
	$: descLen = description.length;
	$: categoryInvalid = showErrors && !category;
	$: titleInvalid =
		showErrors &&
		(!title.trim() ||
			title.trim().length < MIN_TITLE_LENGTH ||
			title.length > MAX_TITLE_LENGTH);
	$: poaAllowed = category ? POA_CATEGORY_SET.has(category) : false;
	$: priceInvalid =
		showErrors &&
		((priceType === 'fixed' &&
			(price === '' || Number.isNaN(Number(price)) || Number(price) <= 0)) ||
			(priceType === 'free' && Number(price) !== 0));
	$: minOfferInvalid =
		showErrors &&
		priceType === 'fixed' &&
		!firmPrice &&
		minOffer !== '' &&
		(Number.isNaN(Number(minOffer)) ||
			Number(minOffer) <= 0 ||
			(price !== '' && Number(minOffer) >= Number(price)));
	$: descriptionInvalid =
		showErrors &&
		(!description.trim() ||
			description.trim().length < MIN_DESC_LENGTH ||
			description.length > MAX_DESC_LENGTH);
	$: ageInvalid = showErrors && !ageConfirmed;
</script>

<section class="fields" aria-busy={loading}>
	{#if step === 1}
		<div class="field">
			<label for="category">Category</label>
			<select
				id="category"
				bind:value={category}
				disabled={loading}
				aria-invalid={showErrors ? categoryInvalid : undefined}
			>
				<option value="" disabled selected hidden>Choose…</option>
				{#each CATEGORIES as c (c)}
					<option value={c}>{c}</option>
				{/each}
			</select>
		</div>

		<div class="field">
			<label for="title">Title <span class="muted">({titleLen}/{MAX_TITLE_LENGTH})</span></label>
			<input
				id="title"
				type="text"
				bind:value={title}
				minlength={MIN_TITLE_LENGTH}
				maxlength={MAX_TITLE_LENGTH}
				placeholder="e.g., IKEA MALM desk — great condition"
				required
				disabled={loading}
				aria-invalid={showErrors ? titleInvalid : undefined}
			/>
			<small class="muted">Min {MIN_TITLE_LENGTH}, max {MAX_TITLE_LENGTH}</small>
		</div>

		<div class="field">
			<label for="description"
				>Description <span class="muted">({descLen}/{MAX_DESC_LENGTH})</span></label
			>
			<textarea
				id="description"
				bind:value={description}
				minlength={MIN_DESC_LENGTH}
				maxlength={MAX_DESC_LENGTH}
				rows="6"
				placeholder="Key details, pickup area, condition…"
				required
				disabled={loading}
				aria-invalid={showErrors ? descriptionInvalid : undefined}
			></textarea>
			<small class="muted">Min {MIN_DESC_LENGTH}, max {MAX_DESC_LENGTH}</small>
		</div>

	{/if}

	{#if step === 2}
		{#if category === 'Free / Giveaway'}
			<div class="free-card" aria-live="polite">
				<div class="free-pill">Free / Giveaway</div>
				<p class="free-text">This listing will be shown as free. No price required.</p>
				<div class="free-meta">
					<span class="label">Price</span>
					<span class="value">Free</span>
				</div>
				<small class="muted">Need a price? Go back and choose another category.</small>
			</div>
		{:else}
			<div class="row">
				<div class="field">
					<label for="price-type">Price type</label>
					<select id="price-type" bind:value={priceType} disabled={loading}>
						<option value="fixed">Fixed price</option>
						<option value="free">Free</option>
						{#if poaAllowed}
							<option value="poa">Price on application</option>
						{/if}
					</select>
				</div>
				<div class="field">
					<label for="price">
						Price
						{#if priceType === 'free'}
							<span class="muted">(shown as Free)</span>
						{:else if priceType === 'poa'}
							<span class="muted">(shown as POA)</span>
						{/if}
					</label>
					<input
						id="price"
						type="number"
						min="0"
						step="1"
						inputmode="numeric"
						pattern="[0-9]*"
						bind:value={price}
						required={priceType === 'fixed'}
						disabled={priceType !== 'fixed' || loading}
						placeholder={priceType === 'fixed' ? 'e.g., 50' : '—'}
						aria-invalid={showErrors ? priceInvalid : undefined}
					/>
				</div>
			</div>
		{/if}

		{#if priceType === 'fixed'}
			<div class="field">
				<label class="checkbox">
					<input type="checkbox" bind:checked={firmPrice} disabled={loading} />
					<span>Firm price (no offers)</span>
				</label>
				<small class="muted">Turn this on to auto-decline offers.</small>
			</div>
			{#if !firmPrice}
				<div class="field">
					<label for="min-offer">Minimum offer (optional)</label>
					<input
						id="min-offer"
						type="number"
						min="1"
						step="1"
						inputmode="numeric"
						pattern="[0-9]*"
						bind:value={minOffer}
						disabled={loading}
						placeholder="e.g., 40"
						aria-invalid={showErrors ? minOfferInvalid : undefined}
					/>
					<small class="muted">Auto-decline lower offers.</small>
				</div>
			{/if}
			{#if firmPrice || minOffer !== ''}
				<div class="field">
					<label for="auto-decline">Auto-decline message (optional)</label>
					<input
						id="auto-decline"
						type="text"
						bind:value={autoDeclineMessage}
						disabled={loading}
						placeholder="e.g., Thanks — price is firm."
					/>
				</div>
			{/if}
		{/if}
	{/if}

	{#if step === 3}
		<div class="row">
			<label class="checkbox">
				<input
					type="checkbox"
					bind:checked={ageConfirmed}
					disabled={loading}
					aria-invalid={showErrors ? ageInvalid : undefined}
				/>
				<span>I am 18 or older.</span>
			</label>
		</div>

		<div class="row">
			<label class="checkbox">
				<input type="checkbox" bind:checked={directContactEnabled} disabled={loading} />
				<span>Allow direct contact after first message.</span>
			</label>
		</div>
		<small class="muted">We will only reveal your email after a buyer messages you.</small>
	{/if}
</section>

<style>
	.fields {
		display: grid;
		gap: 12px;
		width: 100%;
	}
	.field {
		display: grid;
		gap: 6px;
		width: 100%;
	}
	.row {
		display: flex;
		gap: 12px;
		align-items: flex-end;
		width: 100%;
	}
	.row > .field {
		flex: 1 1 auto;
		min-width: 0;
	}

	.free-card {
		border: 1px solid var(--hairline);
		background: color-mix(in srgb, var(--fg) 6%, var(--surface));
		border-radius: 14px;
		padding: 16px;
		display: grid;
		gap: 10px;
	}
	.free-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 10px;
		border-radius: 999px;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		background: color-mix(in srgb, var(--fg) 16%, var(--bg));
		color: var(--fg);
		width: max-content;
	}
	.free-text {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 80%, transparent);
		font-weight: 600;
	}
	.free-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 12px;
		border-radius: 10px;
		background: color-mix(in srgb, var(--fg) 10%, var(--bg));
		font-weight: 800;
	}
	.free-meta .label {
		font-size: 0.9rem;
		color: color-mix(in srgb, var(--fg) 70%, transparent);
	}
	.free-meta .value {
		font-size: 1rem;
	}
	.checkbox {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-weight: 600;
	}
	.checkbox input {
		width: 16px;
		height: 16px;
	}
	label {
		font-weight: 700;
	}
	input,
	select,
	textarea {
		border: 1px solid color-mix(in srgb, var(--fg) 18%, transparent);
		background: var(--surface);
		color: inherit;
		border-radius: 10px;
		padding: 10px 12px;
		font: inherit;
		width: 100%;
	}
	.muted {
		color: color-mix(in srgb, var(--fg) 55%, transparent);
	}
</style>
