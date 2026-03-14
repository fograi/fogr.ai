---
phase: 06
slug: infrastructure-and-cost-control
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-14
---

# Phase 06 — Validation Strategy

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

| Task ID  | Plan | Wave | Requirement | Test Type | Automated Command                                     | File Exists | Status   |
| -------- | ---- | ---- | ----------- | --------- | ----------------------------------------------------- | ----------- | -------- |
| 06-01-01 | 01   | 1    | INFR-02     | unit      | `npx vitest run src/routes/api/health/server.spec.ts` | ✅          | ✅ green |
| 06-01-02 | 01   | 1    | INFR-02     | unit      | `npx vitest run src/cron-worker.spec.ts`              | ✅          | ✅ green |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior                              | Requirement | Why Manual                     | Test Instructions                                                                               |
| ------------------------------------- | ----------- | ------------------------------ | ----------------------------------------------------------------------------------------------- |
| Database backups configured           | INFR-01     | External Supabase dashboard    | Navigate to Supabase > Backups, verify daily schedule visible, test restore to separate project |
| UptimeRobot monitors active           | INFR-02     | External monitoring service    | Verify 2 monitors exist: homepage + /api/health, 5-min intervals                                |
| Supabase spend cap enabled            | INFR-03     | External dashboard toggle      | Supabase > Billing > Spend Cap: verify ON                                                       |
| OpenAI hard spending limit            | INFR-03     | External OpenAI dashboard      | Organization settings > Billing > Hard limit: verify $10/month                                  |
| Cloudflare usage alerts               | INFR-03     | External Cloudflare dashboard  | Verify usage-based billing notification configured                                              |
| Resend usage alerts                   | INFR-03     | External Resend dashboard      | Verify 80% threshold alert at 2,400 emails                                                      |
| Graceful degradation on OpenAI outage | INFR-04     | Requires simulated outage      | Remove OPENAI_API_KEY, post ad, verify status=pending (not rejected)                            |
| R2 redundancy strategy documented     | INFR-05     | Documentation-only requirement | Review .planning/ops/DEGRADATION.md for risk acceptance                                         |

---

## Test Coverage Summary

| Test File             | Tests  | Coverage                                                |
| --------------------- | ------ | ------------------------------------------------------- |
| health/server.spec.ts | 8      | DB/R2/cron checks, status codes, latency, cache headers |
| cron-worker.spec.ts   | 4      | Heartbeat KV write, ISO timestamp, TTL, missing binding |
| **Total**             | **12** |                                                         |

---

## Validation Sign-Off

- [x] All tasks have automated verify
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-14
