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
			<div class="media" class:portrait={isPortrait}>
				{#if img}
					<img src={img} alt={title} loading="lazy" decoding="async" on:load={onImgLoad} />
				{:else}
					<div class="placeholder" aria-hidden="true"></div>
				{/if}

				<!-- NEW: chips over image -->
				<div class="chip-row">
					{#if category}
						<span class="chip chip--cat" style="--chip:{bannerBase}">
							<span aria-hidden="true">{bannerIcon}</span>
							<span class="chip__label">{category}</span>
						</span>
					{/if}
					{#if formattedPrice}<span class="chip chip--price">{formattedPrice}</span>{/if}
				</div>

				<!-- NEW: title over image -->
				<div class="overlay">
					<h3 class="title">{title}</h3>
				</div>
			</div>

			{#if description}<p class="desc">{description}</p>{/if}
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
		transition: transform 0.25s ease;
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
