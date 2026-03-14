import { describe, it, expect } from 'vitest';
import { GET } from './+server';

function makeEvent(origin = 'https://fogr.ai') {
	return {
		url: new URL(`${origin}/robots.txt`)
	} as Parameters<typeof GET>[0];
}

describe('GET /robots.txt', () => {
	it('returns a 200 response', async () => {
		const res = await GET(makeEvent());
		expect(res.status).toBe(200);
	});

	it('returns text/plain content-type', async () => {
		const res = await GET(makeEvent());
		expect(res.headers.get('Content-Type')).toBe('text/plain');
	});

	it('allows all crawlers at root with User-agent wildcard', async () => {
		const res = await GET(makeEvent());
		const body = await res.text();
		expect(body).toContain('User-agent: *');
		expect(body).toContain('Allow: /');
	});

	it('blocks authenticated private routes', async () => {
		const res = await GET(makeEvent());
		const body = await res.text();
		expect(body).toContain('Disallow: /account');
		expect(body).toContain('Disallow: /admin');
		expect(body).toContain('Disallow: /messages');
		expect(body).toContain('Disallow: /post');
		expect(body).toContain('Disallow: /auth');
		expect(body).toContain('Disallow: /api');
		expect(body).toContain('Disallow: /login');
	});

	it('explicitly allows GPTBot crawler', async () => {
		const res = await GET(makeEvent());
		const body = await res.text();
		expect(body).toContain('User-agent: GPTBot');
	});

	it('explicitly allows ClaudeBot AI crawler', async () => {
		const res = await GET(makeEvent());
		const body = await res.text();
		expect(body).toContain('User-agent: ClaudeBot');
	});

	it('explicitly allows PerplexityBot crawler', async () => {
		const res = await GET(makeEvent());
		const body = await res.text();
		expect(body).toContain('User-agent: PerplexityBot');
	});

	it('explicitly allows all eight required AI crawlers', async () => {
		const res = await GET(makeEvent());
		const body = await res.text();
		const requiredCrawlers = [
			'GPTBot',
			'ChatGPT-User',
			'ClaudeBot',
			'anthropic-ai',
			'PerplexityBot',
			'Applebot-Extended',
			'Google-Extended',
			'Bytespider'
		];
		for (const crawler of requiredCrawlers) {
			expect(body, `expected ${crawler} in robots.txt`).toContain(`User-agent: ${crawler}`);
		}
	});

	it('includes a Sitemap directive pointing to sitemap.xml', async () => {
		const res = await GET(makeEvent());
		const body = await res.text();
		expect(body).toContain('Sitemap:');
		expect(body).toContain('sitemap.xml');
	});

	it('uses the request origin in the Sitemap directive URL', async () => {
		const res = await GET(makeEvent('https://fogr.ai'));
		const body = await res.text();
		expect(body).toContain('Sitemap: https://fogr.ai/sitemap.xml');
	});

	it('sets Cache-Control header to public with 24-hour max-age', async () => {
		const res = await GET(makeEvent());
		expect(res.headers.get('Cache-Control')).toBe('public, max-age=86400');
	});
});
