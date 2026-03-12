---
created: 2026-03-12T15:55:20.281Z
title: Submit sitemap to Bing Webmaster Tools
area: seo
files:
  - src/routes/sitemap.xml/+server.ts
  - src/routes/robots.txt/+server.ts
---

## Problem

After Phase 2 ships, the sitemap.xml needs to be submitted to Bing Webmaster Tools. This is critical for AI discovery because GPTBot and ChatGPT-User rely on the Bing index to find and crawl content. Without Bing indexing, Fogr.ai listings won't appear in ChatGPT, Copilot, or other AI-powered answers that use Bing's crawl data.

Google Search Console submission is standard practice too, but Bing is the higher priority for AI surface area.

## Solution

1. Create a Bing Webmaster Tools account at https://www.bing.com/webmasters
2. Verify fogr.ai domain ownership (DNS TXT record or meta tag)
3. Submit https://fogr.ai/sitemap.xml
4. Also submit to Google Search Console for completeness
5. Monitor crawl stats to confirm AI bots are actually hitting the site
