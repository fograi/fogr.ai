<script lang="ts">
	import AdCard from '$lib/components/AdCard.svelte';
	import { resolve } from '$app/paths';

	let { data } = $props();
	let filtersForm: HTMLFormElement | null = null;

	const categoryPath = $derived(
		resolve('/(public)/category/[slug]', { slug: String(data.categorySlug ?? '') })
	);
	const isBikes = $derived(data.category === 'Bikes');

	function submitFilters() {
		if (!filtersForm) return;
		if (typeof filtersForm.requestSubmit === 'function') {
			filtersForm.requestSubmit();
		} else {
			filtersForm.submit();
		}
	}

	function buildPageHref(targetPage: number) {
		const params = new URLSearchParams();
		params.set('page', String(targetPage));
		if (data.filters?.q) params.set('q', data.filters.q);
		if (data.filters?.sort && data.filters.sort !== 'newest') params.set('sort', data.filters.sort);
		if (data.filters?.priceState) params.set('price_state', data.filters.priceState);
		if (data.filters?.minPrice) params.set('min_price', data.filters.minPrice);
		if (data.filters?.maxPrice) params.set('max_price', data.filters.maxPrice);
		if (data.filters?.bikeSubtype) params.set('bike_subtype', data.filters.bikeSubtype);
		if (data.filters?.bikeType) params.set('bike_type', data.filters.bikeType);
		if (data.filters?.bikeCondition) params.set('bike_condition', data.filters.bikeCondition);
		if (data.filters?.bikeSize) params.set('bike_size', data.filters.bikeSize);
		return `${categoryPath}?${params.toString()}`;
	}
</script>

<section class="category-page">
	<header class="head">
		<a class="back" href={resolve('/')} rel="external">All listings</a>
		<h1>{data.category}</h1>
		<p class="sub">Browse local listings with focused filters.</p>
	</header>

	<form bind:this={filtersForm} class="filters" method="GET" action={categoryPath}>
		<div class="filters-main">
			<div class="field field--search">
				<label for="cat-q">Search in {data.category}</label>
				<input
					id="cat-q"
					name="q"
					type="search"
					value={data.filters.q}
					placeholder="Search titles or details"
				/>
			</div>
			<div class="field">
				<label for="cat-sort">Sort</label>
				<select id="cat-sort" name="sort" value={data.filters.sort} onchange={submitFilters}>
					{#each data.options.sort as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</div>
			<div class="field">
				<label for="cat-price-state">Price type</label>
				<select
					id="cat-price-state"
					name="price_state"
					value={data.filters.priceState}
					onchange={submitFilters}
				>
					<option value="">Any</option>
					<option value="fixed">Fixed</option>
					<option value="free">Free</option>
					<option value="poa">POA</option>
				</select>
			</div>
			<div class="field field--price">
				<label for="cat-min-price">Price range</label>
				<div class="range-row">
					<input
						id="cat-min-price"
						name="min_price"
						type="number"
						min="0"
						step="1"
						inputmode="numeric"
						pattern="[0-9]*"
						value={data.filters.minPrice}
						placeholder="Min"
					/>
					<span aria-hidden="true">to</span>
					<input
						id="cat-max-price"
						name="max_price"
						type="number"
						min="0"
						step="1"
						inputmode="numeric"
						pattern="[0-9]*"
						value={data.filters.maxPrice}
						placeholder="Max"
					/>
				</div>
			</div>
		</div>

		{#if isBikes}
			<details
				class="bike-filters"
				open={!!(
					data.filters.bikeSubtype ||
					data.filters.bikeType ||
					data.filters.bikeCondition ||
					data.filters.bikeSize
				)}
			>
				<summary>Bike filters</summary>
				<div class="bike-grid">
					<div class="field bike-pills">
						<span class="label">Subtype</span>
						<div class="pill-group" role="radiogroup" aria-label="Bike subtype">
							<label class="pill" class:active={!data.filters.bikeSubtype}>
								<input
									type="radio"
									name="bike_subtype"
									value=""
									checked={!data.filters.bikeSubtype}
									onchange={submitFilters}
								/>
								<span>All</span>
							</label>
							{#each data.options.bikeSubtype as option (option.value)}
								<label class="pill" class:active={data.filters.bikeSubtype === option.value}>
									<input
										type="radio"
										name="bike_subtype"
										value={option.value}
										checked={data.filters.bikeSubtype === option.value}
										onchange={submitFilters}
									/>
									<span>{option.label}</span>
								</label>
							{/each}
						</div>
					</div>

					<div class="field">
						<label for="cat-bike-type">Bike type</label>
						<select
							id="cat-bike-type"
							name="bike_type"
							value={data.filters.bikeType}
							onchange={submitFilters}
						>
							<option value="">Any bike type</option>
							{#each data.options.bikeType as option (option.value)}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>

					<div class="field">
						<label for="cat-bike-condition">Condition</label>
						<select
							id="cat-bike-condition"
							name="bike_condition"
							value={data.filters.bikeCondition}
							onchange={submitFilters}
						>
							<option value="">Any condition</option>
							{#each data.options.bikeCondition as option (option.value)}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>

					<div class="field">
						<label for="cat-bike-size">Size</label>
						<select
							id="cat-bike-size"
							name="bike_size"
							value={data.filters.bikeSize}
							onchange={submitFilters}
						>
							<option value="">Any size</option>
							{#each data.options.bikeSize as size (size)}
								<option value={size}>{size}</option>
							{/each}
						</select>
					</div>
				</div>
			</details>
		{/if}

		<div class="actions">
			<button type="submit">Apply</button>
			<a href={categoryPath} rel="external">Clear</a>
		</div>
	</form>

	{#if data?.error}
		<div class="error-banner" role="alert">
			<strong>Could not load listings.</strong>
			<span>{data.error.message}</span>
			{#if data.error.requestId}
				<span class="req">Request ID: {data.error.requestId}</span>
			{/if}
		</div>
	{/if}

	<ul class="grid">
		{#each data.ads as ad (ad.id)}
			<AdCard {...ad} />
		{/each}
	</ul>

	{#if data.ads.length === 0}
		<p class="empty">No listings match these filters yet.</p>
	{/if}

	<nav class="pager" aria-label="Pagination">
		{#if data.page > 1}
			<a class="pager__link" href={buildPageHref(data.page - 1)} rel="external">Prev</a>
		{/if}
		{#if data.nextPage}
			<a class="pager__link" href={buildPageHref(data.nextPage)} rel="external">Next</a>
		{/if}
	</nav>
</section>

<style>
	.category-page {
		max-width: var(--page-max);
		margin: 0 auto;
		padding: 8px var(--page-pad) 24px;
		display: grid;
		gap: 14px;
	}
	.head {
		display: grid;
		gap: 4px;
	}
	.head h1 {
		margin: 0;
	}
	.back {
		font-size: 0.9rem;
		text-decoration: none;
		font-weight: 600;
	}
	.sub {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 68%, transparent);
	}

	.filters {
		border: 1px solid var(--hairline);
		border-radius: 14px;
		padding: 12px;
		display: grid;
		gap: 10px;
		background: color-mix(in srgb, var(--fg) 3%, var(--surface));
	}
	.filters-main {
		display: grid;
		grid-template-columns: minmax(180px, 2fr) repeat(2, minmax(130px, 1fr)) minmax(220px, 1.4fr);
		gap: 10px;
	}
	.field {
		display: grid;
		gap: 6px;
	}
	.field > label,
	.field > .label {
		font-size: 0.82rem;
		font-weight: 700;
	}
	.field input,
	.field select {
		height: 40px;
		padding: 0 10px;
		border: 1px solid var(--hairline);
		border-radius: 10px;
		background: var(--surface);
		color: inherit;
		min-width: 0;
	}
	.range-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
		gap: 8px;
		align-items: center;
	}
	.range-row span {
		font-size: 0.85rem;
		color: color-mix(in srgb, var(--fg) 65%, transparent);
	}

	.bike-filters {
		border: 1px solid color-mix(in srgb, var(--fg) 15%, transparent);
		border-radius: 12px;
		padding: 8px 10px 10px;
		background: color-mix(in srgb, var(--fg) 4%, var(--surface));
	}
	.bike-filters > summary {
		cursor: pointer;
		font-weight: 700;
	}
	.bike-grid {
		margin-top: 8px;
		display: grid;
		grid-template-columns: minmax(0, 2fr) repeat(3, minmax(0, 1fr));
		gap: 10px;
	}
	.bike-pills {
		align-content: start;
	}
	.pill-group {
		display: flex;
		flex-wrap: wrap;
		gap: 7px;
	}
	.pill {
		border: 1px solid color-mix(in srgb, var(--fg) 18%, transparent);
		background: var(--surface);
		color: inherit;
		border-radius: 999px;
		padding: 6px 10px;
		font-size: 0.85rem;
		font-weight: 700;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
	}
	.pill input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}
	.pill.active {
		background: color-mix(in srgb, var(--fg) 18%, var(--bg));
		border-color: color-mix(in srgb, var(--fg) 30%, transparent);
	}

	.actions {
		display: flex;
		gap: 10px;
		justify-content: flex-end;
		align-items: center;
	}
	.actions button {
		border: 1px solid var(--hairline);
		background: var(--surface);
		color: inherit;
		border-radius: 10px;
		padding: 8px 14px;
		font-weight: 700;
		cursor: pointer;
	}
	.actions a {
		text-decoration: none;
		font-weight: 600;
	}

	.error-banner {
		padding: 10px 12px;
		border: 1px solid color-mix(in srgb, var(--accent-orange) 35%, transparent);
		background: var(--tangerine-bg);
		color: var(--accent-orange);
		border-radius: 8px;
		display: grid;
		gap: 4px;
	}
	.error-banner .req {
		font-family:
			ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
			monospace;
		font-size: 0.85rem;
	}

	.grid {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 14px;
	}
	.empty {
		margin: 6px 0 0;
		color: color-mix(in srgb, var(--fg) 70%, transparent);
	}
	.pager {
		display: flex;
		justify-content: center;
		gap: 12px;
		margin: 6px 0 2px;
	}
	.pager__link {
		text-decoration: none;
		padding: 6px 12px;
		border: 1px solid color-mix(in srgb, var(--fg) 25%, transparent);
		border-radius: 8px;
		color: inherit;
		background: var(--surface);
	}

	@media (max-width: 1000px) {
		.filters-main {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.field--search,
		.field--price {
			grid-column: 1 / -1;
		}
		.bike-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.bike-pills {
			grid-column: 1 / -1;
		}
	}
	@media (max-width: 640px) {
		.filters-main {
			grid-template-columns: 1fr;
		}
		.field--search,
		.field--price {
			grid-column: auto;
		}
		.bike-grid {
			grid-template-columns: 1fr;
		}
		.actions {
			justify-content: space-between;
		}
	}
</style>
