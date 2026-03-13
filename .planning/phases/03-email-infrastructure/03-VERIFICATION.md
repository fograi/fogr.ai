---
phase: 03-email-infrastructure
verified: 2026-03-13T12:23:11Z
status: passed
score: 19/19 must-haves verified
re_verification: false
---

# Phase 3: Email Infrastructure Verification Report

**Phase Goal:** Build complete email infrastructure — Resend integration, branded templates, HMAC unsubscribe, email preferences, saved search alerts
**Verified:** 2026-03-13T12:23:11Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

#### Plan 01: Foundation

| #   | Truth                                                                                   | Status   | Evidence                                                                                                                        |
| --- | --------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | sendEmail() exists, calls Resend REST API, returns without blocking on failure          | VERIFIED | `src/lib/server/email/send.ts` — fetch to `https://api.resend.com/emails`, try/catch returns null on failure                    |
| 2   | All email templates produce branded HTML with logo, accent color, consistent layout     | VERIFIED | `templates.ts` — `renderEmail()` produces full DOCTYPE with `#1a73e8` accent, "fogr.ai" header, footer with privacy/terms links |
| 3   | DSA/moderation emails use HTML templates matching brand style                           | VERIFIED | `moderation-emails.ts` imports `renderEmail` and `escapeHtml`, all three DSA templates call `renderEmail()`                     |
| 4   | HMAC-signed unsubscribe tokens can be generated and verified using Web Crypto API       | VERIFIED | `unsubscribe.ts` — `crypto.subtle.sign` for generate, `crypto.subtle.verify` for timing-safe verify                             |
| 5   | Email preferences can be checked before sending suppressible emails                     | VERIFIED | `preferences.ts` — `isEmailSuppressed()` queries `/rest/v1/email_preferences`, fail-open returns false on error                 |
| 6   | email_preferences and saved_searches tables exist with correct schema, indexes, and RLS | VERIFIED | Both SQL migrations exist with CREATE TABLE, UNIQUE INDEX, partial INDEX, RLS ENABLE, policies with auth.uid() check            |

#### Plan 02: Unsubscribe Flow

| #   | Truth                                                                                | Status   | Evidence                                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7   | Clicking an unsubscribe link suppresses email type without requiring login           | VERIFIED | `/unsubscribe/+page.server.ts` load fn verifies HMAC token and calls `suppressEmail()` — no auth.getUser() check                                                  |
| 8   | Gmail/Yahoo/Outlook one-click unsubscribe (RFC 8058 POST) works and returns HTTP 200 | VERIFIED | `/api/unsubscribe/+server.ts` POST-only handler returns `new Response('{}', { status: 200 })` after suppression                                                   |
| 9   | Browser-based unsubscribe shows confirmation page with suppressed email type name    | VERIFIED | `+page.svelte` renders `"You have been unsubscribed from {data.emailType}"` where emailType is mapped to human labels                                             |
| 10  | Confirmation page offers a re-subscribe link that reverses suppression               | VERIFIED | `+page.svelte` has `<form method="POST" action="?/resubscribe">` with hidden token/type fields; `+page.server.ts` `actions.resubscribe` calls `unsuppressEmail()` |
| 11  | Invalid or tampered tokens show an error message, not a crash                        | VERIFIED | Both API and page server return structured error objects (`{ error: 'Invalid token' }`, `{ error: 'Invalid or expired link' }`) — no uncaught throws              |

#### Plan 03: Email Trigger Integration

| #   | Truth                                                                                          | Status   | Evidence                                                                                                                                                    |
| --- | ---------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 12  | A seller receives an email when their ad is approved by cron moderation                        | VERIFIED | `cron-worker.ts` line 531: `await sendApprovalEmail(env, ad)` called after `updateAdStatus(env, ad.id, ACTIVE_STATUS)`                                      |
| 13  | A seller receives an email when their ad is rejected by cron moderation                        | VERIFIED | `cron-worker.ts` line 519: `await sendRejectionEmail(env, ad)` called after `updateAdStatus(env, ad.id, REJECTED_STATUS)`                                   |
| 14  | A user who receives a new message gets an email notification without revealing sender identity | VERIFIED | `messages/+server.ts` fires async IIFE; `buildNewMessageEmailHtml` does not include sender name or ID — only ad title and CTA link                          |
| 15  | Email failures do not block ad approval/rejection or message sending                           | VERIFIED | Approval/rejection: email called after status update; message API: email in `emailPromise` IIFE with `waitUntil`, response returned unconditionally         |
| 16  | Suppressible emails check preferences before sending; DSA emails always send                   | VERIFIED | `sendApprovalEmail` calls `isEmailSuppressed`; `sendRejectionEmail` explicitly skips preference check with comment "DSA email"                              |
| 17  | Approve and new-message emails include List-Unsubscribe headers; reject emails do not          | VERIFIED | `sendApprovalEmail` calls `buildUnsubscribeHeaders(unsubUrl)`; `sendRejectionEmail` has no `headers` field; messages API includes `buildUnsubscribeHeaders` |

#### Plan 04: Saved Search Digest

| #   | Truth                                                                                              | Status   | Evidence                                                                                                                        |
| --- | -------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 18  | Saved search alert emails are delivered once daily (not every cron tick)                           | VERIFIED | `isDigestWindow = utcHour === 8 && utcMinute === 0` gate at line 585; `last_notified_at` PATCH after each send prevents re-send |
| 19  | Digest email shows count + top 3 listings + "View all" link with preferences check and unsubscribe | VERIFIED | `runSavedSearchDigest()` calls `isEmailSuppressed`, `matches.slice(0,3)`, `viewAllUrl`, `buildUnsubscribeHeaders` — all wired   |

**Score:** 19/19 truths verified

---

### Required Artifacts

| Artifact                                                    | Expected                                               | Status   | Details                                                                                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/20260312_000018_email_preferences.sql` | email_preferences table with RLS                       | VERIFIED | CREATE TABLE, UNIQUE INDEX on (user_id, email_type), RLS ENABLE, SELECT + UPDATE policies                                                            |
| `supabase/migrations/20260312_000019_saved_searches.sql`    | saved_searches table with indexes                      | VERIFIED | CREATE TABLE, user_id INDEX, partial notify INDEX WHERE notify=true, composite (category,county) INDEX, RLS ALL policy                               |
| `src/lib/server/email/send.ts`                              | sendEmail() fire-and-forget Resend REST API wrapper    | VERIFIED | Exports `sendEmail`, `EmailEnv`, `SendEmailParams`; fetch to `https://api.resend.com/emails`; try/catch returns null                                 |
| `src/lib/server/email/templates.ts`                         | renderEmail() and 4 template builders                  | VERIFIED | Exports `renderEmail`, `escapeHtml`, `buildAdApprovedEmailHtml`, `buildAdRejectedEmailHtml`, `buildNewMessageEmailHtml`, `buildSearchAlertEmailHtml` |
| `src/lib/server/email/unsubscribe.ts`                       | HMAC token generation and verification                 | VERIFIED | Exports `generateUnsubscribeToken`, `verifyUnsubscribeToken`, `buildUnsubscribeHeaders`; uses `crypto.subtle.sign/verify`                            |
| `src/lib/server/email/preferences.ts`                       | Email preference check and update functions            | VERIFIED | Exports `isEmailSuppressed`, `suppressEmail`, `unsuppressEmail`; queries `/rest/v1/email_preferences`                                                |
| `src/lib/server/moderation-emails.ts`                       | DSA email templates using new HTML renderEmail wrapper | VERIFIED | Imports `renderEmail`, `escapeHtml` from `./email/templates`; all 3 DSA builders call `renderEmail(subject, bodyHtml)`                               |
| `src/routes/api/unsubscribe/+server.ts`                     | RFC 8058 POST endpoint                                 | VERIFIED | Exports `POST` only; verifies HMAC token; calls `suppressEmail`; returns `Response('{}', { status: 200 })`                                           |
| `src/routes/(public)/unsubscribe/+page.server.ts`           | load + resubscribe form action                         | VERIFIED | Exports `load` and `actions` with `resubscribe`; verifies tokens; maps type slugs to display names                                                   |
| `src/routes/(public)/unsubscribe/+page.svelte`              | Confirmation UI with re-subscribe                      | VERIFIED | Handles all states: error, success, resubscribed; form with hidden token/type inputs; `<svelte:head>` title                                          |
| `src/cron-worker.ts` (plan 03)                              | Approval/rejection email wiring                        | VERIFIED | `sendApprovalEmail`, `sendRejectionEmail`, `getUserEmail`, `buildEmailEnv` all present; wired after status updates                                   |
| `src/cron-worker.ts` (plan 04)                              | Daily digest dispatch                                  | VERIFIED | `SavedSearch` type, `MatchingAd` type, `fetchNotifiableSearches`, `findMatchingAds`, `runSavedSearchDigest`, `isDigestWindow` gate                   |
| `src/routes/api/messages/+server.ts`                        | New message email notification                         | VERIFIED | Imports all email modules; async IIFE fire-and-forget with `waitUntil`; does not reveal sender identity                                              |

---

### Key Link Verification

#### Plan 01

| From                   | To                              | Via                            | Status   | Details                                                                                                                             |
| ---------------------- | ------------------------------- | ------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `send.ts`              | `https://api.resend.com/emails` | fetch() POST with Bearer token | VERIFIED | Line 23: `fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: \`Bearer ${env.RESEND_API_KEY}\` } })` |
| `unsubscribe.ts`       | `crypto.subtle`                 | HMAC-SHA256 sign/verify        | VERIFIED | Lines 38, 69: `crypto.subtle.sign('HMAC', key, ...)` and `crypto.subtle.verify('HMAC', key, ...)`                                   |
| `preferences.ts`       | email_preferences table         | Supabase REST API query        | VERIFIED | Lines 21-24: `new URL('/rest/v1/email_preferences', env.PUBLIC_SUPABASE_URL)` with user_id, email_type, suppressed filters          |
| `moderation-emails.ts` | `email/templates.ts`            | imports renderEmail            | VERIFIED | Line 1: `import { escapeHtml, renderEmail } from './email/templates'`                                                               |

#### Plan 02

| From                                   | To                     | Via                           | Status   | Details                                                                          |
| -------------------------------------- | ---------------------- | ----------------------------- | -------- | -------------------------------------------------------------------------------- |
| `api/unsubscribe/+server.ts`           | `email/unsubscribe.ts` | verifyUnsubscribeToken import | VERIFIED | Line 2: `import { verifyUnsubscribeToken } from '$lib/server/email/unsubscribe'` |
| `api/unsubscribe/+server.ts`           | `email/preferences.ts` | suppressEmail import          | VERIFIED | Line 3: `import { suppressEmail } from '$lib/server/email/preferences'`          |
| `(public)/unsubscribe/+page.server.ts` | `email/unsubscribe.ts` | verifyUnsubscribeToken import | VERIFIED | Line 2: `import { verifyUnsubscribeToken } from '$lib/server/email/unsubscribe'` |

#### Plan 03

| From                  | To                     | Via                      | Status   | Details                                                                                                                 |
| --------------------- | ---------------------- | ------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| `cron-worker.ts`      | `email/send.ts`        | import sendEmail         | VERIFIED | Line 8: `import { sendEmail } from './lib/server/email/send'`                                                           |
| `cron-worker.ts`      | `email/templates.ts`   | import template builders | VERIFIED | Lines 11-15: imports `renderEmail`, `buildAdApprovedEmailHtml`, `buildAdRejectedEmailHtml`, `buildSearchAlertEmailHtml` |
| `cron-worker.ts`      | `email/preferences.ts` | import isEmailSuppressed | VERIFIED | Line 17: `import { isEmailSuppressed } from './lib/server/email/preferences'`                                           |
| `messages/+server.ts` | `email/send.ts`        | import sendEmail         | VERIFIED | Line 8: `import { sendEmail } from '$lib/server/email/send'`                                                            |

#### Plan 04

| From             | To                     | Via                                 | Status   | Details                                                                                             |
| ---------------- | ---------------------- | ----------------------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| `cron-worker.ts` | `saved_searches` table | Supabase REST query for notify=true | VERIFIED | `fetchNotifiableSearches` line 330: `new URL('/rest/v1/saved_searches', ...)` with `notify=eq.true` |
| `cron-worker.ts` | `ads` table            | Supabase REST for new matching ads  | VERIFIED | `findMatchingAds` line 344: `new URL('/rest/v1/ads', ...)` with `created_at=gt.{last_notified_at}`  |
| `cron-worker.ts` | `email/templates.ts`   | import buildSearchAlertEmailHtml    | VERIFIED | Line 14: `buildSearchAlertEmailHtml` in templates import                                            |

---

### Requirements Coverage

| Requirement | Description                                                      | Status    | Evidence                                                                                                                                                                      |
| ----------- | ---------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EMAL-01     | Transactional email service integrated (Resend)                  | SATISFIED | `send.ts` — direct Resend REST API integration with RESEND_API_KEY Bearer auth                                                                                                |
| EMAL-02     | User receives email when they get a new message                  | SATISFIED | `messages/+server.ts` POST handler sends notification to recipient via fire-and-forget IIFE                                                                                   |
| EMAL-03     | Seller receives email when their ad is approved                  | SATISFIED | `cron-worker.ts` `sendApprovalEmail()` called after `updateAdStatus(ACTIVE_STATUS)`                                                                                           |
| EMAL-04     | Seller receives email when their ad is rejected with reason      | SATISFIED | `cron-worker.ts` `sendRejectionEmail()` called after `updateAdStatus(REJECTED_STATUS)`                                                                                        |
| EMAL-05     | Saved search alerts delivered on schedule (daily digest)         | SATISFIED | `runSavedSearchDigest()` gated by `isDigestWindow` at 08:00 UTC, updates `last_notified_at` to prevent re-send                                                                |
| EMAL-06     | All emails include unsubscribe link and respect user preferences | SATISFIED | `buildUnsubscribeHeaders()` on all suppressible emails; `isEmailSuppressed()` checked before all suppressible sends; RFC 8058 POST endpoint and browser page both implemented |

All 6 requirements (EMAL-01 through EMAL-06) are fully satisfied.

---

### Anti-Patterns Scan

No anti-patterns found in any Phase 3 files:

- No TODO/FIXME/PLACEHOLDER comments in email modules, unsubscribe endpoints, or cron worker additions
- No tracking pixels in `templates.ts` (confirmed by comment "No tracking pixels" and absence of `<img>` tags)
- No empty implementations — all exported functions have substantive bodies
- No stub returns (`return null`, `return {}`, `return []` only appear legitimately in error paths)
- All form handlers do real work (HMAC verify + DB upsert), not just `e.preventDefault()`

Pre-existing unrelated issue: `src/routes/home-page.server.spec.ts` has 12 TypeScript errors. These predate Phase 3 and are outside this phase's scope.

---

### Human Verification Required

The following items require human/integration testing and cannot be verified by static code analysis:

#### 1. End-to-End Resend Delivery

**Test:** Configure RESEND_API_KEY + UNSUBSCRIBE_SECRET secrets, submit a test ad for approval via cron, check inbox.
**Expected:** Branded HTML email from `eolas@fogr.ai` with "Your listing is live" subject, ad link, and working unsubscribe link.
**Why human:** Requires live Resend credentials and domain verification in Resend dashboard.

#### 2. Gmail/Yahoo One-Click Unsubscribe Button

**Test:** Send a real email with List-Unsubscribe headers to a Gmail account, wait for Gmail to render the "Unsubscribe" button in email header.
**Expected:** Gmail shows "Unsubscribe" button; clicking it POSTs to `/api/unsubscribe` and suppresses the email type.
**Why human:** Requires live email delivery; Gmail button rendering depends on Resend domain DKIM/DMARC verification.

#### 3. Unsubscribe Token Expiry Behavior

**Test:** Generate a token, modify a single character, visit `/unsubscribe?token=corrupted&type=messages`.
**Expected:** Error page shown ("Something went wrong / Invalid or expired link"), no crash, no suppression.
**Why human:** Could automate in a unit test but worth a manual smoke test for the browser UI states.

#### 4. Saved Search Digest Email Format

**Test:** Insert a saved_search row with notify=true, insert a matching ad created after last_notified_at, trigger the cron at 08:00 UTC.
**Expected:** Digest email arrives with correct search name, match count, top 3 listings with title/price/link, "View all" CTA.
**Why human:** Requires live Supabase data + live Resend delivery at correct cron window.

#### 5. Message Email Does Not Reveal Sender

**Test:** Send a message as buyer to a seller's ad. Check the notification email received by the seller.
**Expected:** Email shows "Someone sent you a message about [ad title]" with "View conversation" CTA — no buyer name, email, or message content visible.
**Why human:** Privacy requirement — must visually inspect the actual email body delivered.

---

## Summary

Phase 3 goal is fully achieved. All 19 observable truths across the four plans are verified against the actual codebase. Every required artifact exists with substantive implementation, and every key link is wired:

- **Foundation (03-01):** 4 email modules, 2 SQL migrations, migrated DSA templates — all verified to exist, export correct symbols, and implement real logic (not stubs).
- **Unsubscribe flow (03-02):** RFC 8058 POST endpoint returns HTTP 200 with empty body; browser page shows all three states (error/success/resubscribed); re-subscribe form action calls `unsuppressEmail`.
- **Email triggers (03-03):** Approval email placed after ad activation, rejection email placed after rejection status update, new-message notification is non-blocking via `waitUntil`, sender identity not exposed.
- **Saved search digest (03-04):** Daily gate at 08:00 UTC, queries `saved_searches` with `notify=true`, finds new ads since `last_notified_at`, sends digest with top 3 listings, updates timestamp to prevent re-send.
- **DSA compliance:** All three moderation email types (takedown, statement of reasons, appeal outcome) have no unsubscribe mechanism — confirmed by code inspection and 7/7 passing tests.
- **Type safety:** No TypeScript errors in any Phase 3 file (`home-page.server.spec.ts` errors are pre-existing and unrelated).
- **All 7 phase commits verified in git log** (d2c3aeb, 7ff5a03, c687e27, 9d141f0, 90dbe7b, ea243e5, 2a7102e).

---

_Verified: 2026-03-13T12:23:11Z_
_Verifier: Claude (gsd-verifier)_
