<script lang="ts">
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import InlineSpinner from '$lib/components/loading/InlineSpinner.svelte';
	import SkeletonBlock from '$lib/components/loading/SkeletonBlock.svelte';
	import { tagToAvatar } from '$lib/utils/tag-to-avatar';

	type ConversationView = {
		id: string;
		adId: string;
		adTitle: string;
		adPrice: number | null;
		adCurrency: string | null;
		counterpartyId: string;
		counterpartyName: string;
		counterpartyTag: string;
		role: 'buyer' | 'seller';
		lastMessageAt: string;
		preview: string;
		unread: boolean;
		unreadCount: number;
	};

	type ViewMode = 'grouped' | 'threads';
	type RoleFilter = 'all' | 'selling' | 'buying';
	type RoleBucket = 'selling' | 'buying';
	type ThreadSection = {
		key: RoleBucket;
		label: string;
		conversations: ConversationView[];
	};
	type ListingGroup = {
		key: string;
		role: RoleBucket;
		adId: string;
		adTitle: string;
		adPrice: number | null;
		adCurrency: string | null;
		latestAt: string;
		unreadCount: number;
		conversations: ConversationView[];
	};
	type GroupSection = {
		key: RoleBucket;
		label: string;
		groups: ListingGroup[];
		unreadCount: number;
		threadCount: number;
	};

	export let data: { streamed: { conversations: Promise<ConversationView[]> } };

	const VIEW_MODE_KEY = 'fogr:inbox:view-mode';
	const ROLE_FILTER_KEY = 'fogr:inbox:role-filter';
	const skeletonRows = [1, 2, 3, 4];

	let viewMode: ViewMode = 'grouped';
	let roleFilter: RoleFilter = 'all';
	let prefsLoaded = false;

	onMount(() => {
		if (!browser) return;
		const savedView = localStorage.getItem(VIEW_MODE_KEY);
		if (savedView === 'grouped' || savedView === 'threads') {
			viewMode = savedView;
		}
		const savedFilter = localStorage.getItem(ROLE_FILTER_KEY);
		if (savedFilter === 'all' || savedFilter === 'selling' || savedFilter === 'buying') {
			roleFilter = savedFilter;
		}
		prefsLoaded = true;
	});

	$: if (browser && prefsLoaded) {
		localStorage.setItem(VIEW_MODE_KEY, viewMode);
		localStorage.setItem(ROLE_FILTER_KEY, roleFilter);
	}

	const fmt = (iso: string) =>
		new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium', timeStyle: 'short' }).format(
			new Date(iso)
		);

	const formatMoney = (value: number | null, currency: string | null) => {
		if (value === null) return '';
		return new Intl.NumberFormat('en-IE', {
			style: 'currency',
			currency: currency ?? 'EUR',
			maximumFractionDigits: 0
		}).format(value);
	};
	const avatarFor = (tag: string, name: string, size = 34) => {
		const avatar = tagToAvatar(tag, { format: 'svg', size, label: `${name} avatar` });
		return {
			emoji: avatar.emoji,
			dataUri:
				avatar.format === 'svg' ? `data:image/svg+xml;utf8,${encodeURIComponent(avatar.svg)}` : ''
		};
	};

	const toRoleBucket = (role: ConversationView['role']): RoleBucket =>
		role === 'seller' ? 'selling' : 'buying';

	const roleLabel = (role: RoleBucket) => (role === 'selling' ? 'Selling' : 'Buying');

	const hasMixedRoles = (conversations: ConversationView[]) => {
		const hasSelling = conversations.some((conversation) => conversation.role === 'seller');
		const hasBuying = conversations.some((conversation) => conversation.role === 'buyer');
		return hasSelling && hasBuying;
	};

	const applyRoleFilter = (conversations: ConversationView[], filter: RoleFilter) => {
		if (filter === 'selling')
			return conversations.filter((conversation) => conversation.role === 'seller');
		if (filter === 'buying')
			return conversations.filter((conversation) => conversation.role === 'buyer');
		return conversations;
	};

	const timeValue = (iso: string) => new Date(iso).getTime();

	const sortThreads = (a: ConversationView, b: ConversationView) => {
		const aHasUnread = a.unreadCount > 0;
		const bHasUnread = b.unreadCount > 0;
		if (aHasUnread !== bHasUnread) return aHasUnread ? -1 : 1;
		if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
		return timeValue(b.lastMessageAt) - timeValue(a.lastMessageAt);
	};

	const buildThreadSections = (
		conversations: ConversationView[],
		filter: RoleFilter
	): ThreadSection[] => {
		const filtered = [...applyRoleFilter(conversations, filter)].sort(sortThreads);
		if (filtered.length === 0) return [];

		const selling = filtered.filter((conversation) => conversation.role === 'seller');
		const buying = filtered.filter((conversation) => conversation.role === 'buyer');

		if (filter === 'selling') {
			return [{ key: 'selling', label: 'Selling conversations', conversations: selling }];
		}
		if (filter === 'buying') {
			return [{ key: 'buying', label: 'Buying conversations', conversations: buying }];
		}
		if (selling.length > 0 && buying.length > 0) {
			return [
				{ key: 'selling', label: 'Selling conversations', conversations: selling },
				{ key: 'buying', label: 'Buying conversations', conversations: buying }
			];
		}

		const key: RoleBucket = selling.length > 0 ? 'selling' : 'buying';
		return [{ key, label: `${roleLabel(key)} conversations`, conversations: filtered }];
	};

	const buildGroupedSections = (
		conversations: ConversationView[],
		filter: RoleFilter
	): GroupSection[] => {
		const filtered = applyRoleFilter(conversations, filter);
		if (filtered.length === 0) return [];

		const buckets: RoleBucket[] = [];
		if (filter === 'selling') buckets.push('selling');
		else if (filter === 'buying') buckets.push('buying');
		else {
			if (filtered.some((conversation) => conversation.role === 'seller')) buckets.push('selling');
			if (filtered.some((conversation) => conversation.role === 'buyer')) buckets.push('buying');
		}

		return buckets
			.map((bucket) => {
				const bucketConversations = [...filtered]
					.filter((conversation) => toRoleBucket(conversation.role) === bucket)
					.sort(sortThreads);

				const groups = new Map<string, ListingGroup>();
				for (const conversation of bucketConversations) {
					const key = `${bucket}:${conversation.adId}`;
					const existing = groups.get(key);
					if (existing) {
						existing.conversations.push(conversation);
						existing.unreadCount += conversation.unreadCount;
						if (timeValue(conversation.lastMessageAt) > timeValue(existing.latestAt)) {
							existing.latestAt = conversation.lastMessageAt;
						}
						continue;
					}
					groups.set(key, {
						key,
						role: bucket,
						adId: conversation.adId,
						adTitle: conversation.adTitle,
						adPrice: conversation.adPrice,
						adCurrency: conversation.adCurrency,
						latestAt: conversation.lastMessageAt,
						unreadCount: conversation.unreadCount,
						conversations: [conversation]
					});
				}

				const sectionGroups = [...groups.values()]
					.map((group) => ({
						...group,
						conversations: [...group.conversations].sort(sortThreads)
					}))
					.sort((a, b) => {
						const aHasUnread = a.unreadCount > 0;
						const bHasUnread = b.unreadCount > 0;
						if (aHasUnread !== bHasUnread) return aHasUnread ? -1 : 1;
						if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
						return timeValue(b.latestAt) - timeValue(a.latestAt);
					});

				return {
					key: bucket,
					label: `${roleLabel(bucket)} conversations`,
					groups: sectionGroups,
					unreadCount: sectionGroups.reduce((sum, group) => sum + group.unreadCount, 0),
					threadCount: sectionGroups.reduce((sum, group) => sum + group.conversations.length, 0)
				} satisfies GroupSection;
			})
			.filter((section) => section.groups.length > 0);
	};
</script>

<section class="inbox">
	<header class="head">
		<h1>Messages</h1>
		<p class="sub">Manage buyer and seller conversations in one place.</p>
	</header>

	{#await data.streamed.conversations}
		<div class="loading" aria-busy="true">
			<InlineSpinner label="Loading conversations." />
			<ul class="threads skeleton-list" aria-hidden="true">
				{#each skeletonRows as row (row)}
					<li class="thread skeleton-thread">
						<div class="meta">
							<SkeletonBlock width="58%" height="1.1rem" />
							<SkeletonBlock width="78px" height="0.95rem" radius="999px" />
						</div>
						<div class="submeta">
							<SkeletonBlock width="110px" height="0.85rem" />
							<SkeletonBlock width="36%" height="0.85rem" />
						</div>
					</li>
				{/each}
			</ul>
		</div>
	{:then conversations}
		{#if conversations.length === 0}
			<div class="empty">
				<p>No messages yet.</p>
				<p class="muted">Message a seller and your conversation will appear here.</p>
				<a class="btn" href={resolve('/')}>Browse listings</a>
			</div>
		{:else}
			{@const mixedRoles = hasMixedRoles(conversations)}
			{@const effectiveRoleFilter = mixedRoles ? roleFilter : 'all'}
			{@const groupedSections = buildGroupedSections(conversations, effectiveRoleFilter)}
			{@const threadSections = buildThreadSections(conversations, effectiveRoleFilter)}

			<div class="toolbar" role="region" aria-label="Inbox view controls">
				<div class="segmented" role="group" aria-label="Layout mode">
					<button
						type="button"
						class:active={viewMode === 'grouped'}
						on:click={() => (viewMode = 'grouped')}
					>
						Grouped
					</button>
					<button
						type="button"
						class:active={viewMode === 'threads'}
						on:click={() => (viewMode = 'threads')}
					>
						Threads
					</button>
				</div>
				{#if mixedRoles}
					<div class="segmented" role="group" aria-label="Role filter">
						<button
							type="button"
							class:active={roleFilter === 'all'}
							on:click={() => (roleFilter = 'all')}
						>
							All roles
						</button>
						<button
							type="button"
							class:active={roleFilter === 'selling'}
							on:click={() => (roleFilter = 'selling')}
						>
							Selling
						</button>
						<button
							type="button"
							class:active={roleFilter === 'buying'}
							on:click={() => (roleFilter = 'buying')}
						>
							Buying
						</button>
					</div>
				{/if}
			</div>

			{#if viewMode === 'grouped'}
				{#if groupedSections.length === 0}
					<div class="empty">
						<p>No conversations for this filter.</p>
						<p class="muted">Try switching to a different role filter.</p>
					</div>
				{:else}
					<div class="sections">
						{#each groupedSections as section (section.key)}
							<section class="role-section">
								<header class="section-head">
									<h2>{section.label}</h2>
									<p>{section.threadCount} chats · {section.unreadCount} unread</p>
								</header>
								<ul class="groups">
									{#each section.groups as group (group.key)}
										<li class="group-card">
											<details open={group.unreadCount > 0}>
												<summary>
													<div class="meta">
														<h3>{group.adTitle}</h3>
														<span class="group-size"
															>{group.conversations.length}
															{section.key === 'selling' ? 'buyer chats' : 'seller chats'}</span
														>
													</div>
													<div class="submeta">
														<span class="time">{fmt(group.latestAt)}</span>
														{#if group.adPrice !== null}
															<span class="price"
																>{formatMoney(group.adPrice, group.adCurrency)}</span
															>
														{/if}
													</div>
													{#if group.unreadCount > 0}
														<span class="badge">{group.unreadCount}</span>
													{/if}
												</summary>
												<ul class="threads nested">
													{#each group.conversations as convo (convo.id)}
														{@const avatar = avatarFor(
															convo.counterpartyTag,
															convo.counterpartyName,
															34
														)}
														<li>
															<a
																class="thread nested-thread"
																href={resolve('/(app)/messages/[id]', { id: convo.id })}
															>
																<div class="meta">
																	<div class="person">
																		<span class="avatar" aria-hidden="true">
																			{#if avatar.dataUri}
																				<img src={avatar.dataUri} alt="" width="34" height="34" />
																			{:else}
																				<span class="avatar-emoji">{avatar.emoji}</span>
																			{/if}
																		</span>
																		<h3>{convo.counterpartyName}</h3>
																	</div>
																	<span class="role"
																		>{convo.role === 'seller' ? 'Selling' : 'Buying'}</span
																	>
																</div>
																<div class="submeta">
																	<span class="time">{fmt(convo.lastMessageAt)}</span>
																	{#if convo.preview}
																		<span class="preview">{convo.preview}</span>
																	{/if}
																</div>
																{#if convo.unreadCount > 0}
																	<span class="badge">{convo.unreadCount}</span>
																{/if}
															</a>
														</li>
													{/each}
												</ul>
											</details>
										</li>
									{/each}
								</ul>
							</section>
						{/each}
					</div>
				{/if}
			{:else if threadSections.length === 0}
				<div class="empty">
					<p>No conversations for this filter.</p>
					<p class="muted">Try switching to a different role filter.</p>
				</div>
			{:else}
				<div class="sections">
					{#each threadSections as section (section.key)}
						<section class="role-section">
							{#if mixedRoles || roleFilter !== 'all'}
								<header class="section-head">
									<h2>{section.label}</h2>
									<p>{section.conversations.length} chats</p>
								</header>
							{/if}
							<ul class="threads">
								{#each section.conversations as convo (convo.id)}
									{@const avatar = avatarFor(convo.counterpartyTag, convo.counterpartyName, 34)}
									<li>
										<a class="thread" href={resolve('/(app)/messages/[id]', { id: convo.id })}>
											<div class="meta">
												<h2>{convo.adTitle}</h2>
												<span class="role">{convo.role === 'seller' ? 'Selling' : 'Buying'}</span>
											</div>
											<div class="submeta">
												<div class="person">
													<span class="avatar" aria-hidden="true">
														{#if avatar.dataUri}
															<img src={avatar.dataUri} alt="" width="34" height="34" />
														{:else}
															<span class="avatar-emoji">{avatar.emoji}</span>
														{/if}
													</span>
													<span class="counterparty">{convo.counterpartyName}</span>
												</div>
												<span class="time">{fmt(convo.lastMessageAt)}</span>
											</div>
											{#if convo.preview}
												<div class="submeta">
													<span class="preview">{convo.preview}</span>
												</div>
											{/if}
											{#if convo.unreadCount > 0}
												<span class="badge">{convo.unreadCount}</span>
											{/if}
										</a>
									</li>
								{/each}
							</ul>
						</section>
					{/each}
				</div>
			{/if}
		{/if}
	{:catch}
		<div class="empty" role="alert">
			<p>Could not load messages.</p>
			<p class="muted">Refresh and try again.</p>
		</div>
	{/await}
</section>

<style>
	.inbox {
		max-width: 860px;
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
		color: color-mix(in srgb, var(--fg) 60%, transparent);
	}
	.muted {
		margin: 0;
		color: color-mix(in srgb, var(--fg) 60%, transparent);
	}
	.loading {
		display: grid;
		gap: 10px;
	}
	.skeleton-list {
		pointer-events: none;
	}
	.skeleton-thread {
		background: color-mix(in srgb, var(--fg) 4%, var(--surface));
	}
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		align-items: center;
	}
	.segmented {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px;
		border: 1px solid var(--hairline);
		border-radius: 999px;
		background: var(--surface);
	}
	.segmented button {
		border: 0;
		background: transparent;
		color: inherit;
		padding: 6px 11px;
		border-radius: 999px;
		font-weight: 700;
		cursor: pointer;
	}
	.segmented button.active {
		background: color-mix(in srgb, var(--fg) 12%, var(--bg));
	}
	.sections {
		display: grid;
		gap: 14px;
	}
	.role-section {
		display: grid;
		gap: 10px;
	}
	.section-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}
	.section-head h2 {
		margin: 0;
		font-size: 1.04rem;
	}
	.section-head p {
		margin: 0;
		font-size: 0.9rem;
		color: color-mix(in srgb, var(--fg) 60%, transparent);
	}
	.groups,
	.threads {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 10px;
	}
	.group-card {
		border: 1px solid var(--hairline);
		border-radius: 14px;
		background: var(--surface);
		overflow: hidden;
	}
	details {
		display: grid;
		gap: 0;
	}
	summary {
		list-style: none;
		cursor: pointer;
		display: grid;
		gap: 8px;
		padding: 12px;
		position: relative;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	.group-size {
		font-weight: 700;
		font-size: 0.82rem;
		color: color-mix(in srgb, var(--fg) 58%, transparent);
	}
	.thread {
		display: grid;
		gap: 8px;
		padding: 12px;
		border: 1px solid var(--hairline);
		border-radius: 14px;
		background: var(--surface);
		text-decoration: none;
		color: inherit;
		position: relative;
	}
	.nested {
		padding: 0 10px 10px;
	}
	.nested-thread {
		border-radius: 12px;
		padding: 10px;
		background: color-mix(in srgb, var(--fg) 3%, var(--surface));
	}
	.meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}
	.person {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}
	.meta h2,
	.meta h3 {
		margin: 0;
	}
	.meta h2 {
		font-size: 1.04rem;
	}
	.meta h3 {
		font-size: 0.98rem;
	}
	.role {
		font-weight: 700;
		font-size: 0.86rem;
		color: color-mix(in srgb, var(--fg) 56%, transparent);
	}
	.submeta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		font-size: 0.88rem;
		color: color-mix(in srgb, var(--fg) 64%, transparent);
	}
	.counterparty,
	.price {
		font-weight: 600;
	}
	.avatar {
		width: 34px;
		height: 34px;
		flex: 0 0 34px;
		display: grid;
		place-items: center;
		border-radius: 10px;
		border: 1px solid var(--hairline);
		overflow: hidden;
		background: color-mix(in srgb, var(--fg) 4%, var(--bg));
	}
	.avatar img {
		display: block;
		width: 34px;
		height: 34px;
	}
	.avatar-emoji {
		font-size: 1.1rem;
		line-height: 1;
	}
	.preview {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;
	}
	.badge {
		position: absolute;
		top: 10px;
		right: 10px;
		min-width: 22px;
		height: 22px;
		display: inline-grid;
		place-items: center;
		padding: 0 6px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--fg) 12%, var(--bg));
		font-weight: 700;
		font-size: 0.75rem;
	}
	.empty {
		padding: 24px;
		border: 1px dashed var(--hairline);
		border-radius: 14px;
		text-align: center;
		display: grid;
		gap: 10px;
	}
	.btn {
		justify-self: center;
		padding: 8px 14px;
		border-radius: 999px;
		border: 1px solid var(--hairline);
		text-decoration: none;
		color: inherit;
		font-weight: 700;
		background: var(--surface);
	}
	@media (max-width: 720px) {
		.section-head {
			flex-direction: column;
			align-items: flex-start;
		}
		.submeta {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
