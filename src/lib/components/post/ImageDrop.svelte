<script lang="ts">
	import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE, catBase, catIcon } from '$lib/constants';

	// two-way bind from parent
	export let file: File | null = null;
	export let previewUrl: string | null = null;

	// display data from parent
	export let category: keyof typeof catBase | '' = '';
	export let isFree = false;
	export let price: number | '' = '';
	export let currency = 'EUR';
	export let locale = 'en-IE';

	// state
	let imgEl: HTMLImageElement | null = null;
	let imgLoaded = false;
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
		<div class="media">
			<img
				bind:this={imgEl}
				src={previewUrl}
				alt=""
				class:loaded={imgLoaded}
				on:load={() => (imgLoaded = true)}
			/>
			<div class="chip-row">
				{#if category}
					<span class="chip chip--cat">
						<span aria-hidden="true">{bannerIcon}</span>
						<span class="chip__label">{category}</span>
					</span>
				{/if}
				{#if formatted}<span class="chip chip--price">{formatted}</span>{/if}
			</div>
			<div class="overlay"><h3 class="title">{$$props?.title || 'Your catchy title'}</h3></div>
		</div>
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
	.media {
		position: relative;
		aspect-ratio: 3/2;
		border-radius: 14px;
		overflow: hidden;
		background: color-mix(in srgb, var(--fg) 6%, transparent);
	}
	.media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		transition:
			opacity 0.2s ease,
			transform 0.25s ease;
	}
	.media img.loaded {
		opacity: 1;
	}
	.chip-row {
		position: absolute;
		inset: 8px 8px auto 8px;
		display: flex;
		justify-content: space-between;
		gap: 8px;
		z-index: 2;
		pointer-events: none;
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
	}
	.chip--cat {
		background: color-mix(in srgb, var(--chip, var(--bg)) 22%, var(--bg));
	}
	.chip--price {
		background: color-mix(in srgb, #0ea5e9 22%, var(--bg));
	}
	.overlay {
		position: absolute;
		inset: auto 0 0 0;
		padding: 12px;
		background: linear-gradient(to top, color-mix(in srgb, #000 52%, transparent), transparent 70%);
		color: #fff;
	}
	.title {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 800;
		line-height: 1.25;
	}
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
</style>
