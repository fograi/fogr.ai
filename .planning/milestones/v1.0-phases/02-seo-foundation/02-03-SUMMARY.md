---
phase: 02-seo-foundation
plan: 03
subsystem: seo
tags: [sveltekit, sitemap, robots-txt, xml, ai-crawlers, cloudflare-workers]

# Dependency graph
requires:
  - phase: 02-02
    provides: Param matchers, county-slugs utility (getAllCountySlugs, countyIdToSlug), programmatic page routes
  - phase: 02-01
    provides: SEO meta utilities, category-browse slug mappings
provides:
  - Dynamic XML sitemap endpoint (GET /sitemap.xml) with active ads and programmatic pages
  - Dynamic robots.txt endpoint (GET /robots.txt) with AI crawler allow directives
affects: [02-05-final-seo-audit, google-search-console, deployment]

# Tech tracking
tech-stack:
  added: []
  patterns:
    [
      Hand-rolled XML sitemap for Cloudflare Workers compatibility,
      AI crawler explicit allow strategy in robots.txt
    ]

key-files:
  created:
    - src/routes/sitemap.xml/+server.ts
    - src/routes/robots.txt/+server.ts
  modified: []

key-decisions:
  - 'Hand-rolled XML sitemap instead of super-sitemap -- directory-tree dependency requires filesystem access unavailable on Cloudflare Workers'
  - 'Sitemap uses anon-key Supabase client via locals.supabase -- avoids service-role key for public data'
  - 'AI crawlers explicitly allowed in robots.txt: GPTBot, ChatGPT-User, ClaudeBot, anthropic-ai, PerplexityBot, Applebot-Extended, Google-Extended, Bytespider'
  - 'Listing count aggregation done in JavaScript from fetched active ads -- simpler than raw SQL GROUP BY via REST API'

patterns-established:
  - 'Hand-rolled XML sitemap pattern: fetch active ads, aggregate in JS, build URL entries with escapeXml helper'
  - 'Dynamic robots.txt pattern: SvelteKit server endpoint with url.origin for Sitemap directive'

# Metrics
duration: 8min
completed: 2026-03-12
---

# Phase 2 Plan 3: Sitemap & Robots.txt Summary

**Dynamic XML sitemap with active ads and programmatic pages, plus robots.txt with AI crawler allow directives and private route blocking**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-12T16:15:54Z
- **Completed:** 2026-03-12T16:24:08Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments

- Dynamic sitemap.xml endpoint returns valid XML with homepage, active ad URLs (with lastmod), and programmatic pages (category, county, combo) gated at >= 3 listings
- Dynamic robots.txt endpoint with Allow / default, Disallow for 8 private routes, explicit Allow for 8 AI crawlers, and dynamic Sitemap directive
- static/robots.txt removed to prevent Cloudflare static asset serving from shadowing the dynamic endpoint
- super-sitemap evaluated and rejected at build time due to Cloudflare Workers filesystem incompatibility

## Task Commits

Each task was committed atomically:

1. **Task 1: Create dynamic sitemap.xml endpoint** - `7a4fc40` (feat)
2. **Task 2: Create dynamic robots.txt endpoint and remove static file** - `473333f` (feat)
3. **Cleanup: Remove unused super-sitemap dependency** - `1d49d11` (chore)

## Files Created/Modified

- `src/routes/sitemap.xml/+server.ts` - Dynamic XML sitemap with active ads, category/county/combo programmatic pages (>= 3 listings), 1-hour cache
- `src/routes/robots.txt/+server.ts` - Dynamic robots.txt with Allow/Disallow directives, AI crawler allow blocks, Sitemap reference, 24-hour cache
- `static/robots.txt` - Deleted (was shadowing dynamic endpoint on Cloudflare)

## Decisions Made

- Used hand-rolled XML sitemap (Approach B) instead of super-sitemap library -- super-sitemap's `directory-tree` dependency uses `fs.readdirSync` which is unavailable in Cloudflare Workers runtime. The XML generation is straightforward and avoids the 28-package dependency tree.
- Sitemap uses `locals.supabase` (anon-key client from hooks) instead of creating a service-role client -- active ads are publicly readable via RLS, so no elevated permissions needed. Simpler and more consistent with existing server load patterns.
- Listing count aggregation performed in JavaScript after fetching all active ads with minimal columns -- avoids needing raw SQL GROUP BY via Supabase REST API, and the data volume is small for a new site.
- All 8 AI crawlers from the plan explicitly allowed in robots.txt -- GPTBot, ChatGPT-User, ClaudeBot, anthropic-ai, PerplexityBot, Applebot-Extended, Google-Extended, Bytespider.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] super-sitemap incompatible with Cloudflare Workers**

- **Found during:** Task 1 (sitemap.xml endpoint)
- **Issue:** super-sitemap depends on `directory-tree` which calls `fs.readdirSync` -- Cloudflare Workers have no filesystem access
- **Fix:** Used Approach B (hand-rolled XML sitemap) as specified in the plan's fallback strategy
- **Files modified:** src/routes/sitemap.xml/+server.ts
- **Verification:** `npm run build` succeeds, endpoint compiles correctly
- **Committed in:** 7a4fc40

**2. [Rule 1 - Bug] Fixed double XML-escaping of ad slugs**

- **Found during:** Task 1 (sitemap.xml endpoint) -- code review
- **Issue:** Ad slug was passed through `escapeXml()` before being passed to `buildUrlEntry()`, which also calls `escapeXml()` on the entire URL. Would double-escape `&` to `&amp;amp;` if a slug contained special characters.
- **Fix:** Removed redundant `escapeXml()` call on slug -- `buildUrlEntry()` handles escaping
- **Files modified:** src/routes/sitemap.xml/+server.ts
- **Verification:** Code review confirmed single-pass escaping
- **Committed in:** 7a4fc40

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Approach B fallback was pre-planned. Bug fix was cosmetic (slugs are URL-safe by construction). No scope creep.

## Issues Encountered

- super-sitemap installed (28 packages) then immediately uninstalled after confirming filesystem dependency -- research had correctly flagged this as LOW confidence for Cloudflare Workers
- static/robots.txt deletion was already committed by concurrent Plan 02-04 execution -- no conflict, just noted that the deletion was already done

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Sitemap ready for submission to Google Search Console (manual step post-deployment)
- Sitemap ready for submission to Bing Webmaster Tools (todo already captured)
- robots.txt AI crawler directives are live and will take effect on deployment
- Plan 02-05 (if it exists) can reference both endpoints for final SEO audit

## Self-Check: PASSED

- `src/routes/sitemap.xml/+server.ts` verified present on disk
- `src/routes/robots.txt/+server.ts` verified present on disk
- `static/robots.txt` verified deleted
- Task commit 7a4fc40 verified in git log
- Task commit 473333f verified in git log
- Cleanup commit 1d49d11 verified in git log
- `npm run build` succeeded with no errors
- `svelte-check` confirmed no type errors in new files

---

_Phase: 02-seo-foundation_
_Completed: 2026-03-12_
