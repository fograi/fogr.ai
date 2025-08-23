<script lang="ts">
    export let id: number;
    export let title: string;
    export let price: number;
    export let img: string;
    export let description: string;
</script>

<li class="card">
	<div class="card__inner">
		<a href={'/ad/' + id}><strong>{title}</strong> — {price}</a>
		{#if img}<img src={img} alt={title} />{/if}
		{#if description}<p>{description}</p>{/if}
	</div>
</li>

<style>
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
			color: #e5e7eb;
		}
	}
</style>
