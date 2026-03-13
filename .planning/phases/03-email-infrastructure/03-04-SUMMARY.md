---
phase: 03-email-infrastructure
plan: 04
subsystem: email
tags: [resend, cron-worker, saved-search, digest-email, supabase-rest, unsubscribe]

# Dependency graph
requires:
  - phase: 03-email-infrastructure
    plan: 01
    provides: sendEmail(), renderEmail(), buildSearchAlertEmailHtml(), unsubscribe tokens, email preferences
  - phase: 03-email-infrastructure
    plan: 03
    provides: getUserEmail(), buildEmailEnv(), email trigger patterns in cron worker
provides:
  - Daily saved search digest email dispatch at 08:00 UTC via cron worker
  - fetchNotifiableSearches() queries saved_searches with notify=true
  - findMatchingAds() queries ads created since last_notified_at with category/county/locality filters
  - runSavedSearchDigest() orchestrates preference check, branded HTML digest, unsubscribe, and last_notified_at update
affects: [04-saved-search-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    [
      isDigestWindow-time-gate,
      saved-search-digest-loop,
      intl-number-format-currency,
      last-notified-at-dedup
    ]

key-files:
  created: []
  modified:
    - src/cron-worker.ts

key-decisions:
  - 'Digest runs at 08:00 UTC (morning in Ireland, 08:00-09:00 local depending on DST)'
  - 'Up to 100 saved searches processed per tick to stay within Cloudflare Workers CPU limits'
  - 'Up to 20 matching ads fetched per search; top 3 shown in email digest'
  - 'Intl.NumberFormat with en-IE locale for Euro currency formatting in digest emails'
  - 'last_notified_at updated per-search after send to prevent duplicate digests'

patterns-established:
  - 'isDigestWindow gate: utcHour === 8 && utcMinute === 0 for daily digest timing'
  - 'fetchNotifiableSearches(): Supabase REST query for saved searches with notify=true'
  - 'findMatchingAds(): Supabase REST query with dynamic filters from search criteria'
  - 'Search name fallback chain: search.name -> category + county -> "your saved search"'

# Metrics
duration: 2min
completed: 2026-03-13
---

# Phase 3 Plan 04: Saved Search Alerts Summary

**Daily digest email dispatch for saved searches at 08:00 UTC with top-3 listings, preference checks, unsubscribe headers, and last_notified_at deduplication**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-13T12:15:10Z
- **Completed:** 2026-03-13T12:17:35Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Cron worker dispatches saved search digest emails at 08:00 UTC daily, gated by isDigestWindow
- Each notifiable search with new matching ads gets a branded HTML digest showing count + top 3 listings (title, price, link) + "View all" URL
- Preferences checked via isEmailSuppressed for search_alerts type; suppressed users skipped
- Unsubscribe headers (List-Unsubscribe, List-Unsubscribe-Post) included on all digest emails
- last_notified_at updated after each successful send to prevent duplicate notifications

## Task Commits

Each task was committed atomically:

1. **Task 1: Saved search daily digest dispatch in cron worker** - `2a7102e` (feat)

## Files Created/Modified

- `src/cron-worker.ts` - Added SavedSearch/MatchingAd types, fetchNotifiableSearches(), findMatchingAds(), runSavedSearchDigest(), isDigestWindow gate at 08:00 UTC, imported buildSearchAlertEmailHtml from templates

## Decisions Made

- Digest time window set to 08:00 UTC -- 08:00-09:00 Irish local time depending on DST, reasonable morning delivery
- Processing limit of 100 saved searches per cron tick to stay within Cloudflare Workers CPU time limits
- Fetch up to 20 matching ads per search for accurate count, display top 3 in email
- Currency formatting uses Intl.NumberFormat('en-IE') with EUR default and zero fraction digits
- "View all" URL constructed from search criteria as query params on homepage
- Search name uses fallback chain: user-defined name -> "category in county" -> "your saved search"

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

- Pre-existing TypeScript errors in `src/routes/home-page.server.spec.ts` (12 errors) -- unrelated to this plan, from an earlier commit. The cron-worker.ts changes compile cleanly and the wrangler dry-run bundles successfully.

## User Setup Required

None -- uses the same RESEND_API_KEY and UNSUBSCRIBE_SECRET secrets configured during plan 01.

## Next Phase Readiness

- All four Phase 3 email infrastructure plans are now complete
- Saved search digest emails ready for production once saved searches exist in the database
- Phase 4 "Save this search" UI can build on this infrastructure -- the cron worker is ready to dispatch
- The saved_searches table and schema already exist from plan 01's migration

## Self-Check: PASSED

- Modified file exists: src/cron-worker.ts
- Task commit found: 2a7102e
- Key features verified: SavedSearch type, MatchingAd type, fetchNotifiableSearches, findMatchingAds, runSavedSearchDigest, isDigestWindow, buildSearchAlertEmailHtml import

---

_Phase: 03-email-infrastructure_
_Completed: 2026-03-13_
