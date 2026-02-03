<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_R2_BASE } from '$env/static/public';
	import { resolve } from '$app/paths';

	export let id: number | string;
	export let title: string;
	export let price: number;
	export let img: string | undefined;
	export let description: string;
	export let category: string;
	export let currency = 'EUR';
	export let locale = 'en-IE';

	$: formattedPrice =
		typeof price === 'number' && price > -1
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
				onImgError();
			}
		}
	});

	// when the src changes, reset loaded state
	let lastSrc: string | undefined;
	$: if (img && img !== lastSrc) {
		imgLoaded = false;
		lastSrc = img;
	}
</script>

<li class="card">
	<a
		class="link-wrap"
		href={resolve('/(public)/ad/[slug]', { slug: String(id) })}
		aria-label={`View ad: ${title}`}
	>
		<div class="card__inner">
			<div class="hdr">
				<span class="hdr__cat">{category || 'Classifieds'}</span>
			</div>

			{#if showImg}
				<div class="media">
					<img
						bind:this={imgEl}
						src="{PUBLIC_R2_BASE}{img}"
						alt={title}
						loading="lazy"
						decoding="async"
						on:load={onImgLoad}
						on:error={onImgError}
						class:loading={!imgLoaded}
					/>
				</div>
			{/if}

			<h3 class="title title--text">{title}</h3>
			{#if description}<p class="desc">{description}</p>{/if}

			<!-- Price pinned to bottom-right -->
			{#if formattedPrice}
				<span class="price">{formattedPrice}</span>
			{/if}
		</div>
	</a>
</li>

<style>
	/* Base paper card */
	.card {
		background: #fffdf6; /* warm off-white */
		border: 1px solid #1112; /* hairline ink */
		border-radius: 0; /* square */
		box-shadow:
			inset 0 0 0 1px #0000000f,
			/* plate edge */ 0 1px 0 #0001; /* slight lift */
		color: #111;
	}

	/* Headlines feel printed */
	.card .title {
		font-weight: 800;
		letter-spacing: 0.01em;
		text-align: center;
	}

	.card:hover {
		transform: none;
		box-shadow: none;
	} /* no floaty hover */

	.card__inner {
		padding: 0 12px 44px; /* leave space for bottom-right price */
		position: relative;
	}

	/* Full-width black header */
	.hdr {
		margin: 0 -12px; /* bleed to card edges */
		background: #000; /* B&W header */
		color: #fff;
		border-bottom: 1px solid #000;
		text-align: center; /* center contents */
	}

	.hdr__cat {
		display: inline-block; /* shrink to text width */
		padding: 8px 12px;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.02em;
		font-size: 0.82rem;
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
	/* Image: full width, no cropping, square corners */
	.media {
		margin: 8px 0 6px;
	}
	.media img {
		display: block;
		width: 100%;
		height: auto;
		object-fit: contain; /* never crop */
		filter: none; /* keep colour; set grayscale(100%) if you want */
		transition: opacity 0.2s;
	}
	.media img.loading {
		opacity: 0;
	}
	.card:hover .media img {
		transform: scale(1.03);
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

	.title {
		margin: 4px 0 2px;
		font-size: 1rem;
		font-weight: 800;
		line-height: 1.25;
	}
	.desc {
		margin: 0 0 0;
		font-size: 0.92rem;
		line-height: 1.35;
		color: color-mix(in srgb, var(--fg) 70%, transparent);
		display: -webkit-box;
		-webkit-box-orient: vertical;
		overflow: visible;
		word-break: break-word;
	}
	/* Price badge: bottom-right, monochrome */
	.price {
		position: absolute;
		right: 8px;
		bottom: 8px;
		padding: 4px 8px;
		background: #000;
		color: #fff;
		font-weight: 800;
		font-size: 0.85rem;
		border: 1px solid #000;
		line-height: 1;
	}
	@media (prefers-color-scheme: dark) {
		.card {
			background: #191b20; /* deep charcoal */
			border-color: #e5e9ee; /* subtle hairline */
			box-shadow:
				inset 0 0 0 1px #0000003a,
				0 1px 0 #0000;
		}

		.hdr {
			background: #e5e9ee;
			color: #121418;
			border-bottom-color: #000;
		}

		.title {
			color: #e5e9ee;
		} /* strong headline */
		.desc {
			color: #e5e9ee;
		} /* softer body ink */

		.price {
			background: #e5e9ee;
			color: #121418;
			border-color: #e5e9ee;
		}

		/* tame bright photos in dark mode (keeps color) */
		.media img {
			filter: brightness(0.96) contrast(1.05) saturate(0.98);
		}

		/* focus ring that’s visible on dark */
		.link-wrap:focus-visible {
			outline-color: #8ab4ff;
		}
	}
</style>
