<script lang="ts">
	import { onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { PUBLIC_R2_BASE } from '$env/static/public';
	import { type Category, type PriceType, POA_CATEGORY_SET } from '$lib/constants';
	import {
		CATEGORY_PROFILE_VERSION,
		BIKES_PROFILE_KEY,
		buildBikeTitle,
		getBikeDescriptionTemplate,
		isBikesCategory,
		validateAndNormalizeBikesProfileData,
		type BikeCondition,
		type BikeSizePreset,
		type BikeSubtype,
		type BikeType
	} from '$lib/category-profiles';
	import PostFields from '$lib/components/post/PostFields.svelte';
	import ImageDrop from '$lib/components/post/ImageDrop.svelte';
	import { createModerationClient } from '$lib/clients/moderationClient';
	import { formatPriceLabel } from '$lib/utils/price';

	type EditAdRow = {
		id: string;
		title: string;
		description: string;
		category: Category;
		category_profile_data: Record<string, unknown> | null;
		price: number | null;
		currency: string | null;
		image_keys: string[] | null;
		status: string;
		firm_price: boolean;
		min_offer: number | null;
		auto_decline_message: string | null;
		created_at: string;
		updated_at: string | null;
		expires_at: string;
	};

	export let data: {
		ad: EditAdRow;
		ageConfirmed?: boolean;
		editable?: boolean;
	};

	const ad = data.ad;
	const editable = data.editable ?? true;
	const existingImageKey = ad.image_keys?.[0] ?? '';
	const publicR2Base = PUBLIC_R2_BASE.replace(/\/+$/, '');
	const existingImageUrl = existingImageKey
		? `${publicR2Base}/${existingImageKey.replace(/^\/+/, '')}`
		: null;
	const initialBikeProfile = isBikesCategory(ad.category)
		? validateAndNormalizeBikesProfileData(ad.category_profile_data).data
		: null;
	const parseManualBikeSize = (raw?: string) => {
		const trimmed = (raw ?? '').trim();
		if (!trimmed) return { value: '', unit: '' as 'cm' | 'in' | '' };
		const match = trimmed.match(/^([0-9]{1,3}(?:\.[0-9]+)?)\s*(cm|in)$/i);
		if (match) {
			return {
				value: match[1],
				unit: match[2].toLowerCase() as 'cm' | 'in'
			};
		}
		const valueMatch = trimmed.match(/^([0-9]{1,3}(?:\.[0-9]+)?)/);
		if (valueMatch) {
			return {
				value: valueMatch[1],
				unit: 'cm' as const
			};
		}
		return { value: '', unit: '' as 'cm' | 'in' | '' };
	};
	const initialBikeManualSize = parseManualBikeSize(initialBikeProfile?.sizeManual);
	const initialBikeDescriptionTemplate = getBikeDescriptionTemplate({
		reasonForSelling: initialBikeProfile?.reasonForSelling,
		usageSummary: initialBikeProfile?.usageSummary,
		knownIssues: initialBikeProfile?.knownIssues
	});

	let title = ad.title ?? '';
	let description = ad.description ?? '';
	let category: Category | '' = ad.category ?? '';
	let price: number | '' = ad.price ?? '';
	let priceType: PriceType =
		ad.category === 'Lost and Found'
			? 'fixed'
			: ad.price === null
				? 'poa'
				: ad.price === 0 || ad.category === 'Free / Giveaway'
					? 'free'
					: 'fixed';
	let firmPrice = ad.firm_price ?? false;
	let minOffer: number | '' = ad.min_offer ?? '';
	let autoDeclineMessage = ad.auto_decline_message ?? '';
	let bikeSubtype: BikeSubtype | '' = initialBikeProfile?.subtype ?? '';
	let bikeType: BikeType | '' = initialBikeProfile?.bikeType ?? '';
	let bikeCondition: BikeCondition | '' = initialBikeProfile?.condition ?? '';
	let bikeSizePreset: BikeSizePreset | '' = initialBikeProfile?.sizePreset ?? '';
	let bikeSizeManual = initialBikeManualSize.value;
	let bikeSizeManualUnit: 'cm' | 'in' | '' = initialBikeManualSize.unit;
	let bikeReasonForSelling = initialBikeProfile?.reasonForSelling ?? '';
	let bikeUsageSummary = initialBikeProfile?.usageSummary ?? '';
	let bikeKnownIssues = initialBikeProfile?.knownIssues ?? '';
	let bikeSizeManualEdited = !!initialBikeManualSize.value;
	let titleManuallyEdited = !!title;
	let descriptionManuallyEdited =
		!!description && description.trim() !== initialBikeDescriptionTemplate.trim();
	let bikeTitleAutoFilled = initialBikeProfile?.titleAutoFilled ?? false;
	let bikeDescriptionTemplateUsed =
		initialBikeProfile?.descriptionTemplateUsed ??
		(!!initialBikeDescriptionTemplate.trim() &&
			description.trim() === initialBikeDescriptionTemplate.trim());
	let lastBikeTitleSeed = '';
	let lastBikeDescriptionSeed = '';
	let currency = ad.currency ?? 'EUR';
	let locale = 'en-IE';
	let ageConfirmed = data?.ageConfirmed ?? false;
	let step = 1;
	const totalSteps = 3;
	let showErrors = false;
	let previewOpen = false;

	let file: File | null = null;
	let previewUrl: string | null = existingImageUrl;

	const mod = createModerationClient();
	let debounce: number | undefined;

	$: isBikes = isBikesCategory(category);
	$: isLostAndFound = category === 'Lost and Found';
	$: if (category === 'Free / Giveaway' && priceType !== 'free') priceType = 'free';
	$: if (isLostAndFound && priceType !== 'fixed') priceType = 'fixed';
	$: if (priceType === 'poa' && category && !POA_CATEGORY_SET.has(category)) priceType = 'fixed';
	$: if (priceType === 'free' && price !== 0) price = 0;
	$: if (priceType === 'poa') price = '';
	$: if (priceType === 'fixed' && price === 0) price = '';
	$: if (priceType !== 'fixed') {
		firmPrice = true;
		minOffer = '';
		autoDeclineMessage = '';
	}
	$: if (isLostAndFound) {
		firmPrice = false;
		minOffer = '';
		autoDeclineMessage = '';
	}
	$: if (!isBikes) {
		bikeSubtype = '';
		bikeType = '';
		bikeCondition = '';
		bikeSizePreset = '';
		bikeSizeManual = '';
		bikeSizeManualUnit = '';
		bikeReasonForSelling = '';
		bikeUsageSummary = '';
		bikeKnownIssues = '';
		bikeSizeManualEdited = false;
		bikeTitleAutoFilled = false;
		bikeDescriptionTemplateUsed = false;
		lastBikeTitleSeed = '';
		lastBikeDescriptionSeed = '';
	}
	$: bikeSizeManualWithUnit = bikeSizeManual.trim()
		? `${bikeSizeManual.trim()}${bikeSizeManualUnit ? ` ${bikeSizeManualUnit}` : ''}`.trim()
		: '';
	$: bikeTitleSeed = `${bikeSubtype}|${bikeType}|${bikeSizePreset}|${bikeSizeManualWithUnit}`;
	$: suggestedBikeTitle = buildBikeTitle({
		subtype: bikeSubtype,
		bikeType,
		sizePreset: bikeSizePreset,
		sizeManual: bikeSizeManualWithUnit
	});
	$: if (
		isBikes &&
		suggestedBikeTitle &&
		!titleManuallyEdited &&
		bikeTitleSeed !== lastBikeTitleSeed
	) {
		title = suggestedBikeTitle;
		bikeTitleAutoFilled = true;
		lastBikeTitleSeed = bikeTitleSeed;
	}
	$: bikeDescriptionSeed = [
		bikeReasonForSelling.trim(),
		bikeUsageSummary.trim(),
		bikeKnownIssues.trim()
	].join('|');
	$: hasBikeDescriptionAssist = bikeDescriptionSeed.length > 0;
	$: bikeDescriptionTemplate = getBikeDescriptionTemplate({
		reasonForSelling: bikeReasonForSelling,
		usageSummary: bikeUsageSummary,
		knownIssues: bikeKnownIssues
	});
	$: if (isBikes && !descriptionManuallyEdited && bikeDescriptionSeed !== lastBikeDescriptionSeed) {
		description = hasBikeDescriptionAssist ? bikeDescriptionTemplate : '';
		bikeDescriptionTemplateUsed = hasBikeDescriptionAssist;
		lastBikeDescriptionSeed = bikeDescriptionSeed;
	}
	$: usedPresetOnly =
		isBikes && !titleManuallyEdited && !descriptionManuallyEdited && !bikeSizeManualEdited;

	$: {
		if (browser) {
			const text = `${title ?? ''} ${description ?? ''}`.trim();
			clearTimeout(debounce);
			if (text) {
				debounce = window.setTimeout(() => mod.postLive(text), 250);
			}
		}
	}

	import {
		MIN_TITLE_LENGTH,
		MAX_TITLE_LENGTH,
		MIN_DESC_LENGTH,
		MAX_DESC_LENGTH
	} from '$lib/constants';

	type ApiResponse = {
		success?: boolean;
		message?: string;
		id?: string;
	};

	let err = '';
	let ok = '';
	let loading = false;

	function buildBikeProfileCandidate() {
		return {
			version: CATEGORY_PROFILE_VERSION,
			profile: BIKES_PROFILE_KEY,
			subtype: bikeSubtype || undefined,
			bikeType: bikeType || undefined,
			condition: bikeCondition || undefined,
			sizePreset: bikeSizePreset || undefined,
			sizeManual: bikeSizeManualWithUnit || undefined,
			reasonForSelling: bikeReasonForSelling.trim() || undefined,
			usageSummary: bikeUsageSummary.trim() || undefined,
			knownIssues: bikeKnownIssues.trim() || undefined,
			titleAutoFilled: bikeTitleAutoFilled,
			descriptionTemplateUsed: bikeDescriptionTemplateUsed
		};
	}

	function validateBasics() {
		if (!category) return 'Choose a category.';
		if (isBikes) {
			const bikeProfileCheck = validateAndNormalizeBikesProfileData(buildBikeProfileCandidate());
			if (bikeProfileCheck.error) return bikeProfileCheck.error;
		}
		if (!title.trim()) return 'Add a title.';
		if (title.trim().length < MIN_TITLE_LENGTH)
			return `Title must be at least ${MIN_TITLE_LENGTH} characters.`;
		if (title.length > MAX_TITLE_LENGTH)
			return `Title must be no more than ${MAX_TITLE_LENGTH} characters.`;
		if (!description.trim()) return 'Add a description.';
		if (description.trim().length < MIN_DESC_LENGTH)
			return `Description must be at least ${MIN_DESC_LENGTH} characters.`;
		if (description.length > MAX_DESC_LENGTH)
			return `Description must be no more than ${MAX_DESC_LENGTH} characters.`;
		return '';
	}

	function validateDetails() {
		if (category === 'Lost and Found') {
			if (price === '') return '';
			const reward = Number(price);
			if (Number.isNaN(reward) || reward <= 0) return 'Reward must be greater than 0.';
			return '';
		}
		if (priceType === 'poa' && category && !POA_CATEGORY_SET.has(category)) {
			return 'Price on application is not available for this category.';
		}
		if (priceType === 'fixed' && price === '') return 'Enter a price.';
		if (priceType === 'fixed') {
			const n = Number(price);
			if (Number.isNaN(n) || n <= 0) return 'Price must be greater than 0.';
		}
		if (priceType === 'free') {
			const n = Number(price);
			if (Number.isNaN(n) || n !== 0) return 'Free listings must be 0.';
		}
		if (priceType === 'fixed') {
			if (firmPrice && minOffer !== '') {
				return 'Firm price listings cannot set a minimum offer.';
			}
			if (minOffer !== '') {
				const m = Number(minOffer);
				if (Number.isNaN(m) || m <= 0) return 'Minimum offer must be greater than 0.';
				const n = Number(price);
				if (Number.isFinite(n) && m >= n)
					return 'Minimum offer must be less than the asking price.';
			}
		}
		return '';
	}

	function validateFinal() {
		if (!ageConfirmed) return 'Confirm you are 18 or older.';
		return '';
	}

	function validateAll() {
		return validateBasics() || validateDetails() || validateFinal();
	}

	function goNext() {
		err = '';
		ok = '';
		showErrors = true;
		const v = step === 1 ? validateBasics() : validateDetails();
		if (v) {
			err = v;
			return;
		}
		step = Math.min(step + 1, totalSteps);
	}

	function goBack() {
		err = '';
		ok = '';
		step = Math.max(step - 1, 1);
	}

	function jumpTo(target: number) {
		if (target >= step) return;
		err = '';
		ok = '';
		step = target;
	}

	async function handleSubmit() {
		if (!editable) return;
		err = '';
		ok = '';
		showErrors = true;
		const v = validateAll();
		if (v) {
			err = v;
			return;
		}

		loading = true;
		try {
			const flagged = await mod.check(`${title ?? ''} ${description ?? ''}`);
			if (flagged) {
				err = 'That text may break our language rules. Edit it and try again.';
				return;
			}

			const removingExisting = !!existingImageKey && !previewUrl && !file;
			const bikeProfileCheck = isBikes
				? validateAndNormalizeBikesProfileData(buildBikeProfileCandidate())
				: { data: null, error: null };
			if (bikeProfileCheck.error) throw new Error(bikeProfileCheck.error);
			const requestPayload = {
				title: title.trim(),
				description: description.trim(),
				category: category as string,
				category_profile_data: bikeProfileCheck.data,
				price_type: priceType,
				firm_price: priceType === 'fixed' && firmPrice ? '1' : '0',
				min_offer: priceType === 'fixed' && minOffer !== '' ? String(minOffer) : undefined,
				auto_decline_message:
					priceType === 'fixed' && (firmPrice || minOffer !== '')
						? autoDeclineMessage.trim()
						: undefined,
				price:
					priceType === 'free'
						? '0'
						: priceType === 'fixed' && price !== ''
							? String(price)
							: undefined,
				currency,
				locale,
				age_confirmed: ageConfirmed ? '1' : '0',
				remove_image: removingExisting ? '1' : undefined,
				used_preset_only: isBikes ? (usedPresetOnly ? '1' : '0') : undefined
			};

			let res: Response;
			if (file) {
				const form = new FormData();
				Object.entries(requestPayload).forEach(([key, value]) => {
					if (value === undefined || value === null) return;
					if (key === 'category_profile_data' && typeof value === 'object') {
						form.append(key, JSON.stringify(value));
						return;
					}
					form.append(key, String(value));
				});
				form.append('image', file);
				res = await fetch(`/api/ads/${ad.id}`, { method: 'PATCH', body: form });
			} else {
				res = await fetch(`/api/ads/${ad.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(requestPayload)
				});
			}
			const retryAfter = res.headers.get('Retry-After');
			const raw = await res.text();
			let payload: ApiResponse;
			try {
				payload = JSON.parse(raw) as ApiResponse;
			} catch {
				payload = { message: raw };
			}
			if (res.status === 429 && retryAfter) {
				const seconds = Number(retryAfter);
				if (Number.isFinite(seconds)) {
					const minutes = Math.ceil(seconds / 60);
					if (minutes >= 24 * 60) {
						const days = Math.ceil(minutes / (24 * 60));
						payload.message =
							days <= 1
								? 'Please wait about a day before editing again.'
								: `Please wait about ${days} days before editing again.`;
					} else if (minutes >= 60) {
						const hours = Math.ceil(minutes / 60);
						payload.message =
							hours <= 1
								? 'Please wait about an hour before editing again.'
								: `Please wait about ${hours} hours before editing again.`;
					} else {
						payload.message =
							minutes <= 1
								? 'Please wait about a minute before editing again.'
								: `Please wait about ${minutes} minutes before editing again.`;
					}
				}
			}
			if (!res.ok || payload?.success === false)
				throw new Error(payload?.message || 'We could not save your changes.');

			if (payload?.id) {
				window.location.href = `/ad/${payload.id}`;
				return;
			}
			ok = payload?.message || 'Changes saved.';
		} catch (e: unknown) {
			err = e instanceof Error ? e.message : 'We could not save your changes.';
		} finally {
			loading = false;
		}
	}

	function openPreview() {
		if (!editable) return;
		err = '';
		ok = '';
		showErrors = true;
		const v = validateBasics() || validateDetails();
		if (v) {
			err = v;
			return;
		}
		previewOpen = true;
	}

	function handleFormSubmit() {
		if (step < totalSteps) {
			goNext();
			return;
		}
		openPreview();
	}

	onDestroy(() => mod.destroy());

	$: previewPrice = formatPriceLabel({
		price: price === '' ? null : Number(price),
		category,
		currency,
		locale,
		showRewardWhenMissing: true
	});
</script>

{#if !editable}
	<section class="post">
		<header class="head">
			<h1>Edit ad</h1>
			<p class="sub">This ad can’t be edited while it is {ad.status}.</p>
		</header>
		<a class="btn ghost" href="/ads">Back to My ads</a>
	</section>
{:else}
	<form class="post" on:submit|preventDefault={handleFormSubmit} aria-busy={loading}>
		<header class="head">
			<h1>Edit ad</h1>
			<p class="sub">Update the details, price, or photo.</p>
		</header>

		<ol class="steps" aria-label="Edit steps">
			<li class:active={step === 1} class:done={step > 1}>
				<button type="button" on:click={() => jumpTo(1)} aria-current={step === 1}>
					<span class="num">1</span>
					<span class="label">Details</span>
				</button>
			</li>
			<li class:active={step === 2} class:done={step > 2}>
				<button type="button" on:click={() => jumpTo(2)} aria-current={step === 2}>
					<span class="num">2</span>
					<span class="label">Price</span>
				</button>
			</li>
			<li class:active={step === 3} class:done={step > 3}>
				<button type="button" on:click={() => jumpTo(3)} aria-current={step === 3}>
					<span class="num">3</span>
					<span class="label">Photo</span>
				</button>
			</li>
		</ol>

		{#if err}
			<p class="notice error" role="alert">{err}</p>
		{/if}
		{#if ok}
			<p class="notice ok" role="status">{ok}</p>
		{/if}

		{#if step === 1}
			<section class="panel">
				<PostFields
					step={1}
					bind:category
					bind:title
					bind:description
					bind:price
					bind:priceType
					bind:firmPrice
					bind:minOffer
					bind:autoDeclineMessage
					bind:bikeSubtype
					bind:bikeType
					bind:bikeCondition
					bind:bikeSizePreset
					bind:bikeSizeManual
					bind:bikeSizeManualUnit
					bind:bikeReasonForSelling
					bind:bikeUsageSummary
					bind:bikeKnownIssues
					bind:bikeSizeManualEdited
					bind:titleManuallyEdited
					bind:descriptionManuallyEdited
					{loading}
					{showErrors}
				/>
				<div class="actions">
					<button type="button" class="btn primary" on:click={goNext} disabled={loading}>
						Continue
					</button>
				</div>
			</section>
		{/if}

		{#if step === 2}
			<section class="panel">
				<PostFields
					step={2}
					bind:category
					bind:title
					bind:description
					bind:price
					bind:priceType
					bind:firmPrice
					bind:minOffer
					bind:autoDeclineMessage
					bind:bikeSubtype
					bind:bikeType
					bind:bikeCondition
					bind:bikeSizePreset
					bind:bikeSizeManual
					bind:bikeSizeManualUnit
					bind:bikeReasonForSelling
					bind:bikeUsageSummary
					bind:bikeKnownIssues
					bind:bikeSizeManualEdited
					bind:titleManuallyEdited
					bind:descriptionManuallyEdited
					{loading}
					{showErrors}
				/>
				<div class="actions">
					<button type="button" class="btn ghost" on:click={goBack} disabled={loading}>
						Back
					</button>
					<button type="button" class="btn primary" on:click={goNext} disabled={loading}>
						Continue
					</button>
				</div>
			</section>
		{/if}

		{#if step === 3}
			<section class="panel">
				<ImageDrop
					bind:file
					bind:previewUrl
					showMeta={false}
					{title}
					{category}
					{price}
					{currency}
					{locale}
				/>
				<PostFields
					step={3}
					bind:category
					bind:title
					bind:description
					bind:price
					bind:priceType
					bind:firmPrice
					bind:minOffer
					bind:autoDeclineMessage
					bind:bikeSubtype
					bind:bikeType
					bind:bikeCondition
					bind:bikeSizePreset
					bind:bikeSizeManual
					bind:bikeSizeManualUnit
					bind:bikeReasonForSelling
					bind:bikeUsageSummary
					bind:bikeKnownIssues
					bind:bikeSizeManualEdited
					bind:titleManuallyEdited
					bind:descriptionManuallyEdited
					{loading}
					{showErrors}
				/>
				<div class="actions">
					<button type="button" class="btn ghost" on:click={goBack} disabled={loading}>
						Back
					</button>
					<button type="button" class="btn primary" on:click={openPreview} disabled={loading}>
						Preview
					</button>
				</div>
			</section>
		{/if}
	</form>
{/if}

{#if previewOpen}
	<div class="modal-backdrop" role="presentation" on:click={() => (previewOpen = false)}>
		<div
			class="modal"
			role="dialog"
			aria-modal="true"
			aria-label="Ad preview"
			on:click|stopPropagation
			on:keydown={(event) => {
				if (event.key === 'Escape') previewOpen = false;
			}}
			tabindex="-1"
		>
			<header class="modal-head">
				<h2>Preview</h2>
				<button
					type="button"
					class="btn ghost"
					on:click={() => (previewOpen = false)}
					disabled={loading}
				>
					Close
				</button>
			</header>
			<div class="modal-body">
				{#if err}
					<p class="notice error" role="alert">{err}</p>
				{/if}
				<div class="preview-card">
					{#if previewUrl}
						<img src={previewUrl} alt="" class="preview-img" />
					{/if}
					<div class="preview-meta">
						<div class="preview-category">{category || 'Category'}</div>
						<h3>{title || 'Your title'}</h3>
						{#if previewPrice}
							<div class="preview-price">{previewPrice}</div>
						{/if}
						<p>{description || 'Your description will appear here.'}</p>
					</div>
				</div>
				<div class="preview-confirm">
					<label class="checkbox">
						<input type="checkbox" bind:checked={ageConfirmed} disabled={loading} />
						<span>I am 18 or older.</span>
					</label>
				</div>
			</div>
			<footer class="modal-actions">
				<button
					type="button"
					class="btn ghost"
					on:click={() => (previewOpen = false)}
					disabled={loading}
				>
					Edit
				</button>
				<button type="button" class="btn primary" on:click={handleSubmit} disabled={loading}>
					Save changes
				</button>
			</footer>
		</div>
	</div>
{/if}

<style>
	.post {
		padding: 0 var(--page-pad) calc(72px + env(safe-area-inset-bottom));
		max-width: var(--page-max);
		margin: 0 auto;
	}
	.head {
		text-align: center;
		display: grid;
		gap: 6px;
	}
	.head h1 {
		margin: 0;
		font-size: 1.7rem;
		font-weight: 800;
	}
	.sub {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 55%, transparent);
	}

	.steps {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
		padding: 0;
		margin: 16px 0 12px;
	}
	.steps li button {
		width: 100%;
		border: 1px solid var(--hairline);
		background: var(--surface);
		border-radius: 12px;
		padding: 10px;
		display: grid;
		gap: 4px;
		place-items: center;
		font-weight: 700;
		cursor: pointer;
	}
	.steps li.done button {
		border-color: color-mix(in srgb, var(--fg) 30%, transparent);
	}
	.steps li.active button {
		border-color: var(--fg);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--fg) 12%, transparent);
	}
	.steps .num {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: var(--fg);
		color: var(--bg);
		font-weight: 800;
	}
	.steps .label {
		font-size: 0.9rem;
	}

	.notice {
		margin: 12px 0;
		padding: 10px 12px;
		border-radius: 10px;
		font-weight: 700;
	}
	.notice.error {
		background: var(--tangerine-bg);
		color: var(--accent-orange);
		border: 1px solid color-mix(in srgb, var(--accent-orange) 35%, transparent);
	}
	.notice.ok {
		background: var(--mint-bg);
		color: var(--accent-green);
		border: 1px solid color-mix(in srgb, var(--accent-green) 35%, transparent);
	}

	.panel {
		border: 1px solid var(--hairline);
		border-radius: 16px;
		padding: 16px;
		background: var(--surface);
		display: grid;
		gap: 12px;
		width: 100%;
	}

	.actions {
		display: flex;
		gap: 10px;
		justify-content: flex-end;
		width: 100%;
	}
	.btn {
		display: inline-grid;
		place-items: center;
		gap: 6px;
		padding: 10px 14px;
		border-radius: 10px;
		border: 1px solid color-mix(in srgb, var(--fg) 18%, transparent);
		background: var(--surface);
		cursor: pointer;
		font-weight: 700;
	}
	.btn.primary {
		background: var(--fg);
		color: var(--bg);
		border-color: var(--fg);
	}
	.btn.ghost {
		background: transparent;
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: color-mix(in srgb, var(--bg) 25%, rgba(0, 0, 0, 0.6));
		display: grid;
		place-items: center;
		padding: 20px;
		z-index: 50;
	}
	.modal {
		width: min(720px, 100%);
		max-height: 90vh;
		overflow: auto;
		background: var(--surface);
		border: 1px solid var(--hairline);
		border-radius: 18px;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
		display: grid;
		gap: 16px;
		padding: 18px;
	}
	.modal-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	.modal-head h2 {
		margin: 0;
		font-size: 1.3rem;
	}
	.modal-body {
		display: grid;
		gap: 12px;
	}
	.preview-card {
		display: grid;
		gap: 16px;
		grid-template-columns: minmax(0, 1fr);
	}
	.preview-img {
		width: 100%;
		border-radius: 14px;
		aspect-ratio: 4 / 3;
		object-fit: cover;
		background: color-mix(in srgb, var(--fg) 6%, transparent);
	}
	.preview-meta {
		display: grid;
		gap: 8px;
	}
	.preview-meta h3 {
		margin: 0;
		font-size: 1.2rem;
	}
	.preview-category {
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		font-size: 0.75rem;
		color: color-mix(in srgb, var(--fg) 70%, transparent);
	}
	.preview-price {
		font-weight: 800;
		font-size: 1.1rem;
	}
	.preview-confirm {
		display: flex;
		align-items: center;
		gap: 8px;
		padding-top: 4px;
	}
	.preview-confirm .checkbox {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-weight: 600;
	}
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
	}
</style>
