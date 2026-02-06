import { describe, expect, it } from 'vitest';
import {
	buildAppealOutcomeEmail,
	buildModerationEmailPreviews,
	buildStatementOfReasonsEmail,
	buildTakedownEmail
} from './moderation-emails';

describe('moderation email templates', () => {
	it('builds takedown email with full context', () => {
		const email = buildTakedownEmail({
			adId: 'ad-123',
			decision: 'reject',
			reasonCategory: 'illegal',
			reasonDetails: 'Item violates policy.',
			legalBasis: 'Terms 4.3',
			reportId: 'report-1',
			baseUrl: 'https://example.com'
		});

		expect(email.subject).toContain('removed');
		expect(email.body).toContain('ad-123');
		expect(email.body).toContain('Decision: reject');
		expect(email.body).toContain('Reason category: illegal');
		expect(email.body).toContain('Statement of reasons: Item violates policy.');
		expect(email.body).toContain('Legal or policy basis: Terms 4.3');
		expect(email.body).toContain('Report reference: report-1');
		expect(email.body).toContain('https://example.com/ad/ad-123');
	});

	it('builds statement of reasons email', () => {
		const email = buildStatementOfReasonsEmail({
			adId: 'ad-777',
			decision: 'expire',
			reasonCategory: 'spam',
			reasonDetails: 'Repeated spam content.',
			baseUrl: 'https://example.com'
		});

		expect(email.subject).toContain('Statement of reasons');
		expect(email.body).toContain('ad-777');
		expect(email.body).toContain('Decision: expire');
		expect(email.body).toContain('Reason category: spam');
		expect(email.body).toContain('Facts and circumstances: Repeated spam content.');
		expect(email.body).toContain('https://example.com/ad/ad-777');
	});

	it('builds appeal outcome email', () => {
		const email = buildAppealOutcomeEmail({
			adId: 'ad-999',
			outcome: 'resolved',
			appealId: 'appeal-1',
			baseUrl: 'https://example.com'
		});

		expect(email.subject).toContain('resolved');
		expect(email.body).toContain('ad-999');
		expect(email.body).toContain('Appeal reference: appeal-1');
		expect(email.body).toContain('https://example.com/ad/ad-999');
	});

	it('builds moderation previews with takedown when rejecting', () => {
		const preview = buildModerationEmailPreviews({
			adId: 'ad-222',
			decision: 'reject',
			reasonCategory: 'illegal',
			reasonDetails: 'Policy violation.'
		});

		expect(preview.statement.subject).toContain('Statement of reasons');
		expect(preview.takedown?.subject).toContain('removed');
	});

	it('builds moderation previews without takedown when restoring', () => {
		const preview = buildModerationEmailPreviews({
			adId: 'ad-333',
			decision: 'restore',
			reasonCategory: 'other',
			reasonDetails: 'Restored after review.'
		});

		expect(preview.statement.subject).toContain('Statement of reasons');
		expect(preview.takedown).toBeUndefined();
	});
});
