---
phase: 01-slug-migration
plan: 02
subsystem: routes, components, api
tags: [slug-routing, 301-redirect, canonical-url, seo, sveltekit-redirect]

# Dependency graph
requires:
  - "01-01: slug and short_id columns, generateAdSlug(), parseSlugShortId(), isUuidParam()"
provides:
  - "Ad page loads by short_id extracted from slug URL"
  - "UUID URLs 301-redirect to canonical slug URL"
  - "Non-canonical slug URLs 301-redirect to canonical slug"
  - "All ad link references across 13 files use slug URLs"
  - "AdCard component accepts slug prop for link generation"
  - "Moderation emails accept optional adSlug for URL generation"
affects: [02-SEO-Foundation]

# Tech tracking
tech-stack:
  added: []
  patterns: [slug-based-route-resolution, three-case-redirect-logic, graceful-uuid-fallback]

key-files:
  created: []
  modified:
    - src/routes/(public)/ad/[slug]/+page.server.ts
    - src/routes/api/ads/[id]/+server.ts
    - src/lib/components/AdCard.svelte
    - src/routes/(app)/post/+page.svelte
    - src/routes/(app)/ads/+page.svelte
    - src/routes/(app)/ads/+page.server.ts
    - src/routes/(app)/ads/[id]/edit/+page.svelte
    - src/routes/(app)/admin/appeals/+page.svelte
    - src/routes/(app)/messages/[id]/+page.svelte
    - src/lib/server/moderation-emails.ts
    - src/routes/api/ads/[id]/report/+server.ts
    - src/routes/(public)/category/[slug]/+page.server.ts
    - src/routes/+page.server.ts

key-decisions:
  - "Ad page queries Supabase directly by short_id instead of calling internal API -- avoids modifying UUID-based cache keys"
  - "Admin appeals and messages pages keep UUID links with 301 redirect fallback -- avoids touching data pipelines for low-traffic admin pages"
  - "Homepage and category page mappers also include slug in AdCard data -- discovered as Rule 2 deviation"

patterns-established:
  - "Three-case redirect pattern: UUID -> slug lookup -> 301, non-canonical -> 301, canonical -> render"
  - "Graceful slug fallback: all slug references use (slug ?? id) to handle ads without slugs during transition"

# Metrics
duration: 5min
completed: 2026-03-11
---

# Phase 1 Plan 02: Route Migration Summary

**Slug-based ad routing with UUID 301 redirects, canonical URL enforcement, and all 13 ad link references updated across routes, components, and emails**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-11T21:14:07Z
- **Completed:** 2026-03-11T21:19:27Z
- **Tasks:** 2 (of 3 -- checkpoint pending)
- **Files modified:** 13

## Accomplishments
- Ad page load function rewritten to resolve ads by short_id from slug, with three-case redirect logic (UUID, non-canonical, canonical)
- All ad link integration points across 13 files updated to use slug URLs with graceful fallback to UUID
- 121 unit tests pass, svelte-check clean (no new type errors introduced)

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite ad page server load for slug-based routing** - `75b479e` (feat)
2. **Task 2: Update all ad link references across the codebase** - `1d6de96` (feat)

## Files Created/Modified
- `src/routes/(public)/ad/[slug]/+page.server.ts` - Rewritten: direct Supabase query by short_id, UUID redirect, canonical redirect, owner access check
- `src/routes/api/ads/[id]/+server.ts` - GET adds slug/short_id to select; PATCH loads slug, returns it in response
- `src/lib/components/AdCard.svelte` - New slug prop, href uses slug with id fallback
- `src/routes/(app)/post/+page.svelte` - Post-creation redirect uses data.slug
- `src/routes/(app)/ads/+page.svelte` - View and share links use slug
- `src/routes/(app)/ads/+page.server.ts` - Adds slug to select query and E2E mock
- `src/routes/(app)/ads/[id]/edit/+page.svelte` - Edit redirect uses payload.slug
- `src/routes/(app)/admin/appeals/+page.svelte` - UUID link with comment (301 handles it)
- `src/routes/(app)/messages/[id]/+page.svelte` - UUID link with comment (301 handles it)
- `src/lib/server/moderation-emails.ts` - Added optional adSlug to context types, URL prefers slug
- `src/routes/api/ads/[id]/report/+server.ts` - Looks up slug, uses it in location URL
- `src/routes/(public)/category/[slug]/+page.server.ts` - Category page passes slug through to AdCard
- `src/routes/+page.server.ts` - Homepage passes slug through to AdCard

## Decisions Made
- Ad page queries Supabase directly by short_id instead of calling the internal API endpoint -- avoids the need to modify UUID-based Cloudflare edge cache keys
- Admin appeals and messages pages keep UUID links with 301 redirect fallback -- avoids touching the conversations and appeals data pipelines for low-traffic admin pages
- Auth check deferred until needed: public active ads skip the getUser() call entirely, improving page load for the common case

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Homepage AdCard mapper missing slug**
- **Found during:** Task 2
- **Issue:** The plan listed 10 integration points but did not include the homepage (`src/routes/+page.server.ts`) which also maps API data to AdCard objects and renders AdCard components. Without slug in the mapper, homepage ad cards would still link to UUID URLs.
- **Fix:** Added `slug: ad.slug ?? undefined` to the homepage's AdCard mapper, matching the category page pattern.
- **Files modified:** src/routes/+page.server.ts
- **Verification:** svelte-check passes, AdCard receives slug prop from homepage
- **Committed in:** 1d6de96 (Task 2 commit)

**2. [Rule 1 - Bug] Type cast for category/location profile data from Supabase**
- **Found during:** Task 1 (svelte-check verification)
- **Issue:** Direct Supabase query returns `Json | null` type for JSONB columns, which is not assignable to `Record<string, unknown> | null` without explicit cast. svelte-check reported type errors.
- **Fix:** Added `as Record<string, unknown> | null` casts for category_profile_data and location_profile_data in the ad page mapper.
- **Files modified:** src/routes/(public)/ad/[slug]/+page.server.ts
- **Verification:** svelte-check no longer reports errors for this file
- **Committed in:** 1d6de96 (Task 2 commit, since the fix was to the same file before commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required. The backfill script (`scripts/backfill-slugs.ts`) must be run against the database before deployment (documented in Plan 01).

## Next Phase Readiness
- Slug migration is functionally complete pending human verification (checkpoint)
- Phase 1 satisfies all five success criteria from the roadmap:
  1. Visiting /ad/{slug} opens the correct ad
  2. UUID URLs 301-redirect to slug URLs
  3. Non-canonical slugs 301-redirect to canonical
  4. New ads get slugs at creation time (Plan 01)
  5. No existing shared ad link becomes a permanent 404

## Self-Check: PASSED

All 14 files verified present. Both task commits (75b479e, 1d6de96) verified in git log. 121 tests pass, svelte-check clean.

---
*Phase: 01-slug-migration*
*Completed: 2026-03-11*
