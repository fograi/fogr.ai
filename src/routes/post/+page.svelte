<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		CATEGORIES,
		type Category,
		catBase,
		catIcon,
		MIN_TITLE_LENGTH,
		MAX_TITLE_LENGTH,
		MIN_DESC_LENGTH,
		MAX_DESC_LENGTH,
		ALLOWED_IMAGE_TYPES,
		MAX_IMAGE_SIZE
	} from '$lib/constants';

	// ---- Form state ----
	let title = '';
	let description = '';
	let category: Category | '' = '';
	let price: number | '' = '';
	let email = '';
	let currency = 'EUR';
	let locale = 'en-IE';

	// one image (optional)
	let file: File | null = null;
	let previewUrl: string | null = null;
	let imgEl: HTMLImageElement | null = null;
	let imgLoaded = false;

	let modWorker: Worker | null = null;
	let modReady = false;
	let modFlagged = false;
	let modLoading = false;

	async function initModeration() {
		if (modWorker || typeof window === 'undefined') return;
		modWorker = new Worker(new URL('$lib/workers/moderation.worker.ts', import.meta.url), {
			type: 'module'
		});

		modWorker.onmessage = (ev: MessageEvent<{ id: string; flagged: boolean }>) => {
			const { id, flagged } = ev.data || { id: '', flagged: false };

			if (id === 'live') {
				modFlagged = flagged;
				modLoading = false;
				return;
			}

			const resolve = pending.get(id);
			if (resolve) {
				pending.delete(id);
				resolve(flagged);
			} else {
				// dev aid
				console.debug('[mod-worker] no pending resolver for id:', id);
			}
		};

		modWorker.onerror = (e) => {
			console.error('[mod-worker] error', e);
			modWorker?.terminate();
			modWorker = null;
			modReady = false;
		};

		modReady = true;
	}

	let debounce: number | undefined;

	// Track pending request -> resolver for submit-time checks
	const pending = new Map<string, (flagged: boolean) => void>();

	function nextId() {
		// Works in all modern browsers
		return (crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
	}

	async function checkWithWorker(text: string, timeoutMs = 1500): Promise<boolean> {
		await initModeration();
		if (!modWorker) return false; // fail-open to server

		const id = nextId();
		return await new Promise<boolean>((resolve) => {
			const timer = setTimeout(() => {
				pending.delete(id);
				console.warn('[mod-worker] timeout; continuing to server');
				resolve(false); // don’t block submit
			}, timeoutMs);

			pending.set(id, (flagged) => {
				clearTimeout(timer);
				resolve(flagged);
			});

			modWorker!.postMessage({ id, text });
		});
	}

	// derived
	$: {
		const text = `${title ?? ''} ${description ?? ''}`.trim();
		clearTimeout(debounce);
		if (!text) {
			modFlagged = false;
		} else {
			debounce = window.setTimeout(async () => {
				await initModeration();
				if (!modWorker) return;
				modLoading = true;
				// SEND A STRING, not an object
				modWorker.postMessage(text);
			}, 250);
		}
	}
	$: isFree = category === 'Free / Giveaway';
	$: bannerBase = category ? catBase[category] : '#6B7280';
	$: bannerIcon = category ? catIcon[category] : '🗂️';
	$: descCount = description.length;
	$: displayedPrice =
		category === 'Free / Giveaway'
			? 'Free'
			: price === ''
				? ''
				: new Intl.NumberFormat(locale, {
						style: 'currency',
						currency,
						maximumFractionDigits: 0
					}).format(Number(price));

	const DESC_MAX = 256;
	const TITLE_MAX = 80;

	function onFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const f = input.files?.[0];
		if (!f) return clearFile();
		if (!ALLOWED_IMAGE_TYPES.includes(f.type))
			return ((err = 'Only JPEG or PNG allowed.'), clearFile());
		if (f.size > MAX_IMAGE_SIZE)
			return (
				(err = `Image must be ≤ ${Math.floor(MAX_IMAGE_SIZE / 1024 / 1024)}MB.`),
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
				(err = `Image must be ≤ ${Math.floor(MAX_IMAGE_SIZE / 1024 / 1024)}MB.`),
				clearFile()
			);
		err = '';
		file = f;
		setPreview(f);
	}

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
	}
	onMount(() => {
		if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) imgLoaded = true;
	});

	onDestroy(() => {
		modWorker?.terminate();
		modWorker = null;
		pending.clear();
	});

	// ---- Validation + submit ----
	let err = '';
	let ok = '';
	let loading = false;

	function validate() {
		if (!title.trim()) return 'Title is required.';
		if (title.trim().length < MIN_TITLE_LENGTH) return `Title must be ≥ ${MIN_TITLE_LENGTH} chars.`;
		if (title.length > MAX_TITLE_LENGTH) return `Title ≤ ${MAX_TITLE_LENGTH} chars.`;
		if (!category) return 'Choose a category.';
		if (!description.trim()) return 'Description is required.';
		if (description.trim().length < MIN_DESC_LENGTH)
			return `Description must be ≥ ${MIN_DESC_LENGTH} chars.`;
		if (description.length > MAX_DESC_LENGTH) return `Description ≤ ${MAX_DESC_LENGTH} chars.`;
		if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return 'Valid email required.';
		if (!isFree) {
			const n = Number(price);
			if (Number.isNaN(n) || n < 0) return 'Price must be 0 or more.';
		}
		return '';
	}

	async function handleSubmit() {
		err = '';
		ok = '';

		const v = validate();
		if (v) {
			err = v;
			return;
		}

		// Show UI feedback immediately
		loading = true;
		try {
			// client-side moderation preflight (never blocks indefinitely)
			const text = `${title ?? ''} ${description ?? ''}`.trim();
			modLoading = true;
			const flagged = await checkWithWorker(text);
			modLoading = false;

			if (flagged) {
				err = 'Your ad likely violates our language rules. Please edit and resubmit.';
				return;
			}

			// proceed to server
			const form = new FormData();
			form.append('title', title.trim());
			form.append('description', description.trim());
			form.append('category', category as string);
			form.append('price', String(isFree ? 0 : price || 0));
			form.append('email', email.trim());
			form.append('currency', currency);
			form.append('locale', locale);
			if (file) form.append('image', file);

			const res = await fetch('/api/ads', { method: 'POST', body: form });
			const raw = await res.text();
			let data: any = null;
			try {
				data = JSON.parse(raw);
			} catch {
				data = { message: raw };
			}

			if (!res.ok || data?.success === false) {
				throw new Error(data?.message || 'Failed to post.');
			}

			if (data?.id) {
				window.location.href = `/ad/${data.id}`;
				return;
			}

			ok = data?.message || 'Ad submitted successfully!';
			title = '';
			description = '';
			category = '';
			price = '';
			email = '';
			clearFile();
		} catch (e: any) {
			err = e?.message || 'Failed to post. Try again.';
		} finally {
			loading = false;
		}
	}
</script>

<form class="post" on:submit|preventDefault={handleSubmit} aria-busy={loading}>
	<header class="head">
		<h1>Post an ad</h1>
		<p class="sub">Simply online classifieds. One image max. Ads auto-delete after 32 days.</p>
	</header>

	<div class="grid">
		<!-- LEFT: media/preview -->
		<section class="left">
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
							{#if !isFree && price !== ''}
								<span class="chip chip--price">
									{new Intl.NumberFormat(locale, {
										style: 'currency',
										currency,
										maximumFractionDigits: 0
									}).format(Number(price))}
								</span>
							{/if}
						</div>
						<div class="overlay"><h3 class="title">{title || 'Your catchy title'}</h3></div>
					</div>
					<div class="row actions">
						<button type="button" class="btn ghost" on:click={clearFile} disabled={loading}
							>Remove image</button
						>
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
						<small>Max 4MB • JPG/PNG/WebP • 1 image</small>
					</div>
				{/if}
			</div>
		</section>

		<!-- RIGHT: fields -->
		<section class="right" class:disabled={loading}>
			<div class="field">
				<label for="category">Category</label>
				<select id="category" bind:value={category} disabled={loading}>
					<option value="" disabled selected hidden>Choose…</option>
					{#each CATEGORIES as c}
						<option value={c}>{c}</option>
					{/each}
				</select>
			</div>

			<div class="field">
				<label for="title">Title <span class="muted">({title.length}/{TITLE_MAX})</span></label>
				<input
					id="title"
					type="text"
					bind:value={title}
					maxlength={TITLE_MAX}
					placeholder="e.g., IKEA MALM desk — great condition"
					required
					disabled={loading}
				/>
			</div>

			<div class="field">
				<label for="description"
					>Description <span class="muted">({descCount}/{DESC_MAX})</span></label
				>
				<textarea
					id="description"
					bind:value={description}
					maxlength={DESC_MAX}
					rows="6"
					placeholder="Key details, pickup area, condition…"
					required
					disabled={loading}
				></textarea>
			</div>

			<div class="row">
				<div class="field">
					<label for="price"
						>Price {#if isFree}<span class="muted">(set to €0 for Free / Giveaway)</span
							>{/if}</label
					>
					<input
						id="price"
						type="number"
						min="0"
						step="1"
						inputmode="numeric"
						pattern="[0-9]*"
						bind:value={price}
						disabled={isFree || loading}
						placeholder={isFree ? '0' : 'e.g., 50'}
					/>
				</div>
			</div>

			<div class="row">
				<div class="field">
					<label for="email">Contact email</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						placeholder="you@example.com"
						required
						disabled={loading}
					/>
				</div>
			</div>

			{#if err}<p class="error" role="alert">{err}</p>{/if}
			{#if ok}<p class="ok" role="status">{ok}</p>{/if}

			<div class="row actions desktop">
				<button type="submit" class="btn primary" disabled={loading}
					>{loading ? 'Posting…' : 'Post ad'}</button
				>
				<span class="muted small">AI + rules review before publishing.</span>
			</div>
		</section>
	</div>

	<!-- MOBILE STICKY CTA -->
	<div class="sticky-cta" aria-live="polite">
		<div class="sticky-cta__price">{displayedPrice || (isFree ? 'Free' : '')}</div>
		<button type="submit" class="btn primary btn--cta" disabled={loading}>
			{loading ? 'Posting…' : 'Post ad'}
		</button>
	</div>
</form>

<style>
	.post {
		padding-bottom: calc(72px + env(safe-area-inset-bottom));
		padding-left: 12px;
	}
	.head h1 {
		margin: 0 0 4px;
		font-size: 1.5rem;
		font-weight: 800;
	}
	.sub {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 70%, transparent);
	}
	.grid {
		display: grid;
		gap: 16px;
		margin-top: 16px;
	}
	@media (min-width: 820px) {
		.grid {
			grid-template-columns: 1.1fr 1fr;
		}
	}

	@media (hover: none) {
		.chip {
			backdrop-filter: none;
		}
	}

	/* LEFT */
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
	.post:hover .media img {
		transform: scale(1.02);
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
		backdrop-filter: saturate(1.2) blur(6px);
		color: color-mix(in srgb, var(--fg) 86%, transparent);
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
		display: -webkit-box;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* RIGHT */
	.right {
		display: grid;
		gap: 12px;
	}
	.field {
		display: grid;
		gap: 6px;
	}
	.row {
		display: flex;
		gap: 12px;
		align-items: flex-end;
	}
	label {
		font-weight: 700;
	}
	input,
	select,
	textarea {
		border: 1px solid color-mix(in srgb, var(--fg) 18%, transparent);
		background: var(--surface);
		color: inherit;
		border-radius: 10px;
		padding: 10px 12px;
		font: inherit;
	}
	select {
		appearance: none;
		background-image:
			linear-gradient(45deg, transparent 50%, currentColor 50%),
			linear-gradient(135deg, currentColor 50%, transparent 50%);
		background-position:
			calc(100% - 20px) calc(1em + 2px),
			calc(100% - 15px) calc(1em + 2px);
		background-size:
			5px 5px,
			5px 5px;
		background-repeat: no-repeat;
	}
	textarea {
		resize: vertical;
		min-height: 120px;
	}
	.muted {
		color: color-mix(in srgb, var(--fg) 55%, transparent);
	}
	.small {
		font-size: 0.85rem;
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
	.btn.primary {
		background: black;
		color: white;
		border-color: black;
	}
	.btn.ghost {
		background: transparent;
	}
	.btn input[type='file'] {
		display: none;
	}
	.actions {
		display: flex;
		gap: 10px;
		align-items: center;
	}

	.error {
		color: #b91c1c;
		font-weight: 700;
		margin: 4px 0;
	}
	.ok {
		color: #0a7f3f;
		font-weight: 700;
		margin: 4px 0;
	}

	/* Sticky CTA */
	.sticky-cta {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		display: none;
		align-items: center;
		gap: 10px;
		padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
		border-top: 1px solid var(--hairline);
		background: var(--surface);
		z-index: 50;
	}
	.sticky-cta__price {
		min-width: 84px;
		font-weight: 800;
		font-size: 0.95rem;
	}
	.btn--cta {
		flex: 1;
	}

	/* Mobile */
	@media (max-width: 640px), (orientation: portrait) {
		.sticky-cta {
			display: flex;
		}
		.empty {
			padding: 24px 12px;
		}
		.overlay {
			padding: 10px;
		}
		.title {
			font-size: 1rem;
		}
		input,
		select,
		textarea {
			padding: 12px 14px;
			font-size: 16px;
		} /* avoid iOS zoom */
		.btn,
		.btn.primary {
			padding: 12px 14px;
			font-size: 16px;
		}
	}

	select {
		-webkit-tap-highlight-color: transparent;
		touch-action: manipulation;
	}
</style>
