<script lang="ts">
	import AdCard from '$lib/AdCard.svelte';
	let { data } = $props();
</script>

{#if data.ad}
	<ul><AdCard {...data.ad} /></ul>
{:else}
	<p>Ad not found.</p>
{/if}
