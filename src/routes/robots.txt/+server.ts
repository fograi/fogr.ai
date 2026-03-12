/**
 * Dynamic robots.txt endpoint.
 *
 * Replaces static/robots.txt to enable dynamic Sitemap directive with the
 * correct origin. The static file MUST be deleted to avoid Cloudflare's
 * static asset serving from shadowing this route.
 *
 * Directives:
 * - Allow: / for all crawlers
 * - Disallow authenticated/private routes (account, admin, ads, messages, post, auth, api, login)
 * - Explicitly allow major AI crawlers for AI discovery
 * - Sitemap directive pointing to /sitemap.xml
 *
 * Cached for 24 hours.
 */

import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	const body = `User-agent: *
Allow: /

# Block authenticated/private routes
Disallow: /account
Disallow: /admin
Disallow: /ads
Disallow: /messages
Disallow: /post
Disallow: /auth
Disallow: /api
Disallow: /login

# AI Crawlers -- explicitly ALLOW to maximise AI discovery
# Being in AI-generated answers and recommendations is a key market entry strategy
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Bytespider
Allow: /

# Sitemap
Sitemap: ${url.origin}/sitemap.xml
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain',
			'Cache-Control': 'public, max-age=86400'
		}
	});
};
