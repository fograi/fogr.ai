<script lang="ts">
	export let id: number | string;
	export let title: string;
	export let price: number;
	export let img: string;
	export let description: string;
	export let category: string;

	// optional formatting; adjust to your market
	export let currency = 'EUR';
	export let locale = 'en-IE';

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
				{#if category}<span class="badge">{category}</span>{/if}
			</div>

			<h3 class="title">{title}</h3>

			{#if formattedPrice}
				<div class="price">{formattedPrice}</div>
			{/if}

			{#if description}
				<p class="desc">{description}</p>
			{/if}
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
		padding: 12px;
	}

	.media {
		position: relative;
		aspect-ratio: 16/9; /* default for landscape */
		border-radius: 8px;
		overflow: hidden;
		background: color-mix(in srgb, var(--fg) 6%, transparent);
		margin-bottom: 10px;
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

	.badge {
		position: absolute;
		top: 8px;
		right: 8px;
		font-size: 12px;
		line-height: 1;
		padding: 6px 8px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--bg) 85%, transparent);
		border: 1px solid var(--hairline);
		backdrop-filter: blur(2px);
	}

	.title {
		margin: 0 0 6px;
		font-size: 1rem;
		font-weight: 700;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.price {
		font-weight: 700;
		margin: 0 0 6px;
	}

	.desc {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 80%, transparent);
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
