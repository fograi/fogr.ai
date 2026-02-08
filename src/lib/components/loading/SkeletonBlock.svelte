<script lang="ts">
	export let width = '100%';
	export let height = '1rem';
	export let radius = '8px';
	export let inline = false;
</script>

<span
	class={`skeleton ${inline ? 'inline' : ''}`}
	style={`--skeleton-width:${width};--skeleton-height:${height};--skeleton-radius:${radius}`}
	aria-hidden="true"
></span>

<style>
	.skeleton {
		display: block;
		width: var(--skeleton-width);
		height: var(--skeleton-height);
		border-radius: var(--skeleton-radius);
		background:
			linear-gradient(
				90deg,
				color-mix(in srgb, var(--fg) 8%, var(--surface)) 0%,
				color-mix(in srgb, var(--fg) 14%, var(--surface)) 50%,
				color-mix(in srgb, var(--fg) 8%, var(--surface)) 100%
			);
		background-size: 240% 100%;
		animation: skeleton-wave 1.2s ease infinite;
	}
	.skeleton.inline {
		display: inline-block;
	}
	@keyframes skeleton-wave {
		0% {
			background-position: 180% 0;
		}
		100% {
			background-position: -60% 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.skeleton {
			animation: none;
		}
	}
</style>
