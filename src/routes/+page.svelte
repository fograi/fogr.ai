<script lang="ts">
	import { onMount } from 'svelte';
	let { data } = $props();

	let container: HTMLUListElement;

	function layout() {
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
</script>

<h1>home</h1>
<p>this is the home page.</p>

<ul bind:this={container} class="masonry-grid">
	{#each data.ads as { id, title, price, img, description }}
		<li class="card">
			<div class="card__inner">
				<a href="/ad/{id}"><strong>{title}</strong> — {price}</a>
				{#if img}<img src={img} alt={title} />{/if}
				{#if description}<p>{description}</p>{/if}
			</div>
		</li>
	{/each}
</ul>

<style>
	.masonry-grid {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 16px;
		grid-auto-rows: 8px; /* ← pair with JS 'row' */
	}

	.card {
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		background: white;
		overflow: hidden;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
		transition: transform 0.2s;
	}
	.card:hover {
		transform: translateY(-6px);
	}

	.card__inner {
		padding: 12px;
	}
	.card a {
		text-decoration: none;
		color: inherit;
		display: block;
	}
	.card img {
		width: 100%;
		height: auto;
		display: block;
	}

	@media (prefers-color-scheme: dark) {
		.card {
			background: #111;
			border-color: #2a2a2a;
			color: #e5e7eb
		}
	}
</style>
