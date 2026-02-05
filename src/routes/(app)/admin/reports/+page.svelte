<script lang="ts">
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

	export let data: { reports: ReportRow[] };

	const statusOptions = [
		{ value: 'open', label: 'Open' },
		{ value: 'in_review', label: 'In review' },
		{ value: 'actioned', label: 'Actioned' },
		{ value: 'dismissed', label: 'Dismissed' }
	];
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
</script>

<section class="admin">
	<header class="admin-header">
		<div>
			<h1>Ad Reports</h1>
			<p class="sub">{data.reports.length} reports</p>
		</div>
		<a class="link" href="/admin/appeals">View appeals</a>
	</header>

	{#if data.reports.length === 0}
		<p class="empty">No reports yet.</p>
	{:else}
		<div class="report-list">
			{#each data.reports as report}
				<article class="report-card">
					<header class="card-header">
						<div>
							<h2>Report #{report.id.slice(0, 8)}</h2>
							<p class="meta">
								<span>{formatDate(report.created_at)}</span>
								<span>Ad: {report.ad_id}</span>
							</p>
						</div>
						<span class="status badge {report.status}">{report.status.replace('_', ' ')}</span>
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
						<a class="link" href={report.location_url} target="_blank" rel="noopener">
							View ad
						</a>
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
				</article>
			{/each}
		</div>
	{/if}
</section>

<style>
	.admin {
		max-width: 1100px;
		margin: 24px auto 48px;
		padding: 0 16px;
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
	.report-card {
		border: 1px solid var(--hairline);
		border-radius: 14px;
		padding: 14px 16px;
		background: var(--surface);
		display: grid;
		gap: 10px;
	}
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 12px;
	}
	.card-header h2 {
		margin: 0;
		font-size: 1.05rem;
	}
	.meta {
		margin: 4px 0 0;
		color: color-mix(in srgb, var(--fg) 65%, transparent);
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
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
	}
	.reporter {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 70%, transparent);
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
	}
	select {
		padding: 6px 10px;
		border-radius: 10px;
		border: 1px solid var(--hairline);
		background: var(--bg);
		color: var(--fg);
	}
	button {
		padding: 6px 12px;
		border-radius: 10px;
		border: 1px solid var(--hairline);
		background: color-mix(in srgb, var(--fg) 12%, var(--bg));
		font-weight: 600;
		cursor: pointer;
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
	}
</style>
