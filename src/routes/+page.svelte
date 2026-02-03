<script lang="ts">
	import { onMount } from 'svelte';
	import AdCard from '../lib/components/AdCard.svelte';
	import { resolve } from '$app/paths';

	let { data } = $props();
	let loggedError = false;

	let container: HTMLUListElement;

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

{#if data?.error}
	<div class="error-banner" role="alert">
		<strong>Couldn’t load ads.</strong>
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
			href={`${resolve('/')}?page=${data.page - 1}`}
			rel="external"
		>
			Prev
		</a>
	{/if}
	{#if data.nextPage}
		<a
			class="pager__link"
			href={`${resolve('/')}?page=${data.nextPage}`}
			rel="external"
		>
			Next
		</a>
	{/if}
</nav>

<style>
	.error-banner {
		margin: 12px 0 16px;
		padding: 10px 12px;
		border: 1px solid color-mix(in srgb, var(--fg) 25%, transparent);
		background: color-mix(in srgb, var(--bg) 92%, transparent);
		color: var(--fg);
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
		padding-left: 0px;
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
