<script lang="ts">
	export let data: { reportId?: string };

	let reportId = data.reportId ?? '';
	let email = '';
	let loading = false;
	let error = '';
	let result:
		| {
				report: {
					id: string;
					status: string;
					reason_category: string;
					created_at: string;
				};
				decision: {
					action_type: string;
					reason_category: string;
					reason_details: string;
					legal_basis: string | null;
					automated: boolean;
					created_at: string;
				} | null;
		  }
		| null = null;

	const formatDate = (iso: string) =>
		new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium', timeStyle: 'short' }).format(
			new Date(iso)
		);

	async function lookup() {
		error = '';
		result = null;
		if (!reportId.trim()) {
			error = 'Report ID is required.';
			return;
		}
		if (!email.trim()) {
			error = 'Email is required.';
			return;
		}
		loading = true;
		try {
			const res = await fetch('/api/reports/status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'same-origin',
				body: JSON.stringify({ reportId: reportId.trim(), email: email.trim() })
			});
			const body = (await res.json().catch(() => ({}))) as {
				success?: boolean;
				message?: string;
				report?: any;
				decision?: any;
			};
			if (!res.ok || body.success === false) {
				error = body.message || 'Unable to fetch report status.';
			} else {
				result = {
					report: body.report,
					decision: body.decision ?? null
				};
			}
		} catch {
			error = 'Unable to fetch report status.';
		} finally {
			loading = false;
		}
	}
</script>

<section class="report-status">
	<header>
		<h1>Report status</h1>
		<p class="sub">
			Enter your report reference and email to check the status of your notice.
		</p>
	</header>

	<form class="lookup" on:submit|preventDefault={lookup}>
		<label for="report-id">Report reference</label>
		<input id="report-id" type="text" bind:value={reportId} autocomplete="off" />

		<label for="report-email">Your email</label>
		<input id="report-email" type="email" bind:value={email} autocomplete="email" />

		{#if error}<p class="error" aria-live="assertive">{error}</p>{/if}

		<button type="submit" disabled={loading}>
			{loading ? 'Checking...' : 'Check status'}
		</button>
	</form>

	{#if result}
		<div class="result">
			<h2>Report #{result.report.id.slice(0, 8)}</h2>
			<p class="meta">
				Status: <strong>{result.report.status.replace('_', ' ')}</strong>
			</p>
			<p class="meta">Reported on {formatDate(result.report.created_at)}</p>

			{#if result.decision}
				<div class="decision">
					<h3>Decision</h3>
					<p class="meta">
						{result.decision.action_type.replace('_', ' ')} on
						{formatDate(result.decision.created_at)}
					</p>
					<p><strong>Reason category:</strong> {result.decision.reason_category}</p>
					<p class="details">{result.decision.reason_details}</p>
					{#if result.decision.legal_basis}
						<p class="meta">
							<strong>Legal or policy basis:</strong> {result.decision.legal_basis}
						</p>
					{/if}
					<p class="meta">
						Decision type: {result.decision.automated ? 'Automated' : 'Manual'}
					</p>
				</div>
			{:else}
				<p class="meta">No decision yet. We will update this page once reviewed.</p>
			{/if}
		</div>
	{/if}
</section>

<style>
	.report-status {
		max-width: 720px;
		margin: 24px auto 48px;
		padding: 0 16px;
	}
	header h1 {
		margin: 0 0 6px;
	}
	.sub {
		margin: 0 0 16px;
		color: color-mix(in srgb, var(--fg) 70%, transparent);
	}
	.lookup {
		display: grid;
		gap: 10px;
		padding: 14px;
		border: 1px solid var(--hairline);
		border-radius: 12px;
		background: var(--surface);
	}
	label {
		font-weight: 600;
	}
	input {
		padding: 10px 12px;
		border-radius: 10px;
		border: 1px solid var(--hairline);
		background: var(--bg);
		color: var(--fg);
	}
	button {
		height: 44px;
		border: 0;
		border-radius: 10px;
		background: var(--fg);
		color: var(--bg);
		font-weight: 700;
		cursor: pointer;
	}
	button[disabled] {
		opacity: 0.6;
		cursor: default;
	}
	.error {
		margin: 0;
		color: var(--danger);
	}
	.result {
		margin-top: 16px;
		padding: 14px;
		border: 1px solid var(--hairline);
		border-radius: 12px;
		background: color-mix(in srgb, var(--fg) 3%, var(--bg));
	}
	.meta {
		margin: 0 0 8px;
		color: color-mix(in srgb, var(--fg) 70%, transparent);
	}
	.decision {
		margin-top: 12px;
		padding-top: 10px;
		border-top: 1px solid var(--hairline);
	}
	.details {
		margin: 0 0 8px;
		white-space: pre-wrap;
	}
</style>
