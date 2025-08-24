<script lang="ts">
	export let id: number | string;
	export let title: string;
	export let price: number;
	export let img: string;
	export let description: string;
	export let category: string;

	export let currency = 'EUR';
	export let locale = 'en-IE';

	export const catBase: Record<string, string> = {
		'Home & Garden': '#5A9C3E', // merged Furniture/Appliances/Household/Gardening
		Electronics: '#117AB5',
		'Baby & Kids': '#5DA9E9', // merged Baby/Toys/Books
		'Sports & Bikes': '#2A9D4B',
		'Clothing & Accessories': '#D64B8A',
		'Services & Gigs': '#7A5AF8',
		'Lessons & Tutoring': '#CD5C5C', // was Education
		'Lost and Found': '#EE6600',
		'Free / Giveaway': '#1EAD7B' // growth lever
		// (Defer) Jobs, Pets
	};

	export const catIcon: Record<string, string> = {
		'Home & Garden': '🏠',
		Electronics: '💻',
		'Baby & Kids': '🧸',
		'Sports & Bikes': '🚲',
		'Clothing & Accessories': '👕',
		'Services & Gigs': '🧰',
		'Lessons & Tutoring': '🎓',
		'Lost and Found': '🔎',
		'Free / Giveaway': '🆓'
	};

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

	function onImgLoad(e: Event) {
		const img = e.currentTarget as HTMLImageElement;
		isPortrait = img.naturalHeight > img.naturalWidth;
	}
</script>

<li class="card">
	<a class="link-wrap" {href} aria-label={`View ad: ${title}`}>
		<div class="card__inner">
			{#if category}
				<div class="banner" style="--banner-base: {bannerBase}">
					<span class="icon" aria-hidden="true">{bannerIcon}</span>
					<span class="label">{category}</span>
				</div>
			{/if}

			<div class="media" class:portrait={isPortrait}>
				{#if img}
					<img src={img} alt={title} loading="lazy" decoding="async" on:load={onImgLoad} />
				{:else}
					<div class="placeholder" aria-hidden="true"></div>
				{/if}
			</div>

			<h3 class="title">{title}</h3>
			{#if description}<p class="desc">{description}</p>{/if}
			{#if formattedPrice}<p class="price">{formattedPrice}</p>{/if}
		</div>
	</a>
</li>

<style>
	.card {
		border: 1px solid var(--hairline);
		border-radius: 12px;
		background: var(--surface);
		color: inherit;
		overflow: hidden;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
		transition:
			transform 0.18s ease,
			box-shadow 0.18s ease,
			border-color 0.18s ease;
		will-change: transform;
	}
	.card:hover {
		transform: translateY(-6px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
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

	.card__inner {
		padding: 0px 12px;
		overflow: visible;
		position: relative;
		padding-bottom: 32px;
	}

	/* full-width strip like classifieds */
	.banner {
		display: flex;
		justify-content: space-between;
		align-items: center;
		text-align: center;
		gap: 0.5rem;
		margin: 0 -14px 6px; /* bleed to card edges */
		padding: 6px 12px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.02em;
		border-bottom: 1px solid var(--hairline);
		/* mix the category color with the page bg so it works in light/dark */
		background: color-mix(in srgb, var(--banner-base) 20%, var(--bg));
		color: var(--fg);
		border-top-left-radius: 12px;
		border-top-right-radius: 12px;
		white-space: nowrap;
		overflow: hidden;
	}

	.banner .icon {
		font-size: 1.25rem; /* tweak as you like */
		line-height: 1;
	}

	.banner .label {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	@media (prefers-color-scheme: dark) {
		.banner {
			background: color-mix(in srgb, var(--banner-base) 66%, var(--bg));
		}
	}

	.media {
		position: relative;
		aspect-ratio: 16/9; /* default for landscape */
		border-radius: 8px;
		overflow: hidden;
		background: color-mix(in srgb, var(--fg) 6%, transparent);
		margin-bottom: 8px;
	}

	.media.portrait {
		aspect-ratio: 3/4;
	} /* room for tall images */

	.media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block; /* fill for landscape */
	}
	.media.portrait img {
		object-fit: contain; /* show full portrait image */
		background: color-mix(in srgb, var(--bg) 85%, transparent); /* subtle letterbox */
	}
	.media .placeholder {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, color-mix(in srgb, var(--fg) 8%, transparent), transparent);
	}

	.title {
		font-size: 0.95rem;
		line-height: 1.25;
		display: -webkit-box;
		margin: 4px 0 4px;
		font-weight: 700;
	}

	.desc {
		font-size: 0.9rem;
		line-height: 1.35;
		margin: 0 0 2px;
	}

	.price {
		position: absolute;
		right: 12px;
		bottom: 8px; /* was -12px; keep it inside */
		font-weight: 700;
		margin: 0;
	}

	@media (max-width: 420px) {
		.media {
			max-height: 180px;
			aspect-ratio: 3/2;
		}
	}
</style>
