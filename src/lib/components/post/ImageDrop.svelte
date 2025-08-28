<script lang="ts">
	import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE, catBase, catIcon } from '$lib/constants';

	// two-way bind from parent
	export let file: File | null = null;
	export let previewUrl: string | null = null;
	export let imgLoaded = false;
	export let title: string = '';
	export let category: keyof typeof catBase | '' = '';
	export let isFree = false;
	export let price: number | '' = '';
	export let currency = 'EUR';
	export let locale = 'en-IE';

	// state
	let imgEl: HTMLImageElement | null = null;
	let err = '';

	$: bannerBase = category ? catBase[category] : '#6B7280';
	$: bannerIcon = category ? catIcon[category] : '🗂️';

	function setPreview(f: File) {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = URL.createObjectURL(f);
		imgLoaded = false;
	}
	function clearFile() {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = null;
		file = null;
		imgLoaded = false;
		err = '';
		// bubble up so parent can also react if it wants
		const e = new CustomEvent('clear');
		dispatchEvent(e);
	}

	function onFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const f = input.files?.[0];
		if (!f) return clearFile();
		if (!ALLOWED_IMAGE_TYPES.includes(f.type))
			return ((err = 'Only JPEG or PNG allowed.'), clearFile());
		if (f.size > MAX_IMAGE_SIZE)
			return (
				(err = `Image must be ≤ ${Math.floor(MAX_IMAGE_SIZE / (1024 * 1024))}MB.`),
				clearFile()
			);
		err = '';
		file = f;
		setPreview(f);
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		const f = e.dataTransfer?.files?.[0];
		if (!f) return;
		if (!ALLOWED_IMAGE_TYPES.includes(f.type))
			return ((err = 'Only JPEG or PNG allowed.'), clearFile());
		if (f.size > MAX_IMAGE_SIZE)
			return (
				(err = `Image must be ≤ ${Math.floor(MAX_IMAGE_SIZE / (1024 * 1024))}MB.`),
				clearFile()
			);
		err = '';
		file = f;
		setPreview(f);
	}

	$: formatted =
		!isFree && price !== ''
			? new Intl.NumberFormat(locale, {
					style: 'currency',
					currency,
					maximumFractionDigits: 0
				}).format(Number(price))
			: '';

	// expose actions to parent via element binding if needed
	export { clearFile };
</script>

<div
	class="drop"
	style="--chip:{bannerBase}"
	on:dragover|preventDefault
	on:drop={onDrop}
	role="button"
	aria-label="Drop image here"
	tabindex="0"
>
	{#if previewUrl}
		<!-- Banner header above image (centered) -->
		<div class="banner" style="--banner:{bannerBase}">
			<span class="banner__icon">{bannerIcon}</span>
			<span class="banner__label">{(category || '').toUpperCase()}</span>
		</div>

		<!-- Square image, no overlays/chips -->
		<div class="media square">
			<img
				bind:this={imgEl}
				src={previewUrl}
				alt=""
				class:loaded={imgLoaded}
				on:load={() => (imgLoaded = true)}
				on:error={() => (imgLoaded = false)}
			/>
		</div>
		<h3 class="title--standalone">{title || 'Your catchy title'}</h3>
		{#if isFree || formatted}
			<div class="price-row">
				<span class="price-badge">{isFree ? 'Free' : formatted}</span>
			</div>
		{/if}
		<div class="row actions">
			<button type="button" class="btn ghost" on:click={clearFile}>Remove image</button>
			<label class="btn">
				Replace
				<input
					type="file"
					accept={ALLOWED_IMAGE_TYPES.join(',')}
					capture="environment"
					on:change={onFileChange}
					hidden
				/>
			</label>
		</div>
	{:else}
		<div class="empty">
			<div class="icon">🖼️</div>
			<p>Drag & drop an image, or</p>
			<label class="btn">
				Choose file
				<input
					type="file"
					accept={ALLOWED_IMAGE_TYPES.join(',')}
					capture="environment"
					on:change={onFileChange}
					hidden
				/>
			</label>
			<small>Max {Math.floor(MAX_IMAGE_SIZE / (1024 * 1024))}MB • JPG/PNG • 1 image</small>
			{#if err}<p class="error">{err}</p>{/if}
		</div>
	{/if}
</div>

<style>
	.drop {
		border: 1px dashed color-mix(in srgb, var(--fg) 25%, transparent);
		border-radius: 16px;
		padding: 12px;
	}

	/* Centered banner header, like the ad page */
	.banner {
		background: #000;
		color: #fff;
		border-radius: 6px;
		padding: 10px 12px;
		font-weight: 900;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		display: flex;
		justify-content: center; /* center content */
		align-items: center;
		gap: 10px;
		text-align: center;
		margin-bottom: 12px; /* space above image */
	}
	.banner__icon {
		filter: saturate(1.2);
	}
	.banner__label {
		font-size: 0.95rem;
	}

	/* Square media (no overlay) */
	.media {
		position: relative;
		border-radius: 14px;
		overflow: hidden;
		background: color-mix(in srgb, var(--fg) 6%, transparent);
	}
	.media.square {
		aspect-ratio: 1 / 1;
	}
	.media img {
		width: 100%;
		height: 100%;
		object-fit: cover; /* square crop */
		opacity: 0;
		transition: opacity 0.2s ease;
	}
	.media img.loaded {
		opacity: 1;
	}

	.title--standalone {
		margin: 12px 0 8px;
		font-size: 1.2rem;
		font-weight: 800;
		line-height: 1.3;
		color: var(--fg);
		text-align: center; /* matches banner alignment */
	}
	/* Actions row */
	.row.actions {
		display: flex;
		gap: 10px;
		align-items: center;
		margin-top: 10px;
	}

	/* Buttons (unchanged) */
	.btn {
		display: inline-grid;
		place-items: center;
		gap: 6px;
		padding: 8px 12px;
		border-radius: 10px;
		border: 1px solid color-mix(in srgb, var(--fg) 18%, transparent);
		background: var(--surface);
		cursor: pointer;
	}
	.btn.ghost {
		background: transparent;
	}

	/* Empty state (unchanged) */
	.empty {
		display: grid;
		place-items: center;
		gap: 8px;
		padding: 32px 12px;
		text-align: center;
	}
	.empty .icon {
		font-size: 2rem;
	}
	.error {
		color: #b91c1c;
		font-weight: 700;
	}
	.row.actions {
		display: flex;
		gap: 10px;
		align-items: center;
		margin-top: 8px;
	}
	.price-row {
		display: flex;
		justify-content: center; /* center to match banner/title */
		margin: 4px 0 10px;
	}

	.price-badge {
		display: inline-block;
		background: #000;
		color: #fff;
		padding: 6px 12px;
		border-radius: 8px;
		font-weight: 900;
		min-width: 64px;
		text-align: center;
		line-height: 1;
	}
</style>
