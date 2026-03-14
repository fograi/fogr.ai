import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendEmail } from './send';
import type { EmailEnv, SendEmailParams } from './send';

const TEST_ENV: EmailEnv = {
	RESEND_API_KEY: 'test-key-abc123',
	PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
	SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
	UNSUBSCRIBE_SECRET: 'secret'
};

const BASE_PARAMS: SendEmailParams = {
	to: 'user@example.com',
	subject: 'Test Subject',
	html: '<p>Hello</p>'
};

describe('sendEmail', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('sends email via Resend REST API with correct method and URL', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockResolvedValueOnce(
			new Response(JSON.stringify({ id: 'resend-id-001' }), { status: 200 })
		);

		await sendEmail(TEST_ENV, BASE_PARAMS);

		expect(mockFetch).toHaveBeenCalledOnce();
		const [url, init] = mockFetch.mock.calls[0];
		expect(url).toBe('https://api.resend.com/emails');
		expect((init as RequestInit).method).toBe('POST');
	});

	it('includes Bearer token auth header from env', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockResolvedValueOnce(
			new Response(JSON.stringify({ id: 'resend-id-002' }), { status: 200 })
		);

		await sendEmail(TEST_ENV, BASE_PARAMS);

		const [, init] = mockFetch.mock.calls[0];
		const headers = (init as RequestInit).headers as Record<string, string>;
		expect(headers['Authorization']).toBe('Bearer test-key-abc123');
	});

	it('sends from fogr.ai address in request body', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockResolvedValueOnce(
			new Response(JSON.stringify({ id: 'resend-id-003' }), { status: 200 })
		);

		await sendEmail(TEST_ENV, BASE_PARAMS);

		const [, init] = mockFetch.mock.calls[0];
		const body = JSON.parse((init as RequestInit).body as string);
		expect(body.from).toBe('fogr.ai <eolas@fogr.ai>');
	});

	it('returns Resend email ID on successful delivery', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockResolvedValueOnce(
			new Response(JSON.stringify({ id: 'resend-email-xyz' }), { status: 200 })
		);

		const result = await sendEmail(TEST_ENV, BASE_PARAMS);

		expect(result).toBe('resend-email-xyz');
	});

	it('includes recipient, subject, and HTML in request body', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ id: 'abc' }), { status: 200 }));

		const params: SendEmailParams = {
			to: 'buyer@example.com',
			subject: 'Your listing is live',
			html: '<p>Congrats</p>'
		};

		await sendEmail(TEST_ENV, params);

		const [, init] = mockFetch.mock.calls[0];
		const body = JSON.parse((init as RequestInit).body as string);
		expect(body.to).toEqual(['buyer@example.com']);
		expect(body.subject).toBe('Your listing is live');
		expect(body.html).toBe('<p>Congrats</p>');
	});

	it('forwards optional custom headers to Resend', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ id: 'abc' }), { status: 200 }));

		const params: SendEmailParams = {
			...BASE_PARAMS,
			headers: {
				'List-Unsubscribe': '<https://fogr.ai/unsub>',
				'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
			}
		};

		await sendEmail(TEST_ENV, params);

		const [, init] = mockFetch.mock.calls[0];
		const body = JSON.parse((init as RequestInit).body as string);
		expect(body.headers['List-Unsubscribe']).toBe('<https://fogr.ai/unsub>');
		expect(body.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
	});

	it('returns null and does not throw on HTTP error response', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockResolvedValueOnce(
			new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 })
		);

		const result = await sendEmail(TEST_ENV, BASE_PARAMS);

		expect(result).toBeNull();
	});

	it('returns null and does not throw on network error', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockRejectedValueOnce(new Error('fetch failed'));

		const result = await sendEmail(TEST_ENV, BASE_PARAMS);

		expect(result).toBeNull();
	});

	it('returns null on 5xx server error without throwing', async () => {
		const mockFetch = vi.mocked(fetch);
		mockFetch.mockResolvedValueOnce(new Response('Internal Server Error', { status: 500 }));

		const result = await sendEmail(TEST_ENV, BASE_PARAMS);

		expect(result).toBeNull();
	});
});
