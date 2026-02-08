<script lang="ts">
	import AdCard from '$lib/components/AdCard.svelte';
	import { resolve } from '$app/paths';

	let { data } = $props();
	let filtersForm: HTMLFormElement | null = null;

	const categoryPath = $derived(
		resolve('/(public)/category/[slug]', { slug: String(data.categorySlug ?? '') })
	);
	const isBikes = $derived(data.category === 'Bikes');
	type FilterState = {
		q: string;
		sort: string;
		priceState: string;
		minPrice: string;
		maxPrice: string;
		bikeSubtype: string;
		bikeType: string;
		bikeCondition: string;
		bikeSize: string;
	};

	function getCurrentFilters(): FilterState {
		return {
			q: data.filters?.q ?? '',
			sort: data.filters?.sort ?? 'newest',
			priceState: data.filters?.priceState ?? '',
			minPrice: data.filters?.minPrice ?? '',
			maxPrice: data.filters?.maxPrice ?? '',
			bikeSubtype: data.filters?.bikeSubtype ?? '',
			bikeType: data.filters?.bikeType ?? '',
			bikeCondition: data.filters?.bikeCondition ?? '',
			bikeSize: data.filters?.bikeSize ?? ''
		};
	}

	function submitFilters() {
		if (!filtersForm) return;
		if (typeof filtersForm.requestSubmit === 'function') {
			filtersForm.requestSubmit();
		} else {
			filtersForm.submit();
		}
	}

	function buildFilterHref(overrides: Partial<FilterState> = {}, targetPage: number | null = null) {
		const next = { ...getCurrentFilters(), ...overrides };
		const params: string[] = [];
		const pushParam = (key: string, value?: string) => {
			if (!value) return;
			params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
		};

		if (targetPage && targetPage > 1) {
			pushParam('page', String(targetPage));
		}
		pushParam('q', next.q);
		if (next.sort && next.sort !== 'newest') {
			pushParam('sort', next.sort);
		}
		pushParam('price_state', next.priceState);
		pushParam('min_price', next.minPrice);
		pushParam('max_price', next.maxPrice);
		pushParam('bike_subtype', next.bikeSubtype);
		pushParam('bike_type', next.bikeType);
		pushParam('bike_condition', next.bikeCondition);
		pushParam('bike_size', next.bikeSize);

		const query = params.join('&');
		return query ? `${categoryPath}?${query}` : categoryPath;
	}

	function buildPageHref(targetPage: number) {
		return buildFilterHref({}, targetPage);
	}

	function optionLabel(options: Array<{ value: string; label: string }>, value: string) {
		if (!value) return '';
		return options.find((option) => option.value === value)?.label ?? value;
	}

	const activeFilterChips = $derived.by(() => {
		const chips: Array<{ id: string; label: string; href: string }> = [];
		const currentFilters = getCurrentFilters();
		const q = currentFilters.q.trim();
		if (q) {
			chips.push({
				id: `q:${q}`,
				label: `Search: ${q}`,
				href: buildFilterHref({ q: '' })
			});
		}
		if (currentFilters.sort && currentFilters.sort !== 'newest') {
			chips.push({
				id: `sort:${currentFilters.sort}`,
				label: `Sort: ${optionLabel(data.options.sort, currentFilters.sort)}`,
				href: buildFilterHref({ sort: 'newest' })
			});
		}
		if (currentFilters.minPrice || currentFilters.maxPrice) {
			const rangeLabel =
				currentFilters.minPrice && currentFilters.maxPrice
					? `Price: EUR ${currentFilters.minPrice}-${currentFilters.maxPrice}`
					: currentFilters.minPrice
						? `Price: >= EUR ${currentFilters.minPrice}`
						: `Price: <= EUR ${currentFilters.maxPrice}`;
			chips.push({
				id: `price:${currentFilters.minPrice}:${currentFilters.maxPrice}`,
				label: rangeLabel,
				href: buildFilterHref({ minPrice: '', maxPrice: '' })
			});
		}
		if (currentFilters.bikeSubtype) {
			chips.push({
				id: `bike_subtype:${currentFilters.bikeSubtype}`,
				label: `Bike type: ${optionLabel(data.options.bikeSubtype, currentFilters.bikeSubtype)}`,
				href: buildFilterHref({ bikeSubtype: '', bikeType: '' })
			});
		}
		if (currentFilters.bikeType) {
			chips.push({
				id: `bike_type:${currentFilters.bikeType}`,
				label: `Subtype: ${optionLabel(data.options.bikeType, currentFilters.bikeType)}`,
				href: buildFilterHref({ bikeType: '' })
			});
		}
		if (currentFilters.bikeCondition) {
			chips.push({
				id: `bike_condition:${currentFilters.bikeCondition}`,
				label: `Condition: ${optionLabel(data.options.bikeCondition, currentFilters.bikeCondition)}`,
				href: buildFilterHref({ bikeCondition: '' })
			});
		}
		if (currentFilters.bikeSize) {
			chips.push({
				id: `bike_size:${currentFilters.bikeSize}`,
				label: `Size: ${currentFilters.bikeSize}`,
				href: buildFilterHref({ bikeSize: '' })
			});
		}

		return chips;
	});
</script>

<section class="category-page">
	<header class="head">
		<a class="back" href={resolve('/')} rel="external">&lt;All listings</a>
		<h1>{data.category}</h1>
	</header>

	<div class="listing-layout">
		<form bind:this={filtersForm} class="filters" method="GET" action={categoryPath}>
			<div class="filters-main filters-main--core">
				<div class="field">
					<label for="cat-q">Search</label>
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

			<div class="filters-main filters-main--price">
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

			{#if isBikes}
				<div class="bike-filters">
					<div class="bike-grid">
						<div class="field bike-pills">
							<span class="label">Bike type</span>
							<div class="pill-group" role="radiogroup" aria-label="Bike type">
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
							<label for="cat-bike-type">Subtype</label>
							<select
								id="cat-bike-type"
								name="bike_type"
								value={data.filters.bikeType}
								onchange={submitFilters}
							>
								<option value="">Any subtype</option>
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
				</div>
			{/if}

			<div class="actions">
				<a href={categoryPath} rel="external">Clear</a>
				<button type="submit">Apply</button>
			</div>
		</form>

		<div class="results">
			{#if activeFilterChips.length > 0}
				<div class="active-filters" aria-label="Applied filters">
					{#each activeFilterChips as chip (chip.id)}
						<a
							class="filter-chip"
							href={chip.href}
							rel="external"
							aria-label={`Remove ${chip.label}`}
						>
							<span>{chip.label}</span>
							<span class="x" aria-hidden="true">×</span>
						</a>
					{/each}
					<a class="clear-all" href={categoryPath} rel="external">Clear all</a>
				</div>
			{/if}

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
		</div>
	</div>
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

	.listing-layout {
		display: grid;
		gap: 14px;
		align-items: start;
	}
	.results {
		min-width: 0;
		display: grid;
		gap: 10px;
		align-content: start;
	}

	.filters {
		border: 1px solid var(--hairline);
		border-radius: 14px;
		padding: 10px 12px;
		background: color-mix(in srgb, var(--fg) 3%, var(--surface));
		display: grid;
		gap: 10px;
	}
	.filters-main {
		display: grid;
		gap: 10px;
	}
	.filters-main--core {
		grid-template-columns: minmax(220px, 2fr) minmax(180px, 1fr);
	}
	.filters-main--price {
		grid-template-columns: minmax(240px, 1fr);
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
		border-top: 1px solid color-mix(in srgb, var(--fg) 12%, transparent);
		padding-top: 10px;
	}
	.bike-grid {
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
	.active-filters {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
	}
	.filter-chip {
		text-decoration: none;
		color: inherit;
		border: 1px solid color-mix(in srgb, var(--fg) 18%, transparent);
		background: color-mix(in srgb, var(--fg) 6%, var(--surface));
		border-radius: 999px;
		padding: 5px 10px;
		font-size: 0.82rem;
		font-weight: 600;
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.filter-chip .x {
		font-size: 0.95rem;
		font-weight: 800;
		line-height: 1;
	}
	.clear-all {
		text-decoration: none;
		font-size: 0.82rem;
		font-weight: 700;
		padding: 0 2px;
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
	@media (min-width: 1024px) {
		.listing-layout {
			grid-template-columns: minmax(260px, 300px) minmax(0, 1fr);
			gap: 16px;
		}
		.filters {
			position: sticky;
			top: calc(4rem + 8px);
			max-height: calc(100vh - 4rem - 16px);
			overflow: auto;
			overscroll-behavior: contain;
		}
		.filters-main--core,
		.bike-grid {
			grid-template-columns: 1fr;
		}
		.bike-pills {
			grid-column: auto;
		}
	}
</style>
