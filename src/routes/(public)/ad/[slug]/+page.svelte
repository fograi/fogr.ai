<script lang="ts">
	import AdCardWide from '$lib/components/AdCardWide.svelte';
	import type { AdCard, ModerationAction } from '../../../../types/ad-types';
	export let data: { ad: AdCard; moderation?: ModerationAction | null };

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
	let reportPanel: HTMLDetailsElement | null = null;
	let moderationPanel: HTMLDetailsElement | null = null;

	let appealOpen = false;
	let appealDetails = '';
	let appealSending = false;
	let appealSuccess = false;
	let appealError = '';
	let appealId = '';
	let moderationOpen = false;

	$: reportDetailsCount = reportDetails.length;
	$: appealDetailsCount = appealDetails.length;
	$: decisionSource =
		data.moderation ? (data.moderation.report_id ? 'User report' : 'Own-initiative review') : '';

	const formatDecisionDate = (iso?: string) =>
		iso
			? new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium', timeStyle: 'short' }).format(
					new Date(iso)
				)
			: '';

	async function share() {
		try {
			if (navigator.share) {
				await navigator.share({ title: data?.ad?.title ?? 'Listing', url: location.href });
			} else {
				await navigator.clipboard?.writeText(location.href);
			}
		} catch {
			/* noop */
		}
	}

	function openPanel(kind: 'report' | 'moderation') {
		if (kind === 'report') {
			reportOpen = true;
			reportPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		} else {
			moderationOpen = true;
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

	{#if data?.ad}
		{#if data.ad.status === 'pending'}
			<div class="pending" role="status" aria-live="polite">
				Pending review. Your ad will be visible once moderation completes.
			</div>
		{/if}
		{#if data.ad.status === 'expired'}
			<div class="expired" role="status" aria-live="polite">
				This ad has expired.
			</div>
		{/if}
		<AdCardWide {...data.ad} showActions={false} />

		<section class="action-rail" aria-label="Listing actions">
			<button type="button" class="btn primary" on:click={share}>Share listing</button>
			<button type="button" class="btn" on:click={() => openPanel('report')}>
				Report this ad
			</button>
			{#if data.moderation}
				<button type="button" class="btn ghost" on:click={() => openPanel('moderation')}>
					Moderation decision
				</button>
			{/if}
		</section>

		<details class="panel" bind:this={reportPanel} bind:open={reportOpen}>
			<summary>Report details</summary>
			<div class="report-card">
				<p class="report-intro">
					Report content that is illegal or against our rules. We review reports quickly.
				</p>

				{#if reportSuccess}
					<p class="report-success" aria-live="polite">
						Thanks - we received your report{reportId ? ` (ref: ${reportId})` : ''}.
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
						<a href={`/report-status?reportId=${encodeURIComponent(reportId)}`}>report status</a>.
					</p>
					{/if}
					<p class="report-note">
						We review reports quickly. Some decisions may use automated tools.
					</p>
				{:else}
					<form class="report-form" on:submit|preventDefault={submitReport}>
						<label for="report-name">Your name</label>
						<input id="report-name" type="text" bind:value={reportName} autocomplete="name" />

						<label for="report-email">Your email</label>
						<input
							id="report-email"
							type="email"
							bind:value={reportEmail}
							autocomplete="email"
						/>

						<label for="report-reason">Reason</label>
						<select id="report-reason" bind:value={reportReason}>
							{#each reportReasons as reason}
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
							placeholder="Describe the issue and where it appears."
						></textarea>

						<label class="checkbox">
							<input type="checkbox" bind:checked={reportGoodFaith} />
							<span>I confirm this report is made in good faith.</span>
						</label>

						{#if reportError}<p class="report-error" aria-live="assertive">{reportError}</p>{/if}

						<button type="submit" class="report-submit" disabled={reportSending}>
							{reportSending ? 'Sending...' : 'Submit report'}
						</button>
					</form>
				{/if}
			</div>
		</details>

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
							<strong>Legal or policy basis:</strong> {data.moderation.legal_basis}
						</p>
					{/if}
					<p class="moderation-meta">
						Decision type: {data.moderation.automated ? 'Automated' : 'Manual'}
					</p>

					<details class="appeal">
						<summary>Challenge this decision</summary>
						<div class="appeal-body">
						<p class="appeal-intro">
							If you think this decision is wrong, submit an appeal. We will review it as soon as
							we can.
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
										placeholder="Share any facts or context we should reconsider."
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
		padding: 0 16px;
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		justify-content: center;
	}
	.action-rail .btn {
		display: inline-grid;
		place-items: center;
		gap: 6px;
		padding: 10px 14px;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--fg) 18%, transparent);
		background: var(--surface);
		cursor: pointer;
		font-weight: 700;
	}
	.action-rail .btn.primary {
		background: var(--fg);
		color: var(--bg);
		border-color: var(--fg);
	}
	.action-rail .btn.ghost {
		background: transparent;
	}

	.panel {
		max-width: 960px;
		margin: 12px auto;
		padding: 0 16px;
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
		color: var(--danger);
	}
	.appeal-success {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 80%, transparent);
		font-weight: 600;
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
		display: inline-flex;
		gap: 8px;
		align-items: flex-start;
	}
	.report-form .checkbox input {
		margin-top: 3px;
	}
	.report-error {
		margin: 0;
		color: var(--danger);
	}
	.report-success {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 80%, transparent);
		font-weight: 600;
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
</style>
