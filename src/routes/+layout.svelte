<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.ico';
	import Navbar from '$lib/Navbar.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Navbar title="fogr.ai" />

<main>
	{@render children()}
</main>

<style>
	main {
		padding-top: 4rem;
	}
</style>
