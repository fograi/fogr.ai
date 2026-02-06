<script lang="ts">
	import { resolve } from '$app/paths';
	import { PUBLIC_R2_BASE } from '$env/static/public';

	type AdRow = {
		id: string;
		title: string;
		price: number | null;
		currency: string | null;
		category: string;
		image_keys: string[] | null;
		status: string;
		created_at: string;
		updated_at: string | null;
		expires_at: string;
	};

	export let data: { ads: AdRow[] };

	let ads = data.ads ?? [];
	let filter: 'all' | AdRow['status'] = 'all';
	let busyId: string | null = null;
	let notice = '';
	let err = '';

	const STATUS_ORDER = ['active', 'pending', 'sold', 'archived', 'expired', 'rejected'] as const;
	const STATUS_LABELS: Record<string, string> = {
		active: 'Active',
		pending: 'Pending',
		sold: 'Sold',
		archived: 'Archived',
		expired: 'Expired',
		rejected: 'Rejected'
	};

	const publicR2Base = PUBLIC_R2_BASE.replace(/\/+$/, '');
	const normalizeKey = (key: string) => key.replace(/^\/+/, '');

	$: counts = STATUS_ORDER.reduce(
		(acc, status) => {
			acc[status] = ads.filter((ad) => ad.status === status).length;
			return acc;
		},
		{} as Record<string, number>
	);
	$: filteredAds = filter === 'all' ? ads : ads.filter((ad) => ad.status === filter);

	const formatPrice = (ad: AdRow) => {
		if (ad.price === null) return 'POA';
		if (ad.price === 0 || ad.category === 'Free / Giveaway') return 'Free';
		return new Intl.NumberFormat('en-IE', {
			style: 'currency',
			currency: ad.currency ?? 'EUR',
			maximumFractionDigits: 0
		}).format(ad.price);
	};

	const formatDate = (iso?: string | null) =>
		iso
			? new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium' }).format(new Date(iso))
			: '';

	async function setStatus(ad: AdRow, nextStatus: 'active' | 'sold' | 'archived') {
		err = '';
		notice = '';
		busyId = ad.id;
		try {
			const res = await fetch(`/api/ads/${ad.id}/status`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: nextStatus })
			});
			const body = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
			if (!res.ok || body.success === false) {
				throw new Error(body.message || 'Could not update status.');
			}
			ads = ads.map((row) => (row.id === ad.id ? { ...row, status: nextStatus } : row));
			notice = 'Status updated.';
		} catch (e: unknown) {
			err = e instanceof Error ? e.message : 'Could not update status.';
		} finally {
			busyId = null;
		}
	}

	async function copyLink(ad: AdRow) {
		err = '';
		notice = '';
		try {
			await navigator.clipboard?.writeText(`${location.origin}${resolve('/ad/' + ad.id)}`);
			notice = 'Link copied.';
		} catch {
			err = 'Could not copy the link.';
		}
	}
</script>

<section class="listings-hub">
	<header class="head">
		<h1>My ads</h1>
		<p class="sub">Manage status, share, or archive your listings.</p>
	</header>

	<div class="filters" role="tablist" aria-label="Filter ads by status">
		<button
			type="button"
			class:active={filter === 'all'}
			on:click={() => (filter = 'all')}
			role="tab"
			aria-selected={filter === 'all'}
		>
			All <span class="count">{ads.length}</span>
		</button>
		{#each STATUS_ORDER as status}
			<button
				type="button"
				class:active={filter === status}
				on:click={() => (filter = status)}
				role="tab"
				aria-selected={filter === status}
			>
				{STATUS_LABELS[status]} <span class="count">{counts[status] ?? 0}</span>
			</button>
		{/each}
	</div>

	{#if err}
		<p class="notice error" role="alert">{err}</p>
	{/if}
	{#if notice}
		<p class="notice ok" role="status">{notice}</p>
	{/if}

	{#if filteredAds.length === 0}
		<p class="empty">No ads in this view yet.</p>
	{:else}
		<div class="list" role="list">
			{#each filteredAds as ad (ad.id)}
				<article class="card" role="listitem">
					<div class="media">
						{#if ad.image_keys?.[0]}
							<img
								src={`${publicR2Base}/${normalizeKey(ad.image_keys[0])}`}
								alt={ad.title}
								loading="lazy"
								decoding="async"
							/>
						{:else}
							<div class="placeholder">
								<span>{(ad.category || 'Ad').toUpperCase()}</span>
							</div>
						{/if}
					</div>

					<div class="meta">
						<div class="top">
							<h2>{ad.title}</h2>
							<span class={`status ${ad.status}`}>{STATUS_LABELS[ad.status] ?? ad.status}</span>
						</div>
						<p class="price">{formatPrice(ad)}</p>
						<p class="detail">
							Updated {formatDate(ad.updated_at ?? ad.created_at)}
							{#if ad.expires_at}
								· {ad.status === 'expired' ? 'Expired' : 'Expires'} {formatDate(ad.expires_at)}
							{/if}
						</p>
					</div>

					<div class="actions">
						<a class="btn ghost" href={resolve(`/ad/${ad.id}`)}>View</a>
						{#if ['active', 'pending', 'archived'].includes(ad.status)}
							<a class="btn ghost" href={resolve(`/ads/${ad.id}/edit`)}>Edit</a>
						{/if}
						<button type="button" class="btn ghost" on:click={() => copyLink(ad)}>
							Copy link
						</button>
						{#if ad.status === 'active'}
							<button
								type="button"
								class="btn"
								disabled={busyId === ad.id}
								on:click={() => setStatus(ad, 'sold')}
							>
								Mark sold
							</button>
							<button
								type="button"
								class="btn"
								disabled={busyId === ad.id}
								on:click={() => setStatus(ad, 'archived')}
							>
								Archive
							</button>
						{:else if ad.status === 'sold'}
							<button
								type="button"
								class="btn"
								disabled={busyId === ad.id}
								on:click={() => setStatus(ad, 'active')}
							>
								Mark active
							</button>
							<button
								type="button"
								class="btn"
								disabled={busyId === ad.id}
								on:click={() => setStatus(ad, 'archived')}
							>
								Archive
							</button>
						{:else if ad.status === 'archived'}
							<button
								type="button"
								class="btn"
								disabled={busyId === ad.id}
								on:click={() => setStatus(ad, 'active')}
							>
								Restore
							</button>
						{:else}
							<span class="muted">Status locked</span>
						{/if}
					</div>
				</article>
			{/each}
		</div>
	{/if}
</section>

<style>
	.listings-hub {
		max-width: var(--page-max);
		margin: 0 auto;
		padding: 24px var(--page-pad) 80px;
		display: grid;
		gap: 16px;
		color: var(--fg);
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
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.filters button {
		border: 1px solid var(--hairline);
		background: var(--surface);
		border-radius: 999px;
		padding: 6px 12px;
		font-weight: 700;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.filters button.active {
		border-color: var(--fg);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--fg) 12%, transparent);
	}
	.count {
		font-size: 0.8rem;
		color: color-mix(in srgb, var(--fg) 55%, transparent);
	}
	.notice {
		margin: 0;
		padding: 10px 12px;
		border-radius: 10px;
		font-weight: 700;
	}
	.notice.error {
		background: var(--tangerine-bg);
		color: var(--accent-orange);
		border: 1px solid color-mix(in srgb, var(--accent-orange) 35%, transparent);
	}
	.notice.ok {
		background: var(--mint-bg);
		color: var(--accent-green);
		border: 1px solid color-mix(in srgb, var(--accent-green) 35%, transparent);
	}
	.empty {
		padding: 24px 0;
		text-align: center;
		color: color-mix(in srgb, var(--fg) 65%, transparent);
	}
	.list {
		display: grid;
		gap: 12px;
		width: 100%;
	}
	.card {
		border: 1px solid var(--hairline);
		border-radius: 14px;
		background: var(--surface);
		padding: 12px;
		display: grid;
		grid-template-columns: 120px minmax(0, 1fr) auto;
		gap: 14px;
		align-items: center;
		width: 100%;
		min-width: 0;
	}
	.media {
		width: 120px;
		height: 92px;
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid color-mix(in srgb, var(--fg) 12%, transparent);
		background: color-mix(in srgb, var(--fg) 4%, var(--bg));
	}
	.media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.placeholder {
		width: 100%;
		height: 100%;
		display: grid;
		place-items: center;
		text-align: center;
		padding: 8px;
		font-weight: 700;
		font-size: 0.7rem;
		letter-spacing: 0.06em;
		color: color-mix(in srgb, var(--fg) 70%, transparent);
	}
	.meta {
		display: grid;
		gap: 6px;
		min-width: 0;
	}
	.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}
	.meta h2 {
		margin: 0;
		font-size: 1rem;
	}
	.status {
		font-size: 0.75rem;
		padding: 4px 8px;
		border-radius: 999px;
		border: 1px solid var(--hairline);
		text-transform: capitalize;
	}
	.status.active {
		border-color: color-mix(in srgb, var(--accent-green) 60%, transparent);
		color: var(--accent-green);
	}
	.status.sold {
		border-color: color-mix(in srgb, var(--fg) 25%, transparent);
		color: color-mix(in srgb, var(--fg) 75%, transparent);
	}
	.status.archived {
		border-color: color-mix(in srgb, var(--fg) 18%, transparent);
		color: color-mix(in srgb, var(--fg) 65%, transparent);
	}
	.status.expired,
	.status.rejected {
		border-color: color-mix(in srgb, var(--accent-orange) 40%, transparent);
		color: var(--accent-orange);
	}
	.status.pending {
		border-color: color-mix(in srgb, var(--fg) 25%, transparent);
		color: color-mix(in srgb, var(--fg) 70%, transparent);
	}
	.price {
		margin: 0;
		font-weight: 700;
	}
	.detail {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 60%, transparent);
		font-size: 0.9rem;
	}
	.actions {
		display: flex;
		flex-direction: column;
		gap: 6px;
		align-items: flex-end;
		min-width: 0;
	}
	.btn {
		border: 1px solid color-mix(in srgb, var(--fg) 18%, transparent);
		background: var(--surface);
		border-radius: 10px;
		padding: 8px 12px;
		font-weight: 700;
		cursor: pointer;
		color: inherit;
		text-decoration: none;
	}
	.btn.ghost {
		background: transparent;
	}
	.btn[disabled] {
		opacity: 0.6;
		cursor: default;
	}
	.muted {
		color: color-mix(in srgb, var(--fg) 55%, transparent);
		font-size: 0.85rem;
	}

	@media (max-width: 860px) {
		.card {
			grid-template-columns: 100px 1fr;
		}
		.actions {
			grid-column: 1 / -1;
			flex-direction: row;
			flex-wrap: wrap;
			justify-content: flex-start;
		}
		.media {
			width: 100px;
			height: 80px;
		}
	}
	@media (max-width: 560px) {
		.card {
			grid-template-columns: 1fr;
		}
		.media {
			width: 100%;
			height: 160px;
		}
		.top {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
