<script lang="ts">
	import AdCardWide from '$lib/components/AdCardWide.svelte';
	import type { AdCard } from '../../../../types/ad-types';
	export let data: { ad: AdCard };
</script>

{#if data?.ad}
	{#if data.ad.status === 'pending'}
		<div class="pending" role="status" aria-live="polite">
			Pending review. Your ad will be visible once moderation completes.
		</div>
	{/if}
	<AdCardWide {...data.ad} />
{:else}
	<p>Ad not found.</p>
{/if}

<style>
	.pending {
		max-width: 960px;
		margin: 16px auto 8px;
		padding: 10px 12px;
		border: 1px solid color-mix(in srgb, var(--fg) 20%, transparent);
		background: color-mix(in srgb, var(--bg) 92%, transparent);
		border-radius: 8px;
		text-align: center;
		font-weight: 600;
	}
</style>
