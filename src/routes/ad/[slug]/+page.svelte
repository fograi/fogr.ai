<script lang="ts">
	import AdCardWide from '$lib/components/AdCardWide.svelte';
	let { data } = $props();
</script>

{#if data.ad}
	<ul><AdCardWide {...data.ad} /></ul>
{:else}
	<p>Ad not found.</p>
{/if}
