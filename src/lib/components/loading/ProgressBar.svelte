<script lang="ts">
	import { clampPercent } from '$lib/utils/loading';

	export let value = 0;
	export let label = 'Loading progress';
	export let showPercent = true;
	export let compact = false;

	$: safeValue = clampPercent(value);
</script>

<div class={`progress-wrap ${compact ? 'compact' : ''}`}>
	<div
		class="track"
		role="progressbar"
		aria-label={label}
		aria-valuemin={0}
		aria-valuemax={100}
		aria-valuenow={safeValue}
	>
		<div class="fill" style={`width:${safeValue}%`}></div>
	</div>
	{#if showPercent}
		<span class="pct" aria-hidden="true">{safeValue}%</span>
	{/if}
</div>

<style>
	.progress-wrap {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 8px;
		align-items: center;
	}
	.track {
		height: 8px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--fg) 12%, transparent);
		overflow: hidden;
	}
	.fill {
		height: 100%;
		border-radius: inherit;
		background: color-mix(in srgb, var(--fg) 70%, transparent);
		transition: width 180ms ease;
	}
	.pct {
		font-size: 0.75rem;
		font-weight: 700;
		color: color-mix(in srgb, var(--fg) 70%, transparent);
		min-width: 2.4rem;
		text-align: right;
	}
	.compact .track {
		height: 6px;
	}
	@media (prefers-reduced-motion: reduce) {
		.fill {
			transition: none;
		}
	}
</style>
