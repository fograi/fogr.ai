<script lang="ts">
	import type { ActionData } from './$types';

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
	export let form: ActionData | null | undefined;

	type EmailTemplate = { subject: string; body: string };
	type AppealEmailPreview = {
		appealId: string;
		adId: string;
		outcome: 'resolved' | 'dismissed';
		template: EmailTemplate;
	};
	type ModerationEmailPreview = {
		appealId: string;
		adId: string;
		actionType: string;
		statement: EmailTemplate;
		takedown?: EmailTemplate | null;
	};

	let copyStatus = '';
	let copyError = '';
	let lastPreviewKey = '';

	const extractAppealPreview = (value: ActionData | null | undefined): AppealEmailPreview | null => {
		if (!value || typeof value !== 'object') return null;
		if ('emailPreview' in value && value.emailPreview) {
			return value.emailPreview as AppealEmailPreview;
		}
		return null;
	};

	const extractModerationPreview = (
		value: ActionData | null | undefined
	): ModerationEmailPreview | null => {
		if (!value || typeof value !== 'object') return null;
		if ('moderationEmailPreview' in value && value.moderationEmailPreview) {
			return value.moderationEmailPreview as ModerationEmailPreview;
		}
		return null;
	};

	$: activeAppealPreview = extractAppealPreview(form);
	$: activeModerationPreview = extractModerationPreview(form);
	$: activePreviewKey =
		activeAppealPreview
			? `appeal:${activeAppealPreview.appealId}:${activeAppealPreview.adId}`
			: activeModerationPreview
				? `mod:${activeModerationPreview.appealId}:${activeModerationPreview.adId}`
				: '';
	$: {
		if (activePreviewKey !== lastPreviewKey) {
			copyStatus = '';
			copyError = '';
			lastPreviewKey = activePreviewKey;
		}
	}

	const previewForAppeal = (appeal: AppealRow): AppealEmailPreview | null => {
		if (!activeAppealPreview) return null;
		if (activeAppealPreview.appealId === appeal.id) return activeAppealPreview;
		return null;
	};

	const moderationPreviewForAppeal = (appeal: AppealRow): ModerationEmailPreview | null => {
		if (!activeModerationPreview) return null;
		if (activeModerationPreview.appealId === appeal.id) return activeModerationPreview;
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
		{ value: 'resolved', label: 'Resolved' },
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
		<h1>Appeals</h1>
		<p class="sub">{data.appeals.length} appeals</p>
	</header>

	{#if data.appeals.length === 0}
		<p class="empty">No appeals yet.</p>
	{:else}
		<div class="appeal-list">
			{#each data.appeals as appeal}
				{@const appealPreview = previewForAppeal(appeal)}
				{@const moderationPreview = moderationPreviewForAppeal(appeal)}
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

					<details class="action-panel">
						<summary>Take action on ad</summary>
						<form method="post" action="?/takeAction" class="action-form">
							<input type="hidden" name="appeal_id" value={appeal.id} />

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
										<option value={option.value}>{option.label}</option>
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

					{#if appealPreview}
						<div class="email-preview">
							<h3>Email template</h3>
							<p class="meta">Generated from the last appeal status update.</p>
							{#if copyStatus}
								<p class="copy-status" aria-live="polite">{copyStatus}</p>
							{/if}
							{#if copyError}
								<p class="error" aria-live="assertive">{copyError}</p>
							{/if}

							<div class="email-block">
								<h4>Appeal outcome ({appealPreview.outcome})</h4>
								<div class="email-field">
									<span class="email-label">Subject</span>
									<div class="email-row">
										<input type="text" value={appealPreview.template.subject} readonly />
										<button
											type="button"
											on:click={() =>
												copyText(appealPreview.template.subject, 'Appeal subject copied.')
											}
										>
											Copy subject
										</button>
									</div>
								</div>
								<div class="email-field">
									<span class="email-label">Body</span>
									<div class="email-row">
										<textarea rows="7" readonly>{appealPreview.template.body}</textarea>
										<button
											type="button"
											on:click={() =>
												copyText(appealPreview.template.body, 'Appeal body copied.')
											}
										>
											Copy body
										</button>
									</div>
								</div>
							</div>
						</div>
					{/if}

					{#if moderationPreview}
						<div class="email-preview">
							<h3>Moderation emails</h3>
							<p class="meta">Generated from the last action on this appeal.</p>
							{#if copyStatus}
								<p class="copy-status" aria-live="polite">{copyStatus}</p>
							{/if}
							{#if copyError}
								<p class="error" aria-live="assertive">{copyError}</p>
							{/if}

							<div class="email-block">
								<h4>Statement of reasons</h4>
								<div class="email-field">
									<span class="email-label">Subject</span>
									<div class="email-row">
										<input type="text" value={moderationPreview.statement.subject} readonly />
										<button
											type="button"
											on:click={() =>
												copyText(
													moderationPreview.statement.subject,
													'Statement subject copied.'
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
										<textarea rows="8" readonly>{moderationPreview.statement.body}</textarea>
										<button
											type="button"
											on:click={() =>
												copyText(
													moderationPreview.statement.body,
													'Statement body copied.'
												)
											}
										>
											Copy body
										</button>
									</div>
								</div>
							</div>

							{#if moderationPreview.takedown}
								<div class="email-block">
									<h4>Takedown notice</h4>
									<div class="email-field">
										<span class="email-label">Subject</span>
										<div class="email-row">
											<input type="text" value={moderationPreview.takedown.subject} readonly />
											<button
												type="button"
												on:click={() =>
													moderationPreview.takedown &&
													copyText(
														moderationPreview.takedown.subject,
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
											<textarea rows="7" readonly>{moderationPreview.takedown.body}</textarea>
											<button
												type="button"
												on:click={() =>
													moderationPreview.takedown &&
													copyText(
														moderationPreview.takedown.body,
														'Takedown body copied.'
													)
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
</section>

<style>
	.admin {
		max-width: 1100px;
		margin: 24px auto 48px;
		padding: 0 var(--page-pad);
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
		flex-wrap: wrap;
	}
	.card-header > div {
		min-width: 0;
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
		width: 100%;
		box-sizing: border-box;
	}
	.email-preview {
		border-top: 1px solid var(--hairline);
		padding-top: 12px;
		display: grid;
		gap: 10px;
	}
	.email-preview h3 {
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
	.email-block h4 {
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
