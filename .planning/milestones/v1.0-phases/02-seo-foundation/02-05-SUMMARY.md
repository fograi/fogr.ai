---
phase: 02-seo-foundation
plan: 05
subsystem: seo
tags: [json-ld, itemlist, breadcrumblist, structured-data, anonymous-access, schema-org]

# Dependency graph
requires:
  - phase: 02-01
    provides: 'JSON-LD utility module (jsonld.ts) and SEO data pattern (seo object in server load)'
  - phase: 02-02
    provides: 'Programmatic SEO page routes (category, county, category+county) with server loads'
provides:
  - 'ItemList JSON-LD on all programmatic pages listing ad URLs for Google rich snippets'
  - 'BreadcrumbList JSON-LD on all programmatic pages for navigation-path rich results'
  - 'Verified anonymous access across all public routes -- no auth gates block crawlers'
affects: [03-engagement, 05-content-seeding]

# Tech tracking
tech-stack:
  added: []
  patterns: [json-ld-array-pattern-in-seo-object, multiple-json-ld-script-tags-per-page]

key-files:
  created: []
  modified:
    - src/lib/seo/jsonld.ts
    - src/routes/(public)/[category=category]/+page.server.ts
    - src/routes/(public)/[category=category]/+page.svelte
    - src/routes/(public)/[county=county]/+page.server.ts
    - src/routes/(public)/[county=county]/+page.svelte
    - src/routes/(public)/[category=category]/[county=county]/+page.server.ts
    - src/routes/(public)/[category=category]/[county=county]/+page.svelte

key-decisions:
  - "JSON-LD rendered as separate script tags (ItemList + BreadcrumbList) per Google's recommendation for multiple structured data types"
  - 'All public routes verified anonymous-accessible -- no auth walls found on any (public) route'

patterns-established:
  - 'JSON-LD array pattern: server load returns seo.jsonLd as array of objects, svelte:head iterates with #each'
  - 'Anonymous access audit pattern: verify getUser() is only called for optional owner features, never as an access gate'

requirements-completed: [SEO-04, TRST-03]

# Metrics
duration: 5min
completed: 2026-03-12
---

# Phase 2 Plan 5: JSON-LD Structured Data + Public Access Audit Summary

**ItemList and BreadcrumbList JSON-LD on all programmatic category/county pages with verified anonymous crawler access across all public routes**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-12T16:28:19Z
- **Completed:** 2026-03-12T16:33:40Z
- **Tasks:** 2 (1 code, 1 audit)
- **Files modified:** 7

## Accomplishments

- All three programmatic page types (category, county, category+county) now include ItemList JSON-LD listing ad URLs for Google rich snippet eligibility
- BreadcrumbList JSON-LD added with correct navigation paths: Home > Category (2-level), Home > County (2-level), Home > Category > County (3-level)
- Complete anonymous access audit of all public routes confirmed zero auth gates -- crawlers can access all public content without login

## Task Commits

Each task was committed atomically:

1. **Task 1: Add ItemList and BreadcrumbList JSON-LD to programmatic pages** - `b55cfed` (feat)
2. **Task 2: Audit and verify anonymous public access** - No commit (verification-only audit, no code changes needed)

## Files Created/Modified

- `src/lib/seo/jsonld.ts` - Added `itemListJsonLd()` and `breadcrumbJsonLd()` builder functions
- `src/routes/(public)/[category=category]/+page.server.ts` - Added jsonLd array to seo return object (both paths)
- `src/routes/(public)/[category=category]/+page.svelte` - Added JSON-LD script tag rendering in svelte:head
- `src/routes/(public)/[county=county]/+page.server.ts` - Added jsonLd array to seo return object (both paths)
- `src/routes/(public)/[county=county]/+page.svelte` - Added JSON-LD script tag rendering in svelte:head
- `src/routes/(public)/[category=category]/[county=county]/+page.server.ts` - Added jsonLd array to seo return object (both paths)
- `src/routes/(public)/[category=category]/[county=county]/+page.svelte` - Added JSON-LD script tag rendering in svelte:head

## Decisions Made

- **JSON-LD as separate script tags:** Rendered ItemList and BreadcrumbList as separate `<script type="application/ld+json">` blocks rather than a single combined block, following Google's documented recommendation for multiple structured data types on one page.
- **Empty ItemList on error path:** When the /api/ads fetch fails, programmatic pages still include an empty ItemList and the BreadcrumbList, so the page structure is always present for crawlers.

## Deviations from Plan

None - plan executed exactly as written.

## Anonymous Access Audit Results

All routes under `src/routes/(public)/` verified for anonymous access:

| Route                                                          | Auth Used?       | Purpose                                                     | Verdict |
| -------------------------------------------------------------- | ---------------- | ----------------------------------------------------------- | ------- |
| `(public)/+layout.server.ts`                                   | No               | Empty load, returns `{}`                                    | PASS    |
| `(public)/+layout.svelte`                                      | Client-side only | `/api/me` fetch sets user store, null on failure            | PASS    |
| `(public)/ad/[slug]/+page.server.ts`                           | Optional         | `getUser()` for owner check only; active/expired ads public | PASS    |
| `(public)/category/[slug]/+page.server.ts`                     | No               | Public fetch from /api/ads GET                              | PASS    |
| `(public)/[category=category]/+page.server.ts`                 | No               | Public fetch from /api/ads GET                              | PASS    |
| `(public)/[county=county]/+page.server.ts`                     | No               | Public fetch from /api/ads GET                              | PASS    |
| `(public)/[category=category]/[county=county]/+page.server.ts` | No               | Public fetch from /api/ads GET                              | PASS    |
| `(public)/about/+page.svelte`                                  | No               | Static content                                              | PASS    |
| `(public)/privacy/+page.svelte`                                | No               | Static content                                              | PASS    |
| `(public)/terms/+page.svelte`                                  | No               | Static content                                              | PASS    |
| `(public)/report-status/+page.server.ts`                       | No               | Reads URL params only                                       | PASS    |
| `(public)/login/+page.server.ts`                               | Redirect-away    | Redirects logged-in users; anonymous see login page         | PASS    |
| `+page.server.ts` (homepage)                                   | No               | Public fetch from /api/ads GET                              | PASS    |
| `/api/ads` GET handler                                         | No               | No auth in GET (auth only in POST)                          | PASS    |

**Conclusion:** Zero `redirect(**/login)` calls found in any public route. `getUser()` calls are used exclusively for optional owner features (moderation visibility, message counts), never as access gates.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 02 (SEO Foundation) is now fully complete -- all 5 plans executed
- All programmatic pages have meta tags, OG, Twitter Cards, JSON-LD, and verified anonymous access
- Sitemap includes all programmatic URLs; robots.txt allows all major crawlers
- Ready to proceed to Phase 03 (Engagement)

## Self-Check: PASSED

All 7 modified files verified present on disk. Task 1 commit hash (b55cfed) verified in git log. Task 2 had no code changes (audit-only), so no commit to verify.

---

_Phase: 02-seo-foundation_
_Completed: 2026-03-12_
