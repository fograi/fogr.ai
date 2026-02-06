<script lang="ts">
	export let label = 'Post ad';
	export let loading = false;
	export let loadingLabel = 'Posting…';
</script>

<div class="sticky-cta" aria-live="polite">
	<button type="submit" class="btn primary btn--cta" disabled={loading}>
		{loading ? loadingLabel : label}
	</button>
</div>

<style>
	.sticky-cta {
		display: flex;
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
		border-top: 1px solid var(--hairline);
		background: var(--surface);
		z-index: 50;
	}
	.btn {
		display: inline-grid;
		place-items: center;
		gap: 6px;
		padding: 8px 12px;
		border-radius: 10px;
		border: 1px solid color-mix(in srgb, var(--fg) 18%, transparent);
		background: var(--surface);
		cursor: pointer;
	}
	.btn.primary {
		background: black;
		color: white;
		border-color: black;
	}
	@media (min-width: 820px) {
		.sticky-cta {
			left: 50%;
			right: auto;
			transform: translateX(-50%);
			bottom: 16px;
			padding: 8px 10px;
			gap: 8px;
			width: auto;
		}
		.btn--cta {
			flex: 0 0 auto;
			padding: 10px 14px;
			font-size: 14px;
		}
	}
</style>
