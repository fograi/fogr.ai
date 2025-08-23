<script lang="ts">
	let { data } = $props();
</script>

<h1>home</h1>
<p>this is the home page.</p>
<ul>
	{#each data.ads as { id, title, price }}
		<li>
			<a href="/ad/{id}">{title}:{price}</a>
		</li>
	{/each}
</ul>
