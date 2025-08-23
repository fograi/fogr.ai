<script lang="ts">
    export let id: number | string;
    export let title: string;
    export let price: number;
    export let img: string;
    export let description: string;
    export let category: string;
    export let email: string;
    export let currency = 'EUR';
    export let locale = 'en-IE';
  
    const href = `/ad/${id}`;
  
    const catBase: Record<string, string> = {
      Furniture: '#D64B8A',
      Jobs: '#2B76D2',
      Pets: '#1EAD7B',
      Services: '#7A5AF8',
      Education: '#CD5C5C',
      'Lost and Found': '#EE6600',
      Sports: '#2A9D4B',
      Books: '#AD7A50',
      Household: '#5B7083',
      Clothing: '#D64B8A',
      Gardening: '#5A9C3E',
      Electronics: '#117AB5',
      Baby: '#5DA9E9',
      Appliances: '#F2C94C',
      Toys: '#FF7A59'
    };
  
    const catIcon: Record<string, string> = {
      Furniture: '🪑',
      Jobs: '💼',
      Pets: '🐾',
      Services: '🧰',
      Education: '🎓',
      'Lost and Found': '🔎',
      Sports: '🏅',
      Books: '📚',
      Household: '🏠',
      Clothing: '👕',
      Gardening: '🪴',
      Electronics: '💻',
      Baby: '🍼',
      Appliances: '🔌',
      Toys: '🧸'
    };
  
    $: bannerBase = catBase[category?.trim?.() ?? ''] ?? '#6B7280';
    $: bannerIcon = catIcon[category?.trim?.() ?? ''] ?? '🗂️';
  
    $: formattedPrice =
      typeof price === 'number'
        ? new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(price)
        : null;
  
    let isPortrait = false;
    function onImgLoad(e: Event) {
      const i = e.currentTarget as HTMLImageElement;
      isPortrait = i.naturalHeight > i.naturalWidth;
    }
</script>

<article class="ad-wide">
	{#if category}
		<div class="banner" style="--banner-base:{bannerBase}">
			<span class="icon" aria-hidden="true">{bannerIcon}</span>
			<span class="label">{category}</span>
		</div>
	{/if}

	<div class="content">
		<!-- LEFT: image -->
		<a class="media-link" {href} aria-label={`View ad: ${title}`}>
			<div class="media" class:portrait={isPortrait}>
				{#if img}
					<img src={img} alt={title} loading="lazy" decoding="async" on:load={onImgLoad} />
				{:else}
					<div class="placeholder" aria-hidden="true"></div>
				{/if}
			</div>
		</a>

		<!-- RIGHT: details -->
		<div class="meta">
			<h3 class="title"><a class="titlelink" {href}>{title}</a></h3>
			{#if formattedPrice}<div class="price">{formattedPrice}</div>{/if}
			{#if description}<p class="desc">{description}</p>{/if}

			{#if email}
				<div class="contact">
					<a class="btn" href={'mailto:' + email}>Email seller</a>
					<span class="addr">{email}</span>
				</div>
			{/if}
		</div>
	</div>
</article>

<style>
	.ad-wide {
		container-type: inline-size;
		border: 1px solid var(--hairline);
		border-radius: 12px;
		background: var(--surface);
		color: inherit;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        overflow: hidden;
	}

	/* banner */
	.banner {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		padding: 10px 12px;
		text-transform: uppercase;
		font-weight: 700;
		letter-spacing: 0.02em;
		border-bottom: 1px solid var(--hairline);
		background: color-mix(in srgb, var(--banner-base) 20%, var(--bg));
	}
	@media (prefers-color-scheme: dark) {
		.banner {
			background: color-mix(in srgb, var(--banner-base) 66%, var(--bg));
		}
	}
	.banner .icon {
		font-size: 1.05rem;
		line-height: 1;
	}

	/* layout */
	.content {
		display: grid;
		gap: 14px;
		padding: 12px;
	}
	@container (min-width: 640px) {
		.content {
			grid-template-columns: 1fr 1.2fr;
			align-items: start;
			gap: 16px;
		}
	}

	/* media */
	.media-link {
		display: block;
		text-decoration: none;
		color: inherit;
	}
	.media {
		position: relative;
		aspect-ratio: 16/9;
		border-radius: 10px;
		overflow: hidden;
		background: color-mix(in srgb, var(--fg) 6%, transparent);
	}
	.media.portrait {
		aspect-ratio: 3/4;
	}
	.media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
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

	/* details */
	.title {
		margin: 0 0 6px;
		font-size: 1.05rem;
		font-weight: 800;
	}
	.titlelink {
		text-decoration: none;
		color: inherit;
	}
	.titlelink:focus-visible {
		outline: 2px solid var(--link);
		outline-offset: 2px;
	}

	.price {
		font-weight: 700;
		margin: 0 0 6px;
	}
	.desc {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 80%, transparent);
		display: -webkit-box;
		-webkit-line-clamp: 6;
		line-clamp: 6;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.contact {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
		margin-top: 10px;
	}
	.btn {
		display: inline-block;
		padding: 0.4rem 0.65rem;
		border-radius: 0.45rem;
		border: 1px solid var(--hairline);
		background: color-mix(in srgb, var(--fg) 6%, var(--bg));
		text-decoration: none;
		color: inherit;
		font-weight: 600;
	}
	.btn:hover {
		background: color-mix(in srgb, var(--fg) 10%, var(--bg));
	}
	.addr {
		opacity: 0.85;
		font-size: 0.92em;
	}
</style>
