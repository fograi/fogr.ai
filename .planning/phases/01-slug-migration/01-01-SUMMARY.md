---
phase: 01-slug-migration
plan: 01
subsystem: database, api
tags: [slugify, nanoid, slug-generation, supabase-migration, seo]

# Dependency graph
requires: []
provides:
  - "slug and short_id columns on ads table with unique indexes"
  - "generateAdSlug() function for title-county-shortid slug format"
  - "parseSlugShortId() and isUuidParam() for route-level slug parsing"
  - "backfill script for populating existing ads with slugs"
  - "POST handler generates slugs at ad creation with collision retry"
affects: [01-02-PLAN, 02-SEO-Foundation]

# Tech tracking
tech-stack:
  added: [slugify@1.6.6, nanoid@5.1.6]
  patterns: [slug-generation-pipeline, short-id-collision-retry, stop-word-filtering]

key-files:
  created:
    - src/lib/server/slugs.ts
    - src/lib/server/slugs.spec.ts
    - supabase/migrations/20260312_000017_ads_slug_column.sql
    - scripts/backfill-slugs.ts
  modified:
    - src/routes/api/ads/+server.ts
    - src/types/ad-types.d.ts
    - src/lib/server/e2e-mocks.ts
    - src/lib/supabase.types.ts
    - package.json
    - package-lock.json

key-decisions:
  - "Used slugify + nanoid as recommended by research -- battle-tested, tiny, ESM-compatible"
  - "8-char alphanumeric short IDs using full 36-char alphabet (a-z0-9)"
  - "Collision handling via retry with new short ID (max 3 attempts), not counter append"
  - "Supabase types manually updated with slug/short_id as nullable -- will be regenerated after migration runs"

patterns-established:
  - "Slug format: {title}-{county}-{shortid} with stop word removal and 60-char truncation"
  - "Insert-with-retry pattern for unique constraint violations (error code 23505)"
  - "Backfill script pattern: batch 100 rows, 100ms delay, service role key"

# Metrics
duration: 9min
completed: 2026-03-11
---

# Phase 1 Plan 01: Slug Infrastructure Summary

**Slug generation module using slugify + nanoid with 14 unit tests, DB migration adding slug/short_id columns, backfill script, and POST handler wiring with collision retry**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-11T21:02:02Z
- **Completed:** 2026-03-11T21:11:23Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Slug generation function producing `{title}-{county}-{shortid}` format with diacritic transliteration, stop word removal, and 60-char truncation
- 14 unit tests covering edge cases: emoji fallback, diacritics, truncation, short ID format, UUID detection
- Database migration adding nullable slug and short_id columns with unique indexes
- POST handler wired to generate slugs at ad creation with 3-attempt collision retry
- Backfill script ready to populate existing ads (runs with service role key)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies, create slug generation module with tests, and write DB migration** - `c011e9a` (feat)
2. **Task 2: Create backfill script, update types, and wire slug generation into POST handler** - `c126623` (feat)

## Files Created/Modified
- `src/lib/server/slugs.ts` - Slug generation, short ID extraction, UUID detection functions
- `src/lib/server/slugs.spec.ts` - 14 Vitest unit tests for slug generation edge cases
- `supabase/migrations/20260312_000017_ads_slug_column.sql` - Add slug and short_id columns with unique indexes
- `scripts/backfill-slugs.ts` - One-off script to populate slug/short_id for existing ads
- `src/routes/api/ads/+server.ts` - POST handler generates slug with collision retry; GET includes slug in select
- `src/types/ad-types.d.ts` - Added slug to AdCard and slug/short_id to ApiAdRow
- `src/lib/server/e2e-mocks.ts` - Added slug and short_id to E2E mock ad
- `src/lib/supabase.types.ts` - Added slug and short_id to ads table Row/Insert/Update types
- `package.json` - Added slugify and nanoid dependencies
- `package-lock.json` - Updated lockfile

## Decisions Made
- Used slugify + nanoid as recommended by research (battle-tested, tiny, ESM-compatible)
- 8-char alphanumeric short IDs using full 36-char alphabet (a-z0-9) via nanoid customAlphabet
- Collision handling via retry with new short ID (max 3 attempts), not counter append
- Manually updated Supabase generated types with slug/short_id as nullable -- will need regeneration after migration runs on actual database

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added slug and short_id to Supabase generated types**
- **Found during:** Task 2 (svelte-check verification)
- **Issue:** The auto-generated `src/lib/supabase.types.ts` does not know about slug/short_id columns since the migration has not been run on the actual database. This caused a type error in the POST handler where `result.data` was typed as `SelectQueryError` instead of `{ id: string; slug: string }`.
- **Fix:** Manually added `slug: string | null` and `short_id: string | null` to Row, Insert, and Update types for the ads table. These will be overwritten when types are regenerated after migration.
- **Files modified:** src/lib/supabase.types.ts
- **Verification:** svelte-check no longer reports errors in +server.ts
- **Committed in:** c126623 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix was necessary to resolve type errors from the not-yet-run migration. No scope creep.

## Issues Encountered
None beyond the deviation documented above.

## User Setup Required
None - no external service configuration required. The backfill script (`scripts/backfill-slugs.ts`) requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables when run, but these are standard development credentials.

## Next Phase Readiness
- Plan 01 slug infrastructure is complete and ready for Plan 02 (route migration)
- Plan 02 can now update route load functions to use `parseSlugShortId()` and `isUuidParam()` for slug-based lookups
- Plan 02 can update all ad link references to use the slug field now available in API responses
- Backfill script must be run against the database before Plan 02 deploys (existing ads need slugs)

---
*Phase: 01-slug-migration*
*Completed: 2026-03-11*
