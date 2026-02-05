<script lang="ts">
	import {
		ALLOWED_IMAGE_TYPES,
		MAX_IMAGE_SIZE,
		catBase,
		catIcon,
		type PriceType
	} from '$lib/constants';

	// two-way bind from parent
	export let file: File | null = null;
	export let previewUrl: string | null = null;
	export let title: string = '';
	export let category: keyof typeof catBase | '' = '';
	export let priceType: PriceType = 'fixed';
	export let price: number | '' = '';
	export let currency = 'EUR';
	export let locale = 'en-IE';

	// state
	let imgLoaded = false;
	let err = '';
	let warn = '';
	let compressing = false;

	const MAX_DIMENSION = 1600;
	const JPEG_QUALITY = 0.85;
	const JPEG_MIN_QUALITY = 0.7;
	const JPEG_REENCODE_THRESHOLD = 1 * 1024 * 1024; // 1MB

	$: bannerBase = category ? catBase[category] : '#6B7280';
	$: bannerIcon = category ? catIcon[category] : '🗂️';

	function setPreview(f: File) {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = URL.createObjectURL(f);
		imgLoaded = false;
	}
	function clearFile({ keepError = false }: { keepError?: boolean } = {}) {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = null;
		file = null;
		imgLoaded = false;
		warn = '';
		if (!keepError) err = '';
	}

	function toCanvasBlob(
		canvas: HTMLCanvasElement,
		type: string,
		quality?: number
	): Promise<Blob> {
		return new Promise((resolve, reject) => {
			canvas.toBlob(
				(blob) => (blob ? resolve(blob) : reject(new Error('Image encoding failed'))),
				type,
				quality
			);
		});
	}

	function normalizeName(name: string, type: string) {
		const ext = type === 'image/png' ? '.png' : '.jpg';
		return name.replace(/\.(png|jpg|jpeg)$/i, '') + ext;
	}

	async function decodeImage(f: File): Promise<ImageBitmap | HTMLImageElement> {
		if (typeof createImageBitmap === 'function') {
			return await createImageBitmap(f);
		}
		return await new Promise<HTMLImageElement>((resolve, reject) => {
			const img = new Image();
			const url = URL.createObjectURL(f);
			img.onload = () => {
				URL.revokeObjectURL(url);
				resolve(img);
			};
			img.onerror = () => {
				URL.revokeObjectURL(url);
				reject(new Error('Image decode failed'));
			};
			img.src = url;
		});
	}

	async function optimizeImage(f: File): Promise<File> {
		const bitmap = await decodeImage(f);
		const width = 'width' in bitmap ? bitmap.width : (bitmap as HTMLImageElement).naturalWidth;
		const height = 'height' in bitmap ? bitmap.height : (bitmap as HTMLImageElement).naturalHeight;
		const maxDim = Math.max(width, height);
		const scale = maxDim > MAX_DIMENSION ? MAX_DIMENSION / maxDim : 1;
		const targetW = Math.max(1, Math.round(width * scale));
		const targetH = Math.max(1, Math.round(height * scale));

		const isPng = f.type === 'image/png';
		const shouldResize = scale < 1;
		const shouldReencode = !isPng && (f.size > JPEG_REENCODE_THRESHOLD || shouldResize);

		if (!shouldResize && !shouldReencode) {
			if ('close' in bitmap) bitmap.close();
			return f;
		}

		const canvas = document.createElement('canvas');
		canvas.width = targetW;
		canvas.height = targetH;
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			if ('close' in bitmap) bitmap.close();
			throw new Error('Canvas not supported');
		}
		ctx.drawImage(bitmap as CanvasImageSource, 0, 0, targetW, targetH);
		if ('close' in bitmap) bitmap.close();

		if (isPng) {
			const blob = await toCanvasBlob(canvas, 'image/png');
			return new File([blob], normalizeName(f.name, 'image/png'), {
				type: 'image/png',
				lastModified: f.lastModified
			});
		}

		let quality = JPEG_QUALITY;
		let blob = await toCanvasBlob(canvas, 'image/jpeg', quality);
		while (blob.size > MAX_IMAGE_SIZE && quality > JPEG_MIN_QUALITY) {
			quality = Math.max(JPEG_MIN_QUALITY, Number((quality - 0.05).toFixed(2)));
			blob = await toCanvasBlob(canvas, 'image/jpeg', quality);
		}

		return new File([blob], normalizeName(f.name, 'image/jpeg'), {
			type: 'image/jpeg',
			lastModified: f.lastModified
		});
	}

	async function handleFile(f: File) {
		warn = '';
		if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
			clearFile({ keepError: true });
			err = 'Unsupported image type. Use a JPG or PNG.';
			return;
		}
		if (f.size > MAX_IMAGE_SIZE) {
			warn = 'Large image — we will compress it. If it still fails, use a smaller file.';
		}

		err = '';
		compressing = true;
		try {
			const optimized = await optimizeImage(f);
			if (optimized.size > MAX_IMAGE_SIZE) {
				clearFile({ keepError: true });
				err = 'Image is still too large. Use a smaller file.';
				return;
			}
			file = optimized;
			setPreview(optimized);
		} catch {
			clearFile({ keepError: true });
			err = 'Unsupported image type. Use a JPG or PNG.';
		} finally {
			compressing = false;
		}
	}

	async function onFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const f = input.files?.[0];
		if (!f) return clearFile();
		await handleFile(f);
	}

	async function onDrop(e: DragEvent) {
		e.preventDefault();
		const f = e.dataTransfer?.files?.[0];
		if (!f) return;
		await handleFile(f);
	}

	$: formatted =
		priceType === 'poa'
			? 'POA'
			: priceType === 'free' || Number(price) === 0
				? 'Free'
				: price !== ''
					? new Intl.NumberFormat(locale, {
							style: 'currency',
							currency,
							maximumFractionDigits: 0
						}).format(Number(price))
					: '';
</script>

<div
	class="drop"
	style="--chip:{bannerBase}"
	on:dragover|preventDefault
	on:drop={onDrop}
	role="button"
	aria-label="Drop photo here"
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
				src={previewUrl}
				alt=""
				class:loaded={imgLoaded}
				on:load={() => (imgLoaded = true)}
				on:error={() => (imgLoaded = false)}
			/>
		</div>
		<h3 class="title--standalone">{title || 'Your catchy title'}</h3>
		{#if formatted}
			<div class="price-row">
				<span class="price-badge">{formatted}</span>
			</div>
		{/if}
		<div class="row actions">
			<button type="button" class="btn ghost" on:click={() => clearFile()}>
				Remove image
			</button>
			<label class="btn">
				Replace
				<input type="file" accept="image/*" on:change={onFileChange} hidden />
			</label>
			<label class="btn ghost">
				Use camera
				<input
					type="file"
					accept="image/*"
					capture="environment"
					on:change={onFileChange}
					hidden
				/>
			</label>
		</div>
	{:else}
		<div class="empty">
			<div class="icon">🖼️</div>
			<p>Drag a photo here, or</p>
			<div class="choice-row">
				<label class="btn">
					Choose photo
					<input
						type="file"
						accept="image/*"
						on:change={onFileChange}
						disabled={compressing}
						hidden
					/>
				</label>
				<label class="btn ghost">
					Use camera
					<input
						type="file"
						accept="image/*"
						capture="environment"
						on:change={onFileChange}
						disabled={compressing}
						hidden
					/>
				</label>
			</div>
			<small>Optional. Add 1 photo if you have it.</small>
		</div>
	{/if}
	{#if compressing}<p class="hint">Compressing image…</p>{/if}
	{#if warn}<p class="warn">{warn}</p>{/if}
	{#if err}<p class="error">{err}</p>{/if}
</div>

<style>
	.drop {
		border: 1px dashed color-mix(in srgb, var(--fg) 25%, transparent);
		border-radius: 16px;
		padding: 12px;
	}

	/* Centered banner header, like the ad page */
	.banner {
		background: color-mix(in srgb, var(--fg) 14%, var(--bg));
		color: var(--fg);
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
		flex-wrap: wrap;
		justify-content: center;
	}
	.choice-row {
		display: flex;
		gap: 10px;
		align-items: center;
		flex-wrap: wrap;
		justify-content: center;
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
		color: var(--accent-orange);
		background: var(--tangerine-bg);
		border: 1px solid color-mix(in srgb, var(--accent-orange) 35%, transparent);
		border-radius: 10px;
		padding: 8px 10px;
		font-weight: 700;
	}
	.hint {
		color: color-mix(in srgb, var(--fg) 70%, transparent);
		font-weight: 600;
	}
	.warn {
		color: color-mix(in srgb, #d97706 85%, var(--bg));
		font-weight: 700;
	}
	.price-row {
		display: flex;
		justify-content: center; /* center to match banner/title */
		margin: 4px 0 10px;
	}

	.price-badge {
		display: inline-block;
		background: color-mix(in srgb, var(--fg) 18%, var(--bg));
		color: var(--fg);
		padding: 6px 12px;
		border-radius: 8px;
		font-weight: 900;
		min-width: 64px;
		text-align: center;
		line-height: 1;
	}
</style>
