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

	const formatDate = (iso: string) =>
		new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium', timeStyle: 'short' }).format(
			new Date(iso)
		);
</script>

<section class="admin">
	<header class="admin-header">
		<h1>Ad Reports</h1>
		<p class="sub">{data.reports.length} reports</p>
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
</style>
