<script lang="ts">
	import AdCardWide from '$lib/components/AdCardWide.svelte';
	import type { AdCard } from '../../../../types/ad-types';
	export let data: { ad: AdCard };
</script>

{#if data?.ad}
	<AdCardWide {...data.ad} />
{:else}
	<p>Ad not found.</p>
{/if}
