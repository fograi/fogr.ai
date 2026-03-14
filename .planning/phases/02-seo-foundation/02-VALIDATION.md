---
phase: 02
slug: seo-foundation
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-14
---

# Phase 02 — Validation Strategy

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

| Task ID  | Plan | Wave | Requirement    | Test Type   | Automated Command                                      | File Exists | Status   |
| -------- | ---- | ---- | -------------- | ----------- | ------------------------------------------------------ | ----------- | -------- |
| 02-01-01 | 01   | 1    | SEO-02, SEO-09 | unit        | `npx vitest run src/lib/seo/meta.spec.ts`              | ✅          | ✅ green |
| 02-01-02 | 01   | 1    | SEO-03         | unit        | `npx vitest run src/lib/seo/jsonld.spec.ts`            | ✅          | ✅ green |
| 02-01-03 | 01   | 1    | SEO-06         | unit        | `npx vitest run src/lib/seo/og.spec.ts`                | ✅          | ✅ green |
| 02-02-01 | 02   | 2    | SEO-07         | unit        | `npx vitest run src/params/param-matchers.spec.ts`     | ✅          | ✅ green |
| 02-03-01 | 03   | 3    | SEO-05         | integration | `npx vitest run src/routes/sitemap.xml/server.spec.ts` | ✅          | ✅ green |
| 02-03-02 | 03   | 3    | SEO-08         | integration | `npx vitest run src/routes/robots.txt/server.spec.ts`  | ✅          | ✅ green |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior                               | Requirement    | Why Manual                                              | Test Instructions                                                                         |
| -------------------------------------- | -------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| OG preview in WhatsApp/Twitter         | SEO-06         | Requires social platform rendering                      | Share ad URL on WhatsApp/Twitter, verify title, description, image appear                 |
| Google Rich Results validation         | SEO-03, SEO-04 | Requires Google's validator                             | Paste ad/category URL into Google Rich Results Test, verify Product/ItemList schema valid |
| Public browsing without login          | TRST-03        | Verified by code audit (no auth gates on public routes) | Open incognito browser, browse ads/categories without login                               |
| Expired ad page shows similar listings | TRST-05        | Requires expired ad in database                         | Visit expired ad URL, verify "expired" banner and similar listings grid                   |

---

## Test Coverage Summary

| Test File                  | Tests  | Coverage                                               |
| -------------------------- | ------ | ------------------------------------------------------ |
| meta.spec.ts               | 15     | Title builders, description truncation, canonical URLs |
| jsonld.spec.ts             | 18     | Product schema, ItemList, BreadcrumbList               |
| og.spec.ts                 | 18     | Ad/category/homepage OG tags, fallback images          |
| param-matchers.spec.ts     | 10     | Category and county slug validation                    |
| sitemap.xml/server.spec.ts | 12     | XML generation, ad filtering, programmatic pages       |
| robots.txt/server.spec.ts  | 11     | Directives, AI crawler blocks, sitemap reference       |
| **Total**                  | **84** |                                                        |

---

## Validation Sign-Off

- [x] All tasks have automated verify
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-14
