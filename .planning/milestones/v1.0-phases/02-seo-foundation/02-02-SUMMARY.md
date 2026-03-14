---
phase: 02-seo-foundation
plan: 02
subsystem: seo
tags: [sveltekit, param-matchers, programmatic-seo, flat-urls, canonical, noindex]

# Dependency graph
requires:
  - phase: 01-slug-migration
    provides: slug-based ad URLs for linking from programmatic pages
  - phase: 02-01
    provides: SEO meta utilities (buildCategoryTitle, buildCanonical, buildDescription, OG builders)
provides:
  - SvelteKit param matchers for category and county slugs (src/params/category.ts, src/params/county.ts)
  - Category-only programmatic page (/bikes, /electronics, etc.)
  - County-only programmatic page (/dublin, /cork, etc.)
  - Category+county programmatic page (/bikes/dublin, etc.)
  - County slug lookup utility (src/lib/seo/county-slugs.ts) for reuse by sitemap and expired ads
affects: [02-03-sitemap, 02-04-expired-ads, 02-05-robots-txt]

# Tech tracking
tech-stack:
  added: [slugify (county slug generation, already installed)]
  patterns:
    [
      SvelteKit param matchers for flat URL routing,
      programmatic SEO page pattern with noindex gating
    ]

key-files:
  created:
    - src/params/category.ts
    - src/params/county.ts
    - src/lib/seo/county-slugs.ts
    - src/routes/(public)/[category=category]/+page.server.ts
    - src/routes/(public)/[category=category]/+page.svelte
    - src/routes/(public)/[county=county]/+page.server.ts
    - src/routes/(public)/[county=county]/+page.svelte
    - src/routes/(public)/[category=category]/[county=county]/+page.server.ts
    - src/routes/(public)/[category=category]/[county=county]/+page.svelte
  modified: []

key-decisions:
  - 'Flat URL structure with param matchers: /bikes, /dublin, /bikes/dublin -- no /category/ prefix'
  - 'County slug lookup utility placed in src/lib/seo/county-slugs.ts for reuse by sitemap and expired ads'
  - 'noindex threshold set to 3 listings (per user decision in CONTEXT.md)'
  - 'Three separate page components instead of shared component -- clarity over DRY for 3 small files'

patterns-established:
  - 'Programmatic SEO page pattern: server load fetches /api/ads with filters, computes listing count + price range, builds SEO object with title/description/canonical/robots'
  - 'Param matcher pattern: validate param against pre-built Set at module load time for zero-cost routing'
  - 'County slug utility pattern: countySlugToOption() returns { id, name, slug } for server loads'

# Metrics
duration: 7min
completed: 2026-03-12
---

# Phase 2 Plan 2: Programmatic SEO Pages Summary

**Flat-URL programmatic pages for category, county, and category+county combinations with param matchers, noindex gating, and canonical URLs**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-12T16:03:35Z
- **Completed:** 2026-03-12T16:10:04Z
- **Tasks:** 2
- **Files created:** 9

## Accomplishments

- SvelteKit param matchers validate category and county slugs at routing level, preventing collision with static routes (about, login, privacy, terms, ad/\*)
- Three programmatic page types target transactional search queries ("second hand bikes for sale dublin")
- All pages include title, meta description, canonical URL, OG tags, Twitter Card tags, and conditional noindex
- Shared county-slugs utility ready for sitemap generation (Plan 03) and expired ad similar listings (Plan 04)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create param matchers for category and county slugs** - `d63ed79` (feat)
2. **Task 2: Create programmatic SEO page routes** - `8480bc7` (feat)

## Files Created/Modified

- `src/params/category.ts` - Param matcher validating category slugs via slugToCategory()
- `src/params/county.ts` - Param matcher validating county slugs via pre-built Set from location hierarchy
- `src/lib/seo/county-slugs.ts` - County slug lookup utility: countySlugToOption(), countyIdToSlug(), getAllCountySlugs()
- `src/routes/(public)/[category=category]/+page.server.ts` - Category-only page server load with listing stats
- `src/routes/(public)/[category=category]/+page.svelte` - Category-only page with SEO head, grid, pagination
- `src/routes/(public)/[county=county]/+page.server.ts` - County-only page server load
- `src/routes/(public)/[county=county]/+page.svelte` - County-only page component
- `src/routes/(public)/[category=category]/[county=county]/+page.server.ts` - Category+county page server load
- `src/routes/(public)/[category=category]/[county=county]/+page.svelte` - Category+county page with linked filter chips

## Decisions Made

- Used flat URL structure with param matchers (/bikes, /dublin, /bikes/dublin) -- no /category/ prefix, matching user decision
- noindex threshold is 3 listings (matching CONTEXT.md decision, lower than roadmap's suggested 5 for early growth)
- Three separate page components instead of a shared component -- each is under 130 lines, clarity wins over DRY
- County slug utility placed in src/lib/seo/ namespace for co-location with other SEO utilities
- Zero collisions verified between all 9 category slugs and all 32 county slugs

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing type errors in test spec files (home-page.server.spec.ts, page.svelte.spec.ts, ad/[slug]/+page.server.ts) unrelated to this plan -- did not affect build or new code

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Programmatic pages are live and ready for sitemap inclusion (Plan 03)
- County slug utility (countySlugToOption, getAllCountySlugs) exported and ready for Plan 03 sitemap generation
- Expired ad pages (Plan 04) can use the same county-slugs utility for similar listings lookup

## Self-Check: PASSED

- All 9 created files verified present on disk
- Both task commits (d63ed79, 8480bc7) verified in git log
- All 3 programmatic page types have `<link rel="canonical">` in svelte:head
- `npm run build` succeeded with no errors in new files
- `npx svelte-check` confirmed no type errors in new files

---

_Phase: 02-seo-foundation_
_Completed: 2026-03-12_
