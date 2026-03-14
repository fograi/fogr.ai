---
phase: 03
slug: email-infrastructure
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-14
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                             |
| ---------------------- | --------------------------------- |
| **Framework**          | vitest 3.x                        |
| **Config file**        | vite.config.ts (server project)   |
| **Quick run command**  | `npx vitest run --project server` |
| **Full suite command** | `npx vitest run`                  |
| **Estimated runtime**  | ~4s                               |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --project server`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement               | Test Type | Automated Command                                         | File Exists | Status   |
| -------- | ---- | ---- | ------------------------- | --------- | --------------------------------------------------------- | ----------- | -------- |
| 03-01-01 | 01   | 1    | EMAL-01                   | unit      | `npx vitest run src/lib/server/email/send.spec.ts`        | ✅          | ✅ green |
| 03-01-02 | 01   | 1    | EMAL-03, EMAL-04          | unit      | `npx vitest run src/lib/server/email/templates.spec.ts`   | ✅          | ✅ green |
| 03-02-01 | 02   | 2    | EMAL-06                   | unit      | `npx vitest run src/lib/server/email/unsubscribe.spec.ts` | ✅          | ✅ green |
| 03-02-02 | 02   | 2    | EMAL-06                   | unit      | `npx vitest run src/lib/server/email/preferences.spec.ts` | ✅          | ✅ green |
| 03-03-01 | 03   | 2    | EMAL-02, EMAL-03, EMAL-04 | unit      | `npx vitest run src/lib/server/moderation-emails.spec.ts` | ✅          | ✅ green |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior                             | Requirement | Why Manual                                        | Test Instructions                                                       |
| ------------------------------------ | ----------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| End-to-end email delivery via Resend | EMAL-01     | Requires live RESEND_API_KEY and verified domain  | Configure Resend, trigger ad approval, check inbox                      |
| Gmail one-click unsubscribe button   | EMAL-06     | Requires live email + Gmail rendering             | Send email, open in Gmail, verify "Unsubscribe" button appears          |
| Saved search digest at 08:00 UTC     | EMAL-05     | Requires live cron + Supabase + saved search data | Create saved search, wait for 08:00 UTC cron, verify email received     |
| Message notification email privacy   | EMAL-02     | Requires live message flow                        | Send message, verify notification email does not reveal sender identity |

---

## Test Coverage Summary

| Test File                 | Tests  | Coverage                                       |
| ------------------------- | ------ | ---------------------------------------------- |
| send.spec.ts              | 9      | Resend API call, error handling, return values |
| templates.spec.ts         | 37     | All 4 email templates, renderEmail, escapeHtml |
| unsubscribe.spec.ts       | 15     | HMAC token generation/verification, headers    |
| preferences.spec.ts       | 19     | Suppress/unsuppress/check via mocked Supabase  |
| moderation-emails.spec.ts | 7      | DSA email HTML, XSS prevention, branding       |
| **Total**                 | **87** |                                                |

---

## Validation Sign-Off

- [x] All tasks have automated verify
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-14
