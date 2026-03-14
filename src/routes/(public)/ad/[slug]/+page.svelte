<script lang="ts">
	import { tick } from 'svelte';
	import AdCardWide from '$lib/components/AdCardWide.svelte';
	import AdCardComponent from '$lib/components/AdCard.svelte';
	import MessageComposer from '$lib/components/messages/MessageComposer.svelte';
	import type { AdCard, ModerationAction } from '../../../../types/ad-types';
	import { ModerationIcon, ReportIcon, ShareIcon, WatchlistIcon } from '$lib/icons';
	import type { OgData } from '$lib/seo/og';
	import { formatFullDate } from '$lib/utils/relative-time';
	import { formatMoney } from '$lib/utils/price';
	import { QUICK_SAFETY_TIPS } from '$lib/safety-tips';
	export let data: {
		ad: AdCard;
		moderation?: ModerationAction | null;
		isOwner?: boolean;
		isExpired?: boolean;
		isSaved?: boolean;
		similarAds?: AdCard[];
		ownerMessages?: { count: number } | null;
		offerRules?: {
			firmPrice?: boolean;
			minOffer?: number | null;
			autoDeclineMessage?: string | null;
		};
		seo?: {
			title: string;
			description: string;
			canonical: string;
			og: OgData;
			jsonLd: Record<string, unknown>;
			robots?: string;
		};
	};

	const reportReasons = [
		{ value: 'illegal', label: 'Illegal content' },
		{ value: 'prohibited', label: 'Prohibited item' },
		{ value: 'scam', label: 'Scam or fraud' },
		{ value: 'spam', label: 'Spam or misleading' },
		{ value: 'other', label: 'Other' }
	];
	const MIN_REPORT_DETAILS = 20;

	let reportOpen = false;
	let reportName = '';
	let reportEmail = '';
	let reportReason = reportReasons[0]?.value ?? 'illegal';
	let reportDetails = '';
	let reportGoodFaith = false;
	let reportSending = false;
	let reportSuccess = false;
	let reportError = '';
	let reportId = '';
	let reportCopied = false;
	let reportCopyError = '';
	const MIN_APPEAL_DETAILS = 20;
	let reportAttempted = false;
	let appealAttempted = false;

	let reportPanel: HTMLElement | null = null;
	let moderationPanel: HTMLDetailsElement | null = null;

	let appealOpen = false;
	let appealDetails = '';
	let appealSending = false;
	let appealSuccess = false;
	let appealError = '';
	let appealId = '';
	let moderationOpen = false;

	// Mark as Sold inline form state
	let soldFormOpen = false;
	let soldSalePrice = '';
	let soldBusy = false;
	let soldErr = '';
	let soldOk = '';

	async function confirmSoldFromDetail() {
		soldErr = '';
		soldOk = '';
		soldBusy = true;
		try {
			const price = soldSalePrice ? parseInt(soldSalePrice, 10) : null;
			const res = await fetch(`/api/ads/${data.ad.id}/status`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					status: 'sold',
					sale_price: price && price > 0 ? price : null
				})
			});
			const body = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
			if (!res.ok || body.success === false) {
				throw new Error(body.message || 'Could not update status.');
			}
			data.ad = { ...data.ad, status: 'sold', salePrice: price && price > 0 ? price : null };
			soldOk = 'Marked as sold.';
			soldFormOpen = false;
			soldSalePrice = '';
		} catch (e: unknown) {
			soldErr = e instanceof Error ? e.message : 'Could not update status.';
		} finally {
			soldBusy = false;
		}
	}

	$: reportDetailsCount = reportDetails.length;
	$: appealDetailsCount = appealDetails.length;
	$: decisionSource = data.moderation
		? data.moderation.report_id
			? 'User report'
			: 'Own-initiative review'
		: '';
	$: postedDate = data.ad?.createdAt ? formatFullDate(data.ad.createdAt) : '';
	$: salePriceLabel =
		data.ad?.status === 'sold' && data.ad?.salePrice
			? `Sold for ${formatMoney(data.ad.salePrice, data.ad.currency ?? 'EUR')}`
			: '';

	const LT = '<';
	$: jsonLdHtml = data?.seo?.jsonLd
		? `<script type="application/ld+json">${JSON.stringify(data.seo.jsonLd).replace(new RegExp(LT, 'g'), '\\u003c')}${LT}/script>`
		: '';

	const formatDecisionDate = (iso?: string) =>
		iso
			? new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium', timeStyle: 'short' }).format(
					new Date(iso)
				)
			: '';

	let isSaved = data.isSaved ?? false;
	let saveBusy = false;

	async function toggleWatchlist() {
		saveBusy = true;
		try {
			const method = isSaved ? 'DELETE' : 'POST';
			const res = await fetch('/api/watchlist', {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ad_id: data.ad.id })
			});
			if (res.ok) isSaved = !isSaved;
		} finally {
			saveBusy = false;
		}
	}

	async function share() {
		try {
			if (navigator.share) {
				await navigator.share({ title: data?.ad?.title ?? 'Ad', url: location.href });
			} else {
				await navigator.clipboard?.writeText(location.href);
			}
		} catch {
			/* noop */
		}
	}

	async function openPanel(kind: 'report' | 'moderation') {
		if (kind === 'report') {
			reportOpen = true;
			await tick();
			reportPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		} else {
			moderationOpen = true;
			await tick();
			moderationPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	async function copyReportId() {
		reportCopyError = '';
		reportCopied = false;
		if (!reportId) return;
		try {
			await navigator.clipboard?.writeText(reportId);
			reportCopied = true;
		} catch {
			reportCopyError = 'Unable to copy. Please copy the reference manually.';
		}
	}

	async function submitReport() {
		reportError = '';
		reportSuccess = false;
		reportId = '';
		reportCopied = false;
		reportCopyError = '';
		reportAttempted = true;

		if (!reportName.trim()) {
			reportError = 'Enter your name.';
			return;
		}
		if (!reportEmail.trim()) {
			reportError = 'Enter your email address.';
			return;
		}
		if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(reportEmail.trim())) {
			reportError = 'Enter a valid email address.';
			return;
		}
		if (reportDetails.trim().length < MIN_REPORT_DETAILS) {
			reportError = `Add at least ${MIN_REPORT_DETAILS} characters.`;
			return;
		}
		if (!reportGoodFaith) {
			reportError = 'Confirm this report is made in good faith.';
			return;
		}

		reportSending = true;
		try {
			const res = await fetch(`/api/ads/${data.ad.id}/report`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'same-origin',
				body: JSON.stringify({
					name: reportName.trim(),
					email: reportEmail.trim(),
					reasonCategory: reportReason,
					details: reportDetails.trim(),
					goodFaith: reportGoodFaith
				})
			});
			const body = (await res.json().catch(() => ({}))) as {
				success?: boolean;
				message?: string;
				reportId?: string;
			};
			if (!res.ok || body.success === false) {
				reportError = body.message || 'We could not send your report. Try again.';
			} else {
				reportSuccess = true;
				reportId = body.reportId || '';
				reportDetails = '';
				reportGoodFaith = false;
			}
		} catch {
			reportError = 'We could not send your report. Try again.';
		} finally {
			reportSending = false;
		}
	}

	async function submitAppeal() {
		appealError = '';
		appealSuccess = false;
		appealId = '';
		appealAttempted = true;

		if (appealDetails.trim().length < MIN_APPEAL_DETAILS) {
			appealError = `Add at least ${MIN_APPEAL_DETAILS} characters.`;
			return;
		}

		appealSending = true;
		try {
			const res = await fetch(`/api/ads/${data.ad.id}/appeal`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'same-origin',
				body: JSON.stringify({ details: appealDetails.trim() })
			});
			const body = (await res.json().catch(() => ({}))) as {
				success?: boolean;
				message?: string;
				appealId?: string;
			};
			if (!res.ok || body.success === false) {
				appealError = body.message || 'We could not send your appeal. Try again.';
			} else {
				appealSuccess = true;
				appealId = body.appealId || '';
				appealDetails = '';
			}
		} catch {
			appealError = 'We could not send your appeal. Try again.';
		} finally {
			appealSending = false;
		}
	}
</script>

<svelte:head>
	{#if data?.seo}
		<title>{data.seo.title}</title>
		<meta name="description" content={data.seo.description} />
		<link rel="canonical" href={data.seo.canonical} />
		{#if data.seo.robots}
			<meta name="robots" content={data.seo.robots} />
		{/if}
		<meta property="og:title" content={data.seo.og.title} />
		<meta property="og:description" content={data.seo.og.description} />
		<meta property="og:image" content={data.seo.og.image} />
		<meta property="og:url" content={data.seo.og.url} />
		<meta property="og:type" content={data.seo.og.type} />
		<meta property="og:site_name" content={data.seo.og.siteName} />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content={data.seo.og.title} />
		<meta name="twitter:description" content={data.seo.og.description} />
		<meta name="twitter:image" content={data.seo.og.image} />
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- XSS-safe: JSON.stringify + u003c escape -->
		{@html jsonLdHtml}
	{/if}
</svelte:head>

{#if data?.ad}
	{#if data.ad.status === 'pending'}
		<div class="pending" role="status" aria-live="polite">
			Pending review. Your ad will be visible once moderation completes.
		</div>
	{/if}
	{#if data.isExpired || data.ad.status === 'expired'}
		<div class="expired" role="status" aria-live="polite">
			This ad has expired. Browse similar listings below.
		</div>
	{/if}
	<AdCardWide {...data.ad} showActions={false} showExpires={data.isOwner ?? false} />

	<div class="ad-meta" aria-label="Ad details">
		{#if postedDate}
			<p class="posted-date">Posted {postedDate}</p>
		{/if}
		{#if salePriceLabel}
			<p class="sale-price">{salePriceLabel}</p>
		{/if}
	</div>

	<section class="action-rail" aria-label="Ad actions">
		<button type="button" class="btn primary" on:click={share}>
			<span class="btn-icon accent-green" aria-hidden="true">
				<ShareIcon size={16} strokeWidth={1.8} />
			</span>
			Share
		</button>
		{#if !data.isOwner && !data.isExpired}
			<button type="button" class="btn ghost" disabled={saveBusy} on:click={toggleWatchlist}>
				<span class="btn-icon accent-red" aria-hidden="true">
					<WatchlistIcon size={16} strokeWidth={1.8} fill={isSaved ? 'currentColor' : 'none'} />
				</span>
				{isSaved ? 'Saved' : 'Save'}
			</button>
			<button type="button" class="btn ghost" on:click={() => openPanel('report')}>
				<span class="btn-icon accent-orange" aria-hidden="true">
					<ReportIcon size={16} strokeWidth={1.8} />
				</span>
				Report
			</button>
		{/if}
		{#if data.moderation}
			<button type="button" class="btn ghost" on:click={() => openPanel('moderation')}>
				<span class="btn-icon" aria-hidden="true">
					<ModerationIcon size={16} strokeWidth={1.8} />
				</span>
				Moderation decision
			</button>
		{/if}
	</section>

	{#if data.isOwner && data.ad.status === 'active'}
		<section class="owner-sold-section">
			{#if soldOk}
				<p class="sold-ok" role="status">{soldOk}</p>
			{/if}
			{#if soldErr}
				<p class="sold-err" role="alert">{soldErr}</p>
			{/if}
			{#if soldFormOpen}
				<div class="sold-form">
					<label class="sold-label">
						Sale price (optional)
						<input
							type="number"
							bind:value={soldSalePrice}
							placeholder="e.g. 350"
							min="0"
							class="sold-input"
						/>
					</label>
					<div class="sold-actions">
						<button
							type="button"
							class="action-rail-btn"
							disabled={soldBusy}
							on:click={confirmSoldFromDetail}
						>
							Confirm sold
						</button>
						<button
							type="button"
							class="action-rail-btn ghost"
							on:click={() => {
								soldFormOpen = false;
								soldSalePrice = '';
								soldErr = '';
							}}
						>
							Cancel
						</button>
					</div>
				</div>
			{:else}
				<button type="button" class="action-rail-btn" on:click={() => (soldFormOpen = true)}>
					Mark as sold
				</button>
			{/if}
		</section>
	{/if}

	{#if data.isOwner}
		<section class="owner-note">
			{#if (data.ownerMessages?.count ?? 0) > 0}
				<p>
					You have {data.ownerMessages?.count}
					{data.ownerMessages?.count === 1 ? 'conversation' : 'conversations'} about this listing.
				</p>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a class="owner-link" href="/messages">Open messages</a>
			{:else}
				<p>No buyer messages yet.</p>
				<p class="owner-hint">If someone contacts you, you’ll see it in Messages.</p>
				<p class="owner-hint">Want more interest? Use the Share button above.</p>
			{/if}
		</section>
	{:else if !data.isExpired}
		<MessageComposer
			adId={data.ad.id}
			price={data.ad.price ?? null}
			currency={data.ad.currency ?? 'EUR'}
			firmPrice={data.offerRules?.firmPrice ?? false}
			on:flag={() => openPanel('report')}
		/>
	{/if}

	{#if !data.isOwner && !data.isExpired}
		<details class="safety-accordion">
			<summary class="safety-summary">Stay Safe</summary>
			<div class="safety-content">
				<ul>
					{#each QUICK_SAFETY_TIPS as tip (tip)}
						<li>{tip}</li>
					{/each}
				</ul>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a href="/safety" class="safety-link">Read our full safety guide</a>
			</div>
		</details>
	{/if}

	{#if data.isExpired && data.similarAds && data.similarAds.length > 0}
		<section class="similar-listings">
			<h2>Similar active listings</h2>
			<ul class="similar-grid">
				{#each data.similarAds as similarAd (similarAd.id)}
					<AdCardComponent {...similarAd} />
				{/each}
			</ul>
		</section>
	{/if}

	{#if reportOpen}
		<section class="panel report-panel" bind:this={reportPanel}>
			<div class="panel-head">
				<h2>Report</h2>
				<button type="button" class="panel-close" on:click={() => (reportOpen = false)}>
					Close
				</button>
			</div>
			<div class="report-card">
				<p class="report-intro">Report content that breaks our rules. We review quickly.</p>

				{#if reportSuccess}
					<p class="report-success" aria-live="polite">
						Thanks — report received{reportId ? ` (ref: ${reportId})` : ''}.
					</p>
					{#if reportId}
						<div class="report-actions">
							<button type="button" class="report-copy" on:click={copyReportId}>
								{reportCopied ? 'Copied' : 'Copy report ID'}
							</button>
							{#if reportCopyError}
								<p class="report-error" aria-live="assertive">{reportCopyError}</p>
							{/if}
						</div>
						<p class="report-followup">
							Track it on
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a href={`/report-status?reportId=${encodeURIComponent(reportId)}`}>report status</a>.
						</p>
					{/if}
					<p class="report-note">
						We review reports quickly. Some decisions may use automated tools.
					</p>
				{:else}
					<form class="report-form" on:submit|preventDefault={submitReport}>
						<label for="report-name">Your name</label>
						<input
							id="report-name"
							type="text"
							bind:value={reportName}
							autocomplete="name"
							required
							aria-invalid={reportAttempted ? !reportName.trim() : undefined}
						/>

						<label for="report-email">Your email</label>
						<input
							id="report-email"
							type="email"
							bind:value={reportEmail}
							autocomplete="email"
							required
							aria-invalid={reportAttempted
								? !reportEmail.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(reportEmail.trim())
								: undefined}
						/>

						<label for="report-reason">Reason</label>
						<select
							id="report-reason"
							bind:value={reportReason}
							required
							aria-invalid={reportAttempted ? !reportReason : undefined}
						>
							{#each reportReasons as reason (reason.value)}
								<option value={reason.value}>{reason.label}</option>
							{/each}
						</select>

						<label for="report-details">
							Details
							<span class="field-meta">
								<span class="hint">Tell us what is wrong and why.</span>
								<span class="char-count">
									{reportDetailsCount}/{MIN_REPORT_DETAILS} min
								</span>
							</span>
						</label>
						<textarea
							id="report-details"
							rows="5"
							bind:value={reportDetails}
							minlength={MIN_REPORT_DETAILS}
							required
							placeholder="Describe the issue and where it appears."
							aria-invalid={reportAttempted
								? reportDetails.trim().length < MIN_REPORT_DETAILS
								: undefined}
						></textarea>

						<label class="checkbox">
							<input
								type="checkbox"
								bind:checked={reportGoodFaith}
								required
								aria-invalid={reportAttempted ? !reportGoodFaith : undefined}
							/>
							<span>I confirm this report is made in good faith.</span>
						</label>

						{#if reportError}
							<p class="report-error" aria-live="assertive">{reportError}</p>
						{/if}

						<button type="submit" class="report-submit" disabled={reportSending}>
							{reportSending ? 'Sending...' : 'Submit report'}
						</button>
					</form>
				{/if}
			</div>
		</section>
	{/if}

	{#if data.moderation}
		<details class="panel" bind:this={moderationPanel} bind:open={moderationOpen}>
			<summary>Moderation decision</summary>
			<div class="moderation-card">
				<p class="moderation-meta">Only visible to the ad owner when signed in.</p>
				<p class="moderation-meta">Decision source: {decisionSource}</p>
				<p class="moderation-meta">
					{data.moderation.action_type.replace('_', ' ')} on
					{formatDecisionDate(data.moderation.created_at)}
				</p>
				<p><strong>Reason category:</strong> {data.moderation.reason_category}</p>
				<p><strong>Facts and circumstances:</strong></p>
				<p class="moderation-details">{data.moderation.reason_details}</p>
				{#if data.moderation.legal_basis}
					<p class="moderation-legal">
						<strong>Legal or policy basis:</strong>
						{data.moderation.legal_basis}
					</p>
				{/if}
				<p class="moderation-meta">
					Decision type: {data.moderation.automated ? 'Automated' : 'Manual'}
				</p>

				<details class="appeal">
					<summary>Challenge this decision</summary>
					<div class="appeal-body">
						<p class="appeal-intro">
							If you think this decision is wrong, submit an appeal. We will review it as soon as we
							can.
						</p>
						{#if appealSuccess}
							<p class="appeal-success" aria-live="polite">
								Appeal received{appealId ? ` (ref: ${appealId})` : ''}.
							</p>
						{:else}
							<form class="appeal-form" on:submit|preventDefault={submitAppeal}>
								<label for="appeal-details">
									Your explanation
									<span class="field-meta">
										<span class="hint">Explain why you think this should be changed.</span>
										<span class="char-count">
											{appealDetailsCount}/{MIN_APPEAL_DETAILS} min
										</span>
									</span>
								</label>
								<textarea
									id="appeal-details"
									rows="4"
									bind:value={appealDetails}
									minlength={MIN_APPEAL_DETAILS}
									required
									placeholder="Share any facts or context we should reconsider."
									aria-invalid={appealAttempted
										? appealDetails.trim().length < MIN_APPEAL_DETAILS
										: undefined}
								></textarea>

								{#if appealError}
									<p class="appeal-error" aria-live="assertive">{appealError}</p>
								{/if}

								<button type="submit" class="appeal-submit" disabled={appealSending}>
									{appealSending ? 'Sending...' : 'Submit appeal'}
								</button>
							</form>
						{/if}
					</div>
				</details>
			</div>
		</details>
	{/if}
{:else}
	<p>Ad not found.</p>
{/if}

<style>
	.ad-meta {
		max-width: 960px;
		margin: 4px auto 0;
		padding: 0 var(--page-pad);
		text-align: center;
	}
	.posted-date {
		margin: 0;
		font-size: 0.85rem;
		color: color-mix(in srgb, var(--fg) 55%, transparent);
	}
	.sale-price {
		margin: 6px 0 0;
		font-size: 1.1rem;
		font-weight: 900;
	}
	.pending {
		max-width: 960px;
		margin: 16px auto 8px;
		padding: 10px 12px;
		border: 1px solid color-mix(in srgb, var(--fg) 20%, transparent);
		background: color-mix(in srgb, var(--bg) 92%, transparent);
		border-radius: 8px;
		text-align: center;
		font-weight: 600;
	}
	.expired {
		max-width: 960px;
		margin: 16px auto 8px;
		padding: 10px 12px;
		border: 1px solid color-mix(in srgb, var(--fg) 20%, transparent);
		background: color-mix(in srgb, var(--danger) 18%, var(--bg));
		border-radius: 8px;
		text-align: center;
		font-weight: 600;
	}

	.action-rail {
		max-width: 960px;
		margin: 12px auto 16px;
		padding: 0 var(--page-pad);
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		justify-content: center;
	}
	.action-rail .btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 10px 14px;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--fg) 18%, transparent);
		background: var(--surface);
		cursor: pointer;
		font-weight: 700;
	}
	.action-rail .btn-icon {
		display: inline-flex;
		align-items: center;
	}
	.action-rail .btn-icon.accent-green {
		color: var(--accent-green);
	}
	.action-rail .btn-icon.accent-orange {
		color: var(--accent-orange);
	}
	.action-rail .btn-icon.accent-red {
		color: #e74c3c;
	}
	.action-rail .btn.primary {
		background: var(--fg);
		color: var(--bg);
		border-color: var(--fg);
	}
	.action-rail .btn.ghost {
		background: transparent;
	}
	.owner-sold-section {
		max-width: 720px;
		margin: 0 auto 12px;
		padding: 12px 14px;
		border: 1px solid var(--hairline);
		border-radius: 12px;
		background: var(--surface);
		text-align: center;
	}
	.sold-form {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
	}
	.sold-label {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-weight: 600;
		font-size: 0.85rem;
		color: color-mix(in srgb, var(--fg) 75%, transparent);
	}
	.sold-input {
		padding: 8px 10px;
		border: 1px solid var(--hairline);
		border-radius: 8px;
		background: var(--bg);
		color: var(--fg);
		font-size: 0.9rem;
		width: 120px;
	}
	.sold-actions {
		display: flex;
		gap: 8px;
	}
	.sold-ok {
		margin: 0 0 8px;
		padding: 8px 10px;
		border-radius: 8px;
		background: var(--mint-bg);
		color: var(--accent-green);
		border: 1px solid color-mix(in srgb, var(--accent-green) 35%, transparent);
		font-weight: 700;
	}
	.sold-err {
		margin: 0 0 8px;
		padding: 8px 10px;
		border-radius: 8px;
		background: var(--tangerine-bg);
		color: var(--accent-orange);
		border: 1px solid color-mix(in srgb, var(--accent-orange) 35%, transparent);
		font-weight: 700;
	}
	.action-rail-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 10px 14px;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--fg) 18%, transparent);
		background: var(--fg);
		color: var(--bg);
		cursor: pointer;
		font-weight: 700;
	}
	.action-rail-btn.ghost {
		background: transparent;
		color: inherit;
	}
	.action-rail-btn[disabled] {
		opacity: 0.6;
		cursor: default;
	}
	.owner-note {
		max-width: 720px;
		margin: 12px auto;
		padding: 12px 14px;
		border: 1px solid var(--hairline);
		border-radius: 12px;
		background: var(--surface);
		text-align: center;
		font-weight: 600;
	}
	.owner-hint {
		margin: 6px 0 0;
		color: color-mix(in srgb, var(--fg) 70%, transparent);
		font-weight: 500;
	}
	.owner-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin-top: 8px;
		padding: 8px 12px;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--fg) 18%, transparent);
		background: var(--surface);
		font-weight: 700;
		text-decoration: none;
		color: inherit;
	}

	.panel {
		max-width: 960px;
		margin: 12px auto;
		padding: 0 var(--page-pad);
	}
	.panel summary {
		list-style: none;
		cursor: pointer;
		font-weight: 700;
		padding: 10px 12px;
		border-radius: 10px;
		border: 1px solid var(--hairline);
		background: var(--surface);
	}
	.panel summary::-webkit-details-marker {
		display: none;
	}
	.panel[open] summary {
		border-color: var(--fg);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--fg) 12%, transparent);
	}
	.panel-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 12px;
		border-radius: 10px;
		border: 1px solid var(--hairline);
		background: var(--surface);
	}
	.panel-head h2 {
		margin: 0;
		font-size: 1rem;
	}
	.panel-close {
		border: 0;
		background: transparent;
		color: color-mix(in srgb, var(--fg) 70%, transparent);
		font-weight: 700;
		cursor: pointer;
	}
	.moderation-card {
		margin-top: 12px;
		padding: 14px 16px;
		border: 1px solid var(--hairline);
		border-radius: 12px;
		background: color-mix(in srgb, var(--fg) 4%, var(--bg));
	}
	.moderation-meta {
		margin: 0 0 8px;
		color: color-mix(in srgb, var(--fg) 70%, transparent);
	}
	.moderation-details {
		margin: 0 0 8px;
		white-space: pre-wrap;
	}
	.moderation-legal {
		margin: 0 0 8px;
	}
	.appeal {
		margin-top: 12px;
		border-top: 1px solid var(--hairline);
		padding-top: 10px;
	}
	.appeal summary {
		cursor: pointer;
		font-weight: 600;
	}
	.appeal-body {
		margin-top: 10px;
	}
	.appeal-intro {
		margin: 0 0 10px;
		color: color-mix(in srgb, var(--fg) 70%, transparent);
	}
	.appeal-form {
		display: grid;
		gap: 10px;
	}
	.appeal-form textarea {
		width: 100%;
		padding: 10px 12px;
		border-radius: 10px;
		border: 1px solid var(--hairline);
		background: var(--bg);
		color: var(--fg);
		resize: vertical;
	}
	.appeal-error {
		margin: 0;
		color: var(--accent-orange);
		background: var(--tangerine-bg);
		border: 1px solid color-mix(in srgb, var(--accent-orange) 35%, transparent);
		border-radius: 10px;
		padding: 8px 10px;
	}
	.appeal-success {
		margin: 0;
		color: var(--accent-green);
		background: var(--mint-bg);
		border: 1px solid color-mix(in srgb, var(--accent-green) 35%, transparent);
		border-radius: 10px;
		padding: 8px 10px;
		font-weight: 700;
	}
	.appeal-submit {
		height: 44px;
		border: 0;
		border-radius: 10px;
		background: var(--fg);
		color: var(--bg);
		font-weight: 700;
		cursor: pointer;
	}
	.appeal-submit[disabled] {
		opacity: 0.6;
		cursor: default;
	}
	.report-card {
		margin-top: 12px;
		padding: 14px;
		border: 1px solid var(--hairline);
		border-radius: 12px;
		background: var(--surface);
	}
	.report-intro {
		margin: 0 0 12px;
		color: color-mix(in srgb, var(--fg) 70%, transparent);
	}
	.report-form {
		display: grid;
		gap: 10px;
	}
	.report-form label {
		font-weight: 600;
	}
	.field-meta {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		margin-top: 4px;
		font-weight: 500;
		font-size: 0.85rem;
		color: color-mix(in srgb, var(--fg) 65%, transparent);
	}
	.hint {
		flex: 1;
	}
	.char-count {
		white-space: nowrap;
	}
	.report-form input,
	.report-form select,
	.report-form textarea {
		width: 100%;
		padding: 10px 12px;
		border-radius: 10px;
		border: 1px solid var(--hairline);
		background: var(--bg);
		color: var(--fg);
	}
	.report-form textarea {
		resize: vertical;
	}
	.report-form .checkbox {
		display: grid;
		grid-template-columns: 18px 1fr;
		gap: 6px;
		align-items: center;
	}
	.report-form .checkbox input {
		margin: 0;
		width: 16px;
		height: 16px;
	}
	.report-error {
		margin: 0;
		color: var(--accent-orange);
		background: var(--tangerine-bg);
		border: 1px solid color-mix(in srgb, var(--accent-orange) 35%, transparent);
		border-radius: 10px;
		padding: 8px 10px;
	}
	.report-success {
		margin: 0;
		color: var(--accent-green);
		background: var(--mint-bg);
		border: 1px solid color-mix(in srgb, var(--accent-green) 35%, transparent);
		border-radius: 10px;
		padding: 8px 10px;
		font-weight: 700;
	}
	.report-followup {
		margin: 8px 0 0;
	}
	.report-actions {
		margin-top: 8px;
		display: flex;
		gap: 8px;
		align-items: center;
		flex-wrap: wrap;
	}
	.report-copy {
		padding: 6px 10px;
		border-radius: 10px;
		border: 1px solid var(--hairline);
		background: var(--surface);
		color: inherit;
		cursor: pointer;
		font-weight: 600;
	}
	.report-note {
		margin: 8px 0 0;
		color: color-mix(in srgb, var(--fg) 70%, transparent);
	}
	.report-submit {
		height: 44px;
		border: 0;
		border-radius: 10px;
		background: var(--fg);
		color: var(--bg);
		font-weight: 700;
		cursor: pointer;
	}
	.report-submit[disabled] {
		opacity: 0.6;
		cursor: default;
	}
	.similar-listings {
		max-width: 960px;
		margin: 24px auto 16px;
		padding: 0 var(--page-pad);
	}
	.similar-listings h2 {
		margin: 0 0 12px;
		font-size: 1.1rem;
	}
	.similar-grid {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 14px;
	}
	.safety-accordion {
		max-width: 720px;
		margin: 1.5rem auto 0;
		border: 1px solid var(--hairline);
		border-radius: 12px;
		background: var(--surface);
	}
	.safety-summary {
		padding: 12px 16px;
		cursor: pointer;
		font-weight: 700;
		font-size: 0.9rem;
		color: color-mix(in srgb, var(--fg) 70%, transparent);
		list-style: none;
	}
	.safety-summary::-webkit-details-marker {
		display: none;
	}
	.safety-summary::marker {
		display: none;
	}
	.safety-content {
		padding: 0 16px 16px;
	}
	.safety-content ul {
		margin: 0;
		padding-left: 1.25rem;
		display: grid;
		gap: 6px;
	}
	.safety-content li {
		color: color-mix(in srgb, var(--fg) 75%, transparent);
		font-size: 0.92rem;
		line-height: 1.4;
	}
	.safety-link {
		display: inline-block;
		margin-top: 10px;
		font-size: 0.85rem;
	}
</style>
