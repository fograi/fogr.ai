<script lang="ts">
	import { resolve } from '$app/paths';
	import AdCard from '$lib/components/AdCard.svelte';
	import type { AdCard as AdCardType } from '../../../types/ad-types';

	export let data: { ads: AdCardType[] };
	let ads = data.ads;
	let removingId: string | null = null;

	async function unsave(adId: string) {
		removingId = adId;
		try {
			const res = await fetch('/api/watchlist', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ad_id: adId })
			});
			if (res.ok) ads = ads.filter((a) => a.id !== adId);
		} finally {
			removingId = null;
		}
	}
</script>

<section class="watchlist">
	<header class="head">
		<h1>Watchlist</h1>
		<p class="sub">Ads you have saved for later.</p>
	</header>

	{#if ads.length === 0}
		<div class="empty">
			<p>No saved ads yet. Browse listings to save ones you like.</p>
			<a class="btn ghost" href={resolve('/')}>Browse listings</a>
		</div>
	{:else}
		<ul class="grid">
			{#each ads as ad (ad.id)}
				<li class="grid-item">
					<AdCard {...ad} />
					<button
						type="button"
						class="remove-btn"
						disabled={removingId === ad.id}
						on:click={() => unsave(ad.id)}
					>
						{removingId === ad.id ? 'Removing...' : 'Remove'}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.watchlist {
		max-width: var(--page-max);
		margin: 0 auto;
		padding: 24px var(--page-pad) 80px;
		display: grid;
		gap: 16px;
		color: var(--fg);
	}
	.head h1 {
		margin: 0 0 4px;
		font-size: 1.6rem;
		font-weight: 800;
	}
	.sub {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 55%, transparent);
	}
	.empty {
		padding: 32px 0;
		text-align: center;
		color: color-mix(in srgb, var(--fg) 65%, transparent);
		display: grid;
		gap: 12px;
		justify-items: center;
	}
	.empty .btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		border: 1px solid color-mix(in srgb, var(--fg) 18%, transparent);
		background: var(--surface);
		border-radius: 10px;
		padding: 7px 12px;
		font-weight: 700;
		cursor: pointer;
		color: inherit;
		text-decoration: none;
		font-size: 0.88rem;
	}
	.empty .btn.ghost {
		background: transparent;
	}
	.grid {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 16px;
	}
	.grid-item {
		display: grid;
		gap: 6px;
	}
	.remove-btn {
		display: block;
		width: 100%;
		padding: 6px 10px;
		border: 1px solid color-mix(in srgb, var(--accent-orange) 35%, transparent);
		border-radius: 10px;
		background: transparent;
		color: var(--accent-orange);
		font-weight: 700;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.remove-btn:hover:not([disabled]) {
		background: var(--tangerine-bg);
	}
	.remove-btn[disabled] {
		opacity: 0.6;
		cursor: default;
	}
</style>
