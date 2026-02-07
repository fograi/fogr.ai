<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import { catBase } from '$lib/constants';
	import { PUBLIC_R2_BASE } from '$env/static/public';
	import { formatPriceLabel } from '$lib/utils/price';
	import { CATEGORY_ICON_MAP, DefaultCategoryIcon } from '$lib/icons';

	// Props
	export let title: string;
	export let price: number | null;
	export let img: string;
	export let description: string;
	export let category: string;
	export let currency = 'EUR';
	export let locale = 'en-IE';
	export let email: string = '';
	export let status: string | undefined = undefined;
	export let expiresAt: string | undefined = undefined;
	export let showActions = true;
	export let showExpires = false;

	// Derived
	$: bannerBase = catBase[category?.trim?.() as keyof typeof catBase] ?? '#6B7280';
	$: bannerIcon = CATEGORY_ICON_MAP[category?.trim?.() ?? ''] ?? DefaultCategoryIcon;
	$: displayedPrice = formatPriceLabel({ price, category, currency, locale });

	$: expiresLabel = expiresAt
		? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(expiresAt))
		: '';

	$: mailtoHref = email ? `mailto:${email}?subject=${encodeURIComponent('Enquiry: ' + title)}` : '';

	// Image handling
	let isPortrait = false;
	let showImg = !!img && status !== 'pending';
	let imgEl: HTMLImageElement | null = null;
	let lightboxOpen = false;
	let closeButton: HTMLButtonElement | null = null;
	let lastActive: Element | null = null;
	$: showImg = !!img && status !== 'pending';

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
	onDestroy(() => {
		if (typeof document !== 'undefined') {
			document.body.style.overflow = '';
		}
	});

	async function openLightbox() {
		if (!showImg) return;
		if (typeof document !== 'undefined') {
			lastActive = document.activeElement;
			document.body.style.overflow = 'hidden';
		}
		lightboxOpen = true;
		await tick();
		closeButton?.focus();
	}

	function closeLightbox() {
		lightboxOpen = false;
		if (typeof document !== 'undefined') {
			document.body.style.overflow = '';
		}
		if (lastActive instanceof HTMLElement) {
			lastActive.focus();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!lightboxOpen) return;
		if (event.key === 'Escape') closeLightbox();
	}

	async function share() {
		try {
			if (navigator.share) await navigator.share({ title, text: title, url: location.href });
			else await navigator.clipboard?.writeText(location.href);
		} catch {
			/* noop */
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<article class="listing-wide">
	<div class="content" class:no-media={!showImg}>
		{#if showImg}
			<!-- Banner header above image -->
			<div class="banner" style="--banner:{bannerBase}">
				<span class="banner__icon" aria-hidden="true">
					<svelte:component this={bannerIcon} size={20} strokeWidth={1.6} />
				</span>
				<span class="banner__label">{(category || '').toUpperCase()}</span>
			</div>

			<!-- Full-height image, NO overlays/chips -->
			<button
				type="button"
				class="media media-button"
				on:click={openLightbox}
				aria-label="View listing image full screen"
			>
				<img
					bind:this={imgEl}
					src={`${PUBLIC_R2_BASE.replace(/\/+$/, '')}/${img.replace(/^\/+/, '')}`}
					alt={title}
					loading="lazy"
					decoding="async"
					on:load={onImgLoad}
					on:error={onImgError}
				/>
			</button>

			<!-- Text meta beside/under the image -->
			<div class="meta">
				<h3 class="title--standalone">{title}</h3>
				{#if !showActions && displayedPrice}
					<span class="price-badge">{displayedPrice}</span>
				{/if}
				{#if description}<p class="desc">{description}</p>{/if}
				{#if expiresLabel && showExpires}
					<p class="meta-line">
						{status === 'expired' ? 'Expired on' : 'Expires on'} {expiresLabel}
					</p>
				{/if}
				{#if showActions}
					<div class="actions desktop">
						<!-- Price badge sits here (not over image) -->
						{#if displayedPrice}<span class="price-badge">{displayedPrice}</span>{/if}
						{#if email}
							<a class="btn primary" href={mailtoHref} rel="external">Contact</a>
						{/if}
						<button type="button" class="btn" on:click={share}>Share</button>
					</div>
				{/if}
			</div>
		{:else}
			<!-- TEXT-ONLY FULL-WIDTH -->
			<div class="text-body">
				<div class="banner" style="--banner:{bannerBase}">
					<span class="banner__icon" aria-hidden="true">
						<svelte:component this={bannerIcon} size={20} strokeWidth={1.6} />
					</span>
					<span class="banner__label">{(category || '').toUpperCase()}</span>
				</div>

				<h3 class="title--standalone">{title}</h3>
				{#if !showActions && displayedPrice}
					<span class="price-badge">{displayedPrice}</span>
				{/if}
				{#if description}<p class="desc">{description}</p>{/if}
				{#if expiresLabel && showExpires}
					<p class="meta-line">
						{status === 'expired' ? 'Expired on' : 'Expires on'} {expiresLabel}
					</p>
				{/if}

				{#if showActions}
					<div class="actions desktop">
						{#if displayedPrice}<span class="price-badge">{displayedPrice}</span>{/if}
						{#if email}
							<a class="btn primary" href={mailtoHref} rel="external">Contact</a>
						{/if}
						<button type="button" class="btn" on:click={share}>Share</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Mobile sticky CTA -->
	{#if showActions}
		<div class="sticky-cta" role="region" aria-label="Listing actions">
			<div class="sticky-cta__price">{displayedPrice}</div>
			{#if email}
				<a class="btn primary btn--cta" href={mailtoHref} rel="external">Contact</a>
			{/if}
			<button type="button" class="btn" on:click={share}>Share</button>
		</div>
	{/if}
</article>

{#if lightboxOpen}
	<div
		class="lightbox"
		role="dialog"
		aria-modal="true"
		aria-label={`Full screen image: ${title}`}
		on:click={closeLightbox}
	>
		<button
			type="button"
			class="lightbox__close"
			on:click={closeLightbox}
			on:click|stopPropagation
			aria-label="Close image"
			bind:this={closeButton}
		>
			<span aria-hidden="true">×</span>
		</button>
		<img
			class="lightbox__image"
			src={`${PUBLIC_R2_BASE.replace(/\/+$/, '')}/${img.replace(/^\/+/, '')}`}
			alt={title}
			loading="eager"
			decoding="async"
			on:click|stopPropagation
		/>
	</div>
{/if}

<style>
	.listing-wide {
		max-width: none; /* let inner grid control width */
		margin: 24px auto;
		padding: 0 var(--page-pad);
		container-type: inline-size;
	}

	.listing-wide:hover .media img {
		transform: scale(1.03);
	}
	.content {
		display: grid;
		grid-template-columns: 1fr 1fr; /* equal halves */
		gap: 24px;
		align-items: start;
		max-width: 960px; /* constrain width */
		margin-inline: auto; /* <-- centers horizontally */
		width: 100%; /* still flexible */

		text-align: center;
	}

	@media (max-width: 768px), (orientation: portrait) {
		.content {
			grid-template-columns: 1fr;
			text-align: center;
		}
	}

	.banner {
		grid-column: 1 / -1;
		background: color-mix(in srgb, var(--fg) 14%, var(--bg));
		color: var(--fg);
		border-radius: 6px;
		padding: 10px 12px;
		font-weight: 900;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		display: flex; /* full flex */
		justify-content: center; /* center horizontally */
		align-items: center; /* center vertically */
		gap: 10px;
		text-align: center;
	}

	.banner__icon {
		filter: saturate(1.2);
	}
	.banner__label {
		font-size: 0.95rem;
	}

	/* Media */
	.media {
		display: block;
		width: 100%; /* <-- important: fill the grid column */
		border: 8px solid color-mix(in srgb, var(--fg) 8%, transparent);
		border-radius: 6px;
		overflow: hidden;
		background: color-mix(in srgb, var(--fg) 6%, transparent);
	}
	.media-button {
		padding: 0;
		appearance: none;
		cursor: zoom-in;
	}
	.media-button:focus-visible {
		outline: 2px solid var(--link);
		outline-offset: 3px;
	}

	.media img {
		display: block; /* avoid inline gaps */
		width: 100%;
		height: auto;
		object-fit: contain;
	}

	.title--standalone {
		margin: 8px 0 4px;
		font-size: 1.4rem;
		font-weight: 800;
		line-height: 1.25;
		color: var(--fg);
	}

	/* Meta/description */
	.meta {
		display: grid;
		gap: 8px; /* reduce gap between title/desc/buttons */
		align-content: start; /* prevent centering in tall column */
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
	.meta-line {
		margin: 0;
		font-weight: 600;
		color: color-mix(in srgb, var(--fg) 65%, transparent);
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
		justify-content: center;
	}
	.content.no-media {
		display: block;
	}

	/* Actions */
	.actions.desktop {
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
		background: color-mix(in srgb, var(--fg) 18%, var(--bg));
		color: var(--fg);
		border-color: var(--hairline);
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

	.price-badge {
		display: inline-block;
		background: color-mix(in srgb, var(--fg) 18%, var(--bg));
		color: var(--fg);
		padding: 6px 10px;
		border-radius: 4px;
		font-weight: 900;
		text-align: center;
		margin-right: 8px;
	}
	.meta .price-badge,
	.text-body .price-badge {
		justify-self: center;
		width: max-content;
		min-width: 0;
		margin-inline: auto;
	}

	.lightbox {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.86);
		display: grid;
		align-items: center;
		justify-items: center;
		padding: 20px;
		z-index: 1200;
	}
	.lightbox__close {
		position: absolute;
		top: 16px;
		right: 16px;
		width: 38px;
		height: 38px;
		display: grid;
		place-items: center;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.25);
		background: rgba(0, 0, 0, 0.6);
		color: #fff;
		font-size: 1.4rem;
		font-weight: 600;
		line-height: 1;
		cursor: pointer;
	}
	.lightbox__close:focus-visible {
		outline: 2px solid #fff;
		outline-offset: 2px;
	}
	.lightbox__image {
		max-width: min(1200px, 96vw);
		max-height: min(88vh, 1200px);
		width: auto;
		height: auto;
		object-fit: contain;
		border-radius: 12px;
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
	}

	@media (orientation: portrait) {
		.lightbox {
			padding: 14px;
		}
		.lightbox__image {
			max-width: 96vw;
			max-height: 82vh;
		}
	}
</style>
