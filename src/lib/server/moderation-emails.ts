import { escapeHtml, renderEmail } from './email/templates';

const SUPPORT_EMAIL = 'eolas@fogr.ai';
const DEFAULT_BASE_URL = 'https://fogr.ai';

type EmailTemplate = {
	subject: string;
	body: string;
};

type ModerationEmailContext = {
	adId: string;
	adSlug?: string;
	decision: string;
	reasonCategory?: string | null;
	reasonDetails?: string | null;
	legalBasis?: string | null;
	reportId?: string | null;
	baseUrl?: string;
};

export type ModerationEmailPreview = {
	statement: EmailTemplate;
	takedown?: EmailTemplate;
};

type AppealOutcomeContext = {
	adId: string;
	adSlug?: string;
	outcome: 'resolved' | 'dismissed';
	appealId?: string | null;
	baseUrl?: string;
};

const buildAdUrl = (id: string, baseUrl: string) => `${baseUrl.replace(/\/$/, '')}/ad/${id}`;

export const buildTakedownEmail = (ctx: ModerationEmailContext): EmailTemplate => {
	const baseUrl = ctx.baseUrl ?? DEFAULT_BASE_URL;
	const adUrl = buildAdUrl(ctx.adSlug ?? ctx.adId, baseUrl);
	const reasonCategory = escapeHtml(ctx.reasonCategory ?? 'Unspecified');
	const reasonDetails = escapeHtml(ctx.reasonDetails ?? 'No additional details provided.');
	const legalBasis = ctx.legalBasis
		? `<p><strong>Legal or policy basis:</strong> ${escapeHtml(ctx.legalBasis)}</p>`
		: '';
	const reportLine = ctx.reportId
		? `<p><strong>Report reference:</strong> ${escapeHtml(ctx.reportId)}</p>`
		: '';

	const subject = 'Your fogr.ai listing was removed';
	const bodyHtml = `<p>Hello,</p>
    <p>We removed your listing on fogr.ai (ID: ${escapeHtml(ctx.adId)}).</p>
    <p><strong>Decision:</strong> ${escapeHtml(ctx.decision)}.</p>
    <p><strong>Reason category:</strong> ${reasonCategory}.</p>
    <p><strong>Statement of reasons:</strong> ${reasonDetails}</p>
    ${legalBasis}
    ${reportLine}
    <p>If you believe this decision is incorrect, you can appeal by signing in and opening your ad: <a href="${escapeHtml(adUrl)}">${escapeHtml(adUrl)}</a></p>
    <p>Questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>`;

	return {
		subject,
		body: renderEmail(subject, bodyHtml)
	};
};

export const buildStatementOfReasonsEmail = (ctx: ModerationEmailContext): EmailTemplate => {
	const baseUrl = ctx.baseUrl ?? DEFAULT_BASE_URL;
	const adUrl = buildAdUrl(ctx.adSlug ?? ctx.adId, baseUrl);
	const reasonCategory = escapeHtml(ctx.reasonCategory ?? 'Unspecified');
	const reasonDetails = escapeHtml(ctx.reasonDetails ?? 'No additional details provided.');
	const legalBasis = ctx.legalBasis
		? `<p><strong>Legal or policy basis:</strong> ${escapeHtml(ctx.legalBasis)}</p>`
		: '';

	const subject = 'Statement of reasons for your fogr.ai listing';
	const bodyHtml = `<p>Hello,</p>
    <p>This message provides the statement of reasons for a moderation decision on your listing (ID: ${escapeHtml(ctx.adId)}).</p>
    <p><strong>Decision:</strong> ${escapeHtml(ctx.decision)}.</p>
    <p><strong>Reason category:</strong> ${reasonCategory}.</p>
    <p><strong>Facts and circumstances:</strong> ${reasonDetails}</p>
    ${legalBasis}
    <p>You can review the decision in your account here: <a href="${escapeHtml(adUrl)}">${escapeHtml(adUrl)}</a></p>
    <p>Questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>`;

	return {
		subject,
		body: renderEmail(subject, bodyHtml)
	};
};

export const buildAppealOutcomeEmail = (ctx: AppealOutcomeContext): EmailTemplate => {
	const baseUrl = ctx.baseUrl ?? DEFAULT_BASE_URL;
	const adUrl = buildAdUrl(ctx.adSlug ?? ctx.adId, baseUrl);
	const outcomeLabel = ctx.outcome === 'resolved' ? 'resolved' : 'dismissed';
	const appealLine = ctx.appealId
		? `<p><strong>Appeal reference:</strong> ${escapeHtml(ctx.appealId)}</p>`
		: '';

	const subject = `Your fogr.ai appeal has been ${outcomeLabel}`;
	const bodyHtml = `<p>Hello,</p>
    <p>Your appeal for listing ${escapeHtml(ctx.adId)} has been ${outcomeLabel}.</p>
    ${appealLine}
    <p>You can review the latest decision in your account: <a href="${escapeHtml(adUrl)}">${escapeHtml(adUrl)}</a></p>
    <p>Questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>`;

	return {
		subject,
		body: renderEmail(subject, bodyHtml)
	};
};

export const buildModerationEmailPreviews = (
	ctx: ModerationEmailContext
): ModerationEmailPreview => {
	const statement = buildStatementOfReasonsEmail(ctx);
	const takedown =
		ctx.decision === 'reject' || ctx.decision === 'expire' ? buildTakedownEmail(ctx) : undefined;

	return { statement, takedown };
};
