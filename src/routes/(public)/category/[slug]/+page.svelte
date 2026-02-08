<script lang="ts">
	import AdCard from '$lib/components/AdCard.svelte';
	import { resolve } from '$app/paths';

	let { data } = $props();
	let filtersForm: HTMLFormElement | null = null;

	const categoryPath = $derived(
		resolve('/(public)/category/[slug]', { slug: String(data.categorySlug ?? '') })
	);
	const isBikes = $derived(data.category === 'Bikes');
	const hasActiveBikeFilters = $derived(
		!!(
			data.filters?.bikeSubtype ||
			data.filters?.bikeType ||
			data.filters?.bikeCondition ||
			data.filters?.bikeSize
		)
	);
	const hasActiveFilters = $derived(
		!!(
			data.filters?.q ||
			data.filters?.sort !== 'newest' ||
			data.filters?.priceState ||
			data.filters?.minPrice ||
			data.filters?.maxPrice ||
			hasActiveBikeFilters
		)
	);

	function submitFilters() {
		if (!filtersForm) return;
		if (typeof filtersForm.requestSubmit === 'function') {
			filtersForm.requestSubmit();
		} else {
			filtersForm.submit();
		}
	}

	function buildPageHref(targetPage: number) {
		const params = [`page=${encodeURIComponent(String(targetPage))}`];
		const pushParam = (key: string, value?: string) => {
			if (!value) return;
			params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
		};

		pushParam('q', data.filters?.q);
		if (data.filters?.sort && data.filters.sort !== 'newest') {
			pushParam('sort', data.filters.sort);
		}
		pushParam('price_state', data.filters?.priceState);
		pushParam('min_price', data.filters?.minPrice);
		pushParam('max_price', data.filters?.maxPrice);
		pushParam('bike_subtype', data.filters?.bikeSubtype);
		pushParam('bike_type', data.filters?.bikeType);
		pushParam('bike_condition', data.filters?.bikeCondition);
		pushParam('bike_size', data.filters?.bikeSize);

		return `${categoryPath}?${params.join('&')}`;
	}
</script>

<section class="category-page">
	<header class="head">
		<a class="back" href={resolve('/')} rel="external">All listings</a>
		<h1>{data.category}</h1>
		<p class="sub">Browse local listings with focused filters.</p>
	</header>

	<form bind:this={filtersForm} class="filters" method="GET" action={categoryPath}>
		<details class="filters-shell" open={hasActiveFilters}>
			<summary>Filters & sort</summary>
			<div class="filters-body">
				<details class="filter-group" open={!!(data.filters?.q || data.filters?.sort !== 'newest')}>
					<summary>Search & sort</summary>
					<div class="filters-main filters-main--core">
						<div class="field">
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
					</div>
				</details>

				<details
					class="filter-group"
					open={!!(data.filters?.priceState || data.filters?.minPrice || data.filters?.maxPrice)}
				>
					<summary>Price</summary>
					<div class="filters-main filters-main--price">
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
						<div class="field">
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
				</details>

				{#if isBikes}
					<details class="filter-group bike-filters" open={hasActiveBikeFilters}>
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
					<a href={categoryPath} rel="external">Clear</a>
					<button type="submit">Apply</button>
				</div>
			</div>
		</details>
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
		display: grid;
	}
	.filters-shell {
		border: 1px solid var(--hairline);
		border-radius: 14px;
		padding: 10px 12px;
		background: color-mix(in srgb, var(--fg) 3%, var(--surface));
	}
	.filters-shell > summary {
		cursor: pointer;
		font-weight: 800;
	}
	.filters-shell > summary::-webkit-details-marker {
		display: none;
	}
	.filters-body {
		margin-top: 10px;
		display: grid;
		gap: 10px;
	}
	.filter-group {
		border: 1px solid color-mix(in srgb, var(--fg) 15%, transparent);
		border-radius: 12px;
		padding: 8px 10px 10px;
		background: color-mix(in srgb, var(--fg) 4%, var(--surface));
	}
	.filter-group > summary {
		cursor: pointer;
		font-weight: 700;
	}
	.filter-group > summary::-webkit-details-marker {
		display: none;
	}
	.filters-main {
		display: grid;
		gap: 10px;
	}
	.filters-main--core {
		grid-template-columns: minmax(220px, 2fr) minmax(180px, 1fr);
	}
	.filters-main--price {
		grid-template-columns: minmax(160px, 1fr) minmax(240px, 1.4fr);
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
		padding-bottom: 10px;
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
		.filters-main--core,
		.filters-main--price {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.bike-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.bike-pills {
			grid-column: 1 / -1;
		}
	}
	@media (max-width: 640px) {
		.filters-main--core,
		.filters-main--price {
			grid-template-columns: 1fr;
		}
		.bike-grid {
			grid-template-columns: 1fr;
		}
		.actions {
			justify-content: flex-end;
		}
	}
</style>
