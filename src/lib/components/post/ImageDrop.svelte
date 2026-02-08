<script lang="ts">
	import {
		ALLOWED_IMAGE_TYPES,
		MAX_IMAGE_SIZE,
		catBase
	} from '$lib/constants';
	import pica from 'pica';
	import { formatPriceLabel } from '$lib/utils/price';
	import { CATEGORY_ICON_MAP, DefaultCategoryIcon, ImagePlaceholderIcon } from '$lib/icons';
	import InlineSpinner from '$lib/components/loading/InlineSpinner.svelte';
	import ProgressBar from '$lib/components/loading/ProgressBar.svelte';
	import {
		getCompressionStageLabel,
		getCompressionStageProgress,
		type CompressionStage
	} from '$lib/utils/loading';

	// two-way bind from parent
	export let file: File | null = null;
	export let previewUrl: string | null = null;
	export let title: string = '';
	export let category: keyof typeof catBase | '' = '';
	export let price: number | '' = '';
	export let currency = 'EUR';
	export let locale = 'en-IE';
	export let showMeta = true;

	// state
	let imgLoaded = false;
	let err = '';
	let warn = '';
	let compressing = false;
	let compressionStage: CompressionStage = 'idle';

	const MAX_DIMENSION = 2048;
	const WEBP_QUALITY = 0.85;
	const WEBP_MIN_QUALITY = 0.7;

	let picaInstance: ReturnType<typeof pica> | null = null;
	const getPica = () => {
		if (!picaInstance) picaInstance = pica();
		return picaInstance;
	};

	$: bannerBase = category ? catBase[category] : '#6B7280';
	$: bannerIcon = category ? CATEGORY_ICON_MAP[category] ?? DefaultCategoryIcon : DefaultCategoryIcon;
	$: compressionLabel = getCompressionStageLabel(compressionStage);
	$: compressionProgress = getCompressionStageProgress(compressionStage);

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
		compressionStage = 'idle';
		if (!keepError) err = '';
	}

	function normalizeName(name: string) {
		return name.replace(/\.(png|jpg|jpeg|webp)$/i, '') + '.webp';
	}

	const HEIC_TYPES = new Set([
		'image/heic',
		'image/heif',
		'image/heic-sequence',
		'image/heif-sequence'
	]);
	const AVIF_TYPES = new Set(['image/avif', 'image/avis']);

	function isHeic(file: File) {
		return (
			HEIC_TYPES.has(file.type) ||
			/\.(heic|heif)$/i.test(file.name)
		);
	}

	function isAvif(file: File) {
		return AVIF_TYPES.has(file.type) || /\.avif$/i.test(file.name);
	}

	function decodeWithImageElement(f: File): Promise<HTMLImageElement> {
		return new Promise<HTMLImageElement>((resolve, reject) => {
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

	async function decodeImage(f: File): Promise<ImageBitmap | HTMLImageElement> {
		if (typeof createImageBitmap === 'function') {
			try {
				return await createImageBitmap(f, { imageOrientation: 'from-image' });
			} catch {
				try {
					return await createImageBitmap(f);
				} catch {
					return await decodeWithImageElement(f);
				}
			}
		}
		return await decodeWithImageElement(f);
	}

	async function optimizeImage(
		f: File,
		onStage: (stage: CompressionStage) => void
	): Promise<File> {
		onStage('decoding');
		const bitmap = await decodeImage(f);
		const width = 'width' in bitmap ? bitmap.width : (bitmap as HTMLImageElement).naturalWidth;
		const height = 'height' in bitmap ? bitmap.height : (bitmap as HTMLImageElement).naturalHeight;
		const maxDim = Math.max(width, height);
		const scale = maxDim > MAX_DIMENSION ? MAX_DIMENSION / maxDim : 1;
		const targetW = Math.max(1, Math.round(width * scale));
		const targetH = Math.max(1, Math.round(height * scale));

		const shouldResize = scale < 1;
		const shouldReencode = true;

		if (!shouldResize && !shouldReencode) {
			if ('close' in bitmap) bitmap.close();
			return f;
		}

		const canvas = document.createElement('canvas');
		canvas.width = targetW;
		canvas.height = targetH;
		const processor = getPica();
		onStage('resizing');

		const toBlob = (sourceCanvas: HTMLCanvasElement, type: string, quality: number) =>
			new Promise<Blob>((resolve, reject) => {
				sourceCanvas.toBlob(
					(blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))),
					type,
					quality
				);
			});

		let useFallback = false;
		let picaFailure: string | null = null;
		try {
			await processor.resize(bitmap, canvas);
		} catch (error) {
			useFallback = true;
			picaFailure = error instanceof Error ? error.message : 'Pica resize failed';
		}

		if (useFallback) {
			const ctx = canvas.getContext('2d');
			if (!ctx) {
				if ('close' in bitmap) bitmap.close();
				throw new Error(
					picaFailure
						? `Canvas is not available on this device (${picaFailure})`
						: 'Canvas is not available on this device'
				);
			}
			ctx.imageSmoothingEnabled = true;
			ctx.imageSmoothingQuality = 'high';
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		}

		if ('close' in bitmap) bitmap.close();

		let quality = WEBP_QUALITY;
		let blob: Blob;
		onStage('encoding');
		try {
			blob = useFallback
				? await toBlob(canvas, 'image/webp', quality)
				: await processor.toBlob(canvas, 'image/webp', quality);
		} catch (error) {
			if (!useFallback) {
				try {
					blob = await toBlob(canvas, 'image/webp', quality);
					useFallback = true;
				} catch (fallbackError) {
					const fallbackDetail =
						fallbackError instanceof Error && fallbackError.message
							? fallbackError.message
							: 'Image export failed';
					if (picaFailure) {
						throw new Error(`Pica failed (${picaFailure}). ${fallbackDetail}.`);
					}
					throw fallbackError instanceof Error
						? fallbackError
						: new Error(fallbackDetail);
				}
			} else {
				const fallbackDetail =
					error instanceof Error && error.message ? error.message : 'Image export failed';
				if (picaFailure) {
					throw new Error(`Pica failed (${picaFailure}). ${fallbackDetail}.`);
				}
				throw error instanceof Error ? error : new Error(fallbackDetail);
			}
		}
		while (blob.size > MAX_IMAGE_SIZE && quality > WEBP_MIN_QUALITY) {
			quality = Math.max(WEBP_MIN_QUALITY, Number((quality - 0.05).toFixed(2)));
			blob = useFallback
				? await toBlob(canvas, 'image/webp', quality)
				: await processor.toBlob(canvas, 'image/webp', quality);
		}
		onStage('finalizing');

		return new File([blob], normalizeName(f.name), {
			type: 'image/webp',
			lastModified: f.lastModified
		});
	}

	async function handleFile(f: File) {
		warn = '';
		compressionStage = 'validating';
		const heic = isHeic(f);
		const avif = isAvif(f);
		const isImageType = f.type ? f.type.startsWith('image/') : false;
		const looksLikeImage = isImageType || /\.(png|jpe?g|webp|avif|heic|heif)$/i.test(f.name);
		if (!looksLikeImage) {
			clearFile({ keepError: true });
			err = 'Unsupported image type. Use a JPG, PNG, or WebP.';
			return;
		}
		if (heic || avif) {
			warn = 'High-efficiency image detected — converting for compatibility.';
		}
		if (f.size > MAX_IMAGE_SIZE) {
			warn = 'Large image — we will compress it. If it still fails, use a smaller file.';
		}

		err = '';
		compressing = true;
		try {
			const optimized = await optimizeImage(f, (stage) => {
				compressionStage = stage;
			});
			if (optimized.size > MAX_IMAGE_SIZE) {
				clearFile({ keepError: true });
				err = 'Image is still too large. Use a smaller file.';
				return;
			}
			file = optimized;
			setPreview(optimized);
			compressionStage = 'complete';
		} catch (error) {
			clearFile({ keepError: true });
			const detail =
				error instanceof Error && error.message ? ` (${error.message})` : '';
			if (heic || avif) {
				err =
					`This image format is not supported on this device. Please choose a JPG or PNG.${detail}`;
			} else {
				err =
					f.type && !ALLOWED_IMAGE_TYPES.includes(f.type)
						? `Unsupported image type (${f.type}). Use a JPG, PNG, or WebP.${detail}`
						: `We could not process that image. Please try a different file.${detail}`;
			}
		} finally {
			compressing = false;
			if (!file) compressionStage = 'idle';
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
		formatPriceLabel({
			price: price === '' ? null : Number(price),
			category,
			currency,
			locale
		});
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
		{#if showMeta}
			<!-- Banner header above image (centered) -->
			<div class="banner" style="--banner:{bannerBase}">
				<span class="banner__icon" aria-hidden="true">
					<svelte:component this={bannerIcon} size={18} strokeWidth={1.6} />
				</span>
				<span class="banner__label">{(category || '').toUpperCase()}</span>
			</div>
		{/if}

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
		{#if showMeta}
			<h3 class="title--standalone">{title || 'Your catchy title'}</h3>
			{#if formatted}
				<div class="price-row">
					<span class="price-badge">{formatted}</span>
				</div>
			{/if}
		{/if}
		<div class="row actions">
			<button type="button" class="btn ghost" on:click={() => clearFile()} disabled={compressing}>
				Remove image
			</button>
			<label class="btn" class:disabled={compressing}>
				Replace
				<input type="file" accept="image/*" on:change={onFileChange} disabled={compressing} hidden />
			</label>
			<label class="btn ghost" class:disabled={compressing}>
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
	{:else}
		<div class="empty">
			<div class="icon" aria-hidden="true">
				<ImagePlaceholderIcon size={26} strokeWidth={1.6} />
			</div>
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
	{#if compressing}
		<div class="loading-state" aria-live="polite" aria-busy="true">
			<InlineSpinner label={compressionLabel} />
			<ProgressBar value={compressionProgress} label="Image compression progress" />
		</div>
	{/if}
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
	.btn.disabled,
	.btn[disabled] {
		opacity: 0.6;
		cursor: default;
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
	.loading-state {
		display: grid;
		gap: 6px;
		padding: 2px 0;
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
