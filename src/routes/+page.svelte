<script lang="ts">
	import { onMount } from 'svelte';
	import AdCard from '../lib/components/AdCard.svelte';
	import { resolve } from '$app/paths';
	import { CATEGORIES } from '$lib/constants';
	import { SearchIcon } from '$lib/icons';

	let { data } = $props();
	let loggedError = false;

	let container: HTMLUListElement;
	const q = $derived(data?.q ?? '');
	const category = $derived(data?.category ?? '');
	const priceState = $derived(data?.priceState ?? '');
	const countyId = $derived(data?.countyId ?? '');
	const localityId = $derived(data?.localityId ?? '');
	const countyOptions = $derived(data?.locationOptions?.counties ?? []);
	const localityOptions = $derived(data?.locationOptions?.localities ?? []);
	const categoryOptions = CATEGORIES;
	const hasScopeFilters = $derived(Boolean(category || countyId || localityId));
	let mobileScopeOpen = $state(false);
	let scopeOpenInitialized = false;
	let previousHasScopeFilters = false;

	function getLocationLabel(
		options: ReadonlyArray<{ id: string; name: string }>,
		selectedId: string
	): string {
		if (!selectedId) return '';
		return options.find((option) => option.id === selectedId)?.name ?? '';
	}

	const scopeSummary = $derived.by(() => {
		if (!hasScopeFilters) return 'All categories, all locations';
		const labels: string[] = [];
		if (category) labels.push(category);
		if (countyId) {
			labels.push(getLocationLabel(countyOptions, countyId) || 'Selected county');
		}
		if (localityId) {
			labels.push(getLocationLabel(localityOptions, localityId) || 'Selected locality');
		}
		return labels.join(' • ');
	});

	function toggleScopeFilters() {
		mobileScopeOpen = !mobileScopeOpen;
	}

	function submitSearchForm(form: HTMLFormElement | null | undefined) {
		if (!form) return;
		if (typeof form.requestSubmit === 'function') {
			form.requestSubmit();
		} else {
			form.submit();
		}
	}

	function onCountyChange(event: Event) {
		const countySelect = event.currentTarget as HTMLSelectElement;
		const form = countySelect.form;
		const localitySelect = form?.querySelector('#search-locality') as HTMLSelectElement | null;
		if (localitySelect) localitySelect.value = '';
		submitSearchForm(form);
	}

	function buildPageHref(targetPage: number) {
		const params = new URLSearchParams({ page: String(targetPage) });
		if (q) params.set('q', q);
		if (category) params.set('category', category);
		if (priceState) params.set('price_state', priceState);
		if (countyId) params.set('county_id', countyId);
		if (localityId) params.set('locality_id', localityId);
		return `${resolve('/')}?${params.toString()}`;
	}

	function layout() {
		if (!container) return;
		const row = 8; // must match grid-auto-rows
		const gap = 16; // must match gap
		const items = container.querySelectorAll<HTMLElement>('.card');

		items.forEach((item) => {
			item.style.gridRowEnd = 'span 1'; // reset
			const inner = item.querySelector<HTMLElement>('.card__inner');
			if (!inner) return;
			const h = inner.getBoundingClientRect().height;
			const span = Math.ceil((h + gap) / (row + gap));
			item.style.gridRowEnd = `span ${span}`;
		});
	}

	onMount(() => {
		layout();
		if (!container) return;
		const ro = new ResizeObserver(layout);
		ro.observe(container);
		window.addEventListener('resize', layout);

		// re-layout when imgs load
		container.querySelectorAll('img').forEach((img) => {
			if (img.complete) return;
			img.addEventListener('load', layout, { once: true });
		});

		return () => {
			ro.disconnect();
			window.removeEventListener('resize', layout);
		};
	});

	$effect(() => {
		if (data?.error && !loggedError) {
			console.error('ads_load_failed', data.error);
			loggedError = true;
		}
		if (!data?.error && loggedError) {
			loggedError = false;
		}
	});

	$effect(() => {
		if (!scopeOpenInitialized) {
			mobileScopeOpen = hasScopeFilters;
			previousHasScopeFilters = hasScopeFilters;
			scopeOpenInitialized = true;
			return;
		}
		if (!previousHasScopeFilters && hasScopeFilters) {
			mobileScopeOpen = true;
		}
		previousHasScopeFilters = hasScopeFilters;
	});
</script>

<section class="search">
	<div class="search__inner">
		<div class="search__copy">
			<h1>Buy. Sell. Done.</h1>
			<p class="sub">Local deals, made simple.</p>
		</div>
		<form class="search__form" method="GET" action={resolve('/')}>
			<div class="search__row">
				<div class="field field--query">
					<label for="search-q">Search</label>
					<input
						id="search-q"
						name="q"
						type="search"
						value={q}
						placeholder="Search listings"
						autocomplete="off"
					/>
				</div>
				<button type="submit" class="search__submit" aria-label="Search listings">
					<span class="icon" aria-hidden="true">
						<SearchIcon size={18} strokeWidth={1.8} />
					</span>
					<span class="search__submit-text">Search</span>
				</button>
			</div>

			<button
				type="button"
				class="search__scope-toggle"
				aria-controls="search-scope-filters"
				aria-expanded={mobileScopeOpen}
				onclick={toggleScopeFilters}
			>
				<span class="search__scope-toggle-label">Filters</span>
				<span class="search__scope-toggle-summary">{scopeSummary}</span>
				<span class="search__scope-toggle-glyph" aria-hidden="true">
					{mobileScopeOpen ? '−' : '+'}
				</span>
			</button>

			<div
				id="search-scope-filters"
				class="search__filters"
				class:search__filters--mobile-open={mobileScopeOpen}
				role="group"
				aria-label="Narrow results"
			>
				<div class="field">
					<label for="search-category">Category</label>
					<select id="search-category" name="category" value={category}>
						<option value="">All categories</option>
						{#each categoryOptions as option (option)}
							<option value={option}>{option}</option>
						{/each}
					</select>
				</div>
				<div class="field">
					<label for="search-county">County</label>
					<select id="search-county" name="county_id" value={countyId} onchange={onCountyChange}>
						<option value="">All counties</option>
						{#each countyOptions as option (option.id)}
							<option value={option.id}>{option.name}</option>
						{/each}
					</select>
				</div>
				<div class="field">
					<label for="search-locality">Locality</label>
					<select id="search-locality" name="locality_id" value={localityId} disabled={!countyId}>
						<option value="">All localities</option>
						{#each localityOptions as option (option.id)}
							<option value={option.id}>{option.name}</option>
						{/each}
					</select>
				</div>
			</div>

			{#if q || category || priceState || countyId || localityId}
				<a class="clear" href={resolve('/')} rel="external">Clear filters</a>
			{/if}
		</form>
	</div>
</section>

{#if data?.error}
	<div class="error-banner" role="alert">
		<strong>Could not load listings.</strong>
		<span>{data.error.message}</span>
		{#if data.error.requestId}
			<span class="req">Request ID: {data.error.requestId}</span>
		{/if}
	</div>
{/if}

<ul bind:this={container} class="masonry-grid">
	{#each data.ads as ad (ad.id)}
		<AdCard {...ad} />
	{/each}
</ul>

<nav class="pager" aria-label="Pagination">
	{#if data.page > 1}
		<a class="pager__link" href={buildPageHref(data.page - 1)} rel="external"> Prev </a>
	{/if}
	{#if data.nextPage}
		<a class="pager__link" href={buildPageHref(data.nextPage)} rel="external"> Next </a>
	{/if}
</nav>

<style>
	.search {
		margin: 12px 0 20px;
		padding: 10px 0 6px;
	}
	.search__inner {
		max-width: var(--page-max);
		margin: 0 auto;
		padding: 0 var(--page-pad);
		display: grid;
		gap: 12px;
	}
	.search__copy h1 {
		margin: 0 0 4px;
		font-size: 2rem;
		letter-spacing: -0.02em;
	}
	.search__copy .sub {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 70%, transparent);
	}
	.search__form {
		display: grid;
		gap: 10px;
		width: 100%;
		max-width: 980px;
		justify-self: start;
	}
	.search__row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 10px;
		align-items: end;
	}
	.search__filters {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 10px;
	}
	.field {
		display: grid;
		gap: 6px;
	}
	.field > label {
		font-size: 0.82rem;
		font-weight: 700;
	}
	.field input,
	.field select {
		height: 44px;
		padding: 0 12px;
		border-radius: 12px;
		border: 1px solid var(--hairline);
		background: var(--surface);
		color: var(--fg);
		min-width: 0;
	}
	.search__submit {
		height: 44px;
		padding: 0 14px;
		border-radius: 12px;
		border: 1px solid var(--hairline);
		background: var(--surface);
		color: var(--accent-green);
		font-weight: 700;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}
	.search__submit:hover {
		border-color: color-mix(in srgb, var(--accent-green) 55%, transparent);
		background: color-mix(in srgb, var(--accent-green) 10%, var(--surface));
	}
	.search__submit:focus-visible {
		outline: 2px solid var(--accent-green);
		outline-offset: 2px;
	}
	.search__scope-toggle {
		display: none;
		align-items: center;
		gap: 8px;
		padding: 0 12px;
		height: 42px;
		border-radius: 12px;
		border: 1px solid var(--hairline);
		background: var(--surface);
		color: inherit;
		font-weight: 600;
		cursor: pointer;
		min-width: 0;
	}
	.search__scope-toggle-summary {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-weight: 500;
		font-size: 0.88rem;
		color: color-mix(in srgb, var(--fg) 75%, transparent);
	}
	.search__scope-toggle-glyph {
		font-size: 1.1rem;
		font-weight: 700;
		line-height: 1;
	}
	.search__form .clear {
		text-decoration: none;
		color: inherit;
		font-weight: 600;
		padding: 0 6px;
		justify-self: end;
	}
	@media (max-width: 720px) {
		.search {
			margin: 8px 0 14px;
			padding: 6px 0 4px;
		}
		.search__copy h1 {
			font-size: 1.45rem;
			margin: 0;
		}
		.field {
			position: relative;
			gap: 0;
		}
		.field > label {
			position: absolute;
			width: 1px;
			height: 1px;
			padding: 0;
			margin: -1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			white-space: nowrap;
			border: 0;
		}
		.search__filters {
			display: none;
			grid-template-columns: 1fr;
		}
		.search__filters.search__filters--mobile-open {
			display: grid;
		}
		.search__scope-toggle {
			display: grid;
			grid-template-columns: auto minmax(0, 1fr) auto;
		}
		.search__scope-toggle-label {
			font-size: 0.9rem;
		}
		.search__submit {
			min-width: 44px;
			padding: 0 12px;
		}
		.search__submit-text {
			display: none;
		}
		.search__form .clear {
			justify-self: start;
		}
	}
	@media (min-width: 900px) {
		.search__inner {
			grid-template-columns: minmax(240px, 1fr) minmax(360px, 1.4fr);
			align-items: center;
			gap: 24px;
		}
		.search__copy {
			max-width: 420px;
		}
		.search__form {
			justify-self: end;
			max-width: 980px;
			padding: 12px;
			border-radius: 16px;
			border: 1px solid var(--hairline);
			background: color-mix(in srgb, var(--surface) 92%, var(--fg) 4%);
		}
	}

	.error-banner {
		margin: 12px 0 16px;
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
	.masonry-grid {
		list-style: none;
		padding: 0 var(--page-pad);
		margin: 0 auto;
		max-width: var(--page-max);
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 16px;
		grid-auto-rows: 8px; /* ← pair with JS 'row' */
	}
	.pager {
		display: flex;
		justify-content: center;
		gap: 12px;
		margin: 18px 0 8px;
	}
	.pager__link {
		text-decoration: none;
		padding: 6px 12px;
		border: 1px solid color-mix(in srgb, var(--fg) 25%, transparent);
		border-radius: 8px;
		color: inherit;
		background: var(--surface);
	}
</style>
