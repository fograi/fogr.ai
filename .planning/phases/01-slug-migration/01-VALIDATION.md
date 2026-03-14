---
phase: 01
slug: slug-migration
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-14
---

# Phase 01 — Validation Strategy

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

| Task ID  | Plan | Wave | Requirement | Test Type | Automated Command                                                  | File Exists | Status   |
| -------- | ---- | ---- | ----------- | --------- | ------------------------------------------------------------------ | ----------- | -------- |
| 01-01-01 | 01   | 1    | SEO-01      | unit      | `npx vitest run src/lib/server/slugs.spec.ts`                      | ✅          | ✅ green |
| 01-02-01 | 02   | 2    | SEO-01      | unit      | `npx vitest run src/routes/(public)/ad/[slug]/page.server.spec.ts` | ✅          | ✅ green |
| 01-02-02 | 02   | 2    | SEO-01      | unit      | `npx vitest run src/routes/api/ads/collision-retry.spec.ts`        | ✅          | ✅ green |
| 01-02-03 | 02   | 2    | SEO-01      | unit      | `npx vitest run src/lib/server/redirect.spec.ts`                   | ✅          | ✅ green |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior                                | Requirement | Why Manual                        | Test Instructions                                                                                   |
| --------------------------------------- | ----------- | --------------------------------- | --------------------------------------------------------------------------------------------------- |
| Backfill script execution on production | SEO-01      | Requires live Supabase connection | Run `npx tsx scripts/backfill-slugs.ts` against production; verify all pre-migration ads have slugs |
| Browser network tab shows 301 status    | SEO-01      | Requires running dev server       | Visit old UUID URL, verify 301 in network tab (not 302)                                             |

---

## Test Coverage Summary

| Test File               | Tests  | Coverage                                             |
| ----------------------- | ------ | ---------------------------------------------------- |
| slugs.spec.ts           | 14     | Slug generation, parsing, UUID detection             |
| redirect.spec.ts        | 3      | Safe redirect path validation                        |
| page.server.spec.ts     | 4      | UUID→slug redirect, canonical redirect, 404 handling |
| collision-retry.spec.ts | 5      | Slug collision retry logic, 23505 handling           |
| **Total**               | **26** |                                                      |

---

## Validation Sign-Off

- [x] All tasks have automated verify
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-14
