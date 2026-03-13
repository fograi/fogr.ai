<script lang="ts">
	import { resolve } from '$app/paths';

	type SavedSearch = {
		id: string;
		name: string | null;
		category: string | null;
		county: string | null;
		locality: string | null;
		query: string | null;
		notify: boolean;
		created_at: string;
	};

	export let data: { searches: SavedSearch[] };

	let searches = data.searches ?? [];
	let busyId: string | null = null;
	let editingId: string | null = null;
	let editName = '';
	let notice = '';
	let err = '';

	function buildSearchUrl(search: SavedSearch): string {
		const parts: string[] = [];
		if (search.category) parts.push(`category=${encodeURIComponent(search.category)}`);
		if (search.county) parts.push(`county_id=${encodeURIComponent(search.county)}`);
		if (search.query) parts.push(`q=${encodeURIComponent(search.query)}`);
		return parts.length > 0 ? `${resolve('/')}?${parts.join('&')}` : resolve('/');
	}

	function startEdit(search: SavedSearch) {
		editingId = search.id;
		editName = search.name ?? '';
	}

	function cancelEdit() {
		editingId = null;
		editName = '';
	}

	async function saveName(search: SavedSearch) {
		if (busyId) return;
		busyId = search.id;
		err = '';
		notice = '';
		try {
			const res = await fetch(`/api/saved-searches/${search.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: editName })
			});
			if (!res.ok) throw new Error('Failed');
			searches = searches.map((s) => (s.id === search.id ? { ...s, name: editName || null } : s));
			editingId = null;
			editName = '';
			notice = 'Name updated.';
		} catch {
			err = 'Could not update name.';
		} finally {
			busyId = null;
		}
	}

	async function toggleNotify(search: SavedSearch) {
		if (busyId) return;
		busyId = search.id;
		err = '';
		notice = '';
		const newNotify = !search.notify;
		try {
			const res = await fetch(`/api/saved-searches/${search.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ notify: newNotify })
			});
			if (!res.ok) throw new Error('Failed');
			searches = searches.map((s) => (s.id === search.id ? { ...s, notify: newNotify } : s));
			notice = newNotify ? 'Notifications enabled.' : 'Notifications disabled.';
		} catch {
			err = 'Could not update notifications.';
		} finally {
			busyId = null;
		}
	}

	async function deleteSearch(search: SavedSearch) {
		if (busyId) return;
		busyId = search.id;
		err = '';
		notice = '';
		try {
			const res = await fetch(`/api/saved-searches/${search.id}`, {
				method: 'DELETE'
			});
			if (!res.ok) throw new Error('Failed');
			searches = searches.filter((s) => s.id !== search.id);
			notice = 'Search deleted.';
		} catch {
			err = 'Could not delete search.';
		} finally {
			busyId = null;
		}
	}

	function handleEditKeydown(e: KeyboardEvent, search: SavedSearch) {
		if (e.key === 'Enter') saveName(search);
		if (e.key === 'Escape') cancelEdit();
	}

	const formatDate = (iso: string) =>
		new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium' }).format(new Date(iso));
</script>

<section class="saved-searches">
	<header class="head">
		<h1>Saved searches</h1>
		<p class="sub">Manage your saved searches and email alerts.</p>
	</header>

	{#if err}
		<p class="notice error" role="alert">{err}</p>
	{/if}
	{#if notice}
		<p class="notice ok" role="status">{notice}</p>
	{/if}

	{#if searches.length === 0}
		<div class="empty">
			<p>No saved searches yet. Browse listings and save searches you're interested in.</p>
			<a class="btn ghost" href={resolve('/')}>Browse listings</a>
		</div>
	{:else}
		<div class="list" role="list">
			{#each searches as search (search.id)}
				<article class="card" role="listitem">
					<div class="card-top">
						{#if editingId === search.id}
							<input
								class="edit-name"
								type="text"
								bind:value={editName}
								onblur={() => saveName(search)}
								onkeydown={(e) => handleEditKeydown(e, search)}
							/>
						{:else}
							<button
								type="button"
								class="name-btn"
								onclick={() => startEdit(search)}
								title="Click to edit name"
							>
								<h2>{search.name ?? 'Untitled search'}</h2>
							</button>
						{/if}
						<span class="date">Saved {formatDate(search.created_at)}</span>
					</div>

					<div class="filters">
						{#if search.category}
							<span class="chip">{search.category}</span>
						{/if}
						{#if search.county}
							<span class="chip">{search.county}</span>
						{/if}
						{#if search.query}
							<span class="chip">"{search.query}"</span>
						{/if}
					</div>

					<div class="actions">
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- href built via resolve() in buildSearchUrl -->
						<a class="btn ghost" href={buildSearchUrl(search)}>Run search</a>
						<button
							type="button"
							class="btn ghost"
							class:notify-on={search.notify}
							class:notify-off={!search.notify}
							disabled={busyId === search.id}
							onclick={() => toggleNotify(search)}
						>
							{search.notify ? 'Alerts on' : 'Alerts off'}
						</button>
						<button
							type="button"
							class="btn ghost danger"
							disabled={busyId === search.id}
							onclick={() => deleteSearch(search)}
						>
							Delete
						</button>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</section>

<style>
	.saved-searches {
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
		padding: 32px 0;
		text-align: center;
		color: color-mix(in srgb, var(--fg) 65%, transparent);
		display: grid;
		gap: 12px;
		justify-items: center;
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
		padding: 14px;
		display: grid;
		gap: 10px;
	}
	.card-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		min-width: 0;
	}
	.name-btn {
		appearance: none;
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		text-align: left;
		min-width: 0;
	}
	.name-btn h2 {
		margin: 0;
		font-size: 1rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.name-btn:hover h2 {
		text-decoration: underline;
		text-decoration-style: dotted;
		text-underline-offset: 3px;
	}
	.edit-name {
		flex: 1;
		padding: 6px 10px;
		border: 1px solid var(--accent-green);
		border-radius: 8px;
		background: var(--surface);
		color: var(--fg);
		font-size: 1rem;
		font-weight: 700;
		min-width: 0;
	}
	.date {
		font-size: 0.82rem;
		color: color-mix(in srgb, var(--fg) 55%, transparent);
		white-space: nowrap;
		flex-shrink: 0;
	}
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		padding: 4px 8px;
		border: 1px solid color-mix(in srgb, var(--fg) 18%, transparent);
		background: color-mix(in srgb, var(--fg) 6%, var(--surface));
		border-radius: 999px;
		font-size: 0.78rem;
		font-weight: 600;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		border: 1px solid color-mix(in srgb, var(--fg) 18%, transparent);
		background: var(--surface);
		border-radius: 10px;
		padding: 7px 12px;
		font-weight: 700;
		cursor: pointer;
		color: inherit;
		text-decoration: none;
		font-size: 0.88rem;
	}
	.btn.ghost {
		background: transparent;
	}
	.btn[disabled] {
		opacity: 0.6;
		cursor: default;
	}
	.btn.danger {
		color: var(--accent-orange);
	}
	.btn.danger:hover:not([disabled]) {
		background: var(--tangerine-bg);
	}
	.notify-on {
		color: var(--accent-green);
		border-color: color-mix(in srgb, var(--accent-green) 40%, transparent);
	}
	.notify-off {
		color: color-mix(in srgb, var(--fg) 55%, transparent);
	}
</style>
