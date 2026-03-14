---
phase: 03-email-infrastructure
plan: 03
subsystem: email
tags: [resend, cron-worker, messages-api, fire-and-forget, waitUntil, supabase-auth-admin]

# Dependency graph
requires:
  - phase: 03-email-infrastructure
    plan: 01
    provides: sendEmail(), renderEmail(), template builders, unsubscribe tokens, email preferences
provides:
  - Cron worker sends approval email (branded HTML, unsubscribe, preference check) after ad activation
  - Cron worker sends rejection email (DSA, no unsubscribe, no preference check) after ad rejection
  - Messages API sends new-message notification email to recipient (no sender identity, suppressible)
  - getUserEmail() helper for Supabase auth admin API user lookup
  - buildEmailEnv() helper for constructing EmailEnv from cron worker Env
affects: [03-04-saved-search-alerts]

# Tech tracking
tech-stack:
  added: []
  patterns:
    [
      cron-email-after-status-update,
      waitUntil-fire-and-forget-email,
      supabase-auth-admin-user-lookup,
      platform-env-type-cast
    ]

key-files:
  created: []
  modified:
    - src/cron-worker.ts
    - src/routes/api/messages/+server.ts

key-decisions:
  - 'Email sends placed AFTER status updates -- ad status never blocked by email failure'
  - 'Rejection emails have no preference check and no unsubscribe (DSA Article 17 compliance)'
  - 'Messages API email uses platform.ctx.waitUntil() for non-blocking delivery'
  - 'PlatformEnv type cast pattern reused from unsubscribe route for env access in SvelteKit routes'
  - 'Removed unused escapeHtml import from cron worker (plan included it but no direct usage)'

patterns-established:
  - 'getUserEmail(env, userId): Supabase auth admin API lookup returns email or null on failure'
  - 'buildEmailEnv(env): Construct EmailEnv from cron worker Env for email module consumption'
  - 'PlatformEnv type cast: platform?.env as PlatformEnv for accessing email env vars in SvelteKit routes'

# Metrics
duration: 7min
completed: 2026-03-13
---

# Phase 3 Plan 03: Email Trigger Integration Summary

**Approval, rejection, and new-message emails wired into cron worker and messages API with fire-and-forget delivery, preference checks, and DSA compliance**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-13T12:02:16Z
- **Completed:** 2026-03-13T12:09:26Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Cron worker sends branded HTML approval email with unsubscribe headers after ad activation (preference-checked, suppressible)
- Cron worker sends branded HTML rejection email without unsubscribe after ad rejection (DSA email, always sends)
- Messages API sends new-message notification to recipient without revealing sender identity, using waitUntil() for non-blocking delivery
- All three email paths are fire-and-forget: failures logged, never block the primary flow

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire approval and rejection emails into cron worker** - `90dbe7b` (feat)
2. **Task 2: Wire new message email notification into messages API** - `ea243e5` (feat)

## Files Created/Modified

- `src/cron-worker.ts` - Added email imports, Env type updates (RESEND_API_KEY, UNSUBSCRIBE_SECRET), PendingAd slug field, getUserEmail() and buildEmailEnv() helpers, sendApprovalEmail() and sendRejectionEmail() functions, wired email sends after status updates in retryPendingAds loop
- `src/routes/api/messages/+server.ts` - Added email imports, PlatformEnv type, title to ad select query, fire-and-forget email notification to recipient via async IIFE with waitUntil()

## Decisions Made

- Email sends placed AFTER status updates in both cron worker paths -- ad status is never blocked by email failure
- Rejection emails skip preference check and omit unsubscribe headers (DSA Article 17 -- moderation decisions must be communicated)
- Approval emails check preferences and include List-Unsubscribe headers (user can opt out of non-essential notifications)
- Messages API uses `platform.ctx.waitUntil()` to ensure email delivery completes after HTTP response is sent
- Reused PlatformEnv type cast pattern from unsubscribe route for consistent env access in SvelteKit routes
- Removed unused `escapeHtml` import from cron worker that was in the plan but not needed by any new function

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused escapeHtml import**

- **Found during:** Task 1 (cron worker integration)
- **Issue:** Plan specified importing escapeHtml from templates.ts but none of the new cron worker functions use it directly
- **Fix:** Removed from import statement to avoid unused-import lint warning
- **Files modified:** src/cron-worker.ts
- **Verification:** wrangler deploy --dry-run succeeds, no lint warnings
- **Committed in:** 90dbe7b (Task 1 commit)

**2. [Rule 1 - Bug] Removed unused moderation-emails import**

- **Found during:** Task 1 (cron worker integration)
- **Issue:** Plan specified importing buildTakedownEmail and buildStatementOfReasonsEmail from moderation-emails.ts but the cron worker approval/rejection flow uses buildAdApprovedEmailHtml and buildAdRejectedEmailHtml from templates.ts instead
- **Fix:** Omitted the unused moderation-emails import entirely
- **Files modified:** src/cron-worker.ts
- **Verification:** All email paths work correctly with templates.ts imports only
- **Committed in:** 90dbe7b (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 bug fixes -- unused imports)
**Impact on plan:** Minimal. Both were unnecessary imports that would have caused lint warnings. No scope creep.

## Issues Encountered

- First commit attempt for Task 1 was absorbed by lint-staged stash/restore cycle into a prior commit (c687e27 from plan 03-02). The code changes were already present; the Task 1 commit (90dbe7b) captured the prettier reformatting. No code was lost.
- Unsubscribe page files from plan 03-02 were untracked and accidentally staged during Task 2 commit attempt, causing ESLint failures. Unstaged them and committed only the messages API file.

## User Setup Required

None -- this plan uses the same RESEND_API_KEY and UNSUBSCRIBE_SECRET secrets configured during plan 01 setup.

## Next Phase Readiness

- All three core transactional email types are now wired and functional
- Plan 04 (saved search alerts) can build on the same email infrastructure
- The cron worker is ready for saved search digest emails (plan 04 scope)
- Pre-existing issue: unsubscribe page (plan 03-02) has ESLint errors that need resolution

## Self-Check: PASSED

- Both modified files exist on disk
- Both task commits (90dbe7b, ea243e5) found in git log
- All key features verified: sendApprovalEmail, sendRejectionEmail, getUserEmail, buildEmailEnv in cron-worker; email notification, waitUntil, isEmailSuppressed, buildUnsubscribeHeaders in messages API

---

_Phase: 03-email-infrastructure_
_Completed: 2026-03-13_
