---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 04-03-PLAN.md
last_updated: '2026-03-13T19:27:10Z'
last_activity: 2026-03-13 -- Phase 4 plan 03 complete (watchlist save/unsave and management page)
progress:
  total_phases: 6
  completed_phases: 3
  total_plans: 18
  completed_plans: 16
  percent: 89
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-11)

**Core value:** Anyone in Ireland can post and find classified ads with minimal effort -- brief, honest listings without noise
**Current focus:** Phase 4 -- Engagement and Retention (executing)

## Current Position

Phase: 4 of 6 (Engagement and Retention) -- IN PROGRESS
Plan: 5 of 6 complete in current phase
Status: Executing
Last activity: 2026-03-13 -- Phase 4 plan 03 complete (watchlist save/unsave and management page)

Progress: [########░░] 89%

## Performance Metrics

**Velocity:**

- Total plans completed: 16
- Average duration: 8min
- Total execution time: 131min

**By Phase:**

| Phase                     | Plans | Total | Avg/Plan |
| ------------------------- | ----- | ----- | -------- |
| 1. Slug Migration         | 2/2   | 14min | 7min     |
| 2. SEO Foundation         | 6/6   | 34min | 6min     |
| 3. Email Infrastructure   | 4/4   | 14min | 4min     |
| 4. Engagement & Retention | 5/6   | 69min | 14min    |

**Recent Trend:**

- Last 5 plans: 2min, 3min, 15min, 45min, 6min
- Trend: recovery from 04-04 spike; watchlist plan executed cleanly

_Updated after each plan completion_

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Slug migration isolated as Phase 1 -- UUID URLs make all downstream SEO worthless; this is the load-bearing prerequisite
- [Roadmap]: Revenue deferred to v2 -- premature monetization identified as an active risk before organic inventory is established
- [Roadmap]: Supabase Pro upgrade is required before launch (free tier pauses after 1 week inactivity -- Googlebot 503s)
- [Roadmap]: Programmatic SEO pages gated at 5+ active listings to avoid thin-page Google penalty
- [Roadmap]: New-account listing hold queue required -- spam flooding the moderation gap is a pre-launch blocker
- [01-01]: Used slugify + nanoid for slug generation -- battle-tested, tiny, ESM-compatible
- [01-01]: 8-char alphanumeric short IDs using full 36-char alphabet (a-z0-9) via nanoid customAlphabet
- [01-01]: Collision handling via retry with new short ID (max 3 attempts), not counter append
- [01-01]: Supabase types manually updated with slug/short_id -- will regenerate after migration runs
- [01-02]: Ad page queries Supabase directly by short_id -- avoids modifying UUID-based cache keys
- [01-02]: Admin appeals and messages pages keep UUID links with 301 redirect fallback
- [01-02]: Homepage and category page mappers include slug in AdCard data
- [02-01]: Expired ads changed from owner-only to publicly visible with noindex -- preserves inbound link equity
- [02-01]: OG fallback images generated via sharp from SVG with category-colored gradient backgrounds
- [02-01]: JSON-LD serialized with XSS prevention via .replace(/</g, '\\u003c')
- [02-01]: SEO data pattern established: server load returns seo object consumed by svelte:head block
- [02-02]: Flat URL structure with param matchers: /bikes, /dublin, /bikes/dublin -- no /category/ prefix
- [02-02]: County slug utility in src/lib/seo/county-slugs.ts for reuse by sitemap and expired ads
- [02-02]: noindex threshold set to 3 listings per user decision in CONTEXT.md
- [02-03]: Hand-rolled XML sitemap instead of super-sitemap -- directory-tree dependency incompatible with Cloudflare Workers
- [02-03]: AI crawlers explicitly allowed in robots.txt (GPTBot, ClaudeBot, PerplexityBot, etc.) for AI discovery
- [02-03]: Sitemap uses anon-key client (locals.supabase) for public data -- no service-role key needed
- [02-04]: Similar listings use county-filter-first approach: >= 3 county matches uses locality, otherwise falls back to category-only
- [02-04]: Report button hidden on expired ads since they auto-remove
- [02-04]: Expired ads publicly visible without login; only moderation-removed ads remain owner-only gated
- [02-05]: JSON-LD rendered as separate script tags (ItemList + BreadcrumbList) per Google recommendation
- [02-05]: All public routes verified anonymous-accessible -- no auth walls block crawlers
- [02-06]: Used home-garden.png as generic OG fallback for county pages since they are not category-specific
- [03-01]: Raw fetch() to Resend REST API instead of SDK -- matches existing cron worker Supabase REST pattern, zero new dependencies
- [03-01]: Inline CSS in email templates for maximum email client compatibility
- [03-01]: EmailEnv type decoupled from cron worker Env -- avoids coupling email modules to full worker type
- [03-01]: Template builder functions return inner HTML; callers wrap with renderEmail() for composability
- [03-02]: PlatformEnv type cast pattern for Cloudflare Worker secrets -- matches existing admin route convention
- [03-02]: Fail-open on suppressEmail in unsubscribe API: return 200 even if DB write fails
- [03-02]: resolve() from $app/paths instead of deprecated resolveRoute() for type-safe navigation links
- [03-03]: Email sends placed AFTER status updates -- ad status never blocked by email failure
- [03-03]: Rejection emails skip preference check and omit unsubscribe (DSA Article 17 compliance)
- [03-03]: Messages API email uses platform.ctx.waitUntil() for non-blocking delivery
- [03-03]: PlatformEnv type cast pattern for accessing email env vars in SvelteKit routes
- [03-04]: Digest runs at 08:00 UTC (morning in Ireland, 08:00-09:00 local depending on DST)
- [03-04]: Up to 100 saved searches processed per tick; top 3 of up to 20 matching ads shown in email
- [03-04]: last_notified_at updated per-search after send to prevent duplicate digests
- [04-01]: NI county ID is 'ie/ulster/derry' not 'ie/ulster/londonderry' -- matches actual ireland_counties.json data
- [04-01]: sale_price stored as integer cents matching existing price column pattern
- [04-01]: No DB CHECK constraint change needed for GBP -- ads-validation.ts /^[A-Z]{3}$/ already accepts any 3-letter code
- [04-02]: Sold badge uses reversed fg/bg colors (90% fg background) for maximum visibility
- [04-02]: 7-day window uses updated_at (not a separate sold_at column) for simplicity
- [04-02]: JSON-LD extracted to reactive variable to fix pre-existing eslint svelte parser issue
- [04-04]: County ID (not display name) stored in saved_searches for cron worker matching
- [04-04]: generateSearchName uses getCountyOptionById to look up display name from county ID
- [04-04]: Save button only visible when user is authenticated AND has active filters
- [04-04]: jsonLdScript() helper function pattern for SEO page JSON-LD rendering (fixes ESLint parser)
- [04-04]: Replaced URLSearchParams with string concat in homepage for ESLint svelte/prefer-svelte-reactivity
- [04-03]: Heart icon for watchlist -- lucide-svelte Heart imported as WatchlistIcon
- [04-03]: Save button placed between Share and Report in action rail per user decision
- [04-03]: Idempotent save: POST returns 200 on duplicate via Postgres 23505 unique constraint catch
- [04-03]: GET /api/watchlist returns saved:false for unauthenticated users (graceful fallback, no error)

### Pending Todos

- Regenerate Supabase types after confirming schema is stable
- [Phase 1 note]: Database was emptied during verification -- no existing ads to backfill. New ads get slugs automatically via POST handler.

### Blockers/Concerns

- [RESOLVED] React Email spike not needed -- pure TS string templates with renderEmail() confirmed working in 03-01.
- [Research flag] Saved search alert matching at scale needs schema design attention in Phase 4 -- index on `category` and `county` columns of `saved_searches` table already created; do not do a full-table scan per new listing.
- [Pre-launch gate] Supabase Pro upgrade ($25/mo) must happen before Phase 5 content seeding -- free tier database pauses after 1 week inactivity.

## Session Continuity

Last session: 2026-03-13T19:27:10Z
Stopped at: Completed 04-03-PLAN.md
Resume file: .planning/phases/04-engagement-and-retention/04-03-SUMMARY.md
