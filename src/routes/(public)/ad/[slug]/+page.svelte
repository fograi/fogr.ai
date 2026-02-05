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

	const formatDecisionDate = (iso?: string) =>
		iso
			? new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium', timeStyle: 'short' }).format(
					new Date(iso)
				)
			: '';

	async function submitReport() {
		reportError = '';
		reportSuccess = false;
		reportId = '';

		if (!reportName.trim()) {
			reportError = 'Name is required.';
			return;
		}
		if (!reportEmail.trim()) {
			reportError = 'Email is required.';
			return;
		}
		if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(reportEmail.trim())) {
			reportError = 'Email looks invalid.';
			return;
		}
		if (reportDetails.trim().length < MIN_REPORT_DETAILS) {
			reportError = `Please provide at least ${MIN_REPORT_DETAILS} characters.`;
			return;
		}
		if (!reportGoodFaith) {
			reportError = 'You must confirm good faith.';
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
				reportError = body.message || 'Failed to submit report.';
			} else {
				reportSuccess = true;
				reportId = body.reportId || '';
				reportDetails = '';
				reportGoodFaith = false;
			}
		} catch {
			reportError = 'Failed to submit report.';
		} finally {
			reportSending = false;
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
		<AdCardWide {...data.ad} />
		{#if data.moderation}
			<section class="moderation">
				<h2>Moderation decision</h2>
				<p class="moderation-meta">
					{data.moderation.action_type.replace('_', ' ')} on
					{formatDecisionDate(data.moderation.created_at)}
				</p>
				<p><strong>Reason category:</strong> {data.moderation.reason_category}</p>
				<p class="moderation-details">{data.moderation.reason_details}</p>
				{#if data.moderation.legal_basis}
					<p class="moderation-legal">
						<strong>Legal or policy basis:</strong> {data.moderation.legal_basis}
					</p>
				{/if}
				<p class="moderation-meta">
					Decision type: {data.moderation.automated ? 'Automated' : 'Manual'}
				</p>
			</section>
		{/if}
		<section class="report">
			<button
				type="button"
				class="report-toggle"
				aria-expanded={reportOpen}
				on:click={() => (reportOpen = !reportOpen)}
			>
				Report this ad
			</button>

			{#if reportOpen}
				<div class="report-card">
					<p class="report-intro">
						Use this form to report illegal or inappropriate content. We review reports promptly.
					</p>

					{#if reportSuccess}
						<p class="report-success" aria-live="polite">
							Thanks - your report has been received{reportId ? ` (ref: ${reportId})` : ''}.
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

							<label for="report-details">Details</label>
							<textarea
								id="report-details"
								rows="5"
								bind:value={reportDetails}
								minlength={MIN_REPORT_DETAILS}
								placeholder="Explain why this listing is illegal or inappropriate."
							></textarea>

							<label class="checkbox">
								<input type="checkbox" bind:checked={reportGoodFaith} />
								<span>
									I confirm this report is made in good faith and the information is accurate.
								</span>
							</label>

							{#if reportError}<p class="report-error" aria-live="assertive">{reportError}</p>{/if}

							<button type="submit" class="report-submit" disabled={reportSending}>
								{reportSending ? 'Sending...' : 'Submit report'}
							</button>
						</form>
					{/if}
				</div>
			{/if}
		</section>
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

	.report {
		max-width: 960px;
		margin: 12px auto 32px;
		padding: 0 16px;
	}
	.moderation {
		max-width: 960px;
		margin: 12px auto 16px;
		padding: 14px 16px;
		border: 1px solid var(--hairline);
		border-radius: 12px;
		background: color-mix(in srgb, var(--fg) 4%, var(--bg));
	}
	.moderation h2 {
		margin: 0 0 8px;
		font-size: 1.1rem;
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
	.report-toggle {
		width: 100%;
		text-align: center;
		padding: 10px 12px;
		border-radius: 10px;
		border: 1px solid var(--hairline);
		background: color-mix(in srgb, var(--fg) 6%, var(--bg));
		font-weight: 700;
		cursor: pointer;
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
