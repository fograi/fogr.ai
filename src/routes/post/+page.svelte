<script lang="ts">
	import { onMount } from 'svelte';

	// ---- Config ----
	const CATEGORIES = [
		'Home & Garden',
		'Electronics',
		'Baby & Kids',
		'Sports & Bikes',
		'Clothing & Accessories',
		'Services & Gigs',
		'Lessons & Tutoring',
		'Lost and Found',
		'Free / Giveaway'
	] as const;

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

	// ---- Form state ----
	let title = '';
	let description = '';
	let category: (typeof CATEGORIES)[number] | '' = '';
	let price: number | '' = '';
	let email = '';
	let currency = 'EUR';
	let locale = 'en-IE';

	// one image (optional)
	let file: File | null = null;
	let previewUrl: string | null = null;
	let imgEl: HTMLImageElement | null = null;
	let imgLoaded = false;

	// derived
	$: isFree = category === 'Free / Giveaway';
	$: bannerBase = catBase[category ?? ''] ?? '#6B7280';
	$: bannerIcon = catIcon[category ?? ''] ?? '🗂️';
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
		if (!f.type.startsWith('image/')) return ((err = 'Please choose an image file.'), clearFile());
		if (f.size > 4 * 1024 * 1024) return ((err = 'Image must be ≤ 4MB.'), clearFile());
		err = '';
		file = f;
		setPreview(f);
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		const f = e.dataTransfer?.files?.[0];
		if (!f) return;
		if (!f.type.startsWith('image/')) return ((err = 'Please drop an image file.'), clearFile());
		if (f.size > 4 * 1024 * 1024) return ((err = 'Image must be ≤ 4MB.'), clearFile());
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

	// ---- Validation + submit ----
	let err = '';
	let loading = false;

	function validate() {
		if (!title.trim()) return 'Title is required.';
		if (title.length > TITLE_MAX) return `Title max ${TITLE_MAX} chars.`;
		if (!category) return 'Choose a category.';
		if (!description.trim()) return 'Description is required.';
		if (description.length > DESC_MAX) return `Description max ${DESC_MAX} chars.`;
		if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return 'Valid email required.';
		if (!isFree) {
			const n = Number(price);
			if (Number.isNaN(n) || n < 0) return 'Price must be 0 or more.';
		}
		return '';
	}

	async function handleSubmit() {
		err = validate();
		if (err) return;
		loading = true;

		// Build payload; swap this for your actual API/SDK call.
		const form = new FormData();
		form.append('title', title.trim());
		form.append('description', description.trim());
		form.append('category', category as string);
		form.append('price', String(isFree ? 0 : price || 0));
		form.append('email', email.trim());
		form.append('currency', currency);
		form.append('locale', locale);
		if (file) form.append('image', file);

		try {
			const res = await fetch('/api/ads', { method: 'POST', body: form });
			if (!res.ok) throw new Error(await res.text());
			const data = await res.json(); // expect { id: ... }
			// redirect
			window.location.href = `/ad/${data.id}`;
		} catch (e: any) {
			err = e?.message || 'Failed to post. Try again.';
		} finally {
			loading = false;
		}
	}
</script>

<form class="post" on:submit|preventDefault={handleSubmit}>
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
					<div>
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
						<div class="overlay">
							<h3 class="title">{title || 'Your catchy title'}</h3>
						</div>
					</div>
					<div class="row actions">
						<button type="button" class="btn ghost" on:click={clearFile}>Remove image</button>
						<label class="btn"
							>Replace
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
						<p>Drag & drop an image, or</p>
						<label class="btn"
							>Choose file <!-- replace your file inputs (both places) -->
							<input
								type="file"
								accept="image/*"
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
		<section class="right">
			<div class="field">
				<label for="category">Category</label>
				<select id="category" bind:value={category}>
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
						disabled={isFree}
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
					/>
				</div>
			</div>

			{#if err}<p class="error">{err}</p>{/if}

			<div class="row actions">
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
		} /* perf */
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
	.sticky-cta {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		display: none; /* hidden on desktop */
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
	@media (max-width: 640px), (orientation: portrait) {
		.sticky-cta {
			display: flex;
		}
		.empty {
			padding: 24px 12px;
		} /* tighter empty state */
		.overlay {
			padding: 10px;
		} /* reduce overlay height */
		.title {
			font-size: 1rem;
		}
		input,
		select,
		textarea {
			padding: 12px 14px;
			font-size: 16px;

        max-width: min-content;
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
        max-width: min-content;
	}
	@media (max-width: 640px), (orientation: portrait) {
		.chip-row {
			inset: 8px 8px auto 8px;
		}
		.chip {
			background: color-mix(in srgb, var(--bg) 70%, transparent);
		}
	}
    img {
        max-width: 88vw;
    }
</style>
