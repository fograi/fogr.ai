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

	// validation messages from parent (optional)
	export let err = '';
	export let ok = '';
	export let loading = false;

	$: titleLen = title.length;
	$: descLen = description.length;
</script>

<section class="fields" aria-busy={loading}>
	<div class="field">
		<label for="category">Category</label>
		<select id="category" bind:value={category} disabled={loading}>
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
			maxlength={MAX_DESC_LENGTH}
			rows="6"
			placeholder="Key details, pickup area, condition…"
			required
			disabled={loading}
		></textarea>
		<small class="muted">Min {MIN_DESC_LENGTH}, max {MAX_DESC_LENGTH}</small>
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
			/>
		</div>
	</div>

	<div class="row">
		<label class="checkbox">
			<input type="checkbox" bind:checked={ageConfirmed} disabled={loading} />
			<span>I am 18 or older.</span>
		</label>
	</div>

	{#if err}<p class="error" role="alert">{err}</p>{/if}
	{#if ok}<p class="ok" role="status">{ok}</p>{/if}
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
	.error {
		color: var(--danger);
		font-weight: 700;
		margin: 4px 0;
	}
	.ok {
		color: var(--success);
		font-weight: 700;
		margin: 4px 0;
	}
</style>
