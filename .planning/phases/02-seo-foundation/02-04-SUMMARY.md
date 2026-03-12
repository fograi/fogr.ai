---
phase: 02-seo-foundation
plan: 04
subsystem: ui, api
tags: [sveltekit, supabase, expired-ads, similar-listings, seo, noindex, 410-gone]

# Dependency graph
requires:
  - phase: 02-01
    provides: "SEO data pattern (seo object in server load, svelte:head consumption, robots noindex for expired)"
provides:
  - "Expired ad pages return HTTP 200 with full content for all visitors"
  - "410 Gone for ads expired more than 90 days"
  - "Similar active listings grid on expired ad pages (county-filter-first with category fallback)"
  - "MessageComposer hidden on expired ads"
affects: [02-05-sitemap, seo-indexing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "County-filter-first similar listings query: same category + same county, fallback to category-only if < 3 matches"
    - "JSONB deep filter pattern: filter('location_profile_data->county->>id', 'eq', countyId)"

key-files:
  created: []
  modified:
    - "src/routes/(public)/ad/[slug]/+page.server.ts"
    - "src/routes/(public)/ad/[slug]/+page.svelte"

key-decisions:
  - "Expired ads publicly visible without login; only moderation-removed ads remain owner-only"
  - "Similar listings use county-filter-first approach: >= 3 county matches keeps locality, otherwise falls back to category-only"
  - "Report button hidden on expired ads since the ad will be removed automatically"
  - "Expired banner text updated to reference similar listings below"

patterns-established:
  - "Similar listings query pattern with two-step county/category fallback"

# Metrics
duration: 4min
completed: 2026-03-12
---

# Phase 2 Plan 4: Expired Ad Pages Summary

**Expired ads publicly visible with 410 Gone after 90 days, similar listings grid using county-filter-first Supabase query, and disabled messaging**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-12T16:14:41Z
- **Completed:** 2026-03-12T16:18:51Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Expired ads return HTTP 200 for all visitors (not just owners), preserving inbound link equity
- Ads expired more than 90 days return HTTP 410 Gone
- Similar active listings grid (up to 6) shown below expired ads using county-filter-first approach
- MessageComposer and Report button hidden on expired ad pages

## Task Commits

Each task was committed atomically:

1. **Task 1: Update ad page server load** - `8975618` (feat)
2. **Task 2: Update ad page component** - `084f7de` (feat)

## Files Created/Modified
- `src/routes/(public)/ad/[slug]/+page.server.ts` - Added 410 Gone for 90+ day expired ads, similar listings county-filter-first query, isExpired/similarAds return data
- `src/routes/(public)/ad/[slug]/+page.svelte` - Expired banner, hidden MessageComposer, similar listings grid with AdCard components, responsive CSS

## Decisions Made
- Expired ads are publicly visible without any login check; only moderation-removed ads (rejected, removed, pending) remain owner-only gated
- Similar listings use county-filter-first approach: if >= 3 results from same category + same county, use those; otherwise fall back to category-only
- Report button hidden on expired ads since they auto-remove
- Expired banner text updated to "This ad has expired. Browse similar listings below." for better UX

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Updated expired banner text to reference similar listings**
- **Found during:** Task 2
- **Issue:** The original banner text "This ad has expired." gives no guidance to visitors
- **Fix:** Changed to "This ad has expired. Browse similar listings below." to improve UX and reduce bounce
- **Files modified:** src/routes/(public)/ad/[slug]/+page.svelte
- **Committed in:** 084f7de (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical UX)
**Impact on plan:** Minor UX improvement. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Expired ad pages are SEO-ready with noindex (from Plan 01) and 410 Gone for stale content
- Similar listings query pattern established for reuse
- Plan 05 (sitemap) can proceed independently

---
*Phase: 02-seo-foundation*
*Completed: 2026-03-12*
