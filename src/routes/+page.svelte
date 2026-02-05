<script lang="ts">
	import { onMount } from 'svelte';
	import AdCard from '../lib/components/AdCard.svelte';
	import { resolve } from '$app/paths';
	import { CATEGORIES } from '$lib/constants';

	let { data } = $props();
	let loggedError = false;

	let container: HTMLUListElement;
	let searchForm: HTMLFormElement | null = null;
	const q = $derived(data?.q ?? '');
	const category = $derived(data?.category ?? '');
	const priceState = $derived(data?.priceState ?? '');

	function submitFilters() {
		if (!searchForm) return;
		if (typeof searchForm.requestSubmit === 'function') {
			searchForm.requestSubmit();
		} else {
			searchForm.submit();
		}
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
			<h1>Find it fast.</h1>
			<p class="sub">Search local listings and post in seconds.</p>
		</div>
		<form bind:this={searchForm} class="search__form" method="GET" action={resolve('/')}>
			<label class="sr-only" for="search-q">Search</label>
			<input
				id="search-q"
				name="q"
				type="search"
				value={q}
				placeholder="Search listings"
			/>
			<label class="sr-only" for="search-category">Category</label>
			<select id="search-category" name="category" value={category} on:change={submitFilters}>
				<option value="">All categories</option>
				{#each CATEGORIES as cat}
					<option value={cat}>{cat}</option>
				{/each}
			</select>
			<label class="sr-only" for="search-price-state">Price</label>
			<select
				id="search-price-state"
				name="price_state"
				value={priceState}
				on:change={submitFilters}
			>
				<option value="">Any price</option>
				<option value="fixed">Fixed price</option>
				<option value="free">Free</option>
				<option value="poa">POA</option>
			</select>
			<button type="submit" aria-label="Search">
				<span class="icon" aria-hidden="true">🔍</span>
			</button>
			{#if q || category || priceState}
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
		<a
			class="pager__link"
			href={`${resolve('/')}?page=${data.page - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}${category ? `&category=${encodeURIComponent(category)}` : ''}${priceState ? `&price_state=${encodeURIComponent(priceState)}` : ''}`}
			rel="external"
		>
			Prev
		</a>
	{/if}
	{#if data.nextPage}
		<a
			class="pager__link"
			href={`${resolve('/')}?page=${data.nextPage}${q ? `&q=${encodeURIComponent(q)}` : ''}${category ? `&category=${encodeURIComponent(category)}` : ''}${priceState ? `&price_state=${encodeURIComponent(priceState)}` : ''}`}
			rel="external"
		>
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
		max-width: 1100px;
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
		grid-template-columns: 1fr auto auto auto;
		gap: 10px;
		align-items: center;
		width: 100%;
		max-width: 720px;
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
		padding: 0 16px;
		border-radius: 999px;
		border: 0;
		background: var(--fg);
		color: var(--bg);
		font-weight: 700;
		cursor: pointer;
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
				'category category'
				'price price'
				'clear clear';
			max-width: 100%;
		}
		#search-q {
			grid-area: q;
		}
		#search-category {
			grid-area: category;
		}
		#search-price-state {
			grid-area: price;
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
		margin: 0;
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
