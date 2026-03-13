---
status: testing
phase: 03-email-infrastructure
source: 03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md
started: 2026-03-13T14:00:00Z
updated: 2026-03-13T14:00:00Z
---

## Current Test

number: 1
name: Cold Start Smoke Test
expected: |
Kill any running dev server. Start the application from scratch (`pnpm dev` or equivalent).
Server boots without errors. Migrations (email_preferences, saved_searches tables) are applied.
Homepage loads and returns live data.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test

expected: Kill any running dev server. Start the application from scratch. Server boots without errors. Migrations applied. Homepage loads with live data.
result: [pending]

### 2. Unsubscribe Page — Valid Token

expected: Generate a valid unsubscribe token (or use one from a sent email). Visit /unsubscribe?token=TOKEN&type=ad_approved. Page loads showing "You've been unsubscribed from ad_approved notifications" confirmation message. No errors.
result: [pending]

### 3. Unsubscribe Page — Invalid Token

expected: Visit /unsubscribe?token=INVALID_TOKEN&type=ad_approved (or with missing/tampered token). Page shows a clear error message indicating the link is invalid or expired. No crash or blank page.
result: [pending]

### 4. Re-subscribe from Unsubscribe Page

expected: After successfully unsubscribing (test 2), the confirmation page shows a "Re-subscribe" button/link. Clicking it reverses the suppression and shows confirmation that notifications are re-enabled.
result: [pending]

### 5. Branded Email HTML Output

expected: Moderation emails (ad approved, ad rejected, new message) now use branded HTML with fogr.ai styling — blue accent (#1a73e8), footer with fogr.ai branding. They are no longer plain text. Check by reviewing email content in logs/Resend dashboard or by inspecting the template output.
result: [pending]

### 6. Approval Email on Ad Activation

expected: When an ad is approved through the moderation flow, the ad poster receives a branded HTML email with the ad title, a link to view it, and List-Unsubscribe headers. The email respects user preferences (suppressed users don't receive it).
result: [pending]

### 7. Rejection Email on Ad Rejection

expected: When an ad is rejected through the moderation flow, the ad poster receives a branded HTML rejection email with DSA Article 17 information. This email has NO unsubscribe link and NO List-Unsubscribe headers (legally required notification). It always sends regardless of email preferences.
result: [pending]

### 8. New Message Notification Email

expected: When a user sends a message about an ad via the messages API, the ad owner receives a notification email saying they have a new message. The email does NOT reveal the sender's identity. It includes unsubscribe headers and respects email preferences.
result: [pending]

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0

## Gaps

[none yet]
