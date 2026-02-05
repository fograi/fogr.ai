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
	export let status: string | undefined = undefined;
	export let expiresAt: string | undefined = undefined;
	export let showActions = true;

	// Derived
	$: bannerBase = catBase[category?.trim?.() as keyof typeof catBase] ?? '#6B7280';
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

	$: expiresLabel = expiresAt
		? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(expiresAt))
		: '';

	$: mailtoHref = email ? `mailto:${email}?subject=${encodeURIComponent('Enquiry: ' + title)}` : '';

	// Image handling
	let isPortrait = false;
	let showImg = !!img && status !== 'pending';
	let imgEl: HTMLImageElement | null = null;
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

	async function share() {
		try {
			if (navigator.share) await navigator.share({ title, text: title, url: location.href });
			else await navigator.clipboard?.writeText(location.href);
		} catch {
			/* noop */
		}
	}
</script>

<article class="listing-wide">
	<div class="content" class:no-media={!showImg}>
		{#if showImg}
			<!-- Banner header above image -->
			<div class="banner" style="--banner:{bannerBase}">
				<span class="banner__icon">{bannerIcon}</span>
				<span class="banner__label">{(category || '').toUpperCase()}</span>
			</div>

			<!-- Square image, NO overlays/chips -->
			<div class="media square">
				<img
					bind:this={imgEl}
					src={`${PUBLIC_R2_BASE.replace(/\/+$/, '')}/${img.replace(/^\/+/, '')}`}
					alt={title}
					loading="lazy"
					decoding="async"
					on:load={onImgLoad}
					on:error={onImgError}
				/>
			</div>

			<!-- Text meta beside/under the image -->
			<div class="meta">
				<h3 class="title--standalone">{title}</h3>
				{#if description}<p class="desc">{description}</p>{/if}
				{#if expiresLabel}
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
					<span class="banner__icon">{bannerIcon}</span>
					<span class="banner__label">{(category || '').toUpperCase()}</span>
				</div>

				<h3 class="title--standalone">{title}</h3>
				{#if description}<p class="desc">{description}</p>{/if}
				{#if expiresLabel}
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

<style>
	.listing-wide {
		max-width: none; /* let inner grid control width */
		margin: 24px auto;
		padding: 0 16px;
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
	.media,
	.media.square {
		width: 100%; /* <-- important: fill the grid column */
		max-height: 70vh;
	}

	.media.square {
		aspect-ratio: 1 / 1;
		border: 8px solid color-mix(in srgb, var(--fg) 8%, transparent);
		border-radius: 6px;
		overflow: hidden;
		background: color-mix(in srgb, var(--fg) 6%, transparent);
	}

	.media img {
		display: block; /* avoid inline gaps */
		width: 100%;
		height: 100%;
		object-fit: cover;
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
		min-width: 56px;
		text-align: center;
		margin-right: 8px;
	}
</style>
