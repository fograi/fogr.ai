<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import AdCard from '../lib/components/AdCard.svelte';
	import { resolve } from '$app/paths';
	import { CATEGORIES } from '$lib/constants';
	import { categoryToSlug } from '$lib/category-browse';
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
	const categoryOptions = CATEGORIES.map((cat) => ({
		name: cat,
		slug: categoryToSlug(cat)
	}));
	let browseCategorySlug = $state(categoryOptions[0]?.slug ?? '');

	async function browseCategory(event: Event) {
		const select = event.currentTarget as HTMLSelectElement | null;
		const slug = select?.value || categoryOptions[0]?.slug || 'bikes';
		await goto(
			resolve('/(public)/category/[slug]', {
				slug
			})
		);
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
		const localitySelect = form?.querySelector('#browse-locality') as HTMLSelectElement | null;
		if (localitySelect) localitySelect.value = '';
		submitSearchForm(form);
	}

	function onLocalityChange(event: Event) {
		const localitySelect = event.currentTarget as HTMLSelectElement;
		submitSearchForm(localitySelect.form);
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
</script>

<section class="search">
	<div class="search__inner">
		<div class="search__copy">
			<h1>Buy. Sell. Done.</h1>
			<p class="sub">Local deals, made simple.</p>
		</div>
		<form class="search__form" method="GET" action={resolve('/')}>
			<label class="sr-only" for="search-q">Search</label>
			<input id="search-q" name="q" type="search" value={q} placeholder="Search" />
			<button type="submit" class="search__submit" aria-label="Search">
				<span class="icon" aria-hidden="true">
					<SearchIcon size={18} strokeWidth={1.8} />
				</span>
			</button>
			<label class="sr-only" for="browse-category">Browse category page</label>
			<select id="browse-category" bind:value={browseCategorySlug} onchange={browseCategory}>
				{#each categoryOptions as option (option.slug)}
					<option value={option.slug}>{option.name}</option>
				{/each}
			</select>
			<label class="sr-only" for="browse-county">Filter by county</label>
			<select id="browse-county" name="county_id" value={countyId} onchange={onCountyChange}>
				<option value="">All counties</option>
				{#each countyOptions as option (option.id)}
					<option value={option.id}>{option.name}</option>
				{/each}
			</select>
			<label class="sr-only" for="browse-locality">Filter by locality</label>
			<select
				id="browse-locality"
				name="locality_id"
				value={localityId}
				disabled={!countyId}
				onchange={onLocalityChange}
			>
				<option value="">All localities</option>
				{#each localityOptions as option (option.id)}
					<option value={option.id}>{option.name}</option>
				{/each}
			</select>
			{#if q || category || priceState || countyId || localityId}
				<a class="clear" href={resolve('/')} rel="external">Clear</a>
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
		<a class="pager__link" href={buildPageHref(data.page - 1)} rel="external">
			Prev
		</a>
	{/if}
	{#if data.nextPage}
		<a class="pager__link" href={buildPageHref(data.nextPage)} rel="external">
			Next
		</a>
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
		grid-template-columns:
			minmax(0, 2fr)
			auto
			minmax(140px, 1fr)
			minmax(150px, 1fr)
			minmax(150px, 1fr)
			auto;
		gap: 10px;
		align-items: center;
		width: 100%;
		max-width: 980px;
		justify-self: start;
	}
	.search__form input,
	.search__form select {
		height: 44px;
		padding: 0 12px;
		border-radius: 12px;
		border: 1px solid var(--hairline);
		background: var(--surface);
		color: var(--fg);
		min-width: 0;
	}
	.search__form button {
		height: 44px;
		width: 44px;
		padding: 0;
		border-radius: 12px;
		border: 1px solid var(--hairline);
		background: var(--surface);
		color: var(--accent-green);
		font-weight: 700;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.search__form button:hover {
		border-color: color-mix(in srgb, var(--accent-green) 55%, transparent);
		background: color-mix(in srgb, var(--accent-green) 10%, var(--surface));
	}
	.search__form button:focus-visible {
		outline: 2px solid var(--accent-green);
		outline-offset: 2px;
	}
	.search__form .clear {
		text-decoration: none;
		color: inherit;
		font-weight: 600;
		padding: 0 6px;
	}
	@media (max-width: 720px) {
		.search__form {
			grid-template-columns: minmax(0, 4fr) minmax(0, 1fr);
			grid-template-areas:
				'q btn'
				'browse browse'
				'county county'
				'locality locality'
				'clear clear';
			max-width: 100%;
		}
		#search-q {
			grid-area: q;
		}
		#browse-category {
			grid-area: browse;
		}
		#browse-county {
			grid-area: county;
		}
		#browse-locality {
			grid-area: locality;
		}
		.search__form button {
			grid-area: btn;
		}
		.search__form .clear {
			grid-area: clear;
		}
		.search__form button {
			width: 100%;
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

	.sr-only {
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
