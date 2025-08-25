<script lang="ts">
	import { onMount } from 'svelte';
	import { catBase, catIcon } from '$lib/constants';

	export let id: number | string;
	export let title: string;
	export let price: number;
	export let img: string | undefined;
	export let description: string;
	export let category: string;

	export let currency = 'EUR';
	export let locale = 'en-IE';

	$: bannerIcon = catIcon[category?.trim?.() ?? ''] ?? '🗂️';
	$: bannerBase = catBase[category?.trim?.() ?? ''] ?? '#6B7280';

	const href = `/ad/${id}`;
	$: formattedPrice =
		typeof price === 'number'
			? new Intl.NumberFormat(locale, {
					style: 'currency',
					currency,
					maximumFractionDigits: 0
				}).format(price)
			: null;

	let isPortrait = false;
	let hasImageError = false;
	let showImg = !!img;
	let imgLoaded = false;
	let imgEl: HTMLImageElement | null = null;

	$: showImg = !!img; // if the src prop changes

	function onImgError() {
		showImg = false;
		isPortrait = false;
		imgLoaded = false;
		hasImageError = true;
	}

	function onImgLoad(e: Event) {
		const i = e.currentTarget as HTMLImageElement;
		isPortrait = i.naturalHeight > i.naturalWidth;
		imgLoaded = true;
	}

	// ensure cached images become visible
	onMount(() => {
		if (imgEl && imgEl.complete) {
			if (imgEl.naturalWidth > 0) {
				imgLoaded = true;
				isPortrait = imgEl.naturalHeight > imgEl.naturalWidth;
			} else {
				// broken src in cache
				onImgError();
			}
		}
	});

	// when the src changes, reset loaded state
	$: if (imgEl && img) {
		imgLoaded = false;
	}
</script>

<li class="card">
	<a class="link-wrap" {href} aria-label={`View ad: ${title}`}>
		<div class="card__inner">
			{#if showImg}
				<div class="media" class:portrait={isPortrait} style="--media-tint:{bannerBase}">
					<img
						bind:this={imgEl}
						src={img}
						alt={title}
						loading="lazy"
						decoding="async"
						on:load={onImgLoad}
						on:error={onImgError}
						class:loaded={imgLoaded}
					/>
					<div class="chip-row">
						{#if category}
							<span class="chip chip--cat" style="--chip:{bannerBase}">
								<span aria-hidden="true">{bannerIcon}</span>
								<span class="chip__label">{category}</span>
							</span>
						{/if}
						{#if formattedPrice}<span class="chip chip--price">{formattedPrice}</span>{/if}
					</div>
					<div class="overlay"><h3 class="title">{title}</h3></div>
				</div>
				{#if description }<p class="desc">{description}</p>{/if}
			{:else}
				<!-- TEXT-ONLY FALLBACK -->
				<div class="text-body">
					<div class="chip-row chip-row--text">
						{#if category}
							<span class="chip chip--cat" style="--chip:{bannerBase}">
								<span aria-hidden="true">{bannerIcon}</span>
								<span class="chip__label">{category}</span>
							</span>
						{/if}
						{#if formattedPrice}<span class="chip chip--price">{formattedPrice}</span>{/if}
					</div>
					<h3 class="title title--text">{title}</h3>
					{#if description}<p class="desc">{description}</p>{/if}
				</div>
			{/if}
		</div>
	</a>
</li>

<style>
	.card {
		border: 1px solid color-mix(in srgb, var(--fg) 8%, transparent);
		border-radius: 16px; /* slightly larger radius */
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--surface) 94%, transparent),
			var(--surface)
		);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
		transition:
			transform 0.18s ease,
			box-shadow 0.18s ease,
			border-color 0.18s ease;
	}
	.card:hover {
		transform: translateY(-4px);
		box-shadow: 0 10px 28px rgba(0, 0, 0, 0.1);
	}

	.card__inner {
		padding: 8px 12px 12px;
		position: relative;
	}

	@media (prefers-reduced-motion: reduce) {
		.card,
		.card:hover {
			transform: none;
		}
	}

	.link-wrap {
		display: block;
		text-decoration: none;
		color: inherit;
	}
	.link-wrap:focus-visible {
		outline: 2px solid var(--link);
		outline-offset: 2px;
	}
	/* MEDIA becomes the hero; modern zoom */
	.media {
		position: relative;
		aspect-ratio: 3/2; /* a touch taller than 16/9 feels more editorial */
		overflow: hidden;
		margin-bottom: 10px;
		isolation: isolate; /* chips/overlay stack cleanly */
	}
	.media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition:
			opacity 0.2s ease,
			transform 0.25s ease;
		opacity: 1;
	}
	.media img:not(.loaded) {
		opacity: 0;
	}

	/* (optional) keep your hover zoom */
	.card:hover .media img {
		transform: scale(1.03);
	}

	@keyframes shimmer {
		0% {
			background-position: 0% 0%;
		}
		100% {
			background-position: -200% 0%;
		}
	}

	.card:hover .media img {
		transform: scale(1.03);
	}
	.media.portrait {
		aspect-ratio: 3/4;
	}
	.media.portrait img {
		object-fit: contain;
		background: color-mix(in srgb, var(--bg) 85%, transparent);
	}

	/* CHIPS over image */
	.chip-row {
		position: absolute;
		inset: 8px 8px auto 8px; /* top area */
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
		pointer-events: none; /* non-interactive label look */
		z-index: 2;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 10px;
		border-radius: 999px;
		font-size: 0.78rem;
		font-weight: 700;
		line-height: 1;
		border: 1px solid color-mix(in srgb, var(--fg) 10%, transparent);
		background: color-mix(in srgb, var(--bg) 55%, transparent);
		backdrop-filter: saturate(1.2) blur(6px); /* contemporary, still subtle */
		color: color-mix(in srgb, var(--fg) 86%, transparent);
	}
	.chip--cat {
		background: color-mix(in srgb, var(--chip) 22%, var(--bg));
	}
	.chip--price {
		background: color-mix(in srgb, #0ea5e9 22%, var(--bg));
	} /* calm blue */

	/* text-only container */
	.text-body {
		border-radius: 14px;
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--bg) 96%, transparent),
			color-mix(in srgb, var(--fg) 4%, transparent)
		);
		padding: 10px 12px;
	}

	/* static chips row for text-only (not absolute) */
	.chip-row--text {
		position: static;
		inset: auto;
		margin: 2px 0 8px;
		display: flex;
		justify-content: space-between;
		gap: 8px;
	}

	/* title color when not overlaid on a photo */
	.title--text {
		color: var(--fg);
		margin: 0 0 4px;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* full-page: collapse to single column when no image */
	.content.no-media {
		display: block; /* simpler flow for long text */
	}
	@container (min-width: 640px) {
		.content.no-media {
			display: grid; /* keep nice rhythm on wide screens */
			grid-template-columns: 1fr;
		}
	}

	/* optional: tint text-only background by category */
	.text-body {
		--tint: color-mix(in srgb, var(--chip, #6b7280) 10%, transparent);
		background:
			linear-gradient(180deg, var(--tint), transparent 60%),
			linear-gradient(
				135deg,
				color-mix(in srgb, var(--bg) 96%, transparent),
				color-mix(in srgb, var(--fg) 4%, transparent)
			);
	}

	/* TITLE overlay on the image bottom */
	.overlay {
		position: absolute;
		inset: auto 0 0 0;
		z-index: 1;
		padding: 10px 12px 12px;
		background: linear-gradient(to top, color-mix(in srgb, #000 52%, transparent), transparent 70%);
		color: #fff;
	}
	.title {
		margin: 0;
		font-size: 1rem;
		font-weight: 800;
		line-height: 1.25;
		display: -webkit-box;
		-webkit-box-orient: vertical;
	}

	/* DESC stays below, lighter */
	.desc {
		font-size: 0.92rem;
		line-height: 1.35;
		margin: 2px 0 0;
		color: color-mix(in srgb, var(--fg) 75%, transparent);
		display: -webkit-box;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	/* Dark mode tuning */
	@media (prefers-color-scheme: dark) {
		.chip {
			border-color: color-mix(in srgb, #fff 10%, transparent);
		}
		.chip--price {
			background: color-mix(in srgb, #38bdf8 24%, var(--bg));
		}
	}
</style>
