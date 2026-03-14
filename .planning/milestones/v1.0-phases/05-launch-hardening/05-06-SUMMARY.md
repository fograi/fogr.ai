---
phase: 05-launch-hardening
plan: 06
subsystem: api
tags: [moderation, new-account, pending-hold, supabase, cron-worker]

# Dependency graph
requires:
  - phase: 05-launch-hardening/05-01
    provides: isNewAccount() utility and reseller detection in new-account.ts
provides:
  - isNewAccount() wired into ad POST handler for pending hold on new-account ads
  - New-account ads held in pending state with null moderation_hold_reason for cron auto-approval
affects: [cron-worker, ad-posting, moderation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'New-account pending hold via isNewAccount() in POST handler status determination'
    - 'Null moderation_hold_reason for cron-worker pickup (distinct from reseller_flagged)'

key-files:
  created: []
  modified:
    - src/routes/api/ads/+server.ts

key-decisions:
  - 'isNewAccount called with limiterClient (service-role) after rate limit check, before moderation'
  - 'New-account pending ads use null moderation_hold_reason so cron worker picks them up for auto-approval'
  - 'Bucket routing unchanged -- new-account ads with clean content go to public bucket (not visible until status=active)'
  - 'Log entry distinguishes new-account holds from reseller holds'

patterns-established:
  - 'Status override pattern: multiple conditions ORed into pending status determination'

# Metrics
duration: 2min
completed: 2026-03-14
---

# Phase 5 Plan 6: New-Account Pending Hold Summary

**Wire isNewAccount() into ad POST handler so text-only ads from new accounts are held pending until cron auto-approves**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-14T03:21:06Z
- **Completed:** 2026-03-14T03:23:22Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Closed LNCH-01 verification gap: new-account ads now get status='pending' regardless of synchronous AI moderation result
- New-account pending ads have moderation_hold_reason=null so existing cron worker auto-approval flow picks them up
- Established accounts (3+ approved ads AND 7+ days old) are completely unaffected
- Distinct log entry (ads_post_new_account_hold) for observability without conflating with reseller flags

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire isNewAccount() into ad POST handler for pending hold** - `059ad92` (feat)

## Files Created/Modified

- `src/routes/api/ads/+server.ts` - Added isNewAccount import, call after rate limit check, status/response/log integration (~17 lines added, 4 removed)

## Decisions Made

- Called isNewAccount with limiterClient (service-role client) since isNewAccount uses supabase.auth.admin.getUserById() internally
- Placed isNewAccount call after daily rate limit check to avoid unnecessary DB call for rate-limited users
- Left bucket routing unchanged for new-account ads -- images go to public bucket because content passed synchronous AI moderation; the ad itself is not visible in browse results until cron sets status=active
- Response message says "Ad submitted and pending review" for new-account ads (not silent like reseller flagging)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- LNCH-01 gap fully closed: new-account ads are held pending, cron worker handles auto-approval
- All Phase 5 launch hardening plans (01-06) complete
- Ready for Phase 6 (Infrastructure & Cost Control)

## Self-Check: PASSED

- FOUND: src/routes/api/ads/+server.ts
- FOUND: commit 059ad92
- FOUND: 05-06-SUMMARY.md

---

_Phase: 05-launch-hardening_
_Completed: 2026-03-14_
