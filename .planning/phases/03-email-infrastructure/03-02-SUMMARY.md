---
phase: 03-email-infrastructure
plan: 02
subsystem: email
tags: [rfc-8058, unsubscribe, hmac, sveltekit-routes, form-actions]

# Dependency graph
requires:
  - phase: 03-email-infrastructure
    plan: 01
    provides: verifyUnsubscribeToken, suppressEmail, unsuppressEmail, EmailEnv type
provides:
  - RFC 8058 POST endpoint for machine one-click unsubscribe (/api/unsubscribe)
  - Browser unsubscribe page with confirmation UI and re-subscribe (/unsubscribe)
affects: [03-03, 03-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [platform-env-type-cast, resolve-for-navigation-links, form-actions-for-resubscribe]

key-files:
  created:
    - src/routes/api/unsubscribe/+server.ts
    - src/routes/(public)/unsubscribe/+page.server.ts
    - src/routes/(public)/unsubscribe/+page.svelte
  modified: []

key-decisions:
  - 'PlatformEnv type cast pattern for Cloudflare Worker secrets -- matches existing admin route convention'
  - "Fail-open on suppressEmail: return 200 even if DB write fails -- user's intent to unsubscribe should never be blocked by server errors"
  - 'resolve() from $app/paths instead of deprecated resolveRoute() for type-safe navigation links'

patterns-established:
  - 'PlatformEnv type: local type cast for Cloudflare Worker secrets (RESEND_API_KEY, PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, UNSUBSCRIBE_SECRET)'
  - 'Unsubscribe-on-load: browser page suppresses email type during server load, not via form action'

requirements-completed: [EMAL-06]

# Metrics
duration: 9min
completed: 2026-03-13
---

# Phase 3 Plan 02: Unsubscribe Flow Summary

**RFC 8058 machine one-click unsubscribe API endpoint and browser confirmation page with re-subscribe form action**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-13T12:02:28Z
- **Completed:** 2026-03-13T12:12:12Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- RFC 8058 one-click unsubscribe endpoint at POST /api/unsubscribe -- accepts HMAC token, verifies via Web Crypto, suppresses email type, returns 200 with empty body (no redirects, no HTML)
- Browser unsubscribe page at /unsubscribe -- verifies token on load, immediately suppresses email type, shows confirmation with human-readable type name
- Re-subscribe form action reverses suppression, allowing users to change their mind
- Invalid/tampered/missing tokens handled gracefully with clear error messages
- Both endpoints reuse verifyUnsubscribeToken, suppressEmail, and unsuppressEmail from plan 01

## Task Commits

Each task was committed atomically:

1. **Task 1: RFC 8058 API endpoint for machine one-click unsubscribe** - `c687e27` (feat)
2. **Task 2: Browser unsubscribe page with confirmation UI** - `9d141f0` (feat)

## Files Created/Modified

- `src/routes/api/unsubscribe/+server.ts` - RFC 8058 POST endpoint: verifies HMAC token, suppresses email type, returns 200 with empty JSON
- `src/routes/(public)/unsubscribe/+page.server.ts` - Server load verifies token and suppresses email; resubscribe form action reverses suppression
- `src/routes/(public)/unsubscribe/+page.svelte` - Confirmation UI: unsubscribed/re-subscribed/error states with return-to-home links

## Decisions Made

- PlatformEnv type cast pattern (`platform?.env as PlatformEnv | undefined`) for Cloudflare Worker secrets -- matches existing admin route convention in appeals and reports pages
- Fail-open on suppressEmail in API endpoint: always return 200 even if DB write fails -- the user's unsubscribe intent should never appear to fail from the email client's perspective
- Used `resolve()` from `$app/paths` instead of deprecated `resolveRoute()` for navigation links -- satisfies `svelte/no-navigation-without-resolve` ESLint rule

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- ESLint `svelte/no-navigation-without-resolve` rule required using `resolve()` from `$app/paths` instead of string literal `href="/"` for navigation links. Resolved by importing `resolve` and using `href={resolve('/')}` in template expressions. This is a Svelte 5 / SvelteKit 2.50+ convention not yet adopted across all existing pages.

## User Setup Required

None - no external service configuration required. (UNSUBSCRIBE_SECRET and RESEND_API_KEY setup was handled in plan 01.)

## Next Phase Readiness

- Unsubscribe flow is complete and ready for use by email sending in plans 03-04
- Plan 03 (cron worker integration) can generate unsubscribe URLs using generateUnsubscribeToken() and buildUnsubscribeHeaders() from plan 01, with the endpoints from this plan handling the actual unsubscribe
- Plan 04 (saved search alerts) will include unsubscribe links that route to these endpoints
- Gmail/Yahoo/Outlook one-click unsubscribe via RFC 8058 List-Unsubscribe-Post header is fully supported

## Self-Check: PASSED

- All 3 files exist on disk
- Both task commits (c687e27, 9d141f0) found in git log
- All expected exports verified: POST (api endpoint), load (page server), actions with resubscribe (page server)

---

_Phase: 03-email-infrastructure_
_Completed: 2026-03-13_
