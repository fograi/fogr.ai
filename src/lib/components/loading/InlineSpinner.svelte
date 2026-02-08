<script lang="ts">
	export let label = '';
	export let size = 14;
	export let tone: 'muted' | 'default' = 'muted';
</script>

<span class={`spinner-wrap ${tone === 'default' ? 'default' : 'muted'}`} role="status" aria-live="polite">
	<span class="spinner" style={`--spinner-size:${size}px`} aria-hidden="true"></span>
	{#if label}
		<span class="label">{label}</span>
	{/if}
</span>

<style>
	.spinner-wrap {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-weight: 600;
	}
	.spinner-wrap.muted {
		color: color-mix(in srgb, var(--fg) 65%, transparent);
	}
	.spinner-wrap.default {
		color: inherit;
	}
	.spinner {
		--spinner-size: 14px;
		width: var(--spinner-size);
		height: var(--spinner-size);
		border-radius: 999px;
		border: 2px solid color-mix(in srgb, currentColor 25%, transparent);
		border-top-color: currentColor;
		animation: spin 0.7s linear infinite;
	}
	.label {
		line-height: 1.2;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation-duration: 1.4s;
		}
	}
</style>
