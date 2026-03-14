# Project Retrospective

_A living document updated after each milestone. Lessons feed forward into future planning._

## Milestone: v1.0 — Fogr.ai Launch

**Shipped:** 2026-03-14
**Phases:** 7 | **Plans:** 27 | **Execution time:** 209 minutes

### What Was Built

- Human-readable ad URLs with slug migration and 301 redirects from UUID links
- Full SEO foundation: meta tags, JSON-LD, sitemap, robots.txt, OG tags, programmatic category+location pages
- Transactional email system with Resend: approval, rejection, message notifications, saved search alerts
- Engagement features: watchlist, saved searches with daily email alerts, timestamps, sold badges
- Launch hardening: new-account hold, reseller detection, safety UI, private-seller positioning, 192 seed listings
- Infrastructure: health endpoint, ops runbooks, cost control documentation

### What Worked

- **Strict dependency chain** — slug migration first, then SEO, then email, then engagement. Each phase built cleanly on the previous one without rework
- **Fire-and-forget email pattern** — placing email sends AFTER status updates meant email failures never blocked core operations
- **Param matcher routing** — SvelteKit param matchers for /bikes, /dublin, /bikes/dublin avoided route conflicts with static pages like /about
- **Existing cron worker as integration backbone** — adding email triggers, saved search digests, and reseller detection to the existing cron worker kept architecture simple
- **Phase 7 gap closure pattern** — creating a documentation-only phase to close audit gaps was efficient (4 minutes, no source changes)
- **Yolo mode** — auto-approval of scope checks eliminated confirmation prompts, keeping velocity high across 27 plans

### What Was Inefficient

- **SUMMARY one-liners** — never populated by any of the 27 plan executions, making milestone accomplishment extraction manual
- **Phase 01 VERIFICATION.md missed** — first phase executed before verification workflow was established; required Phase 7 to close
- **County param mismatch** — cron-worker.ts used `?county=` while homepage used `?county_id=`, discovered only during re-audit; caught before launch but could have been prevented by an integration test
- **Nyquist validation retroactive** — all 6 phases validated after completion rather than during; added 362 tests but the timing reduced their value as development feedback

### Patterns Established

- **SEO data pattern**: server load returns `seo` object (title, description, canonical, og, jsonLd, robots) consumed by svelte:head block — reusable across all page types
- **PlatformEnv type cast**: `(platform?.env as unknown as PlatformEnv)` for accessing Cloudflare Worker secrets in SvelteKit routes
- **Email module architecture**: `send.ts` (transport), `templates.ts` (rendering), `unsubscribe.ts` (tokens), `preferences.ts` (suppression) — cleanly separated concerns
- **Collision retry loop**: `for (attempt...) { insert(); if (23505) continue; }` for slug and saved search deduplication
- **County-filter-first fallback**: query county matches first, fall back to broader category-only if < 3 results
- **Raw fetch() over SDKs**: both Supabase REST and Resend REST use fetch() directly — zero SDK dependencies in cron worker

### Key Lessons

1. **Slug migration must be Phase 1** — all downstream SEO work is worthless on UUID URLs. This was correctly identified and executed.
2. **Email infrastructure before engagement** — saved search alerts depend on working email. Strict ordering prevented integration gaps.
3. **Private-seller positioning is a genuine differentiator** — the trust messaging and reseller detection together create a clear brand identity that Facebook Marketplace and adverts.ie lack.
4. **Documentation phases are legitimate** — Phase 7 (verification closure) took 4 minutes but closed the last audit gap. Don't resist creating phases for non-code work.
5. **The cron worker is the integration bottleneck** — moderation, email, saved search alerts, and heartbeat all run in one scheduled handler. This works at v1 scale but will need attention at growth.

### Cost Observations

- Model mix: quality profile (opus for orchestration, sonnet for agents)
- Execution: 27 plans in 209 minutes total (avg 8min/plan)
- Notable: Phase 6 (infrastructure) was the most efficient — 2 plans in 7 minutes, mostly documentation of existing capabilities

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Execution Time | Phases | Plans | Key Change                                 |
| --------- | -------------- | ------ | ----- | ------------------------------------------ |
| v1.0      | 209 min        | 7      | 27    | First milestone — established all patterns |

### Cumulative Quality

| Milestone | Requirements    | Audit Status | Nyquist       | Verification |
| --------- | --------------- | ------------ | ------------- | ------------ |
| v1.0      | 38/38 satisfied | passed       | 6/6 compliant | 7/7 passed   |

### Top Lessons (Verified Across Milestones)

1. Strict phase dependency chains prevent integration rework
2. Fire-and-forget patterns keep critical paths unblocked
3. Documentation-only phases are efficient for closing audit gaps
