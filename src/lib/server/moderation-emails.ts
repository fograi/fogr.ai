const SUPPORT_EMAIL = 'eolas@fogr.ai';
const DEFAULT_BASE_URL = 'https://fogr.ai';

type EmailTemplate = {
	subject: string;
	body: string;
};

type ModerationEmailContext = {
	adId: string;
	decision: string;
	reasonCategory?: string | null;
	reasonDetails?: string | null;
	legalBasis?: string | null;
	reportId?: string | null;
	baseUrl?: string;
};

type AppealOutcomeContext = {
	adId: string;
	outcome: 'resolved' | 'dismissed';
	appealId?: string | null;
	baseUrl?: string;
};

const buildAdUrl = (adId: string, baseUrl: string) => `${baseUrl.replace(/\/$/, '')}/ad/${adId}`;

export const buildTakedownEmail = (ctx: ModerationEmailContext): EmailTemplate => {
	const baseUrl = ctx.baseUrl ?? DEFAULT_BASE_URL;
	const adUrl = buildAdUrl(ctx.adId, baseUrl);
	const reasonCategory = ctx.reasonCategory ?? 'Unspecified';
	const reasonDetails = ctx.reasonDetails ?? 'No additional details provided.';
	const legalBasis = ctx.legalBasis ? `Legal or policy basis: ${ctx.legalBasis}` : '';
	const reportLine = ctx.reportId ? `Report reference: ${ctx.reportId}` : '';

	return {
		subject: 'Your fogr.ai listing was removed',
		body: [
			'Hello,',
			'',
			`We removed your listing on fogr.ai (ID: ${ctx.adId}).`,
			`Decision: ${ctx.decision}.`,
			`Reason category: ${reasonCategory}.`,
			`Statement of reasons: ${reasonDetails}`,
			legalBasis,
			reportLine,
			'',
			`If you believe this decision is incorrect, you can appeal by signing in and opening your ad: ${adUrl}`,
			'',
			`Questions? Contact us at ${SUPPORT_EMAIL}.`
		]
			.filter(Boolean)
			.join('\n')
	};
};

export const buildStatementOfReasonsEmail = (ctx: ModerationEmailContext): EmailTemplate => {
	const baseUrl = ctx.baseUrl ?? DEFAULT_BASE_URL;
	const adUrl = buildAdUrl(ctx.adId, baseUrl);
	const reasonCategory = ctx.reasonCategory ?? 'Unspecified';
	const reasonDetails = ctx.reasonDetails ?? 'No additional details provided.';
	const legalBasis = ctx.legalBasis ? `Legal or policy basis: ${ctx.legalBasis}` : '';

	return {
		subject: 'Statement of reasons for your fogr.ai listing',
		body: [
			'Hello,',
			'',
			`This message provides the statement of reasons for a moderation decision on your listing (ID: ${ctx.adId}).`,
			`Decision: ${ctx.decision}.`,
			`Reason category: ${reasonCategory}.`,
			`Facts and circumstances: ${reasonDetails}`,
			legalBasis,
			'',
			`You can review the decision in your account here: ${adUrl}`,
			'',
			`Questions? Contact us at ${SUPPORT_EMAIL}.`
		]
			.filter(Boolean)
			.join('\n')
	};
};

export const buildAppealOutcomeEmail = (ctx: AppealOutcomeContext): EmailTemplate => {
	const baseUrl = ctx.baseUrl ?? DEFAULT_BASE_URL;
	const adUrl = buildAdUrl(ctx.adId, baseUrl);
	const outcomeLabel = ctx.outcome === 'resolved' ? 'resolved' : 'dismissed';
	const appealLine = ctx.appealId ? `Appeal reference: ${ctx.appealId}` : '';

	return {
		subject: `Your fogr.ai appeal has been ${outcomeLabel}`,
		body: [
			'Hello,',
			'',
			`Your appeal for listing ${ctx.adId} has been ${outcomeLabel}.`,
			appealLine,
			'',
			`You can review the latest decision in your account: ${adUrl}`,
			'',
			`Questions? Contact us at ${SUPPORT_EMAIL}.`
		]
			.filter(Boolean)
			.join('\n')
	};
};
