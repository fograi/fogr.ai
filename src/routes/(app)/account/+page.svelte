<script lang="ts">
	import { onDestroy } from 'svelte';
	import InlineSpinner from '$lib/components/loading/InlineSpinner.svelte';
	import ProgressBar from '$lib/components/loading/ProgressBar.svelte';
	import { tagToAvatar } from '$lib/utils/tag-to-avatar';
	import { getExportStageTarget, stepTowardPercent, type ExportStage } from '$lib/utils/loading';

	export let data: {
		user: { id: string; email?: string | null; displayName: string; tag: string };
	};

	let exporting = false;
	let deleting = false;
	let exportStage: ExportStage = 'idle';
	let exportProgress = 0;
	let exportTicker: ReturnType<typeof setInterval> | null = null;
	let err = '';
	let ok = '';
	$: exportStatusLabel =
		exportStage === 'preparing'
			? 'Preparing export request.'
			: exportStage === 'collecting'
				? 'Collecting your account data.'
				: exportStage === 'finalizing'
					? 'Finalizing download file.'
					: exportStage === 'complete'
						? 'Export ready.'
						: '';
	$: userAvatar = tagToAvatar(data.user.tag, {
		format: 'svg',
		size: 72,
		label: `${data.user.displayName} avatar`
	});
	$: userAvatarDataUri =
		userAvatar.format === 'svg'
			? `data:image/svg+xml;utf8,${encodeURIComponent(userAvatar.svg)}`
			: '';

	function stopExportTicker() {
		if (!exportTicker) return;
		clearInterval(exportTicker);
		exportTicker = null;
	}

	function setExportStage(stage: ExportStage) {
		exportStage = stage;
		if (stage === 'idle') {
			exportProgress = 0;
			stopExportTicker();
			return;
		}
		if (stage === 'complete') {
			exportProgress = 100;
			stopExportTicker();
			return;
		}
		const target = getExportStageTarget(stage);
		exportProgress = stepTowardPercent(exportProgress, target, 10);
		if (exportTicker) return;
		exportTicker = setInterval(() => {
			exportProgress = stepTowardPercent(exportProgress, getExportStageTarget(exportStage), 3);
		}, 120);
	}

	onDestroy(() => {
		stopExportTicker();
	});

	async function downloadExport() {
		err = '';
		ok = '';
		exporting = true;
		setExportStage('idle');
		setExportStage('preparing');
		try {
			setExportStage('collecting');
			const res = await fetch('/api/me/export');
			if (!res.ok) throw new Error('We could not export your data. Try again.');
			setExportStage('finalizing');
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
			setExportStage('complete');
			ok = 'Export ready. Your download has started.';
		} catch (e: unknown) {
			setExportStage('idle');
			err = e instanceof Error ? e.message : 'We could not export your data. Try again.';
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
			const body = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
			if (!res.ok || body?.success === false) {
				throw new Error(body?.message || 'We could not delete the account. Try again.');
			}
			ok = 'Account deleted. Redirecting…';
			window.location.replace('/');
		} catch (e: unknown) {
			err = e instanceof Error ? e.message : 'We could not delete the account. Try again.';
		} finally {
			deleting = false;
		}
	}
</script>

<section class="account">
	<header class="head">
		<h1>Account</h1>
		<p class="sub">Manage your data or delete your account.</p>
	</header>

	<div class="card">
		<div class="row">
			<div class="identity">
				<div class="avatar" aria-hidden="true">
					{#if userAvatar.format === 'svg'}
						<img src={userAvatarDataUri} alt="" width="72" height="72" />
					{:else}
						<span>{userAvatar.emoji}</span>
					{/if}
				</div>
				<div>
					<p class="label">Chat display name</p>
					<p class="value">{data.user.displayName}</p>
					<p class="helper">
						People can recognize you in chats while your real identity stays private.
					</p>
				</div>
			</div>
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
		{#if exporting || exportStage === 'complete'}
			<div class="export-progress" aria-live="polite" aria-busy={exporting}>
				{#if exporting}
					<InlineSpinner label={exportStatusLabel} />
				{:else}
					<p class="muted export-ready">Export completed.</p>
				{/if}
				<ProgressBar value={exportProgress} label="Data export progress" />
			</div>
		{/if}
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
		padding: 24px var(--page-pad) 80px;
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
	.export-progress {
		display: grid;
		gap: 8px;
		padding: 8px 10px;
		border: 1px solid color-mix(in srgb, var(--fg) 12%, transparent);
		border-radius: 10px;
		background: color-mix(in srgb, var(--fg) 3%, var(--bg));
	}
	.export-ready {
		font-weight: 700;
	}
	.row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 12px;
		flex-wrap: wrap;
		min-width: 0;
	}
	.identity {
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: 0;
	}
	.avatar {
		width: 72px;
		height: 72px;
		flex: 0 0 72px;
		display: grid;
		place-items: center;
		border-radius: 16px;
		border: 1px solid var(--hairline);
		background: color-mix(in srgb, var(--fg) 4%, var(--bg));
		overflow: hidden;
	}
	.avatar img {
		display: block;
		width: 72px;
		height: 72px;
	}
	.avatar span {
		font-size: 1.9rem;
	}
	.label {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 55%, transparent);
		font-size: 0.9rem;
	}
	.value {
		margin: 0;
		font-weight: 700;
		overflow-wrap: anywhere;
		word-break: break-word;
	}
	.helper {
		margin: 4px 0 0;
		font-size: 0.88rem;
		color: color-mix(in srgb, var(--fg) 63%, transparent);
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
		color: var(--accent-orange);
		background: var(--tangerine-bg);
		border: 1px solid color-mix(in srgb, var(--accent-orange) 35%, transparent);
		border-radius: 10px;
		font-weight: 700;
		margin: 4px 0 0;
		padding: 8px 10px;
	}
	.ok {
		color: var(--accent-green);
		background: var(--mint-bg);
		border: 1px solid color-mix(in srgb, var(--accent-green) 35%, transparent);
		border-radius: 10px;
		font-weight: 700;
		margin: 4px 0 0;
		padding: 8px 10px;
	}
</style>
