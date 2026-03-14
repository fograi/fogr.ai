import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isEmailSuppressed, suppressEmail, unsuppressEmail } from './preferences';
import type { EmailEnv } from './send';

const TEST_ENV: EmailEnv = {
	RESEND_API_KEY: 'test-key',
	PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
	SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
	UNSUBSCRIBE_SECRET: 'secret'
};

const USER_ID = 'user-uuid-abc';
const EMAIL_TYPE = 'messages';

describe('isEmailSuppressed', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns true when a suppressed preference row exists', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockResolvedValueOnce(
			new Response(JSON.stringify([{ id: 'pref-row-1' }]), { status: 200 })
		);

		const result = await isEmailSuppressed(TEST_ENV, USER_ID, EMAIL_TYPE);

		expect(result).toBe(true);
	});

	it('returns false when no suppressed preference row exists', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));

		const result = await isEmailSuppressed(TEST_ENV, USER_ID, EMAIL_TYPE);

		expect(result).toBe(false);
	});

	it('queries the email_preferences table via Supabase REST', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));

		await isEmailSuppressed(TEST_ENV, USER_ID, EMAIL_TYPE);

		const [url] = mockFetch.mock.calls[0];
		expect(String(url)).toContain('/rest/v1/email_preferences');
	});

	it('filters by user_id and email_type in the query', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));

		await isEmailSuppressed(TEST_ENV, USER_ID, 'search_alerts');

		const [url] = mockFetch.mock.calls[0];
		const urlStr = String(url);
		expect(urlStr).toContain(USER_ID);
		expect(urlStr).toContain('search_alerts');
	});

	it('returns false (fail-open) when the REST API returns an error', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockResolvedValueOnce(new Response('Internal Server Error', { status: 500 }));

		const result = await isEmailSuppressed(TEST_ENV, USER_ID, EMAIL_TYPE);

		expect(result).toBe(false);
	});

	it('returns false (fail-open) when fetch throws a network error', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockRejectedValueOnce(new Error('network failure'));

		const result = await isEmailSuppressed(TEST_ENV, USER_ID, EMAIL_TYPE);

		expect(result).toBe(false);
	});

	it('uses service role key in Authorization header', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));

		await isEmailSuppressed(TEST_ENV, USER_ID, EMAIL_TYPE);

		const [, init] = mockFetch.mock.calls[0];
		const headers = (init as RequestInit).headers as Record<string, string>;
		expect(headers['Authorization']).toBe('Bearer service-role-key');
	});
});

describe('suppressEmail', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns true on successful upsert', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockResolvedValueOnce(new Response('', { status: 201 }));

		const result = await suppressEmail(TEST_ENV, USER_ID, EMAIL_TYPE);

		expect(result).toBe(true);
	});

	it('sends a POST request to upsert the suppression row', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockResolvedValueOnce(new Response('', { status: 201 }));

		await suppressEmail(TEST_ENV, USER_ID, EMAIL_TYPE);

		const [, init] = mockFetch.mock.calls[0];
		expect((init as RequestInit).method).toBe('POST');
	});

	it('includes merge-duplicates Prefer header for upsert semantics', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockResolvedValueOnce(new Response('', { status: 201 }));

		await suppressEmail(TEST_ENV, USER_ID, EMAIL_TYPE);

		const [, init] = mockFetch.mock.calls[0];
		const headers = (init as RequestInit).headers as Record<string, string>;
		expect(headers['Prefer']).toBe('resolution=merge-duplicates');
	});

	it('sends suppressed=true in request body', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockResolvedValueOnce(new Response('', { status: 201 }));

		await suppressEmail(TEST_ENV, USER_ID, EMAIL_TYPE);

		const [, init] = mockFetch.mock.calls[0];
		const body = JSON.parse((init as RequestInit).body as string);
		expect(body.suppressed).toBe(true);
		expect(body.user_id).toBe(USER_ID);
		expect(body.email_type).toBe(EMAIL_TYPE);
	});

	it('returns false on API error without throwing', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockResolvedValueOnce(new Response('Bad Request', { status: 400 }));

		const result = await suppressEmail(TEST_ENV, USER_ID, EMAIL_TYPE);

		expect(result).toBe(false);
	});

	it('returns false on network error without throwing', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockRejectedValueOnce(new Error('network error'));

		const result = await suppressEmail(TEST_ENV, USER_ID, EMAIL_TYPE);

		expect(result).toBe(false);
	});
});

describe('unsuppressEmail', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns true on successful update', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockResolvedValueOnce(new Response('', { status: 200 }));

		const result = await unsuppressEmail(TEST_ENV, USER_ID, EMAIL_TYPE);

		expect(result).toBe(true);
	});

	it('sends a PATCH request to update the suppression row', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockResolvedValueOnce(new Response('', { status: 200 }));

		await unsuppressEmail(TEST_ENV, USER_ID, EMAIL_TYPE);

		const [, init] = mockFetch.mock.calls[0];
		expect((init as RequestInit).method).toBe('PATCH');
	});

	it('sends suppressed=false in request body', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockResolvedValueOnce(new Response('', { status: 200 }));

		await unsuppressEmail(TEST_ENV, USER_ID, EMAIL_TYPE);

		const [, init] = mockFetch.mock.calls[0];
		const body = JSON.parse((init as RequestInit).body as string);
		expect(body.suppressed).toBe(false);
	});

	it('filters by user_id and email_type in the query URL', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockResolvedValueOnce(new Response('', { status: 200 }));

		await unsuppressEmail(TEST_ENV, USER_ID, 'ad_approved');

		const [url] = mockFetch.mock.calls[0];
		const urlStr = String(url);
		expect(urlStr).toContain(USER_ID);
		expect(urlStr).toContain('ad_approved');
	});

	it('returns false on API error without throwing', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockResolvedValueOnce(new Response('Server Error', { status: 500 }));

		const result = await unsuppressEmail(TEST_ENV, USER_ID, EMAIL_TYPE);

		expect(result).toBe(false);
	});

	it('returns false on network error without throwing', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockRejectedValueOnce(new Error('connection refused'));

		const result = await unsuppressEmail(TEST_ENV, USER_ID, EMAIL_TYPE);

		expect(result).toBe(false);
	});
});
