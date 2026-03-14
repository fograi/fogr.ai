---
phase: 04
slug: engagement-and-retention
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-14
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                             |
| ---------------------- | --------------------------------- |
| **Framework**          | vitest 3.x + Playwright (E2E)     |
| **Config file**        | vite.config.ts (server project)   |
| **Quick run command**  | `npx vitest run --project server` |
| **Full suite command** | `npx vitest run`                  |
| **Estimated runtime**  | ~4s (unit)                        |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --project server`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement      | Test Type | Automated Command                                    | File Exists | Status   |
| -------- | ---- | ---- | ---------------- | --------- | ---------------------------------------------------- | ----------- | -------- |
| 04-01-01 | 01   | 1    | TRST-01          | unit      | `npx vitest run src/lib/utils/relative-time.spec.ts` | ✅          | ✅ green |
| 04-01-02 | 01   | 1    | TRST-02          | unit      | `npx vitest run src/lib/utils/currency.spec.ts`      | ✅          | ✅ green |
| 04-02-01 | 02   | 2    | TRST-01          | E2E       | `npx playwright test e2e/engagement.test.ts`         | ✅          | ✅ green |
| 04-03-01 | 03   | 3    | ENGR-01, ENGR-02 | E2E       | `npx playwright test e2e/engagement.test.ts`         | ✅          | ✅ green |
| 04-04-01 | 04   | 4    | ENGR-03, ENGR-05 | unit      | `npx vitest run src/lib/utils/search-name.spec.ts`   | ✅          | ✅ green |
| 04-04-02 | 04   | 4    | ENGR-03, ENGR-05 | E2E       | `npx playwright test e2e/engagement.test.ts`         | ✅          | ✅ green |
| 04-05-01 | 05   | 5    | ENGR-07, TRST-02 | E2E       | `npx playwright test e2e/engagement.test.ts`         | ✅          | ✅ green |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior                              | Requirement | Why Manual                             | Test Instructions                                                                             |
| ------------------------------------- | ----------- | -------------------------------------- | --------------------------------------------------------------------------------------------- |
| Email alerts for saved search matches | ENGR-04     | Requires live cron + Resend + Supabase | Create saved search with notify=true, post matching ad, wait for 08:00 UTC cron, verify email |
| One-click unsubscribe in alert emails | ENGR-06     | Requires live email delivery           | Receive alert email, click unsubscribe, verify preference updated                             |

---

## Test Coverage Summary

| Test File                | Tests  | Coverage                                                                |
| ------------------------ | ------ | ----------------------------------------------------------------------- |
| relative-time.spec.ts    | 12     | formatRelativeTime, formatFullDate, edge cases                          |
| currency.spec.ts         | 10     | NI counties → GBP, ROI → EUR, edge cases                                |
| search-name.spec.ts      | 8      | Auto-naming with category/county/query combinations                     |
| engagement.test.ts (E2E) | 15     | Timestamps, sold badges, watchlist, saved searches, mark sold, currency |
| **Total**                | **45** |                                                                         |

---

## Validation Sign-Off

- [x] All tasks have automated verify
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-14
