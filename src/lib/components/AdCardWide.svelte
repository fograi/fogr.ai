<script lang="ts">
	import { onMount } from 'svelte';
	import { catBase, catIcon } from '$lib/constants';
	import { PUBLIC_R2_BASE } from '$env/static/public';

	// Props
	export let title: string;
	export let price: number;
	export let img: string;
	export let description: string;
	export let category: string;
	export let currency = 'EUR';
	export let locale = 'en-IE';
	export let email: string = '';

	// Derived
	$: bannerBase = catBase[category?.trim?.() ?? ''] ?? '#6B7280';
	$: bannerIcon = catIcon[category?.trim?.() ?? ''] ?? '🗂️';
	$: formattedPrice =
		typeof price === 'number'
			? new Intl.NumberFormat(locale, {
					style: 'currency',
					currency,
					maximumFractionDigits: 0
				}).format(price)
			: null;

	$: displayedPrice =
		category === 'Free / Giveaway'
			? 'Free'
			: typeof price === 'number'
				? new Intl.NumberFormat(locale, {
						style: 'currency',
						currency,
						maximumFractionDigits: 0
					}).format(price)
				: '';

	$: mailtoHref = email ? `mailto:${email}?subject=${encodeURIComponent('Enquiry: ' + title)}` : '';

	// Image handling
	let isPortrait = false;
	let showImg = !!img;
	let imgEl: HTMLImageElement | null = null;
	$: showImg = !!img;

	function onImgError() {
		showImg = false;
		isPortrait = false;
	}
	function onImgLoad(e: Event) {
		const i = e.currentTarget as HTMLImageElement;
		isPortrait = i.naturalHeight > i.naturalWidth;
	}
	onMount(() => {
		if (imgEl && imgEl.complete) {
			if (imgEl.naturalWidth > 0) {
				isPortrait = imgEl.naturalHeight > imgEl.naturalWidth;
			} else onImgError();
		}
	});

	async function share() {
		try {
			if (navigator.share) await navigator.share({ title, text: title, url: location.href });
			else await navigator.clipboard?.writeText(location.href);
		} catch (_) {}
	}
</script>

<article class="ad-wide">
	<div class="content" class:no-media={!showImg}>
		{#if showImg}
			<!-- LEFT: image -->
			<div class="media" class:portrait={isPortrait} style="--media-tint:{bannerBase}">
				<img
					bind:this={imgEl}
					src={PUBLIC_R2_BASE}{img}
					alt={title}
					loading="lazy"
					decoding="async"
					on:load={onImgLoad}
					on:error={onImgError}
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

			<!-- RIGHT: details -->
			<div class="meta">
				{#if description}<p class="desc">{description}</p>{/if}

				<!-- Desktop actions -->
				<div class="actions desktop">
					{#if email}<a class="btn primary" href={mailtoHref}>Contact</a>{/if}
					<button type="button" class="btn" on:click={share}>Share</button>
				</div>
			</div>
		{:else}
			<!-- TEXT-ONLY FULL-WIDTH -->
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

				<!-- Desktop actions (text-only) -->
				<div class="actions desktop">
					{#if email}<a class="btn primary" href={mailtoHref}>Contact</a>{/if}
					<button type="button" class="btn" on:click={share}>Share</button>
				</div>
			</div>
		{/if}
	</div>

	<!-- Mobile sticky CTA -->
	<div class="sticky-cta" role="region" aria-label="Ad actions">
		<div class="sticky-cta__price">{displayedPrice}</div>
		{#if email}<a class="btn primary btn--cta" href={mailtoHref}>Contact</a>{/if}
		<button type="button" class="btn" on:click={share}>Share</button>
	</div>
</article>

<style>
	.ad-wide {
		container-type: inline-size;
		border: 1px solid color-mix(in srgb, var(--fg) 8%, transparent);
		border-radius: 16px;
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--surface) 94%, transparent),
			var(--surface)
		);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
		overflow: hidden;
		padding-bottom: calc(80px + env(safe-area-inset-bottom)); /* room for mobile CTA */
	}
	.content {
		display: grid;
		gap: 14px;
		padding: 12px;
	}
	@container (min-width:640px) {
		.content {
			grid-template-columns: 1fr 1.2fr;
			align-items: start;
			gap: 16px;
		}
	}

	/* Media */
	.media {
		position: relative;
		aspect-ratio: 3/2;
		border-radius: 14px;
		overflow: hidden;
		background: color-mix(in srgb, var(--fg) 6%, transparent);
		isolation: isolate;
		max-height: 70vh;
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

	.ad-wide:hover .media img {
		transform: scale(1.03);
	}
	.media.portrait {
		aspect-ratio: 3/4;
		max-height: 80vh;
	}
	.media.portrait img {
		object-fit: contain;
		background: color-mix(in srgb, var(--bg) 85%, transparent);
	}

	/* Chips */
	.chip-row {
		position: absolute;
		inset: 8px 8px auto 8px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
		pointer-events: none;
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
		backdrop-filter: saturate(1.2) blur(6px);
		color: color-mix(in srgb, var(--fg) 86%, transparent);
	}
	.chip--cat {
		background: color-mix(in srgb, var(--chip) 22%, var(--bg));
	}
	.chip--price {
		background: color-mix(in srgb, #0ea5e9 22%, var(--bg));
	}
	@media (prefers-color-scheme: dark) {
		.chip {
			border-color: color-mix(in srgb, #fff 10%, transparent);
		}
		.chip--price {
			background: color-mix(in srgb, #38bdf8 24%, var(--bg));
		}
	}

	/* Overlay title */
	.overlay {
		position: absolute;
		inset: auto 0 0 0;
		z-index: 1;
		padding: 12px;
		background: linear-gradient(to top, color-mix(in srgb, #000 52%, transparent), transparent 70%);
		color: #fff;
	}
	.title {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 800;
		line-height: 1.25;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* Meta/description */
	.meta {
		display: grid;
		gap: 10px;
	}
	.desc {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 75%, transparent);
		font-size: 0.95rem;
		line-height: 1.5;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* Text-only */
	.text-body {
		border-radius: 14px;
		--tint: color-mix(in srgb, var(--chip, #6b7280) 10%, transparent);
		background:
			linear-gradient(180deg, var(--tint), transparent 60%),
			linear-gradient(
				135deg,
				color-mix(in srgb, var(--bg) 96%, transparent),
				color-mix(in srgb, var(--fg) 4%, transparent)
			);
		padding: 10px 12px;
	}
	.chip-row--text {
		position: static;
		inset: auto;
		margin: 2px 0 8px;
		display: flex;
		justify-content: space-between;
		gap: 8px;
	}
	.title--text {
		color: var(--fg);
		margin: 0 0 4px;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.content.no-media {
		display: block;
	}
	@container (min-width: 640px) {
		.content.no-media {
			display: grid;
			grid-template-columns: 1fr;
		}
	}

	/* Actions */
	.actions.desktop {
		display: flex;
		gap: 10px;
		align-items: center;
	}
	.btn {
		display: inline-grid;
		place-items: center;
		padding: 8px 12px;
		border-radius: 10px;
		border: 1px solid color-mix(in srgb, var(--fg) 18%, transparent);
		background: var(--surface);
		color: inherit;
		cursor: pointer;
	}
	.btn.primary {
		background: #000;
		color: #fff;
		border-color: #000;
	}

	/* Sticky CTA (mobile) */
	.sticky-cta {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		display: none;
		gap: 10px;
		align-items: center;
		padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
		border-top: 1px solid var(--hairline);
		background: var(--surface);
		z-index: 60;
	}
	.sticky-cta__price {
		min-width: 84px;
		font-weight: 800;
		font-size: 0.95rem;
	}
	.btn--cta {
		flex: 1;
	}

	/* Mobile/portrait tuning */
	@media (max-width: 768px), (orientation: portrait) {
		.sticky-cta {
			display: flex;
		}
		.actions.desktop {
			display: none;
		}
		.media {
			aspect-ratio: 4/3;
		}
		.media.portrait {
			aspect-ratio: 3/4;
		}
		.overlay {
			padding: 10px;
		}
		.title {
			font-size: 1.05rem;
			-webkit-line-clamp: 2;
		}
		.btn,
		.btn.primary {
			padding: 12px 14px;
			font-size: 16px;
		} /* avoid iOS zoom */
	}

	/* Reduce heavy effects on touch devices */
	@media (hover: none) {
		.ad-wide:hover .media img {
			transform: none;
		}
		.chip {
			backdrop-filter: none;
		}
	}
</style>
