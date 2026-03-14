---
phase: 05-launch-hardening
plan: 01
subsystem: api, database
tags: [moderation, reseller-detection, noindex, private-seller, supabase]

requires:
  - phase: 01-slug-migration
    provides: slug-based ad URLs and short_id lookups
  - phase: 02-seo-foundation
    provides: noindex pattern for expired ads, SEO meta/robots infrastructure
provides:
  - isNewAccount() server utility for new-account detection
  - detectResellerSignals() with weighted scoring for commercial pattern detection
  - Private-seller checkbox server-side validation in POST /api/ads
  - moderation_hold_reason column for blocking auto-approve in cron worker
  - noindex robots directive for ads from new accounts
affects: [05-launch-hardening, admin-moderation]

tech-stack:
  added: []
  patterns:
    - 'Weighted signal scoring for heuristic detection (reseller patterns)'
    - 'Fail-open pattern for non-critical checks (isNewAccount returns false on error)'
    - 'moderation_hold_reason column as cron worker gate'

key-files:
  created:
    - src/lib/server/new-account.ts
    - src/lib/server/reseller-detection.ts
    - supabase/migrations/20260313_000022_ads_moderation_hold_reason.sql
  modified:
    - src/routes/api/ads/+server.ts
    - src/routes/(public)/ad/[slug]/+page.server.ts
    - src/cron-worker.ts

key-decisions:
  - 'Reseller threshold set to weight >= 2 so single low-weight signals (e.g. one phone number) do not trigger flagging'
  - 'Fail-open on new-account check: errors return false to avoid penalising users when Supabase admin API is unavailable'
  - 'Silent flagging: reseller-flagged ads go to pending without notifying the seller, preventing gaming'
  - 'moderation_hold_reason as a string column (not boolean) to support future hold reasons beyond reseller_flagged'

patterns-established:
  - 'Weighted heuristic scoring: DEALER_PATTERNS array with {pattern, signal, weight} objects iterated against concatenated text'
  - 'Service-role client construction in page.server.ts via platform.env for admin-level Supabase operations'
  - "PostgREST filter syntax for IS NULL: url.searchParams.set('column', 'is.null')"

duration: 9min
completed: 2026-03-14
---

# Phase 5 Plan 1: Backend Launch Hardening Summary

**Reseller signal detection with weighted scoring, private-seller validation, new-account noindex, and moderation hold gating in cron worker**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-14T00:07:28Z
- **Completed:** 2026-03-14T00:16:10Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created `isNewAccount()` utility that checks account age (<7 days) and approved ad count (<3) with fail-open error handling
- Created `detectResellerSignals()` with 13 weighted commercial patterns (call for price, stock numbers, showroom, finance, URLs, phone numbers, etc.)
- Integrated private-seller checkbox validation into POST /api/ads (returns 400 without confirmation)
- Reseller-flagged ads silently routed to pending with `moderation_hold_reason = 'reseller_flagged'`
- Ad view page sets `robots: 'noindex'` for ads from new-account sellers
- Cron worker filters out `moderation_hold_reason IS NOT NULL` so reseller-flagged ads require manual review

## Task Commits

Each task was committed atomically:

1. **Task 1: Create new-account detection and reseller detection server utilities** - `b49839d` (feat)
2. **Task 2: Integrate reseller detection, private-seller validation, and noindex into handlers** - `914c980` (feat)

## Files Created/Modified

- `src/lib/server/new-account.ts` - Async isNewAccount() check: account age + approved ad count
- `src/lib/server/reseller-detection.ts` - detectResellerSignals() with 13 weighted DEALER_PATTERNS and RESELLER_THRESHOLD=2
- `supabase/migrations/20260313_000022_ads_moderation_hold_reason.sql` - Adds moderation_hold_reason TEXT column to ads table
- `src/routes/api/ads/+server.ts` - Private-seller validation, reseller detection, moderation_hold_reason in insert
- `src/routes/(public)/ad/[slug]/+page.server.ts` - New-account noindex via service-role Supabase client
- `src/cron-worker.ts` - Filter pending ads query to exclude moderation_hold_reason IS NOT NULL

## Decisions Made

- Reseller threshold set to weight >= 2: a single phone number (weight 1) does not trigger, but "call for price" (weight 2) alone does. Two low-weight signals together also trigger.
- Fail-open on isNewAccount: if the Supabase admin API call fails, the function returns false (no noindex) rather than penalising the user.
- Silent flagging: the seller receives no notification when their ad is flagged. This prevents gaming the detection patterns.
- moderation_hold_reason is a TEXT column (not boolean) to allow future values beyond 'reseller_flagged'.
- Service-role client constructed in page.server.ts via platform.env because isNewAccount needs admin.getUserById which requires the service-role key.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- lint-staged pre-commit hooks caused stash conflicts when untracked files from other plan executions existed in the working directory. Resolved by backing up unrelated files, cleaning the working directory, committing, and then cherry-picking to produce a clean commit history.

## User Setup Required

None - no external service configuration required. The migration needs to be applied to Supabase (`supabase db push` or via dashboard).

## Next Phase Readiness

- Backend hardening complete: reseller detection, private-seller enforcement, new-account noindex all functional
- The private-seller checkbox form field needs to be added to the post form UI (may be addressed in a separate plan or as part of trust messaging)
- moderation_hold_reason column needs migration applied before deployment

## Self-Check: PASSED

All created files exist. Both commits verified in git log. All key integrations confirmed (reseller detection, private-seller validation, new-account noindex, cron worker filter, moderation_hold_reason in insert).

---

_Phase: 05-launch-hardening_
_Completed: 2026-03-14_
