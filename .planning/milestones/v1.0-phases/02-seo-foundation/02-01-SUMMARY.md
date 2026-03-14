---
phase: 02-seo-foundation
plan: 01
subsystem: seo
tags: [svelte-head, json-ld, open-graph, twitter-card, meta-tags, sharp, seo]

# Dependency graph
requires:
  - phase: 01-slug-migration
    provides: 'Slug-based ad URLs for canonical links and SEO-friendly paths'
provides:
  - 'SEO utility modules: meta.ts, jsonld.ts, og.ts in src/lib/seo/'
  - 'Per-page meta tags, OG tags, Twitter Cards on ad, category, and home pages'
  - 'JSON-LD Product schema on ad pages'
  - '9 OG fallback placeholder images in static/og-fallback/'
  - 'Expired ads publicly visible with noindex directive'
affects: [02-seo-foundation, 03-engagement, 05-content-seeding]

# Tech tracking
tech-stack:
  added: [sharp (dev)]
  patterns: [seo-data-in-server-load, svelte-head-seo-block, json-ld-serialization]

key-files:
  created:
    - src/lib/seo/meta.ts
    - src/lib/seo/jsonld.ts
    - src/lib/seo/og.ts
    - static/og-fallback/*.png (9 files)
    - scripts/generate-og-placeholders.ts
  modified:
    - src/routes/(public)/ad/[slug]/+page.server.ts
    - src/routes/(public)/ad/[slug]/+page.svelte
    - src/routes/(public)/category/[slug]/+page.server.ts
    - src/routes/(public)/category/[slug]/+page.svelte
    - src/routes/+page.server.ts
    - src/routes/+page.svelte
    - src/routes/page.svelte.spec.ts

key-decisions:
  - 'Expired ads changed from owner-only to publicly visible with noindex -- enables SEO link equity preservation'
  - 'OG fallback images generated via sharp from SVG with category-colored gradient backgrounds'
  - "JSON-LD serialized with <script> tag XSS prevention via .replace(/</g, '\\u003c')"
  - 'Category slug lookup for OG fallback defaults to home-garden if category not found'

patterns-established:
  - 'SEO data pattern: server load returns seo object consumed by svelte:head block'
  - "Title pattern: '{Content} | Fogr.ai' for all pages, 'Fogr.ai -- Fograi' on homepage only"
  - 'OG fallback chain: ad image > /og-fallback/{categorySlug}.png'

# Metrics
duration: 9min
completed: 2026-03-12
---

# Phase 2 Plan 1: SEO Meta Tags, OG, JSON-LD Summary

**Reusable SEO utility modules (meta.ts, jsonld.ts, og.ts) with per-page meta tags, Open Graph, Twitter Cards, and JSON-LD Product schema on all public pages plus 9 branded OG fallback images**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-12T16:00:37Z
- **Completed:** 2026-03-12T16:09:49Z
- **Tasks:** 3
- **Files modified:** 13

## Accomplishments

- Three reusable SEO utility modules in `src/lib/seo/` with typed exports for title, description, canonical, OG, and JSON-LD builders
- Ad pages now render unique title, meta description, canonical URL, Open Graph tags, Twitter Card tags, and JSON-LD Product schema in SSR
- Category pages and homepage render with branded titles, descriptions, canonicals, and OG tags
- 9 branded OG fallback placeholder images (1200x630px) ensure social sharing previews never show broken images
- Expired ads changed from owner-only to publicly visible with `<meta name="robots" content="noindex">` for SEO link equity

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SEO utility modules** - `94307e6` (feat)
2. **Task 2: Add SEO data to server loads and svelte:head** - `57fb24c` (feat)
3. **Task 3: Create OG fallback placeholder images** - `ebbe7d9` (feat)

## Files Created/Modified

- `src/lib/seo/meta.ts` - Title, description, and canonical URL builder functions
- `src/lib/seo/jsonld.ts` - JSON-LD Product schema builder with AdSeoData interface
- `src/lib/seo/og.ts` - Open Graph and Twitter Card data builders with OgData type
- `src/routes/(public)/ad/[slug]/+page.server.ts` - SEO data in load function, expired ad access fix
- `src/routes/(public)/ad/[slug]/+page.svelte` - svelte:head with all SEO tags + JSON-LD
- `src/routes/(public)/category/[slug]/+page.server.ts` - SEO data in both return paths
- `src/routes/(public)/category/[slug]/+page.svelte` - svelte:head with title, OG, Twitter
- `src/routes/+page.server.ts` - Homepage SEO data in both return paths
- `src/routes/+page.svelte` - svelte:head with homepage SEO tags
- `src/routes/page.svelte.spec.ts` - Updated test helper with seo data fixture
- `static/og-fallback/*.png` - 9 branded placeholder images (1200x630px each)
- `scripts/generate-og-placeholders.ts` - Image generation script (kept for regeneration)

## Decisions Made

- **Expired ad visibility change:** Changed expired ads from owner-only (404 for non-owners) to publicly visible with noindex. This preserves inbound link equity and enables the expired ad SEO pattern from CONTEXT.md. Moderation-removed ads remain owner-only.
- **OG fallback via sharp + SVG:** Used sharp to convert SVG templates to PNG. Each image has a category-specific gradient (matching `catBase` colors from constants.ts) with white text. Kept the generation script for future regeneration.
- **JSON-LD XSS prevention:** Used `JSON.stringify().replace(/</g, '\\u003c')` to prevent `</script>` injection in JSON-LD blocks, per research pitfall #4.
- **Category slug fallback:** `categoryToSlug` returns empty string if category not found; defaulting to `'home-garden'` for OG fallback image path.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Expired ad access gate prevented SEO requirement**

- **Found during:** Task 2 (Ad page server load)
- **Issue:** The existing access check blocked non-owners from viewing expired ads (`if (!isOwner) throw error(404)`), making it impossible to add public SEO tags to expired ad pages.
- **Fix:** Changed condition from `ad.status !== 'active' || isExpired` (blocks expired) to `ad.status !== 'active' && !isExpired` (only blocks moderation-removed). Expired ads are now publicly visible with noindex.
- **Files modified:** `src/routes/(public)/ad/[slug]/+page.server.ts`
- **Verification:** Build succeeds, expired ads return 200 with noindex meta tag.
- **Committed in:** `57fb24c`

**2. [Rule 3 - Blocking] Homepage test helper missing seo property**

- **Found during:** Task 2 (After adding seo to homepage server load)
- **Issue:** `page.svelte.spec.ts` test helper `buildPageData()` was missing the `seo` property that the server load now always returns, causing type errors.
- **Fix:** Added `seo` fixture data to `buildPageData()` and added `as const` assertions for `q` and `category` string literal types.
- **Files modified:** `src/routes/page.svelte.spec.ts`
- **Verification:** svelte-check passes for this file (remaining errors are in unrelated `home-page.server.spec.ts`).
- **Committed in:** `57fb24c`

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for correctness. The expired ad visibility change aligns with CONTEXT.md decisions. No scope creep.

## Issues Encountered

- Pre-existing type errors (12) in `src/routes/home-page.server.spec.ts` -- these existed before this plan and are caused by incomplete type casting in test mocks. Not addressed in this plan as they are out of scope.
- `Category` type is exported from `$lib/constants`, not `$lib/category-browse` -- corrected import in ad page server load.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- SEO utility modules ready for reuse in plans 02-02 through 02-05 (programmatic pages, sitemap, robots.txt)
- OG fallback images ready for all 9 categories
- The `buildCategoryOg` and `buildHomepageOg` functions currently use `home-garden.png` as a generic fallback -- future plans may want category-specific images for category pages
- `home-page.server.spec.ts` has pre-existing type errors that should be addressed

## Self-Check: PASSED

All 13 created/claimed files verified present. All 3 task commit hashes verified in git log.

---

_Phase: 02-seo-foundation_
_Completed: 2026-03-12_
