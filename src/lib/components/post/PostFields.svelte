<script lang="ts">
	import {
		CATEGORIES,
		type Category,
		type PriceType,
		POA_CATEGORY_SET,
		MAX_AD_PRICE,
		MAX_AD_PRICE_LABEL,
		MAX_AD_PRICE_TOOLTIP_TEXT,
		MIN_TITLE_LENGTH,
		MAX_TITLE_LENGTH,
		MIN_DESC_LENGTH,
		MAX_DESC_LENGTH
	} from '$lib/constants';
	import {
		BIKE_ADULT_SIZE_PRESETS,
		BIKE_CONDITION_OPTIONS,
		BIKE_DESCRIPTION_ASSIST_PROMPTS,
		BIKE_GUIDED_FIELD_MAX_LENGTH,
		BIKE_KIDS_SIZE_PRESETS,
		BIKE_MANUAL_SIZE_UNITS,
		BIKE_MIN_OFFER_PRESET_RATIOS,
		BIKE_PHOTO_CHECKLIST,
		BIKE_SUBTYPE_OPTIONS,
		getBikeSubtypeOptions,
		getBikePriceHint,
		isBikesCategory,
		type BikeCondition,
		type BikeDescriptionAssistKey,
		type BikeManualSizeUnit,
		type BikeSizePreset,
		type BikeSubtype,
		type BikeType
	} from '$lib/category-profiles';
	import {
		getLocationSelectionDescendantIds,
		getLocationSelectionNodeById,
		getLocationSelectionTree,
		normalizeLocationSelectionIds
	} from '$lib/location-hierarchy';

	// two-way bind from parent
	export let category: Category | '' = '';
	export let locationSelectionIds: string[] = [];
	export let title = '';
	export let description = '';
	export let price: number | '' = '';
	export let priceType: PriceType = 'fixed';
	export let firmPrice = false;
	export let minOffer: number | '' = '';
	export let autoDeclineMessage = '';
	export let bikeSubtype: BikeSubtype | '' = '';
	export let bikeType: BikeType | '' = '';
	export let bikeCondition: BikeCondition | '' = '';
	export let bikeSizePreset: BikeSizePreset | '' = '';
	export let bikeSizeManual = '';
	export let bikeSizeManualUnit: BikeManualSizeUnit | '' = '';
	export let bikeReasonForSelling = '';
	export let bikeUsageSummary = '';
	export let bikeKnownIssues = '';
	export let bikeSizeManualEdited = false;
	export let titleManuallyEdited = false;
	export let descriptionManuallyEdited = false;
	export let step = 1;
	export let showErrors = false;

	// validation messages from parent (optional)
	export let loading = false;
	type BikeMinOfferUnit = 'eur' | 'percent';
	const locationTree = getLocationSelectionTree();
	let expandedProvinceIds = new Set<string>();
	let selectedLocationSet = new Set<string>();
	let locationPickerOpen = false;
	let bikeMinOfferUnit: BikeMinOfferUnit = 'eur';
	let bikeMinOfferDisplay = '';
	let bikeMinOfferDisplaySignature = '';

	$: {
		const nextSelectionIds = normalizeLocationSelectionIds(locationSelectionIds);
		if (
			nextSelectionIds.length !== locationSelectionIds.length ||
			nextSelectionIds.some((id, index) => id !== locationSelectionIds[index])
		) {
			locationSelectionIds = nextSelectionIds;
		}
	}
	$: selectedLocationSet = new Set(locationSelectionIds);
	$: locationSelectionInvalid = showErrors && locationSelectionIds.length === 0;
	$: locationSummaryText = getLocationSummaryText(locationSelectionIds);

	$: titleLen = title.length;
	$: descLen = description.length;
	$: categoryInvalid = showErrors && !category;
	$: titleInvalid =
		showErrors &&
		(!title.trim() || title.trim().length < MIN_TITLE_LENGTH || title.length > MAX_TITLE_LENGTH);
	$: isBikes = isBikesCategory(category);
	$: isKidsBike = bikeSubtype === 'kids';
	$: poaAllowed = category ? POA_CATEGORY_SET.has(category) && !isBikes : false;
	$: isLostAndFound = category === 'Lost and Found';
	$: bikeSubtypeInvalid = showErrors && isBikes && !bikeSubtype;
	$: bikeTypeInvalid = showErrors && isBikes && !bikeType;
	$: bikeTypeOptions = bikeSubtype ? getBikeSubtypeOptions(bikeSubtype) : [];
	$: bikeConditionInvalid = showErrors && isBikes && !bikeCondition;
	$: kidsSizeInvalid =
		showErrors &&
		isBikes &&
		isKidsBike &&
		(!bikeSizePreset ||
			!BIKE_KIDS_SIZE_PRESETS.includes(bikeSizePreset as (typeof BIKE_KIDS_SIZE_PRESETS)[number]));
	$: adultSizeInvalid =
		showErrors &&
		isBikes &&
		bikeSubtype !== '' &&
		!isKidsBike &&
		!bikeSizePreset &&
		(!bikeSizeManual.trim() || !bikeSizeManualUnit);
	$: bikeSizeInvalid = kidsSizeInvalid || adultSizeInvalid;
	$: bikePriceHint = isBikes ? getBikePriceHint(bikeSubtype) : '';
	$: numericPrice = price === '' ? Number.NaN : Number(price);
	$: numericMinOffer = minOffer === '' ? Number.NaN : Number(minOffer);
	$: canUseBikeMinOfferPresets =
		isBikes &&
		priceType === 'fixed' &&
		!firmPrice &&
		Number.isFinite(numericPrice) &&
		Number.isInteger(numericPrice) &&
		numericPrice > 0 &&
		numericPrice <= MAX_AD_PRICE;
	$: bikeMinusTenPercentMinOffer = canUseBikeMinOfferPresets
		? Math.max(1, Math.floor(numericPrice * 0.9))
		: null;
	$: titlePlaceholder = isBikes
		? 'e.g., Road bike - size M'
		: 'e.g., IKEA MALM desk - great condition';
	$: descriptionPlaceholder = isBikes
		? 'Reason for selling, usage, and known issues...'
		: 'Key details, pickup area, condition...';
	$: rewardInvalid =
		showErrors &&
		isLostAndFound &&
		price !== '' &&
		(!Number.isInteger(numericPrice) || numericPrice <= 0 || numericPrice > MAX_AD_PRICE);
	$: priceInvalid =
		showErrors &&
		!isLostAndFound &&
		((priceType === 'fixed' &&
			(price === '' ||
				!Number.isInteger(numericPrice) ||
				numericPrice <= 0 ||
				numericPrice > MAX_AD_PRICE)) ||
			(priceType === 'free' && numericPrice !== 0));
	$: minOfferInvalid =
		showErrors &&
		!isLostAndFound &&
		priceType === 'fixed' &&
		!firmPrice &&
		minOffer !== '' &&
		(!Number.isInteger(numericMinOffer) ||
			numericMinOffer <= 0 ||
			numericMinOffer > MAX_AD_PRICE ||
			(price !== '' && Number.isInteger(numericPrice) && numericMinOffer >= numericPrice));
	$: {
		if (!isBikes || priceType !== 'fixed' || firmPrice) {
			bikeMinOfferUnit = 'eur';
			bikeMinOfferDisplay = '';
			bikeMinOfferDisplaySignature = '';
		} else {
			const nextSignature = getBikeMinOfferDisplaySignature();
			if (nextSignature !== bikeMinOfferDisplaySignature) {
				bikeMinOfferDisplay = getBikeMinOfferDisplayValue();
				bikeMinOfferDisplaySignature = nextSignature;
			}
		}
	}
	$: descriptionInvalid =
		showErrors &&
		(!description.trim() ||
			description.trim().length < MIN_DESC_LENGTH ||
			description.length > MAX_DESC_LENGTH);
	let descriptionAssistOpenKey: BikeDescriptionAssistKey | '' = '';
	let assistCustomValue = '';
	$: activeDescriptionAssistPrompt =
		BIKE_DESCRIPTION_ASSIST_PROMPTS.find((prompt) => prompt.key === descriptionAssistOpenKey) ??
		null;
	$: {
		if (!activeDescriptionAssistPrompt) {
			assistCustomValue = '';
		} else if (activeDescriptionAssistPrompt.key === 'reasonForSelling') {
			assistCustomValue = bikeReasonForSelling;
		} else if (activeDescriptionAssistPrompt.key === 'usageSummary') {
			assistCustomValue = bikeUsageSummary;
		} else {
			assistCustomValue = bikeKnownIssues;
		}
	}

	function pickBikeSubtype(nextSubtype: BikeSubtype) {
		bikeSubtype = nextSubtype;
		const nextSubtypeOptions = getBikeSubtypeOptions(nextSubtype);
		if (!nextSubtypeOptions.some((option) => option.value === bikeType)) {
			bikeType = '';
		}
		if (nextSubtype === 'kids') {
			bikeSizeManual = '';
			bikeSizeManualUnit = '';
			if (
				bikeSizePreset &&
				!BIKE_KIDS_SIZE_PRESETS.includes(bikeSizePreset as (typeof BIKE_KIDS_SIZE_PRESETS)[number])
			) {
				bikeSizePreset = '';
			}
			return;
		}
		if (
			bikeSizePreset &&
			!BIKE_ADULT_SIZE_PRESETS.includes(bikeSizePreset as (typeof BIKE_ADULT_SIZE_PRESETS)[number])
		) {
			bikeSizePreset = '';
		}
	}

	function pickBikeSizePreset(nextSize: BikeSizePreset) {
		bikeSizePreset = nextSize;
		bikeSizeManual = '';
		bikeSizeManualUnit = '';
	}

	function applyBikeMinOfferPreset(ratio: number) {
		if (!Number.isFinite(numericPrice) || numericPrice <= 0) return;
		bikeMinOfferUnit = 'percent';
		minOffer = Math.max(1, Math.floor(numericPrice * ratio));
		bikeMinOfferDisplay = String(Math.round(ratio * 100));
		bikeMinOfferDisplaySignature = getBikeMinOfferDisplaySignature();
	}

	function applyBikeMinOfferAbsolute(value: number) {
		if (!Number.isFinite(value) || value <= 0) return;
		bikeMinOfferUnit = 'eur';
		minOffer = value;
		bikeMinOfferDisplay = String(minOffer);
		bikeMinOfferDisplaySignature = getBikeMinOfferDisplaySignature();
	}

	function getBikeMinOfferDisplaySignature() {
		const pricePart = Number.isFinite(numericPrice) ? String(numericPrice) : '';
		const minOfferPart = minOffer === '' ? '' : String(Number(minOffer));
		return `${bikeMinOfferUnit}:${pricePart}:${minOfferPart}`;
	}

	function getBikeMinOfferDisplayValue() {
		if (minOffer === '') return '';
		const minOfferValue = Number(minOffer);
		if (!Number.isFinite(minOfferValue) || minOfferValue <= 0) return '';
		if (bikeMinOfferUnit === 'eur') return String(minOfferValue);
		if (!Number.isFinite(numericPrice) || numericPrice <= 0) return '';
		const percent = Math.ceil((minOfferValue / numericPrice) * 100);
		return String(Math.min(99, Math.max(1, percent)));
	}

	function setBikeMinOfferUnit(nextUnit: BikeMinOfferUnit) {
		bikeMinOfferUnit = nextUnit;
		bikeMinOfferDisplay = getBikeMinOfferDisplayValue();
		bikeMinOfferDisplaySignature = getBikeMinOfferDisplaySignature();
	}

	function handleBikeMinOfferUnitChange(event: Event) {
		setBikeMinOfferUnit((event.currentTarget as HTMLSelectElement).value as BikeMinOfferUnit);
	}

	function handleBikeMinOfferInput(event: Event) {
		const raw = (event.currentTarget as HTMLInputElement).value;
		bikeMinOfferDisplay = raw;
		if (!raw.trim()) {
			minOffer = '';
			bikeMinOfferDisplaySignature = getBikeMinOfferDisplaySignature();
			return;
		}

		const numericValue = Number(raw);
		if (!Number.isFinite(numericValue) || numericValue <= 0) {
			minOffer = '';
			bikeMinOfferDisplaySignature = getBikeMinOfferDisplaySignature();
			return;
		}

		if (bikeMinOfferUnit === 'eur') {
			minOffer = numericValue;
		} else if (Number.isFinite(numericPrice) && numericPrice > 0) {
			const percentageValue = Math.max(1, Math.min(99, numericValue));
			if (Number.isInteger(percentageValue)) {
				minOffer = Math.max(1, Math.floor((numericPrice * percentageValue) / 100));
			} else {
				minOffer = (numericPrice * percentageValue) / 100;
			}
			bikeMinOfferDisplay = String(percentageValue);
		} else {
			minOffer = '';
		}

		bikeMinOfferDisplaySignature = getBikeMinOfferDisplaySignature();
	}

	function getBikeDescriptionAssistValue(key: BikeDescriptionAssistKey): string {
		if (key === 'reasonForSelling') return bikeReasonForSelling;
		if (key === 'usageSummary') return bikeUsageSummary;
		return bikeKnownIssues;
	}

	function setBikeDescriptionAssistValue(key: BikeDescriptionAssistKey, value: string) {
		const normalized = value.slice(0, BIKE_GUIDED_FIELD_MAX_LENGTH);
		if (key === 'reasonForSelling') bikeReasonForSelling = normalized;
		else if (key === 'usageSummary') bikeUsageSummary = normalized;
		else bikeKnownIssues = normalized;
	}

	function clearBikeDescriptionAssistValue(key: BikeDescriptionAssistKey) {
		setBikeDescriptionAssistValue(key, '');
	}

	function toggleDescriptionAssist(key: BikeDescriptionAssistKey) {
		descriptionAssistOpenKey = descriptionAssistOpenKey === key ? '' : key;
	}

	function hasSelectedAncestor(nodeId: string, selectedIds: Set<string>) {
		let parentId = getLocationSelectionNodeById(nodeId)?.parentId ?? null;
		while (parentId) {
			if (selectedIds.has(parentId)) return true;
			parentId = getLocationSelectionNodeById(parentId)?.parentId ?? null;
		}
		return false;
	}

	function locationTypeRank(type: 'country' | 'province' | 'county' | undefined) {
		if (type === 'country') return 1;
		if (type === 'province') return 2;
		return 3;
	}

	function getLocationSummaryText(selectedIdsRaw: readonly string[]) {
		if (selectedIdsRaw.length === 0) return '';
		const selectedIds = new Set(selectedIdsRaw);
		const visibleIds = Array.from(selectedIds).filter((nodeId) => !hasSelectedAncestor(nodeId, selectedIds));
		const summaryIds = (visibleIds.length > 0 ? visibleIds : Array.from(selectedIds)).sort((a, b) => {
			const aNode = getLocationSelectionNodeById(a);
			const bNode = getLocationSelectionNodeById(b);
			const rankDiff = locationTypeRank(aNode?.type) - locationTypeRank(bNode?.type);
			if (rankDiff !== 0) return rankDiff;
			return (aNode?.name ?? a).localeCompare(bNode?.name ?? b, 'en-IE');
		});
		const firstLabel = getLocationSelectionNodeById(summaryIds[0])?.name ?? '';
		if (!firstLabel) return '';
		if (summaryIds.length === 1) return firstLabel;
		return `${firstLabel} +${summaryIds.length - 1} more`;
	}

	function toggleLocationPicker() {
		if (loading) return;
		locationPickerOpen = !locationPickerOpen;
		if (!locationPickerOpen) return;
		if (expandedProvinceIds.size > 0) return;
		const nextExpanded = new Set<string>();
		for (const selectedId of locationSelectionIds) {
			const node = getLocationSelectionNodeById(selectedId);
			if (!node) continue;
			if (node.type === 'country') {
				for (const province of locationTree.children) {
					nextExpanded.add(province.id);
				}
			} else if (node.type === 'province') {
				nextExpanded.add(node.id);
			} else if (node.type === 'county' && node.parentId) {
				nextExpanded.add(node.parentId);
			}
		}
		expandedProvinceIds = nextExpanded;
	}

	function handleLocationPickerKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape') return;
		locationPickerOpen = false;
	}

	function isProvinceExpanded(provinceId: string) {
		return expandedProvinceIds.has(provinceId);
	}

	function toggleProvinceExpanded(provinceId: string) {
		const next = new Set(expandedProvinceIds);
		if (next.has(provinceId)) {
			next.delete(provinceId);
		} else {
			next.add(provinceId);
		}
		expandedProvinceIds = next;
	}

	function isNodeChecked(nodeId: string) {
		if (selectedLocationSet.has(nodeId)) return true;
		let parentId = getLocationSelectionNodeById(nodeId)?.parentId ?? null;
		while (parentId) {
			if (selectedLocationSet.has(parentId)) return true;
			parentId = getLocationSelectionNodeById(parentId)?.parentId ?? null;
		}
		return false;
	}

	function handleLocationNodeChange(nodeId: string, event: Event) {
		const shouldSelect = (event.currentTarget as HTMLInputElement).checked;
		const nextIds = new Set(locationSelectionIds);
		const nextExpanded = new Set(expandedProvinceIds);
		const affectedIds = [nodeId, ...getLocationSelectionDescendantIds(nodeId)];

		if (shouldSelect) {
			for (const id of affectedIds) nextIds.add(id);
			const node = getLocationSelectionNodeById(nodeId);
			if (node?.type === 'country') {
				for (const province of locationTree.children) {
					nextExpanded.add(province.id);
				}
			} else if (node?.type === 'province') {
				nextExpanded.add(node.id);
			} else if (node?.type === 'county' && node.parentId) {
				nextExpanded.add(node.parentId);
			}
		} else {
			for (const id of affectedIds) nextIds.delete(id);
			const node = getLocationSelectionNodeById(nodeId);
			let parentId = node?.parentId ?? null;
			while (parentId) {
				nextIds.delete(parentId);
				parentId = getLocationSelectionNodeById(parentId)?.parentId ?? null;
			}
			if (node?.type === 'country') {
				nextExpanded.clear();
			}
		}

		expandedProvinceIds = nextExpanded;
		locationSelectionIds = normalizeLocationSelectionIds(Array.from(nextIds));
		// Keep the control input-like: apply selection and collapse menu so it cannot overlay later fields.
		locationPickerOpen = false;
	}
</script>

<section class="fields" aria-busy={loading}>
	{#if step === 1}
		<div class="field">
			<label for="category">Category</label>
			<select
				id="category"
				bind:value={category}
				disabled={loading}
				aria-invalid={showErrors ? categoryInvalid : undefined}
			>
				<option value="" disabled selected hidden>Choose…</option>
				{#each CATEGORIES as c (c)}
					<option value={c}>{c}</option>
				{/each}
			</select>
		</div>

		<div class="field">
			<label for="location-tree-trigger">Location</label>
			<div class="location-picker">
				<button
					id="location-tree-trigger"
					type="button"
					class="location-picker-trigger"
					class:invalid={showErrors && locationSelectionInvalid}
					on:click={toggleLocationPicker}
					on:keydown={handleLocationPickerKeydown}
					disabled={loading}
					aria-haspopup="tree"
					aria-controls="location-tree-menu"
					aria-expanded={locationPickerOpen}
				>
					<span class="location-picker-label" class:placeholder={!locationSummaryText}>
						{locationSummaryText || 'Select location'}
					</span>
					<span class="location-picker-caret" aria-hidden="true">
						{locationPickerOpen ? '▴' : '▾'}
					</span>
				</button>
				{#if locationPickerOpen}
					<div
						id="location-tree-menu"
						class="location-picker-menu"
						role="group"
						aria-label="Ireland location tree"
					>
						<div class="tree-row tree-row-country">
							<label class="tree-check">
								<input
									id="location-root-checkbox"
									type="checkbox"
									checked={isNodeChecked(locationTree.id)}
									on:change={(event) => handleLocationNodeChange(locationTree.id, event)}
									disabled={loading}
									aria-invalid={showErrors ? locationSelectionInvalid : undefined}
								/>
								<span>{locationTree.name}</span>
							</label>
						</div>
						<div class="tree-children tree-children-provinces">
							{#each locationTree.children as province (province.id)}
								<div class="tree-group">
									<div class="tree-row tree-row-province">
										<button
											type="button"
											class="tree-toggle"
											on:click={() => toggleProvinceExpanded(province.id)}
											disabled={loading}
											aria-label={isProvinceExpanded(province.id)
												? `Collapse ${province.name}`
												: `Expand ${province.name}`}
											aria-expanded={isProvinceExpanded(province.id)}
										>
											{isProvinceExpanded(province.id) ? '▾' : '▸'}
										</button>
										<label class="tree-check">
											<input
												type="checkbox"
												checked={isNodeChecked(province.id)}
												on:change={(event) => handleLocationNodeChange(province.id, event)}
												disabled={loading}
											/>
											<span>{province.name}</span>
										</label>
									</div>
									{#if isProvinceExpanded(province.id)}
										<div class="tree-children tree-children-counties">
											{#each province.children as county (county.id)}
												<div class="tree-row tree-row-county">
													<span class="tree-spacer" aria-hidden="true"></span>
													<label class="tree-check">
														<input
															type="checkbox"
															checked={isNodeChecked(county.id)}
															on:change={(event) => handleLocationNodeChange(county.id, event)}
															disabled={loading}
														/>
														<span>{county.name}</span>
													</label>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
			{#if locationSelectionInvalid}
				<small class="error-text">Select at least one location.</small>
			{/if}
		</div>

		{#if isBikes}
			<div class="bike-panel">
				<div class="field">
					<p class="group-label">Bike type</p>
					<div class="pill-row" role="radiogroup" aria-label="Bike type">
						{#each BIKE_SUBTYPE_OPTIONS as option (option.value)}
							<button
								type="button"
								class="pill"
								class:active={bikeSubtype === option.value}
								on:click={() => pickBikeSubtype(option.value)}
								disabled={loading}
								aria-pressed={bikeSubtype === option.value}
							>
								{option.label}
							</button>
						{/each}
					</div>
					{#if bikeSubtypeInvalid}
						<small class="error-text">Choose a bike type.</small>
					{/if}
				</div>

				<div class="field">
					<p class="group-label">Bike subtype</p>
					{#if bikeSubtype}
						<div class="pill-row" role="radiogroup" aria-label="Bike subtype">
							{#each bikeTypeOptions as option (option.value)}
								<button
									type="button"
									class="pill"
									class:active={bikeType === option.value}
									on:click={() => (bikeType = option.value)}
									disabled={loading}
									aria-pressed={bikeType === option.value}
								>
									{option.label}
								</button>
							{/each}
						</div>
					{:else}
						<small class="muted">Choose bike type first.</small>
					{/if}
					{#if bikeTypeInvalid}
						<small class="error-text">Choose a bike subtype.</small>
					{/if}
				</div>

				<div class="field">
					<p class="group-label">Condition</p>
					<div class="pill-row" role="radiogroup" aria-label="Condition">
						{#each BIKE_CONDITION_OPTIONS as option (option.value)}
							<button
								type="button"
								class="pill"
								class:active={bikeCondition === option.value}
								on:click={() => (bikeCondition = option.value)}
								disabled={loading}
								aria-pressed={bikeCondition === option.value}
							>
								{option.label}
							</button>
						{/each}
					</div>
					{#if bikeConditionInvalid}
						<small class="error-text">Choose a condition.</small>
					{/if}
				</div>

				<div class="field">
					<p class="group-label">Size</p>
					{#if bikeSubtype === 'kids'}
						<div class="pill-row" role="radiogroup" aria-label="Kids size">
							{#each BIKE_KIDS_SIZE_PRESETS as preset (preset)}
								<button
									type="button"
									class="pill"
									class:active={bikeSizePreset === preset}
									on:click={() => pickBikeSizePreset(preset)}
									disabled={loading}
									aria-pressed={bikeSizePreset === preset}
								>
									{preset}
								</button>
							{/each}
						</div>
					{:else if bikeSubtype === 'adult' || bikeSubtype === 'electric'}
						<div class="pill-row" role="radiogroup" aria-label="Adult size">
							{#each BIKE_ADULT_SIZE_PRESETS as preset (preset)}
								<button
									type="button"
									class="pill"
									class:active={bikeSizePreset === preset}
									on:click={() => pickBikeSizePreset(preset)}
									disabled={loading}
									aria-pressed={bikeSizePreset === preset}
								>
									{preset}
								</button>
							{/each}
						</div>
						<div class="size-manual-row">
							<input
								id="bike-size-manual"
								type="text"
								inputmode="numeric"
								pattern="[0-9]*"
								bind:value={bikeSizeManual}
								disabled={loading}
								placeholder="Manual size"
								on:input={(event) => {
									const input = event.currentTarget as HTMLInputElement;
									const digitsOnly = input.value.replace(/[^0-9]/g, '');
									if (digitsOnly !== input.value) {
										input.value = digitsOnly;
									}
									bikeSizeManual = digitsOnly;
									if (bikeSizeManual.trim()) {
										bikeSizePreset = '';
										if (!bikeSizeManualUnit) bikeSizeManualUnit = 'cm';
									}
									bikeSizeManualEdited = true;
								}}
							/>
							<select
								id="bike-size-manual-unit"
								bind:value={bikeSizeManualUnit}
								disabled={loading || !bikeSizeManual.trim()}
								on:change={() => {
									if (bikeSizeManual.trim()) {
										bikeSizePreset = '';
										bikeSizeManualEdited = true;
									}
								}}
							>
								<option value="" disabled selected hidden>Unit</option>
								{#each BIKE_MANUAL_SIZE_UNITS as unit (unit)}
									<option value={unit}>{unit}</option>
								{/each}
							</select>
						</div>
					{:else}
						<small class="muted">Choose bike type first.</small>
					{/if}
					{#if bikeSizeInvalid}
						<small class="error-text">Add a size.</small>
					{/if}
				</div>

				<div class="field bike-description-assist">
					<p class="group-label">Description assist (optional)</p>
					<div class="pill-row" role="group" aria-label="Bike description assist">
						{#each BIKE_DESCRIPTION_ASSIST_PROMPTS as prompt (prompt.key)}
							<button
								type="button"
								class="pill assist-pill"
								class:active={descriptionAssistOpenKey === prompt.key}
								class:configured={!!getBikeDescriptionAssistValue(prompt.key)}
								on:click={() => toggleDescriptionAssist(prompt.key)}
								disabled={loading}
								aria-expanded={descriptionAssistOpenKey === prompt.key}
							>
								<span>{prompt.label}</span>
								{#if getBikeDescriptionAssistValue(prompt.key)}
									<small class="assist-pill-state">Set</small>
								{/if}
							</button>
						{/each}
					</div>
					{#if activeDescriptionAssistPrompt}
						<div
							class="assist-popover"
							role="region"
							aria-label={activeDescriptionAssistPrompt.label}
						>
							<div
								class="pill-row"
								role="group"
								aria-label={`${activeDescriptionAssistPrompt.label} options`}
							>
								{#each activeDescriptionAssistPrompt.options as option (option)}
									<button
										type="button"
										class="pill"
										class:active={getBikeDescriptionAssistValue(
											activeDescriptionAssistPrompt.key
										) === option}
										on:click={() =>
											setBikeDescriptionAssistValue(activeDescriptionAssistPrompt.key, option)}
										disabled={loading}
									>
										{option}
									</button>
								{/each}
							</div>
							<label for={`bike-assist-${activeDescriptionAssistPrompt.key}`}>Custom</label>
							<input
								id={`bike-assist-${activeDescriptionAssistPrompt.key}`}
								type="text"
								bind:value={assistCustomValue}
								maxlength={BIKE_GUIDED_FIELD_MAX_LENGTH}
								disabled={loading}
								placeholder="Or write your own short detail"
								on:input={(event) =>
									setBikeDescriptionAssistValue(
										activeDescriptionAssistPrompt.key,
										(event.currentTarget as HTMLInputElement).value
									)}
							/>
							<div class="assist-actions">
								<button
									type="button"
									class="pill"
									on:click={() =>
										clearBikeDescriptionAssistValue(activeDescriptionAssistPrompt.key)}
									disabled={loading}
								>
									Clear
								</button>
								<button
									type="button"
									class="pill"
									on:click={() => (descriptionAssistOpenKey = '')}
									disabled={loading}
								>
									Done
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<div class="field">
			<label for="title">Title <span class="muted">({titleLen}/{MAX_TITLE_LENGTH})</span></label>
			<input
				id="title"
				type="text"
				bind:value={title}
				minlength={MIN_TITLE_LENGTH}
				maxlength={MAX_TITLE_LENGTH}
				placeholder={titlePlaceholder}
				required
				disabled={loading}
				aria-invalid={showErrors ? titleInvalid : undefined}
				on:input={() => {
					titleManuallyEdited = true;
				}}
			/>
			<small class="muted">Min {MIN_TITLE_LENGTH}, max {MAX_TITLE_LENGTH}</small>
		</div>

		<div class="field">
			<label for="description"
				>Description <span class="muted">({descLen}/{MAX_DESC_LENGTH})</span></label
			>
			<textarea
				id="description"
				bind:value={description}
				minlength={MIN_DESC_LENGTH}
				maxlength={MAX_DESC_LENGTH}
				rows="6"
				placeholder={descriptionPlaceholder}
				required
				disabled={loading}
				aria-invalid={showErrors ? descriptionInvalid : undefined}
				on:input={() => {
					descriptionManuallyEdited = true;
				}}
			></textarea>
			<small class="muted">Min {MIN_DESC_LENGTH}, max {MAX_DESC_LENGTH}</small>
		</div>
	{/if}

	{#if step === 2}
		{#if category === 'Free / Giveaway'}
			<div class="free-card" aria-live="polite">
				<div class="free-pill">Free / Giveaway</div>
				<p class="free-text">This listing will be shown as free. No price required.</p>
				<div class="free-meta">
					<span class="label">Price</span>
					<span class="value">Free</span>
				</div>
				<small class="muted">Need a price? Go back and choose another category.</small>
			</div>
		{:else if category === 'Lost and Found'}
			<div class="row">
				<div class="field">
					<label for="reward">Reward (optional)</label>
					<input
						id="reward"
						type="number"
						min="1"
						max={MAX_AD_PRICE}
						step="1"
						inputmode="numeric"
						pattern="[0-9]*"
						bind:value={price}
						disabled={loading}
						placeholder="e.g., 50"
						aria-invalid={showErrors ? rewardInvalid : undefined}
					/>
					<small class="muted">
						Optional. Leave blank if no reward is offered. Whole euros only, up to
						{MAX_AD_PRICE_LABEL}.
						<span
							class="max-tooltip"
							title={MAX_AD_PRICE_TOOLTIP_TEXT}
							aria-label={MAX_AD_PRICE_TOOLTIP_TEXT}
						>
							i
						</span>
					</small>
				</div>
			</div>
		{:else}
			<div class="row">
				<div class="field">
					<label for="price-type">Price type</label>
					<select id="price-type" bind:value={priceType} disabled={loading}>
						<option value="fixed">Fixed price</option>
						<option value="free">Free</option>
						{#if poaAllowed}
							<option value="poa">Price on application</option>
						{/if}
					</select>
				</div>
				<div class="field">
					{#if priceType === 'fixed'}
						<label for="price">Price</label>
					{:else}
						<span class="price-label">Price</span>
					{/if}
					<div class="price-slot">
						{#if priceType === 'fixed'}
							<input
								id="price"
								type="number"
								min="0"
								max={MAX_AD_PRICE}
								step="1"
								inputmode="numeric"
								pattern="[0-9]*"
								bind:value={price}
								required
								disabled={loading}
								placeholder="e.g., 50"
								aria-invalid={showErrors ? priceInvalid : undefined}
							/>
						{:else}
							<span class="price-badge">{priceType === 'free' ? 'Free' : 'POA'}</span>
						{/if}
					</div>
				</div>
			</div>
			{#if bikePriceHint}
				<small class="muted">{bikePriceHint}</small>
			{/if}
			{#if priceType === 'fixed'}
				<small class="muted">
					Whole euros only, up to {MAX_AD_PRICE_LABEL}.
					<span
						class="max-tooltip"
						title={MAX_AD_PRICE_TOOLTIP_TEXT}
						aria-label={MAX_AD_PRICE_TOOLTIP_TEXT}
					>
						i
					</span>
				</small>
			{/if}
		{/if}

		{#if priceType === 'fixed' && category !== 'Lost and Found'}
			<div class="field">
				<label class="checkbox">
					<input type="checkbox" bind:checked={firmPrice} disabled={loading} />
					<span>Firm price (no offers)</span>
				</label>
				<small class="muted">Turn this on to auto-decline offers.</small>
			</div>
			{#if !firmPrice}
				<div class="field">
					<label for="min-offer">Minimum offer (optional)</label>
					{#if canUseBikeMinOfferPresets}
						<div class="pill-row">
							{#each BIKE_MIN_OFFER_PRESET_RATIOS as ratio (ratio)}
								<button
									type="button"
									class="pill"
									on:click={() => applyBikeMinOfferPreset(ratio)}
									disabled={loading}
								>
									{Math.round(ratio * 100)}%
								</button>
							{/each}
							{#if bikeMinusTenPercentMinOffer !== null}
								<button
									type="button"
									class="pill"
									on:click={() => applyBikeMinOfferAbsolute(bikeMinusTenPercentMinOffer)}
									disabled={loading}
								>
									€{bikeMinusTenPercentMinOffer}
								</button>
							{/if}
						</div>
					{/if}
					{#if isBikes}
						<div class="min-offer-row">
							<input
								id="min-offer"
								type="number"
								min="1"
								max={bikeMinOfferUnit === 'percent' ? 99 : MAX_AD_PRICE}
								step="1"
								inputmode="numeric"
								pattern="[0-9]*"
								value={bikeMinOfferDisplay}
								on:input={handleBikeMinOfferInput}
								disabled={loading}
								placeholder={bikeMinOfferUnit === 'percent' ? '80' : '40'}
								aria-invalid={showErrors ? minOfferInvalid : undefined}
							/>
							<select
								id="min-offer-unit"
								bind:value={bikeMinOfferUnit}
								on:change={handleBikeMinOfferUnitChange}
								disabled={loading}
							>
								<option value="eur">EUR</option>
								<option value="percent">%</option>
							</select>
						</div>
					{:else}
						<input
							id="min-offer"
							type="number"
							min="1"
							max={MAX_AD_PRICE}
							step="1"
							inputmode="numeric"
							pattern="[0-9]*"
							bind:value={minOffer}
							disabled={loading}
							placeholder="e.g., 40"
							aria-invalid={showErrors ? minOfferInvalid : undefined}
						/>
					{/if}
					<small class="muted">
						Auto-decline lower offers. Whole {bikeMinOfferUnit === 'percent' ? 'numbers' : 'euros'}
						only{bikeMinOfferUnit === 'percent' ? ' (1-99).' : `, up to ${MAX_AD_PRICE_LABEL}.`}
						{#if bikeMinOfferUnit !== 'percent'}
							<span
								class="max-tooltip"
								title={MAX_AD_PRICE_TOOLTIP_TEXT}
								aria-label={MAX_AD_PRICE_TOOLTIP_TEXT}
							>
								i
							</span>
						{/if}
					</small>
				</div>
			{/if}
			{#if firmPrice || minOffer !== ''}
				<div class="field">
					<label for="auto-decline">Auto-decline message (optional)</label>
					<input
						id="auto-decline"
						type="text"
						bind:value={autoDeclineMessage}
						disabled={loading}
						placeholder="e.g., Thanks — price is firm."
					/>
				</div>
			{/if}
		{/if}
	{/if}

	{#if step === 3 && isBikes}
		<div class="guide-card">
			<h3>Bike photo checklist</h3>
			<ul>
				{#each BIKE_PHOTO_CHECKLIST as item (item)}
					<li>{item}</li>
				{/each}
			</ul>
		</div>
	{/if}
</section>

<style>
	.fields {
		display: grid;
		gap: 12px;
		width: 100%;
	}
	.field {
		display: grid;
		gap: 6px;
		width: 100%;
	}
	.row {
		display: flex;
		gap: 12px;
		align-items: flex-end;
		width: 100%;
	}
	.row > .field {
		flex: 1 1 auto;
		min-width: 0;
	}
	.bike-panel {
		border: 1px solid var(--hairline);
		border-radius: 14px;
		padding: 12px;
		display: grid;
		gap: 12px;
		background: color-mix(in srgb, var(--fg) 4%, var(--surface));
	}
	.location-picker {
		position: relative;
	}
	.location-picker-trigger {
		width: 100%;
		min-height: 42px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		border: 1px solid var(--hairline);
		border-radius: 12px;
		background: var(--surface);
		color: inherit;
		padding: 10px 12px;
		text-align: left;
		font: inherit;
		cursor: pointer;
	}
	.location-picker-trigger.invalid {
		border-color: color-mix(in srgb, var(--accent-orange) 55%, transparent);
	}
	.location-picker-trigger:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--fg) 22%, transparent);
		outline-offset: 1px;
	}
	.location-picker-label {
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.location-picker-label.placeholder {
		color: color-mix(in srgb, var(--fg) 55%, transparent);
	}
	.location-picker-caret {
		font-size: 0.85rem;
		color: color-mix(in srgb, var(--fg) 68%, transparent);
	}
	.location-picker-menu {
		position: absolute;
		top: calc(100% + 6px);
		left: 0;
		right: 0;
		max-height: min(360px, 52vh);
		overflow: auto;
		border: 1px solid var(--hairline);
		border-radius: 12px;
		background: var(--surface);
		padding: 8px;
		display: grid;
		gap: 6px;
		z-index: 20;
		box-shadow: 0 10px 26px color-mix(in srgb, var(--bg) 82%, transparent);
	}
	.tree-row {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 30px;
	}
	.tree-row-country {
		font-weight: 700;
	}
	.tree-row-county {
		padding-left: 24px;
	}
	.tree-group {
		display: grid;
		gap: 2px;
	}
	.tree-children {
		display: grid;
		gap: 4px;
		padding-left: 16px;
		border-left: 1px solid color-mix(in srgb, var(--fg) 14%, transparent);
	}
	.tree-children-provinces {
		padding-top: 2px;
	}
	.tree-children-counties {
		border-left-color: color-mix(in srgb, var(--fg) 10%, transparent);
	}
	.tree-toggle,
	.tree-spacer {
		width: 26px;
		height: 26px;
		display: grid;
		place-items: center;
	}
	.tree-toggle {
		border: 0;
		border-radius: 7px;
		background: transparent;
		font-size: 0.85rem;
		line-height: 1;
		cursor: pointer;
	}
	.tree-toggle:hover {
		background: color-mix(in srgb, var(--fg) 9%, transparent);
	}
	.tree-spacer {
		border: 0;
	}
	.tree-check {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}
	.tree-check input[type='checkbox'] {
		margin: 0;
	}
	.pill-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.size-manual-row {
		display: flex;
		align-items: center;
		gap: 8px;
		width: fit-content;
		max-width: 100%;
	}
	.size-manual-row input {
		width: 10ch;
		min-width: 10ch;
	}
	.size-manual-row select {
		width: 5.5rem;
		min-width: 5.5rem;
	}
	.min-offer-row {
		display: flex;
		align-items: center;
		gap: 8px;
		width: fit-content;
		max-width: 100%;
	}
	.min-offer-row input {
		width: 10ch;
		min-width: 10ch;
	}
	.min-offer-row select {
		width: 5.5rem;
		min-width: 5.5rem;
	}
	.pill {
		border: 1px solid color-mix(in srgb, var(--fg) 18%, transparent);
		background: var(--surface);
		color: inherit;
		border-radius: 999px;
		padding: 7px 12px;
		font-weight: 700;
		cursor: pointer;
	}
	.pill.active {
		background: color-mix(in srgb, var(--fg) 16%, var(--bg));
		border-color: color-mix(in srgb, var(--fg) 36%, transparent);
	}
	.assist-pill {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}
	.assist-pill.configured {
		border-color: color-mix(in srgb, var(--accent-green) 35%, transparent);
	}
	.assist-pill-state {
		font-size: 0.72rem;
		font-weight: 800;
		color: color-mix(in srgb, var(--fg) 68%, transparent);
		text-transform: uppercase;
	}
	.assist-popover {
		border: 1px solid color-mix(in srgb, var(--fg) 14%, transparent);
		border-radius: 12px;
		padding: 10px;
		display: grid;
		gap: 8px;
		background: color-mix(in srgb, var(--fg) 5%, var(--surface));
	}
	.assist-actions {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
	}
	.error-text {
		color: var(--accent-orange);
		font-weight: 700;
	}
	.guide-card {
		border: 1px solid var(--hairline);
		border-radius: 14px;
		padding: 12px;
		background: color-mix(in srgb, var(--fg) 6%, var(--surface));
	}
	.guide-card h3 {
		margin: 0 0 8px;
		font-size: 1rem;
	}
	.guide-card ul {
		margin: 0;
		padding-left: 18px;
		display: grid;
		gap: 4px;
	}

	.free-card {
		border: 1px solid var(--hairline);
		background: color-mix(in srgb, var(--fg) 6%, var(--surface));
		border-radius: 14px;
		padding: 16px;
		display: grid;
		gap: 10px;
	}
	.free-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 10px;
		border-radius: 999px;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		background: color-mix(in srgb, var(--fg) 16%, var(--bg));
		color: var(--fg);
		width: max-content;
	}
	.free-text {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 80%, transparent);
		font-weight: 600;
	}
	.free-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 12px;
		border-radius: 10px;
		background: color-mix(in srgb, var(--fg) 10%, var(--bg));
		font-weight: 800;
	}
	.free-meta .label {
		font-size: 0.9rem;
		color: color-mix(in srgb, var(--fg) 70%, transparent);
	}
	.free-meta .value {
		font-size: 1rem;
	}
	.checkbox {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-weight: 600;
	}
	.checkbox input {
		width: 16px;
		height: 16px;
	}
	label {
		font-weight: 700;
	}
	.group-label {
		margin: 0;
		font-weight: 700;
	}
	.price-label {
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
		width: 100%;
	}
	.muted {
		color: color-mix(in srgb, var(--fg) 55%, transparent);
	}
	.max-tooltip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1rem;
		height: 1rem;
		margin-left: 0.3rem;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--fg) 25%, transparent);
		font-size: 0.72rem;
		font-weight: 700;
		line-height: 1;
		cursor: help;
	}
	.price-slot {
		min-height: 44px;
		display: flex;
		align-items: center;
		width: 100%;
	}
	.price-slot input {
		width: 100%;
	}
	.price-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 6px 10px;
		border-radius: 4px;
		font-weight: 900;
		background: color-mix(in srgb, var(--fg) 18%, var(--bg));
		color: var(--fg);
	}
</style>
