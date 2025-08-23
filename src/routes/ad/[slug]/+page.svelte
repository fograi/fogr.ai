<script lang="ts">
	export let data: {
		ad: { id: string; title: string; description: string } | null;
	};
</script>

{#if data.ad}
	<h1>{data.ad.title}</h1>
	<p>{data.ad.description}</p>
{:else}
	<p>Ad not found.</p>
{/if}
