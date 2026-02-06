<script lang="ts">
	import type { ActionData } from './$types';

	type ReportRow = {
		id: string;
		ad_id: string;
		reporter_name: string;
		reporter_email: string;
		reason_category: string;
		reason_details: string;
		status: string;
		created_at: string;
		location_url: string;
	};

	type ReportGroup = {
		adId: string;
		reports: ReportRow[];
		latest: ReportRow;
		reportCount: number;
	};

	export let data: { reportGroups: ReportGroup[]; reportCount: number };
	export let form: ActionData | null | undefined;

	type EmailTemplate = { subject: string; body: string };
	type EmailPreview = {
		reportId: string | null;
		adId: string;
		actionType: string;
		statement: EmailTemplate;
		takedown?: EmailTemplate | null;
	};

	let copyStatus = '';
	let copyError = '';
	let lastPreviewKey = '';

	const extractPreview = (value: ActionData | null | undefined): EmailPreview | null => {
		if (!value || typeof value !== 'object') return null;
		if ('emailPreview' in value && value.emailPreview) {
			return value.emailPreview as EmailPreview;
		}
		return null;
	};

	$: activePreview = extractPreview(form);
	$: {
		const key = activePreview ? `${activePreview.reportId ?? ''}:${activePreview.adId}` : '';
		if (key !== lastPreviewKey) {
			copyStatus = '';
			copyError = '';
			lastPreviewKey = key;
		}
	}

	const previewForReport = (report: ReportRow): EmailPreview | null => {
		if (!activePreview) return null;
		if (activePreview.reportId && activePreview.reportId === report.id) return activePreview;
		if (!activePreview.reportId && activePreview.adId === report.ad_id) return activePreview;
		return null;
	};

	async function copyText(text: string, label: string) {
		copyStatus = '';
		copyError = '';
		try {
			await navigator.clipboard?.writeText(text);
			copyStatus = label;
		} catch {
			copyError = 'Could not copy. Please copy manually.';
		}
	}

	const statusOptions = [
		{ value: 'open', label: 'Open' },
		{ value: 'in_review', label: 'In review' },
		{ value: 'actioned', label: 'Actioned' },
		{ value: 'dismissed', label: 'Dismissed' }
	];
	const statusOrder = ['open', 'in_review', 'actioned', 'dismissed'] as const;
	const statusLabel: Record<string, string> = {
		open: 'Open',
		in_review: 'In review',
		actioned: 'Actioned',
		dismissed: 'Dismissed'
	};
	const statusHelp: Record<string, string> = {
		open: 'New report awaiting review.',
		in_review: 'Under review by moderators.',
		actioned: 'Decision made and applied to the ad.',
		dismissed: 'No action taken; report closed.'
	};
	const actionOptions = [
		{ value: 'reject', label: 'Reject (remove from listings)' },
		{ value: 'expire', label: 'Expire (hide as expired)' },
		{ value: 'restore', label: 'Restore (make active)' }
	];
	const reasonOptions = [
		{ value: 'illegal', label: 'Illegal content' },
		{ value: 'prohibited', label: 'Prohibited item' },
		{ value: 'scam', label: 'Scam or fraud' },
		{ value: 'spam', label: 'Spam or misleading' },
		{ value: 'other', label: 'Other' }
	];
	const minReasonLength = 20;

	const formatDate = (iso: string) =>
		new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium', timeStyle: 'short' }).format(
			new Date(iso)
		);

	const groupReportsByStatus = (reports: ReportRow[]) => {
		const map = new Map<string, ReportRow[]>();
		for (const status of statusOrder) map.set(status, []);
		for (const report of reports) {
			const key = map.has(report.status) ? report.status : 'open';
			map.get(key)?.push(report);
		}
		return map;
	};
</script>

<section class="admin">
	<header class="admin-header">
		<div>
			<h1>Ad Reports</h1>
			<p class="sub">
				{data.reportCount} reports across {data.reportGroups.length} ads
			</p>
		</div>
		<a class="link" href="/admin/appeals">View appeals</a>
	</header>

	{#if data.reportGroups.length === 0}
		<p class="empty">No reports yet.</p>
	{:else}
		<div class="report-list">
			{#each data.reportGroups as group}
				<article class="report-group">
					{@const reportsByStatus = groupReportsByStatus(group.reports)}
					<header class="group-header">
						<div>
							<h2>Ad {group.adId}</h2>
							<p class="meta">
								<span>{group.reportCount} reports</span>
								<span>Latest: {formatDate(group.latest.created_at)}</span>
								<span>Latest status: {group.latest.status.replace('_', ' ')}</span>
							</p>
						</div>
						<a class="link" href={group.latest.location_url} target="_blank" rel="noopener">
							View ad
						</a>
					</header>

					<div class="status-flow" aria-label="Report workflow states">
						{#each statusOrder as status}
							{@const count = reportsByStatus.get(status)?.length ?? 0}
							<div class="status-step">
								<span class="status-name">{statusLabel[status]}</span>
								<span class="status-count">{count}</span>
							</div>
						{/each}
					</div>

					<div class="group-body">
						{#each statusOrder as status}
							{@const bucket = reportsByStatus.get(status) ?? []}
							<div class="status-section">
								<div class="status-header">
									<div>
										<h3>{statusLabel[status]}</h3>
										<p class="meta">{statusHelp[status]}</p>
									</div>
									<span class="status-count">{bucket.length}</span>
								</div>

								{#if bucket.length === 0}
									<p class="empty">No reports in this state.</p>
								{:else}
									<div class="status-list">
										{#each bucket as report}
											{@const preview = previewForReport(report)}
											<article class="report-card">
												<header class="card-header">
													<div>
														<h4>Report #{report.id.slice(0, 8)}</h4>
														<p class="meta">
															<span>{formatDate(report.created_at)}</span>
														</p>
													</div>
													<span class="status badge {report.status}">
														{report.status.replace('_', ' ')}
													</span>
												</header>

												<p class="reason">
													<strong>Reason:</strong> {report.reason_category}
												</p>
												<p class="details">{report.reason_details}</p>

												<p class="reporter">
													<strong>Reporter:</strong> {report.reporter_name} ({report.reporter_email})
												</p>

												<div class="actions">
													<form method="post" action="?/updateStatus">
														<input type="hidden" name="report_id" value={report.id} />
														<select name="status" aria-label="Update report status">
															{#each statusOptions as option}
																<option value={option.value} selected={option.value === report.status}>
																	{option.label}
																</option>
															{/each}
														</select>
														<button type="submit">Update</button>
													</form>
												</div>

												<details class="action-panel">
													<summary>Take action on ad</summary>
													<form method="post" action="?/takeAction" class="action-form">
														<input type="hidden" name="report_id" value={report.id} />
														<input type="hidden" name="ad_id" value={report.ad_id} />

														<label>
															Action
															<select name="action_type" required>
																{#each actionOptions as option}
																	<option value={option.value}>{option.label}</option>
																{/each}
															</select>
														</label>

														<label>
															Reason category
															<select name="reason_category" required>
																{#each reasonOptions as option}
																	<option value={option.value} selected={option.value === report.reason_category}>
																		{option.label}
																	</option>
																{/each}
															</select>
														</label>

														<label>
															Statement of reasons
															<textarea
																name="reason_details"
																rows="4"
																minlength={minReasonLength}
																required
																placeholder="Explain the facts and reasoning behind the decision."
															></textarea>
														</label>

														<label>
															Legal or policy basis (optional)
															<input
																type="text"
																name="legal_basis"
																placeholder="e.g. Terms section 4.2, Prohibited items policy"
															/>
														</label>

														<p class="action-hint">
															Do not include personal data in the statement of reasons. This may be submitted to
															a transparency database.
														</p>
														<label class="checkbox">
															<input type="checkbox" name="no_personal_data" required />
															<span>I confirm this statement contains no personal data.</span>
														</label>

														<button type="submit">Apply action</button>
													</form>
												</details>

												{#if preview}
													<div class="email-preview">
														<h4>Email templates</h4>
														<p class="meta">Generated from the last action on this report.</p>
														{#if copyStatus}
															<p class="copy-status" aria-live="polite">{copyStatus}</p>
														{/if}
														{#if copyError}
															<p class="error" aria-live="assertive">{copyError}</p>
														{/if}

														<div class="email-block">
															<h5>Statement of reasons</h5>
															<div class="email-field">
																<span class="email-label">Subject</span>
																<div class="email-row">
																	<input type="text" value={preview.statement.subject} readonly />
																	<button
																		type="button"
																		on:click={() =>
																			copyText(preview.statement.subject, 'Statement subject copied.')
																		}
																	>
																		Copy subject
																	</button>
																</div>
															</div>
															<div class="email-field">
																<span class="email-label">Body</span>
																<div class="email-row">
																	<textarea rows="8" readonly>{preview.statement.body}</textarea>
																	<button
																		type="button"
																		on:click={() =>
																			copyText(preview.statement.body, 'Statement body copied.')
																		}
																	>
																		Copy body
																	</button>
																</div>
															</div>
														</div>

														{#if preview.takedown}
															<div class="email-block">
																<h5>Takedown notice</h5>
																<div class="email-field">
																	<span class="email-label">Subject</span>
																	<div class="email-row">
																		<input type="text" value={preview.takedown.subject} readonly />
																		<button
																			type="button"
																			on:click={() =>
																				copyText(
																					preview.takedown.subject,
																					'Takedown subject copied.'
																				)
																			}
																		>
																			Copy subject
																		</button>
																	</div>
																</div>
																<div class="email-field">
																	<span class="email-label">Body</span>
																	<div class="email-row">
																		<textarea rows="7" readonly>{preview.takedown.body}</textarea>
																		<button
																			type="button"
																			on:click={() =>
																				copyText(preview.takedown.body, 'Takedown body copied.')
																			}
																		>
																			Copy body
																		</button>
																	</div>
																</div>
															</div>
														{/if}
													</div>
												{/if}
											</article>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</article>
			{/each}
		</div>
	{/if}
</section>

<style>
	.admin {
		max-width: 1100px;
		margin: 24px auto 48px;
		padding: 0 var(--page-pad);
		width: 100%;
	}
	.admin-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 12px;
	}
	.sub {
		color: color-mix(in srgb, var(--fg) 65%, transparent);
	}
	.empty {
		margin-top: 16px;
		color: color-mix(in srgb, var(--fg) 70%, transparent);
	}
	.report-list {
		display: grid;
		gap: 16px;
		margin-top: 16px;
	}
	.report-group {
		border: 1px solid var(--hairline);
		border-radius: 16px;
		padding: 16px;
		background: var(--surface);
		display: grid;
		gap: 12px;
	}
	.group-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 12px;
		flex-wrap: wrap;
	}
	.group-header h2 {
		margin: 0;
		font-size: 1.1rem;
	}
	.group-body {
		display: grid;
		gap: 12px;
	}
	.status-flow {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 10px;
		padding: 12px;
		border-radius: 12px;
		border: 1px solid var(--hairline);
		background: color-mix(in srgb, var(--fg) 3%, var(--bg));
	}
	.status-step {
		display: grid;
		gap: 4px;
		padding: 8px 10px;
		border-radius: 10px;
		border: 1px solid var(--hairline);
		background: var(--bg);
	}
	.status-name {
		font-weight: 700;
		font-size: 0.95rem;
	}
	.status-count {
		font-weight: 700;
		font-size: 1.05rem;
		color: color-mix(in srgb, var(--fg) 75%, transparent);
	}
	.status-section {
		display: grid;
		gap: 8px;
		padding: 12px;
		border-radius: 12px;
		border: 1px solid var(--hairline);
		background: color-mix(in srgb, var(--fg) 2%, var(--bg));
	}
	.status-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 12px;
	}
	.status-header h3 {
		margin: 0;
		font-size: 1rem;
	}
	.status-list {
		display: grid;
		gap: 10px;
	}
	.report-card {
		border: 1px solid var(--hairline);
		border-radius: 14px;
		padding: 14px 16px;
		background: color-mix(in srgb, var(--fg) 3%, var(--bg));
		display: grid;
		gap: 10px;
		min-width: 0;
	}
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 12px;
		min-width: 0;
	}
	.card-header h4 {
		margin: 0;
		font-size: 1.05rem;
	}
	.meta {
		margin: 4px 0 0;
		color: color-mix(in srgb, var(--fg) 65%, transparent);
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
		min-width: 0;
	}
	.meta span {
		overflow-wrap: anywhere;
		word-break: break-word;
	}
	.badge {
		padding: 4px 10px;
		border-radius: 999px;
		border: 1px solid var(--hairline);
		font-size: 0.8rem;
		text-transform: capitalize;
		background: color-mix(in srgb, var(--fg) 8%, var(--bg));
	}
	.badge.open {
		background: color-mix(in srgb, var(--fg) 10%, var(--bg));
	}
	.badge.in_review {
		background: color-mix(in srgb, var(--link) 18%, var(--bg));
	}
	.badge.actioned {
		background: color-mix(in srgb, var(--success) 20%, var(--bg));
	}
	.badge.dismissed {
		background: color-mix(in srgb, var(--fg) 6%, var(--bg));
	}
	.reason {
		margin: 0;
	}
	.details {
		margin: 0;
		white-space: pre-wrap;
		color: color-mix(in srgb, var(--fg) 80%, transparent);
		overflow-wrap: anywhere;
		word-break: break-word;
	}
	.reporter {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 70%, transparent);
		overflow-wrap: anywhere;
		word-break: break-word;
	}
	.actions {
		display: flex;
		gap: 12px;
		align-items: center;
		flex-wrap: wrap;
	}
	form {
		display: inline-flex;
		gap: 8px;
		align-items: center;
		flex-wrap: wrap;
		min-width: 0;
	}
	select {
		padding: 6px 10px;
		border-radius: 10px;
		border: 1px solid var(--hairline);
		background: var(--bg);
		color: var(--fg);
		max-width: 100%;
	}
	button {
		padding: 6px 12px;
		border-radius: 10px;
		border: 1px solid var(--hairline);
		background: color-mix(in srgb, var(--fg) 12%, var(--bg));
		font-weight: 600;
		cursor: pointer;
		max-width: 100%;
	}
	.link {
		color: inherit;
		text-decoration: underline;
	}
	.action-panel {
		border-top: 1px solid var(--hairline);
		padding-top: 10px;
	}
	.action-panel summary {
		cursor: pointer;
		font-weight: 600;
	}
	.action-form {
		margin-top: 10px;
		display: grid;
		gap: 10px;
		min-width: 0;
	}
	.action-form label {
		display: grid;
		gap: 6px;
		font-weight: 600;
	}
	.action-hint {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 70%, transparent);
		font-size: 0.9rem;
	}
	.action-form .checkbox {
		display: inline-flex;
		gap: 8px;
		align-items: flex-start;
		font-weight: 600;
	}
	.action-form .checkbox input {
		margin-top: 3px;
	}
	.action-form textarea,
	.action-form input,
	.action-form select {
		padding: 8px 10px;
		border-radius: 10px;
		border: 1px solid var(--hairline);
		background: var(--bg);
		color: var(--fg);
		width: 100%;
		box-sizing: border-box;
	}
	.email-preview {
		border-top: 1px solid var(--hairline);
		padding-top: 12px;
		display: grid;
		gap: 10px;
	}
	.email-preview h4 {
		margin: 0;
		font-size: 1rem;
	}
	.email-block {
		border: 1px dashed var(--hairline);
		border-radius: 12px;
		padding: 12px;
		background: color-mix(in srgb, var(--fg) 3%, var(--bg));
		display: grid;
		gap: 10px;
	}
	.email-block h5 {
		margin: 0;
		font-size: 0.95rem;
	}
	.email-field {
		display: grid;
		gap: 6px;
	}
	.email-label {
		font-weight: 600;
	}
	.email-row {
		display: grid;
		gap: 8px;
	}
	.email-row input,
	.email-row textarea {
		width: 100%;
		border-radius: 10px;
		border: 1px solid var(--hairline);
		background: var(--bg);
		color: var(--fg);
		padding: 8px 10px;
		box-sizing: border-box;
		font-family: inherit;
	}
	.email-row textarea {
		resize: vertical;
	}
	.copy-status {
		margin: 0;
		color: var(--success);
		font-size: 0.9rem;
	}
</style>
