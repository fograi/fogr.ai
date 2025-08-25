<script lang="ts">
	import { onDestroy } from 'svelte';
	import { catBase, catIcon } from '$lib/constants';
	import { type Category } from '$lib/constants';

	import PostFields from '$lib/components/post/PostFields.svelte';
	import ImageDrop from '$lib/components/post/ImageDrop.svelte';
	import StickyCTA from '$lib/components/post/StickyCTA.svelte';
	import { createModerationClient } from '$lib/clients/moderationClient';

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

	// moderation
	const mod = createModerationClient();
	let debounce: number | undefined;

	// derived
	$: isFree = category === 'Free / Giveaway';
	$: bannerBase = category ? catBase[category] : '#6B7280';
	$: bannerIcon = category ? catIcon[category] : '🗂️';
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

	// live moderation check while typing
	$: {
		const text = `${title ?? ''} ${description ?? ''}`.trim();
		clearTimeout(debounce);
		if (text) {
			debounce = window.setTimeout(() => mod.postLive(text), 250);
		}
	}

	// ---- Validation + submit ----
	import {
		MIN_TITLE_LENGTH,
		MAX_TITLE_LENGTH,
		MIN_DESC_LENGTH,
		MAX_DESC_LENGTH
	} from '$lib/constants';

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

		loading = true;
		try {
			// client-side moderation preflight
			const flagged = await mod.check(`${title ?? ''} ${description ?? ''}`);
			if (flagged) {
				err = 'Your ad likely violates our language rules. Please edit and resubmit.';
				return;
			}

			// server call
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
			let data: any;
			try {
				data = JSON.parse(raw);
			} catch {
				data = { message: raw };
			}
			if (!res.ok || data?.success === false) throw new Error(data?.message || 'Failed to post.');

			if (data?.id) {
				window.location.href = `/ad/${data.id}`;
				return;
			}

			ok = data?.message || 'Ad submitted successfully!';
			// reset
			title = '';
			description = '';
			category = '';
			price = '';
			email = '';
			// clear image
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			previewUrl = null;
			file = null;
		} catch (e: any) {
			err = e?.message || 'Failed to post. Try again.';
		} finally {
			loading = false;
		}
	}

	onDestroy(() => mod.destroy());
</script>

<form class="post" on:submit|preventDefault={handleSubmit} aria-busy={loading}>
	<header class="head">
		<h1>Post an ad</h1>
	</header>

	<div class="grid">
		<!-- LEFT: text fields -->
		<section class="left">
			<PostFields
				bind:category
				bind:title
				bind:description
				bind:price
				bind:email
				{isFree}
				{err}
				{ok}
				{loading}
				titleMax={80}
				descMax={256}
			/>
		</section>

		<!-- RIGHT: image -->
		<section class="right">
			<ImageDrop bind:file bind:previewUrl {title} {category} {isFree} {price} {currency} {locale} />
		</section>
	</div>

	<StickyCTA label="Post ad" {loading} />
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
		text-align: center;
	}

	.grid {
		display: grid;
		gap: 16px;
		margin-top: 16px;
		grid-template-areas: 'left' 'right';
	}
	.left {
		grid-area: left;
	}
	.right {
		grid-area: right;
	}
	@media (min-width: 820px) {
		.grid {
			grid-template-columns: 1.1fr 1fr;
			grid-template-areas: 'left right';
		}
	}
</style>
