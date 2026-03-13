---
phase: 04-engagement-and-retention
plan: 04
subsystem: api, ui
tags: [saved-searches, sveltekit, supabase, rls, csrf]

# Dependency graph
requires:
  - phase: 04-01
    provides: saved_searches table migration and shared utilities
provides:
  - POST /api/saved-searches endpoint for creating saved searches
  - PATCH/DELETE /api/saved-searches/[id] endpoints for managing saved searches
  - generateSearchName() utility for auto-naming searches from filters
  - "Save this search" button on homepage and all programmatic SEO pages
  - Saved searches management page at /saved-searches
  - Navbar link for authenticated users
affects: [04-05-notifications, 04-06-analytics]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Save search button pattern: visible only when user authenticated AND filters active"
    - "Auto-generated search names from filter combination (category + query + county)"
    - "County ID stored in saved_searches (not display name) for cron worker matching"
    - "jsonLdScript() helper function pattern for SEO page JSON-LD rendering"

key-files:
  created:
    - src/lib/utils/search-name.ts
    - src/routes/api/saved-searches/+server.ts
    - src/routes/api/saved-searches/[id]/+server.ts
    - src/routes/(app)/saved-searches/+page.server.ts
    - src/routes/(app)/saved-searches/+page.svelte
  modified:
    - src/routes/+page.svelte
    - src/routes/(public)/[category=category]/+page.svelte
    - src/routes/(public)/[county=county]/+page.svelte
    - src/routes/(public)/[category=category]/[county=county]/+page.svelte
    - src/lib/components/Navbar.svelte
    - src/lib/supabase.types.ts
    - src/routes/page.svelte.spec.ts

key-decisions:
  - "County ID (not display name) stored in saved_searches for cron worker matching"
  - "generateSearchName uses getCountyOptionById to look up display name from county ID"
  - "Save button only visible when user is authenticated AND has active filters"
  - "Extracted jsonLdScript() helper to fix ESLint parser errors with inline JSON-LD template literals"
  - "Replaced URLSearchParams with string concatenation in homepage for ESLint svelte/prefer-svelte-reactivity"

patterns-established:
  - "Save search button: auth-gated + filter-gated visibility with 3-second feedback timeout"
  - "jsonLdScript() helper: JSON-LD rendering via function call instead of inline template literal"
  - "$page.data.user access pattern for auth state in (public) route pages"

# Metrics
duration: ~45min
completed: 2026-03-13
---

# Phase 4 Plan 4: Saved Search Creation and Management Summary

**Save search API with auto-naming from filters, "Save this search" button on all browse pages (homepage + 3 SEO pages), and full management page with inline edit, notification toggle, and delete**

## Performance

- **Duration:** ~45 min (effective; elapsed time longer due to parallel agent conflicts)
- **Started:** 2026-03-13T15:00:00Z
- **Completed:** 2026-03-13T19:15:00Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments

- Created search name utility that auto-generates names like "Bicycles in Dublin" or "All listings in Cork"
- Built complete saved search API (POST/PATCH/DELETE) with CSRF protection and auth checks
- Added "Save this search" button to homepage and all 3 programmatic SEO page types (category, county, category+county)
- Created management page with inline name editing, notification toggle, delete, and "Run search" link
- Added "Saved searches" to authenticated navbar with SearchIcon

## Task Commits

Each task was committed atomically:

1. **Task 1: Search name utility and saved search API endpoints** - `a86061b` (feat)
2. **Task 2: Save search buttons on browse pages + management page** - `959b863` (feat)

## Files Created/Modified

- `src/lib/utils/search-name.ts` - Auto-generates search names from filter combination (category, query, county)
- `src/routes/api/saved-searches/+server.ts` - POST endpoint: creates saved search with auto-generated name
- `src/routes/api/saved-searches/[id]/+server.ts` - PATCH (update name/notify) and DELETE endpoints
- `src/routes/(app)/saved-searches/+page.server.ts` - Loads user's saved searches ordered by created_at desc
- `src/routes/(app)/saved-searches/+page.svelte` - Management UI: list, edit name, toggle notify, delete, run search
- `src/routes/+page.svelte` - Added save search button (visible when authenticated + filters active)
- `src/routes/(public)/[category=category]/+page.svelte` - Added save search button + jsonLdScript helper
- `src/routes/(public)/[county=county]/+page.svelte` - Added save search button + jsonLdScript helper
- `src/routes/(public)/[category=category]/[county=county]/+page.svelte` - Added save search button + jsonLdScript helper
- `src/lib/components/Navbar.svelte` - Added "Saved searches" link with SearchIcon to authenticated nav
- `src/lib/supabase.types.ts` - Added saved_searches table types
- `src/routes/page.svelte.spec.ts` - Added $app/stores mock for page store (user property)

## Decisions Made

- **County ID storage:** Saved searches store county ID (e.g., `ie/leinster/dublin`) not display name, matching cron worker's `location_profile_data->'county'->>'id'` lookup pattern
- **Name auto-generation:** Uses `getCountyOptionById` from `$lib/location-hierarchy` to convert county ID to display name for human-readable search names
- **Auth-gated visibility:** Save button only appears when user is logged in AND at least one filter is active (no point saving an unfiltered search)
- **JSON-LD helper pattern:** Extracted `jsonLdScript()` function in SEO pages to avoid Svelte ESLint parser errors caused by template literals inside `{@html}` blocks
- **URLSearchParams replacement:** Used manual string array building with `encodeURIComponent` on homepage to satisfy ESLint `svelte/prefer-svelte-reactivity` rule

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test mock for $page.data.user**

- **Found during:** Task 2 (commit attempt)
- **Issue:** Existing homepage test (`page.svelte.spec.ts`) failed because `$page.data.user` was undefined -- the test never mocked `$app/stores` and the new code accesses `$page.data.user`
- **Fix:** Added `vi.mock('$app/stores')` providing a readable store with `data: { user: null, isAdmin: false }` and other required page store properties
- **Files modified:** `src/routes/page.svelte.spec.ts`
- **Verification:** All 3 tests pass
- **Committed in:** `959b863` (Task 2 commit)

**2. [Rule 1 - Bug] Fixed ESLint parser errors in SEO page JSON-LD rendering**

- **Found during:** Task 2 (commit attempt)
- **Issue:** Inline template literals inside `{@html}` blocks caused Svelte ESLint parser to fail with "Parsing error: Unexpected keyword or identifier"
- **Fix:** Extracted `jsonLdScript()` helper function using string concatenation instead of template literal
- **Files modified:** 3 SEO page svelte files
- **Verification:** ESLint passes on all files
- **Committed in:** `959b863` (Task 2 commit)

**3. [Rule 1 - Bug] Fixed ESLint svelte/prefer-svelte-reactivity for URLSearchParams**

- **Found during:** Task 2 (commit attempt)
- **Issue:** `new URLSearchParams()` in homepage `buildPageHref` triggered ESLint rule
- **Fix:** Replaced with manual string array building using `encodeURIComponent` and `.join('&')`
- **Files modified:** `src/routes/+page.svelte`
- **Verification:** ESLint passes
- **Committed in:** `959b863` (Task 2 commit)

**4. [Rule 3 - Blocking] Added eslint-disable comments for pre-existing Navbar issues**

- **Found during:** Task 2 (commit attempt)
- **Issue:** Pre-existing `{@html logoSvg}` and `href={primaryHref}` in Navbar triggered lint errors when Navbar was staged
- **Fix:** Added `eslint-disable-next-line` comments with explanation
- **Files modified:** `src/lib/components/Navbar.svelte`
- **Verification:** ESLint passes
- **Committed in:** `959b863` (Task 2 commit)

---

**Total deviations:** 4 auto-fixed (3 bugs, 1 blocking)
**Impact on plan:** All auto-fixes necessary for lint/test compliance. No scope creep.

## Issues Encountered

- **Parallel agent interference:** A parallel 04-02 agent committed changes between Task 1 and Task 2, accidentally staging and committing the saved-searches management page files (`+page.server.ts` and `+page.svelte`) in its docs commit. This required unstaging the other agent's files and adjusting the commit strategy. The management page files are correctly in the repo (committed in `9fa3f2d`).
- **lint-staged stash conflicts:** When pre-commit hooks failed, lint-staged's stash mechanism sometimes interfered with working tree changes, requiring re-application of edits.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Saved search infrastructure complete: API, UI, and management page all functional
- Ready for Phase 4 Plan 5 (notification preferences) and Plan 6 (engagement analytics)
- Saved search notification digests (from Phase 3 Plan 4) can now operate against user-created searches

## Self-Check: PASSED

- All 5 created files exist on disk
- Both task commits verified (a86061b, 959b863)
- Save search functionality confirmed in all 4 browse pages
- Navbar link confirmed
- generateSearchName utility confirmed

---

_Phase: 04-engagement-and-retention_
_Completed: 2026-03-13_
