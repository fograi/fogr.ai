import { describe, expect, it } from 'vitest';
import {
	buildAppealOutcomeEmail,
	buildModerationEmailPreviews,
	buildStatementOfReasonsEmail,
	buildTakedownEmail
} from './moderation-emails';

describe('moderation email templates', () => {
	it('builds takedown email with full context as HTML', () => {
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
		expect(email.body).toContain('<!DOCTYPE html>');
		expect(email.body).toContain('ad-123');
		expect(email.body).toContain('reject');
		expect(email.body).toContain('illegal');
		expect(email.body).toContain('Item violates policy.');
		expect(email.body).toContain('Terms 4.3');
		expect(email.body).toContain('report-1');
		expect(email.body).toContain('https://example.com/ad/ad-123');
		// DSA email -- no unsubscribe link
		expect(email.body).not.toContain('Unsubscribe');
	});

	it('builds statement of reasons email as HTML', () => {
		const email = buildStatementOfReasonsEmail({
			adId: 'ad-777',
			decision: 'expire',
			reasonCategory: 'spam',
			reasonDetails: 'Repeated spam content.',
			baseUrl: 'https://example.com'
		});

		expect(email.subject).toContain('Statement of reasons');
		expect(email.body).toContain('<!DOCTYPE html>');
		expect(email.body).toContain('ad-777');
		expect(email.body).toContain('expire');
		expect(email.body).toContain('spam');
		expect(email.body).toContain('Repeated spam content.');
		expect(email.body).toContain('https://example.com/ad/ad-777');
		// DSA email -- no unsubscribe link
		expect(email.body).not.toContain('Unsubscribe');
	});

	it('builds appeal outcome email as HTML', () => {
		const email = buildAppealOutcomeEmail({
			adId: 'ad-999',
			outcome: 'resolved',
			appealId: 'appeal-1',
			baseUrl: 'https://example.com'
		});

		expect(email.subject).toContain('resolved');
		expect(email.body).toContain('<!DOCTYPE html>');
		expect(email.body).toContain('ad-999');
		expect(email.body).toContain('appeal-1');
		expect(email.body).toContain('https://example.com/ad/ad-999');
		// DSA email -- no unsubscribe link
		expect(email.body).not.toContain('Unsubscribe');
	});

	it('builds moderation previews with takedown when rejecting', () => {
		const preview = buildModerationEmailPreviews({
			adId: 'ad-222',
			decision: 'reject',
			reasonCategory: 'illegal',
			reasonDetails: 'Policy violation.'
		});

		expect(preview.statement.subject).toContain('Statement of reasons');
		expect(preview.statement.body).toContain('<!DOCTYPE html>');
		expect(preview.takedown?.subject).toContain('removed');
		expect(preview.takedown?.body).toContain('<!DOCTYPE html>');
	});

	it('builds moderation previews without takedown when restoring', () => {
		const preview = buildModerationEmailPreviews({
			adId: 'ad-333',
			decision: 'restore',
			reasonCategory: 'other',
			reasonDetails: 'Restored after review.'
		});

		expect(preview.statement.subject).toContain('Statement of reasons');
		expect(preview.statement.body).toContain('<!DOCTYPE html>');
		expect(preview.takedown).toBeUndefined();
	});

	it('escapes HTML in user-supplied content', () => {
		const email = buildTakedownEmail({
			adId: 'ad-xss',
			decision: 'reject',
			reasonCategory: '<script>alert("xss")</script>',
			reasonDetails: 'Contains <b>bad</b> content & "quotes".'
		});

		expect(email.body).not.toContain('<script>');
		expect(email.body).toContain('&lt;script&gt;');
		expect(email.body).toContain('&lt;b&gt;bad&lt;/b&gt;');
		expect(email.body).toContain('&amp; &quot;quotes&quot;');
	});

	it('includes fogr.ai branding in all templates', () => {
		const takedown = buildTakedownEmail({
			adId: 'ad-brand',
			decision: 'reject',
			reasonCategory: 'spam',
			reasonDetails: 'Spam.'
		});

		expect(takedown.body).toContain('fogr-logo-email.png');
		expect(takedown.body).toContain('Buy. Sell. Done.');
		expect(takedown.body).toContain('privacy');
		expect(takedown.body).toContain('terms');
	});
});
