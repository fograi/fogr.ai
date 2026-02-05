<script lang="ts">
	type AppealRow = {
		id: string;
		ad_id: string;
		action_id: string | null;
		appellant_user_id: string;
		reason_details: string;
		status: string;
		created_at: string;
	};

	export let data: { appeals: AppealRow[] };

	const statusOptions = [
		{ value: 'open', label: 'Open' },
		{ value: 'resolved', label: 'Resolved' },
		{ value: 'dismissed', label: 'Dismissed' }
	];

	const formatDate = (iso: string) =>
		new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium', timeStyle: 'short' }).format(
			new Date(iso)
		);
</script>

<section class="admin">
	<header class="admin-header">
		<h1>Appeals</h1>
		<p class="sub">{data.appeals.length} appeals</p>
	</header>

	{#if data.appeals.length === 0}
		<p class="empty">No appeals yet.</p>
	{:else}
		<div class="appeal-list">
			{#each data.appeals as appeal}
				<article class="appeal-card">
					<header class="card-header">
						<div>
							<h2>Appeal #{appeal.id.slice(0, 8)}</h2>
							<p class="meta">
								<span>{formatDate(appeal.created_at)}</span>
								<span>Ad: {appeal.ad_id}</span>
							</p>
						</div>
						<span class="status badge {appeal.status}">{appeal.status.replace('_', ' ')}</span>
					</header>

					<p class="details">{appeal.reason_details}</p>
					<p class="meta">User: {appeal.appellant_user_id}</p>

					<div class="actions">
						<form method="post" action="?/updateStatus">
							<input type="hidden" name="appeal_id" value={appeal.id} />
							<select name="status" aria-label="Update appeal status">
								{#each statusOptions as option}
									<option value={option.value} selected={option.value === appeal.status}>
										{option.label}
									</option>
								{/each}
							</select>
							<button type="submit">Update</button>
						</form>
						<a class="link" href={`/ad/${appeal.ad_id}`} target="_blank" rel="noopener">
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
	.appeal-list {
		display: grid;
		gap: 16px;
		margin-top: 16px;
	}
	.appeal-card {
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
	.badge.resolved {
		background: color-mix(in srgb, var(--success) 20%, var(--bg));
	}
	.badge.dismissed {
		background: color-mix(in srgb, var(--fg) 6%, var(--bg));
	}
	.details {
		margin: 0;
		white-space: pre-wrap;
		color: color-mix(in srgb, var(--fg) 80%, transparent);
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
