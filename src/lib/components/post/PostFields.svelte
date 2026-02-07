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
	import {
		BIKE_ADULT_SIZE_PRESETS,
		BIKE_CONDITION_OPTIONS,
		BIKE_KIDS_SIZE_PRESETS,
		BIKE_MIN_OFFER_PRESET_RATIOS,
		BIKE_PHOTO_CHECKLIST,
		BIKE_SUBTYPE_OPTIONS,
		BIKE_TYPE_OPTIONS,
		getBikePriceHint,
		isBikesCategory,
		type BikeCondition,
		type BikeSizePreset,
		type BikeSubtype,
		type BikeType
	} from '$lib/category-profiles';

	// two-way bind from parent
	export let category: Category | '' = '';
	export let title = '';
	export let description = '';
	export let price: number | '' = '';
	export let priceType: PriceType = 'fixed';
	export let firmPrice = false;
	export let minOffer: number | '' = '';
	export let autoDeclineMessage = '';
	export let bikeSubtype: BikeSubtype | '' = '';
	export let bikeType: BikeType | '' = '';
	export let bikeCondition: BikeCondition | '' = '';
	export let bikeSizePreset: BikeSizePreset | '' = '';
	export let bikeSizeManual = '';
	export let bikeSizeManualEdited = false;
	export let titleManuallyEdited = false;
	export let descriptionManuallyEdited = false;
	export let step = 1;
	export let showErrors = false;

	// validation messages from parent (optional)
	export let loading = false;

	$: titleLen = title.length;
	$: descLen = description.length;
	$: categoryInvalid = showErrors && !category;
	$: titleInvalid =
		showErrors &&
		(!title.trim() || title.trim().length < MIN_TITLE_LENGTH || title.length > MAX_TITLE_LENGTH);
	$: isBikes = isBikesCategory(category);
	$: isKidsBike = bikeSubtype === 'kids';
	$: poaAllowed = category ? POA_CATEGORY_SET.has(category) && !isBikes : false;
	$: isLostAndFound = category === 'Lost and Found';
	$: bikeSubtypeInvalid = showErrors && isBikes && !bikeSubtype;
	$: bikeConditionInvalid = showErrors && isBikes && !bikeCondition;
	$: kidsSizeInvalid =
		showErrors &&
		isBikes &&
		isKidsBike &&
		(!bikeSizePreset ||
			!BIKE_KIDS_SIZE_PRESETS.includes(bikeSizePreset as (typeof BIKE_KIDS_SIZE_PRESETS)[number]));
	$: adultSizeInvalid =
		showErrors &&
		isBikes &&
		bikeSubtype !== '' &&
		!isKidsBike &&
		!bikeSizePreset &&
		!bikeSizeManual.trim();
	$: bikeSizeInvalid = kidsSizeInvalid || adultSizeInvalid;
	$: bikePriceHint = isBikes ? getBikePriceHint(bikeSubtype) : '';
	$: numericPrice = price === '' ? Number.NaN : Number(price);
	$: canUseBikeMinOfferPresets =
		isBikes &&
		priceType === 'fixed' &&
		!firmPrice &&
		Number.isFinite(numericPrice) &&
		numericPrice > 0;
	$: titlePlaceholder = isBikes
		? 'e.g., Road bike - size M'
		: 'e.g., IKEA MALM desk - great condition';
	$: descriptionPlaceholder = isBikes
		? 'Reason for selling, usage, and known issues...'
		: 'Key details, pickup area, condition...';
	$: rewardInvalid =
		showErrors &&
		isLostAndFound &&
		price !== '' &&
		(Number.isNaN(Number(price)) || Number(price) <= 0);
	$: priceInvalid =
		showErrors &&
		!isLostAndFound &&
		((priceType === 'fixed' &&
			(price === '' || Number.isNaN(Number(price)) || Number(price) <= 0)) ||
			(priceType === 'free' && Number(price) !== 0));
	$: minOfferInvalid =
		showErrors &&
		!isLostAndFound &&
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

	function pickBikeSubtype(nextSubtype: BikeSubtype) {
		bikeSubtype = nextSubtype;
		if (nextSubtype === 'kids') {
			bikeType = 'kids';
			bikeSizeManual = '';
			if (
				bikeSizePreset &&
				!BIKE_KIDS_SIZE_PRESETS.includes(bikeSizePreset as (typeof BIKE_KIDS_SIZE_PRESETS)[number])
			) {
				bikeSizePreset = '';
			}
			return;
		}
		if (bikeType === 'kids') bikeType = '';
		if (nextSubtype === 'electric' && !bikeType) bikeType = 'electric';
		if (
			bikeSizePreset &&
			!BIKE_ADULT_SIZE_PRESETS.includes(bikeSizePreset as (typeof BIKE_ADULT_SIZE_PRESETS)[number])
		) {
			bikeSizePreset = '';
		}
	}

	function pickBikeSizePreset(nextSize: BikeSizePreset) {
		bikeSizePreset = nextSize;
		bikeSizeManual = '';
	}

	function applyBikeMinOfferPreset(ratio: number) {
		if (!Number.isFinite(numericPrice) || numericPrice <= 0) return;
		minOffer = Math.max(1, Math.floor(numericPrice * ratio));
	}
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

		{#if isBikes}
			<div class="bike-panel">
				<div class="field">
					<p class="group-label">Bike subtype</p>
					<div class="pill-row" role="radiogroup" aria-label="Bike subtype">
						{#each BIKE_SUBTYPE_OPTIONS as option (option.value)}
							<button
								type="button"
								class="pill"
								class:active={bikeSubtype === option.value}
								on:click={() => pickBikeSubtype(option.value)}
								disabled={loading}
								aria-pressed={bikeSubtype === option.value}
							>
								{option.label}
							</button>
						{/each}
					</div>
					{#if bikeSubtypeInvalid}
						<small class="error-text">Choose a bike subtype.</small>
					{/if}
				</div>

				<div class="field">
					<p class="group-label">Bike type <span class="muted">(optional)</span></p>
					<div class="pill-row" role="radiogroup" aria-label="Bike type">
						{#each BIKE_TYPE_OPTIONS as option (option.value)}
							<button
								type="button"
								class="pill"
								class:active={bikeType === option.value}
								on:click={() => (bikeType = option.value)}
								disabled={loading}
								aria-pressed={bikeType === option.value}
							>
								{option.label}
							</button>
						{/each}
					</div>
				</div>

				<div class="field">
					<p class="group-label">Condition</p>
					<div class="pill-row" role="radiogroup" aria-label="Condition">
						{#each BIKE_CONDITION_OPTIONS as option (option.value)}
							<button
								type="button"
								class="pill"
								class:active={bikeCondition === option.value}
								on:click={() => (bikeCondition = option.value)}
								disabled={loading}
								aria-pressed={bikeCondition === option.value}
							>
								{option.label}
							</button>
						{/each}
					</div>
					{#if bikeConditionInvalid}
						<small class="error-text">Choose a condition.</small>
					{/if}
				</div>

				<div class="field">
					<p class="group-label">Size</p>
					{#if bikeSubtype === 'kids'}
						<div class="pill-row" role="radiogroup" aria-label="Kids size">
							{#each BIKE_KIDS_SIZE_PRESETS as preset (preset)}
								<button
									type="button"
									class="pill"
									class:active={bikeSizePreset === preset}
									on:click={() => pickBikeSizePreset(preset)}
									disabled={loading}
									aria-pressed={bikeSizePreset === preset}
								>
									{preset}
								</button>
							{/each}
						</div>
					{:else if bikeSubtype === 'adult' || bikeSubtype === 'electric'}
						<div class="pill-row" role="radiogroup" aria-label="Adult size">
							{#each BIKE_ADULT_SIZE_PRESETS as preset (preset)}
								<button
									type="button"
									class="pill"
									class:active={bikeSizePreset === preset}
									on:click={() => pickBikeSizePreset(preset)}
									disabled={loading}
									aria-pressed={bikeSizePreset === preset}
								>
									{preset}
								</button>
							{/each}
						</div>
						<input
							id="bike-size-manual"
							type="text"
							bind:value={bikeSizeManual}
							disabled={loading}
							placeholder="or enter size in cm/inches"
							on:input={() => {
								if (bikeSizeManual.trim()) bikeSizePreset = '';
								bikeSizeManualEdited = true;
							}}
						/>
					{:else}
						<small class="muted">Choose subtype first.</small>
					{/if}
					{#if bikeSizeInvalid}
						<small class="error-text">Add a size.</small>
					{/if}
				</div>
			</div>
		{/if}

		<div class="field">
			<label for="title">Title <span class="muted">({titleLen}/{MAX_TITLE_LENGTH})</span></label>
			<input
				id="title"
				type="text"
				bind:value={title}
				minlength={MIN_TITLE_LENGTH}
				maxlength={MAX_TITLE_LENGTH}
				placeholder={titlePlaceholder}
				required
				disabled={loading}
				aria-invalid={showErrors ? titleInvalid : undefined}
				on:input={() => {
					titleManuallyEdited = true;
				}}
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
				placeholder={descriptionPlaceholder}
				required
				disabled={loading}
				aria-invalid={showErrors ? descriptionInvalid : undefined}
				on:input={() => {
					descriptionManuallyEdited = true;
				}}
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
		{:else if category === 'Lost and Found'}
			<div class="row">
				<div class="field">
					<label for="reward">Reward (optional)</label>
					<input
						id="reward"
						type="number"
						min="1"
						step="1"
						inputmode="numeric"
						pattern="[0-9]*"
						bind:value={price}
						disabled={loading}
						placeholder="e.g., 50"
						aria-invalid={showErrors ? rewardInvalid : undefined}
					/>
					<small class="muted">Optional. Leave blank if no reward is offered.</small>
				</div>
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
					{#if priceType === 'fixed'}
						<label for="price">Price</label>
					{:else}
						<span class="price-label">Price</span>
					{/if}
					<div class="price-slot">
						{#if priceType === 'fixed'}
							<input
								id="price"
								type="number"
								min="0"
								step="1"
								inputmode="numeric"
								pattern="[0-9]*"
								bind:value={price}
								required
								disabled={loading}
								placeholder="e.g., 50"
								aria-invalid={showErrors ? priceInvalid : undefined}
							/>
						{:else}
							<span class="price-badge">{priceType === 'free' ? 'Free' : 'POA'}</span>
						{/if}
					</div>
				</div>
			</div>
			{#if bikePriceHint}
				<small class="muted">{bikePriceHint}</small>
			{/if}
		{/if}

		{#if priceType === 'fixed' && category !== 'Lost and Found'}
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
					{#if canUseBikeMinOfferPresets}
						<div class="pill-row">
							{#each BIKE_MIN_OFFER_PRESET_RATIOS as ratio (ratio)}
								<button
									type="button"
									class="pill"
									on:click={() => applyBikeMinOfferPreset(ratio)}
									disabled={loading}
								>
									{Math.round(ratio * 100)}%
								</button>
							{/each}
							<button
								type="button"
								class="pill"
								on:click={() => (minOffer = '')}
								disabled={loading}
							>
								Custom
							</button>
						</div>
					{/if}
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

	{#if step === 3 && isBikes}
		<div class="guide-card">
			<h3>Bike photo checklist</h3>
			<ul>
				{#each BIKE_PHOTO_CHECKLIST as item (item)}
					<li>{item}</li>
				{/each}
			</ul>
		</div>
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
	.bike-panel {
		border: 1px solid var(--hairline);
		border-radius: 14px;
		padding: 12px;
		display: grid;
		gap: 12px;
		background: color-mix(in srgb, var(--fg) 4%, var(--surface));
	}
	.pill-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.pill {
		border: 1px solid color-mix(in srgb, var(--fg) 18%, transparent);
		background: var(--surface);
		color: inherit;
		border-radius: 999px;
		padding: 7px 12px;
		font-weight: 700;
		cursor: pointer;
	}
	.pill.active {
		background: color-mix(in srgb, var(--fg) 16%, var(--bg));
		border-color: color-mix(in srgb, var(--fg) 36%, transparent);
	}
	.error-text {
		color: var(--accent-orange);
		font-weight: 700;
	}
	.guide-card {
		border: 1px solid var(--hairline);
		border-radius: 14px;
		padding: 12px;
		background: color-mix(in srgb, var(--fg) 6%, var(--surface));
	}
	.guide-card h3 {
		margin: 0 0 8px;
		font-size: 1rem;
	}
	.guide-card ul {
		margin: 0;
		padding-left: 18px;
		display: grid;
		gap: 4px;
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
	.group-label {
		margin: 0;
		font-weight: 700;
	}
	.price-label {
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
	.price-slot {
		min-height: 44px;
		display: flex;
		align-items: center;
		width: 100%;
	}
	.price-slot input {
		width: 100%;
	}
	.price-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 6px 10px;
		border-radius: 4px;
		font-weight: 900;
		background: color-mix(in srgb, var(--fg) 18%, var(--bg));
		color: var(--fg);
	}
</style>
