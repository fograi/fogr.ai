<script lang="ts">

	export let data: { user: { id: string; email?: string | null } };

	let exporting = false;
	let deleting = false;
	let err = '';
	let ok = '';

	async function downloadExport() {
		err = '';
		ok = '';
		exporting = true;
		try {
			const res = await fetch('/api/me/export');
			if (!res.ok) throw new Error('Failed to export your data.');
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			const stamp = new Date().toISOString().slice(0, 10);
			a.href = url;
			a.download = `fogr-ai-export-${stamp}.json`;
			a.style.display = 'none';
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
			ok = 'Your export is downloading.';
		} catch (e: unknown) {
			err = e instanceof Error ? e.message : 'Failed to export your data.';
		} finally {
			exporting = false;
		}
	}

	async function deleteAccount() {
		err = '';
		ok = '';
		if (!confirm('Delete your account and all ads? This cannot be undone.')) return;
		deleting = true;
		try {
			const res = await fetch('/api/me/delete', { method: 'POST' });
			const body = await res.json().catch(() => ({}));
			if (!res.ok || body?.success === false) {
				throw new Error(body?.message || 'Failed to delete account.');
			}
			ok = 'Account deleted. Redirecting…';
			window.location.replace('/');
		} catch (e: unknown) {
			err = e instanceof Error ? e.message : 'Failed to delete account.';
		} finally {
			deleting = false;
		}
	}
</script>

<section class="account">
	<header class="head">
		<h1>Account</h1>
		<p class="sub">Manage your data and delete your account.</p>
	</header>

	<div class="card">
		<div class="row">
			<div>
				<p class="label">Signed in as</p>
				<p class="value">{data.user.email ?? 'Unknown email'}</p>
			</div>
		</div>
	</div>

	<div class="card">
		<h2>Export your data</h2>
		<p class="muted">
			Download a JSON file containing your ads and account-related data stored by fogr.ai.
		</p>
		<button type="button" on:click={downloadExport} disabled={exporting}>
			{exporting ? 'Preparing…' : 'Download data export'}
		</button>
	</div>

	<div class="card danger">
		<h2>Delete your account</h2>
		<p class="muted">
			This permanently deletes your account and all ads. This action cannot be undone.
		</p>
		<button type="button" class="danger-btn" on:click={deleteAccount} disabled={deleting}>
			{deleting ? 'Deleting…' : 'Delete my account'}
		</button>
	</div>

	{#if err}<p class="err" role="alert">{err}</p>{/if}
	{#if ok}<p class="ok" role="status">{ok}</p>{/if}
</section>

<style>
	.account {
		max-width: 720px;
		margin: 0 auto;
		padding: 24px 16px 80px;
		display: grid;
		gap: 16px;
	}
	.head h1 {
		margin: 0 0 4px;
		font-size: 1.6rem;
		font-weight: 800;
	}
	.sub {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 55%, transparent);
	}
	.card {
		background: var(--surface);
		border: 1px solid var(--hairline);
		border-radius: 14px;
		padding: 16px;
		display: grid;
		gap: 10px;
	}
	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}
	.label {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 55%, transparent);
		font-size: 0.9rem;
	}
	.value {
		margin: 0;
		font-weight: 700;
	}
	button {
		border: 0;
		border-radius: 10px;
		padding: 10px 14px;
		font-weight: 700;
		background: var(--fg);
		color: var(--bg);
		cursor: pointer;
	}
	button[disabled] {
		opacity: 0.6;
		cursor: default;
	}
	.danger {
		border-color: color-mix(in srgb, var(--danger-strong) 50%, var(--hairline));
	}
	.danger-btn {
		background: var(--danger-strong);
		color: white;
	}
	.err {
		color: var(--danger);
		font-weight: 700;
		margin: 4px 0 0;
	}
	.ok {
		color: var(--success);
		font-weight: 700;
		margin: 4px 0 0;
	}
</style>
