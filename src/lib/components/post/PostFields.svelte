<script lang="ts">
	import {
		CATEGORIES,
		type Category,
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
	export let isFree = false;
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
	$: priceInvalid =
		showErrors &&
		!isFree &&
		(price === '' || Number.isNaN(Number(price)) || Number(price) < 0);
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
				aria-invalid={categoryInvalid}
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
				maxlength={MAX_TITLE_LENGTH}
				placeholder="e.g., IKEA MALM desk — great condition"
				required
				disabled={loading}
				aria-invalid={titleInvalid}
			/>
			<small class="muted">Min {MIN_TITLE_LENGTH}, max {MAX_TITLE_LENGTH}</small>
		</div>

		<div class="row">
			<div class="field">
				<label for="price">
					Price {#if isFree}<span class="muted">(set to €0 for Free / Giveaway)</span>{/if}
				</label>
				<input
					id="price"
					type="number"
					min="0"
					step="1"
					inputmode="numeric"
					pattern="[0-9]*"
					bind:value={price}
					required={!isFree}
					disabled={isFree || loading}
					placeholder={isFree ? '0' : 'e.g., 50'}
					aria-invalid={priceInvalid}
				/>
			</div>
		</div>
	{/if}

	{#if step === 2}
		<div class="field">
			<label for="description"
				>Description <span class="muted">({descLen}/{MAX_DESC_LENGTH})</span></label
			>
			<textarea
				id="description"
				bind:value={description}
				maxlength={MAX_DESC_LENGTH}
				rows="6"
				placeholder="Key details, pickup area, condition…"
				required
				disabled={loading}
				aria-invalid={descriptionInvalid}
			></textarea>
			<small class="muted">Min {MIN_DESC_LENGTH}, max {MAX_DESC_LENGTH}</small>
		</div>

		<div class="row">
			<label class="checkbox">
				<input
					type="checkbox"
					bind:checked={ageConfirmed}
					disabled={loading}
					aria-invalid={ageInvalid}
				/>
				<span>I am 18 or older.</span>
			</label>
		</div>
	{/if}
</section>

<style>
	.fields {
		display: grid;
		gap: 12px;
	}
	.field {
		display: grid;
		gap: 6px;
	}
	.row {
		display: flex;
		gap: 12px;
		align-items: flex-end;
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
	}
	.muted {
		color: color-mix(in srgb, var(--fg) 55%, transparent);
	}
</style>
