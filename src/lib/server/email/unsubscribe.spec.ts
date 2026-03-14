import { describe, it, expect } from 'vitest';
import {
	generateUnsubscribeToken,
	verifyUnsubscribeToken,
	buildUnsubscribeHeaders
} from './unsubscribe';

const SECRET = 'test-unsubscribe-secret-32chars!!';
const USER_ID = 'user-uuid-1234-5678';
const EMAIL_TYPE = 'messages';

describe('generateUnsubscribeToken', () => {
	it('produces a non-empty token string', async () => {
		const token = await generateUnsubscribeToken(SECRET, USER_ID, EMAIL_TYPE);
		expect(typeof token).toBe('string');
		expect(token.length).toBeGreaterThan(0);
	});

	it('produces a token with a dot separator between signature and payload', async () => {
		const token = await generateUnsubscribeToken(SECRET, USER_ID, EMAIL_TYPE);
		expect(token).toContain('.');
	});

	it('encodes user ID and email type in the token payload', async () => {
		const token = await generateUnsubscribeToken(SECRET, USER_ID, EMAIL_TYPE);
		const dotIndex = token.indexOf('.');
		const payloadB64 = token.slice(dotIndex + 1);
		// Restore any stripped padding for atob
		const padded = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
		const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
		const decoded = atob(padded + padding);
		expect(decoded).toBe(`${USER_ID}:${EMAIL_TYPE}`);
	});

	it('produces different tokens for different users', async () => {
		const token1 = await generateUnsubscribeToken(SECRET, 'user-aaa', EMAIL_TYPE);
		const token2 = await generateUnsubscribeToken(SECRET, 'user-bbb', EMAIL_TYPE);
		expect(token1).not.toBe(token2);
	});

	it('produces different tokens for different email types', async () => {
		const token1 = await generateUnsubscribeToken(SECRET, USER_ID, 'messages');
		const token2 = await generateUnsubscribeToken(SECRET, USER_ID, 'search_alerts');
		expect(token1).not.toBe(token2);
	});
});

describe('verifyUnsubscribeToken', () => {
	it('returns user ID and email type for a valid token', async () => {
		const token = await generateUnsubscribeToken(SECRET, USER_ID, EMAIL_TYPE);
		const result = await verifyUnsubscribeToken(SECRET, token);

		expect(result).not.toBeNull();
		expect(result?.userId).toBe(USER_ID);
		expect(result?.emailType).toBe(EMAIL_TYPE);
	});

	it('returns null for a token signed with a different secret', async () => {
		const token = await generateUnsubscribeToken('different-secret-xyz', USER_ID, EMAIL_TYPE);
		const result = await verifyUnsubscribeToken(SECRET, token);
		expect(result).toBeNull();
	});

	it('returns null for a tampered token payload', async () => {
		const token = await generateUnsubscribeToken(SECRET, USER_ID, EMAIL_TYPE);
		// Replace payload portion with a different user ID
		const dotIndex = token.indexOf('.');
		const sig = token.slice(0, dotIndex);
		const tamperedPayload = btoa('tampered-user:messages').replace(/=+$/, '');
		const tamperedToken = `${sig}.${tamperedPayload}`;

		const result = await verifyUnsubscribeToken(SECRET, tamperedToken);
		expect(result).toBeNull();
	});

	it('returns null for a completely invalid token string', async () => {
		const result = await verifyUnsubscribeToken(SECRET, 'not-a-valid-token-at-all');
		expect(result).toBeNull();
	});

	it('returns null for an empty string token', async () => {
		const result = await verifyUnsubscribeToken(SECRET, '');
		expect(result).toBeNull();
	});

	it('returns null for a token missing the dot separator', async () => {
		const result = await verifyUnsubscribeToken(SECRET, 'signaturewithoutdot');
		expect(result).toBeNull();
	});

	it('round-trips correctly for all suppressible email types', async () => {
		const emailTypes = ['messages', 'search_alerts', 'ad_approved'];

		for (const emailType of emailTypes) {
			const token = await generateUnsubscribeToken(SECRET, USER_ID, emailType);
			const result = await verifyUnsubscribeToken(SECRET, token);
			expect(result?.emailType).toBe(emailType);
		}
	});
});

describe('buildUnsubscribeHeaders', () => {
	const UNSUB_URL = 'https://fogr.ai/api/unsubscribe?token=abc123&type=messages';

	it('returns an object containing List-Unsubscribe header', () => {
		const headers = buildUnsubscribeHeaders(UNSUB_URL);
		expect(headers).toHaveProperty('List-Unsubscribe');
	});

	it('wraps the unsubscribe URL in angle brackets per RFC 8058', () => {
		const headers = buildUnsubscribeHeaders(UNSUB_URL);
		expect(headers['List-Unsubscribe']).toBe(`<${UNSUB_URL}>`);
	});

	it('includes List-Unsubscribe-Post header for one-click support', () => {
		const headers = buildUnsubscribeHeaders(UNSUB_URL);
		expect(headers).toHaveProperty('List-Unsubscribe-Post');
		expect(headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
	});
});
