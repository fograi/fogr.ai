---
phase: 05
slug: launch-hardening
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-14
---

# Phase 05 — Validation Strategy

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

| Task ID  | Plan | Wave | Requirement      | Test Type | Automated Command                                          | File Exists | Status   |
| -------- | ---- | ---- | ---------------- | --------- | ---------------------------------------------------------- | ----------- | -------- |
| 05-01-01 | 01   | 1    | TRST-04          | unit      | `npx vitest run src/lib/server/reseller-detection.spec.ts` | ✅          | ✅ green |
| 05-01-02 | 01   | 1    | LNCH-01          | unit      | `npx vitest run src/lib/server/new-account.spec.ts`        | ✅          | ✅ green |
| 05-02-01 | 02   | 2    | TRST-06          | unit      | `npx vitest run src/lib/safety-tips.spec.ts`               | ✅          | ✅ green |
| 05-02-02 | 02   | 2    | TRST-06, TRST-07 | E2E       | `npx playwright test e2e/mobile-audit.test.ts`             | ✅          | ✅ green |
| 05-05-01 | 05   | 5    | LNCH-03          | E2E       | `npx playwright test e2e/mobile-audit.test.ts`             | ✅          | ✅ green |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior                               | Requirement | Why Manual                                     | Test Instructions                                                                    |
| -------------------------------------- | ----------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| 30+ bicycle listings seeded            | LNCH-02     | Script execution against live DB               | Run `npx tsx scripts/seed-listings.ts`, verify 30+ active bicycle ads in browse page |
| Production hosting costs reviewed      | LNCH-04     | External dashboard review                      | Check Supabase, Cloudflare, OpenAI billing pages; confirm ~$38-43/month total        |
| Mobile UX visual review                | LNCH-03     | Requires human visual assessment               | Open DevTools at 375x812, walk critical path pages, verify no blocking UX issues     |
| Private-seller trust messaging visible | TRST-07     | Code-verified, visual confirmation recommended | Check homepage hero, about page, footer for private-seller messaging                 |

---

## Test Coverage Summary

| Test File                  | Tests  | Coverage                                                        |
| -------------------------- | ------ | --------------------------------------------------------------- |
| reseller-detection.spec.ts | 13     | 13 weighted patterns, threshold boundary, signal structure      |
| new-account.spec.ts        | 7      | Age check, ad count check, fail-open on errors                  |
| safety-tips.spec.ts        | 7      | QUICK_SAFETY_TIPS count/content, FULL_SAFETY_SECTIONS structure |
| mobile-audit.test.ts (E2E) | 13     | 375px viewport, all critical pages, safety/trust elements       |
| **Total**                  | **40** |                                                                 |

---

## Validation Sign-Off

- [x] All tasks have automated verify
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-14
