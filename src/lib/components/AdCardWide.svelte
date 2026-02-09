<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import { catBase } from '$lib/constants';
	import { PUBLIC_R2_BASE } from '$env/static/public';
	import {
		buildBikeNarrativeSummary,
		getBikeProfileSummary,
		isBikesCategory
	} from '$lib/category-profiles';
	import { formatPriceLabel, hasPaidPrice } from '$lib/utils/price';
	import { CATEGORY_ICON_MAP, DefaultCategoryIcon, ShareIcon } from '$lib/icons';
	import { formatLocationSummary } from '$lib/location-profile';

	// Props
	export let title: string;
	export let price: number | null;
	export let img: string;
	export let description: string;
	export let category: string;
	export let categoryProfileData: Record<string, unknown> | null = null;
	export let locationProfileData: Record<string, unknown> | null = null;
	export let currency = 'EUR';
	export let locale = 'en-IE';
	export let email: string = '';
	export let status: string | undefined = undefined;
	export let expiresAt: string | undefined = undefined;
	export let showActions = true;
	export let showExpires = false;
	export let firmPrice = false;
	export let minOffer: number | null = null;

	// Derived
	$: bannerBase = catBase[category?.trim?.() as keyof typeof catBase] ?? '#6B7280';
	$: bannerIcon = CATEGORY_ICON_MAP[category?.trim?.() ?? ''] ?? DefaultCategoryIcon;
	$: displayedPrice = formatPriceLabel({ price, category, currency, locale });
	$: isPaidPrice = hasPaidPrice(price);
	$: offerBadge = isPaidPrice
		? firmPrice
			? 'Firm price'
			: typeof minOffer === 'number' && minOffer > 0
				? 'Offers'
				: ''
		: '';
	$: bikeSummary =
		isBikesCategory(category) && categoryProfileData
			? getBikeProfileSummary(categoryProfileData)
			: null;
	$: bikeChips = bikeSummary
		? [
				bikeSummary.subtypeLabel,
				bikeSummary.bikeTypeLabel,
				bikeSummary.conditionLabel,
				bikeSummary.sizeLabel
			].filter((value): value is string => !!value)
		: [];
	$: bikeNarrative = bikeSummary
		? bikeSummary.narrativeSummary ||
			buildBikeNarrativeSummary({
				reasonForSelling: bikeSummary.reasonForSelling,
				usageSummary: bikeSummary.usageSummary,
				knownIssues: bikeSummary.knownIssues
			})
		: '';
	$: displayDescription = bikeNarrative || description;
	$: locationSummary = formatLocationSummary(locationProfileData);

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

			<div class="media-column">
				{#if bikeChips.length > 0}
					<div class="bike-chips media-highlights" aria-label="Bike highlights">
						{#each bikeChips as chip (chip)}
							<span class="bike-chip">{chip}</span>
						{/each}
					</div>
				{/if}
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
			</div>

			<!-- Text meta beside/under the image -->
			<div class="meta">
				<h3 class="title--standalone">{title}</h3>
				{#if offerBadge}
					<div class="badges">
						<span class={`badge ${firmPrice ? 'firm' : 'offers'}`}>{offerBadge}</span>
					</div>
				{/if}
				{#if !showActions && displayedPrice}
					<span class="price-badge">{displayedPrice}</span>
				{/if}
				{#if displayDescription}<p class="desc">{displayDescription}</p>{/if}
				{#if locationSummary}
					<p class="meta-line">Location: {locationSummary}</p>
				{/if}
				{#if expiresLabel && showExpires}
					<p class="meta-line">
						{status === 'expired' ? 'Expired on' : 'Expires on'}
						{expiresLabel}
					</p>
				{/if}
				{#if showActions}
					<div class="actions desktop">
						<!-- Price badge sits here (not over image) -->
						{#if displayedPrice}<span class="price-badge">{displayedPrice}</span>{/if}
						{#if email}
							<a class="btn primary" href={mailtoHref} rel="external">Contact</a>
						{/if}
						<button type="button" class="btn" on:click={share}>
							<span class="btn-icon" aria-hidden="true">
								<ShareIcon size={16} strokeWidth={1.8} />
							</span>
							Share
						</button>
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
				{#if bikeChips.length > 0}
					<div class="bike-chips" aria-label="Bike highlights">
						{#each bikeChips as chip (chip)}
							<span class="bike-chip">{chip}</span>
						{/each}
					</div>
				{/if}

				<h3 class="title--standalone">{title}</h3>
				{#if offerBadge}
					<div class="badges">
						<span class={`badge ${firmPrice ? 'firm' : 'offers'}`}>{offerBadge}</span>
					</div>
				{/if}
				{#if !showActions && displayedPrice}
					<span class="price-badge">{displayedPrice}</span>
				{/if}
				{#if displayDescription}<p class="desc">{displayDescription}</p>{/if}
				{#if locationSummary}
					<p class="meta-line">Location: {locationSummary}</p>
				{/if}
				{#if expiresLabel && showExpires}
					<p class="meta-line">
						{status === 'expired' ? 'Expired on' : 'Expires on'}
						{expiresLabel}
					</p>
				{/if}

				{#if showActions}
					<div class="actions desktop">
						{#if displayedPrice}<span class="price-badge">{displayedPrice}</span>{/if}
						{#if email}
							<a class="btn primary" href={mailtoHref} rel="external">Contact</a>
						{/if}
						<button type="button" class="btn" on:click={share}>
							<span class="btn-icon" aria-hidden="true">
								<ShareIcon size={16} strokeWidth={1.8} />
							</span>
							Share
						</button>
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
			<button type="button" class="btn" on:click={share}>
				<span class="btn-icon" aria-hidden="true">
					<ShareIcon size={16} strokeWidth={1.8} />
				</span>
				Share
			</button>
		</div>
	{/if}
</article>

{#if lightboxOpen}
	<div
		class="lightbox"
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-label={`Full screen image: ${title}`}
	>
		<button
			type="button"
			class="lightbox__backdrop"
			on:click={closeLightbox}
			aria-label="Close image"
		></button>
		<button
			type="button"
			class="lightbox__close"
			on:click={closeLightbox}
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
		color: var(--accent-green);
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
	.media-column {
		display: grid;
		gap: 10px;
		align-content: start;
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
	.badges {
		display: flex;
		justify-content: center;
	}
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 10px;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.01em;
		text-transform: uppercase;
		border: 1px solid var(--hairline);
		background: color-mix(in srgb, var(--fg) 8%, var(--bg));
	}
	.badge.firm {
		background: color-mix(in srgb, var(--fg) 16%, var(--bg));
	}
	.bike-chips {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 6px;
	}
	.media-highlights {
		min-height: 1.75rem;
	}
	.bike-chip {
		display: inline-flex;
		align-items: center;
		padding: 4px 9px;
		border-radius: 999px;
		font-size: 0.74rem;
		font-weight: 700;
		border: 1px solid color-mix(in srgb, var(--fg) 15%, transparent);
		background: color-mix(in srgb, var(--fg) 6%, var(--surface));
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
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 8px 12px;
		border-radius: 10px;
		border: 1px solid color-mix(in srgb, var(--fg) 18%, transparent);
		background: var(--surface);
		color: inherit;
		cursor: pointer;
	}
	.btn-icon {
		display: inline-flex;
		align-items: center;
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
	.lightbox__backdrop {
		position: absolute;
		inset: 0;
		border: 0;
		background: transparent;
		padding: 0;
		cursor: zoom-out;
		z-index: 0;
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
		z-index: 2;
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
		z-index: 1;
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
