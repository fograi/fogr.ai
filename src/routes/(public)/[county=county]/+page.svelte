<script lang="ts">
	import AdCard from '$lib/components/AdCard.svelte';
	import { resolve } from '$app/paths';

	let { data } = $props();

	const basePath = $derived(
		`/${data.countySlug}`
	);

	function buildPageHref(targetPage: number) {
		if (targetPage <= 1) return basePath;
		return `${basePath}?page=${targetPage}`;
	}

	const priceRangeText = $derived(
		data.priceRange.min !== null && data.priceRange.max !== null
			? `EUR ${data.priceRange.min} - EUR ${data.priceRange.max}`
			: null
	);
</script>

<svelte:head>
	<title>{data.seo.title}</title>
	<meta name="description" content={data.seo.description} />
	<link rel="canonical" href={data.seo.canonical} />
	{#if data.seo.robots === 'noindex'}
		<meta name="robots" content="noindex" />
	{/if}
	<meta property="og:title" content={data.seo.title} />
	<meta property="og:description" content={data.seo.description} />
	<meta property="og:url" content={data.seo.canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Fogr.ai" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={data.seo.title} />
	<meta name="twitter:description" content={data.seo.description} />
</svelte:head>

<section class="programmatic-page">
	<header class="head">
		<a class="back" href={resolve('/')} rel="external">&lt;&nbsp;All listings</a>
		<h1>Second-Hand Classifieds in {data.countyName}</h1>
	</header>

	<div class="stats">
		<span class="stat">{data.listingCount} listing{data.listingCount === 1 ? '' : 's'}</span>
		{#if priceRangeText}
			<span class="stat-sep" aria-hidden="true">|</span>
			<span class="stat">{priceRangeText}</span>
		{/if}
	</div>

	<div class="active-filters" aria-label="Active filters">
		<span class="filter-chip">{data.countyName}</span>
	</div>

	{#if data.ads.length > 0}
		<ul class="grid">
			{#each data.ads as ad (ad.id)}
				<AdCard {...ad} />
			{/each}
		</ul>
	{:else}
		<p class="empty">No listings yet in {data.countyName}.</p>
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
	.programmatic-page {
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
		font-size: 1.5rem;
		line-height: 1.2;
	}
	.back {
		font-size: 0.9rem;
		text-decoration: none;
		font-weight: 600;
	}
	.stats {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.88rem;
		color: color-mix(in srgb, var(--fg) 70%, transparent);
	}
	.stat {
		font-weight: 600;
	}
	.stat-sep {
		color: color-mix(in srgb, var(--fg) 30%, transparent);
	}
	.active-filters {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.filter-chip {
		display: inline-flex;
		align-items: center;
		padding: 5px 10px;
		border: 1px solid color-mix(in srgb, var(--fg) 18%, transparent);
		background: color-mix(in srgb, var(--fg) 6%, var(--surface));
		border-radius: 999px;
		font-size: 0.82rem;
		font-weight: 600;
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
</style>
