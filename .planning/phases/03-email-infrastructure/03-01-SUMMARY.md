---
phase: 03-email-infrastructure
plan: 01
subsystem: email
tags: [resend, hmac, web-crypto, email-templates, supabase-rls, unsubscribe, rfc-8058]

# Dependency graph
requires:
  - phase: 01-slug-migration
    provides: slug-based ad URLs used in email links
provides:
  - sendEmail() fire-and-forget Resend REST API wrapper
  - HMAC-SHA256 unsubscribe token generation and verification
  - Email preference check/suppress/unsuppress functions
  - renderEmail() branded HTML wrapper with fogr.ai styling
  - 4 email template builders (ad approved, ad rejected, new message, search alert)
  - email_preferences table with RLS
  - saved_searches table with indexes for cron matching
  - Migrated moderation emails to branded HTML output
affects: [03-02, 03-03, 03-04, 04-engagement]

# Tech tracking
tech-stack:
  added: [resend-rest-api, web-crypto-hmac-sha256]
  patterns:
    [
      fire-and-forget-email,
      hmac-signed-tokens,
      inline-css-email-templates,
      supabase-rest-preferences
    ]

key-files:
  created:
    - src/lib/server/email/send.ts
    - src/lib/server/email/templates.ts
    - src/lib/server/email/unsubscribe.ts
    - src/lib/server/email/preferences.ts
    - supabase/migrations/20260312_000018_email_preferences.sql
    - supabase/migrations/20260312_000019_saved_searches.sql
  modified:
    - src/lib/server/moderation-emails.ts
    - src/lib/server/moderation-emails.spec.ts

key-decisions:
  - "Used raw fetch() to Resend REST API instead of SDK -- matches cron worker's existing Supabase REST pattern"
  - 'Inline CSS in email templates instead of head/external styles -- maximum email client compatibility'
  - 'Brand color #1a73e8 (clean blue) for email template accent'
  - 'DSA/moderation emails verified to have no unsubscribe mechanism (legally required notifications)'

patterns-established:
  - 'EmailEnv type: decoupled env type for email modules (RESEND_API_KEY, PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, UNSUBSCRIBE_SECRET)'
  - 'renderEmail(subject, bodyHtml): shared HTML wrapper for all email output'
  - 'escapeHtml(): XSS prevention for all user-supplied content in email templates'
  - 'Template builder pattern: functions return inner HTML string, callers wrap with renderEmail()'

# Metrics
duration: 5min
completed: 2026-03-13
---

# Phase 3 Plan 01: Email Infrastructure Foundation Summary

**Resend REST API wrapper, HMAC unsubscribe tokens via Web Crypto, branded HTML email templates, and email preference storage with Supabase RLS**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-13T11:52:57Z
- **Completed:** 2026-03-13T11:58:23Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Email infrastructure foundation: 2 SQL migrations, 4 new TypeScript modules in src/lib/server/email/
- Fire-and-forget sendEmail() wrapper that calls Resend REST API with error handling that never throws
- HMAC-SHA256 unsubscribe token generation and verification using Web Crypto API (timing-safe)
- Branded HTML email templates with fogr.ai styling, no tracking pixels, RFC 8058 List-Unsubscribe headers
- Migrated 3 existing moderation email templates from plain text to branded HTML via renderEmail()
- All 7 tests pass with updated HTML assertions including XSS escape verification

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migrations and email core utilities** - `d2c3aeb` (feat)
2. **Task 2: Email templates and moderation email migration** - `7ff5a03` (feat)

## Files Created/Modified

- `supabase/migrations/20260312_000018_email_preferences.sql` - email_preferences table with RLS for per-user suppression
- `supabase/migrations/20260312_000019_saved_searches.sql` - saved_searches table with user_id, notify, and category/county indexes
- `src/lib/server/email/send.ts` - sendEmail() fire-and-forget Resend REST API wrapper, exports EmailEnv and SendEmailParams types
- `src/lib/server/email/unsubscribe.ts` - HMAC token generation/verification via Web Crypto, RFC 8058 List-Unsubscribe headers
- `src/lib/server/email/preferences.ts` - isEmailSuppressed, suppressEmail, unsuppressEmail via Supabase REST
- `src/lib/server/email/templates.ts` - renderEmail() wrapper, escapeHtml(), 4 template builders (ad approved, ad rejected, new message, search alert)
- `src/lib/server/moderation-emails.ts` - Migrated to HTML output via renderEmail() import
- `src/lib/server/moderation-emails.spec.ts` - Updated assertions for HTML output, added XSS and branding tests

## Decisions Made

- Used raw fetch() to Resend REST API (no SDK) -- matches existing cron worker pattern for Supabase REST calls, zero new dependencies
- Inline CSS in email templates -- head/external stylesheets are unreliable across email clients
- Brand color #1a73e8 (clean blue) for email accent -- professional, accessible, consistent
- Template builder functions return inner HTML (not wrapped) -- callers compose with renderEmail() for flexibility
- DSA/moderation emails have no unsubscribe links or List-Unsubscribe headers -- legally required notifications per DSA Article 17

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all files compiled and tests passed on first run.

## User Setup Required

**External services require manual configuration.** Per plan frontmatter `user_setup`:

1. **Resend domain verification:** Verify fogr.ai domain in Resend Dashboard (adds DKIM, SPF, DMARC DNS records)
2. **RESEND_API_KEY:** Create API key in Resend Dashboard, add as Cloudflare Worker secret via `wrangler secret put RESEND_API_KEY` for both workers
3. **UNSUBSCRIBE_SECRET:** Generate via `openssl rand -hex 32`, add as Cloudflare Worker secret via `wrangler secret put UNSUBSCRIBE_SECRET` for both workers

## Next Phase Readiness

- Email infrastructure foundation is complete and ready for plans 02-04 to consume
- Plan 02 (unsubscribe endpoint + email preference UI) can import from email/unsubscribe.ts and email/preferences.ts
- Plan 03 (cron worker email integration) can import sendEmail() and template builders
- Plan 04 (saved search alerts) can use saved_searches table and buildSearchAlertEmailHtml()
- Pre-existing blocker cleared: React Email spike not needed (pure TS string templates confirmed working)

## Self-Check: PASSED

- All 8 files exist on disk
- Both task commits (d2c3aeb, 7ff5a03) found in git log
- All expected exports verified: sendEmail, EmailEnv, SendEmailParams, generateUnsubscribeToken, verifyUnsubscribeToken, buildUnsubscribeHeaders, isEmailSuppressed, suppressEmail, unsuppressEmail, escapeHtml, renderEmail, buildAdApprovedEmailHtml, buildAdRejectedEmailHtml, buildNewMessageEmailHtml, buildSearchAlertEmailHtml

---

_Phase: 03-email-infrastructure_
_Completed: 2026-03-13_
