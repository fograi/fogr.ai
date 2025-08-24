<script lang="ts">
	export let title: string;
	export let price: number;
	export let img: string;
	export let description: string;
	export let category: string;
	export let currency = 'EUR';
	export let locale = 'en-IE';

	// REPLACE your catBase / catIcon with:
	const catBase: Record<string, string> = {
		'Home & Garden': '#5A9C3E',
		Electronics: '#117AB5',
		'Baby & Kids': '#5DA9E9',
		'Sports & Bikes': '#2A9D4B',
		'Clothing & Accessories': '#D64B8A',
		'Services & Gigs': '#7A5AF8',
		'Lessons & Tutoring': '#CD5C5C',
		'Lost and Found': '#EE6600',
		'Free / Giveaway': '#1EAD7B'
	};
	const catIcon: Record<string, string> = {
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

	let isPortrait = false;
	function onImgLoad(e: Event) {
		const i = e.currentTarget as HTMLImageElement;
		isPortrait = i.naturalHeight > i.naturalWidth;
	}
</script>

<article class="ad-wide">
	<div class="content">
		<!-- LEFT: image -->
		<div class="media" class:portrait={isPortrait}>
			{#if img}
				<img src={img} alt={title} loading="lazy" decoding="async" on:load={onImgLoad} />
			{:else}
				<div class="placeholder" aria-hidden="true"></div>
			{/if}

			<!-- NEW: chips row -->
			<div class="chip-row">
				{#if category}
					<span class="chip chip--cat" style="--chip:{bannerBase}">
						<span aria-hidden="true">{bannerIcon}</span>
						<span class="chip__label">{category}</span>
					</span>
				{/if}
				{#if formattedPrice}<span class="chip chip--price">{formattedPrice}</span>{/if}
			</div>

			<!-- NEW: title overlay -->
			<div class="overlay">
				<h3 class="title">{title}</h3>
			</div>
		</div>

		<!-- RIGHT: details -->
		<div class="meta">
			{#if description}<p class="desc">{description}</p>{/if}
		</div>
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

	.media {
		position: relative;
		aspect-ratio: 3/2; /* more editorial than 16/9 */
		border-radius: 14px;
		overflow: hidden;
		background: color-mix(in srgb, var(--fg) 6%, transparent);
		isolation: isolate;
	}
	.media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.25s ease;
	}
	.ad-wide:hover .media img {
		transform: scale(1.03);
	}
	.media.portrait {
		aspect-ratio: 3/4;
	}
	.media.portrait img {
		object-fit: contain;
		background: color-mix(in srgb, var(--bg) 85%, transparent);
	}

	.placeholder {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, color-mix(in srgb, var(--fg) 8%, transparent), transparent);
	}

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
	}
	.desc {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 75%, transparent);
		font-size: 0.95rem;
		line-height: 1.5;
		display: -webkit-box;
		-webkit-box-orient: vertical;
	}
</style>
