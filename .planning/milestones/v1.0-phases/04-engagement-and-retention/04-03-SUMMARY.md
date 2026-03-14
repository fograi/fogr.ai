---
phase: 04-engagement-and-retention
plan: 03
subsystem: api, ui
tags: [watchlist, save, heart, supabase, svelte, action-rail]

# Dependency graph
requires:
  - phase: 04-01
    provides: watchlist table migration and shared utilities
  - phase: 04-02
    provides: sold badges and timestamps on ad pages
provides:
  - Watchlist API endpoint (POST save, DELETE unsave, GET check)
  - Save button on ad detail page action rail
  - Watchlist management page with AdCard grid and remove
  - Navbar link for authenticated users
affects: [04-05, 04-06, phase-5]

# Tech tracking
tech-stack:
  added: [lucide-svelte/heart]
  patterns: [watchlist toggle via fetch POST/DELETE, idempotent save with 23505 handling]

key-files:
  created:
    - src/routes/api/watchlist/+server.ts
    - src/routes/(app)/watchlist/+page.server.ts
    - src/routes/(app)/watchlist/+page.svelte
  modified:
    - src/routes/(public)/ad/[slug]/+page.server.ts
    - src/routes/(public)/ad/[slug]/+page.svelte
    - src/lib/components/Navbar.svelte
    - src/lib/icons.ts

key-decisions:
  - 'Heart icon for watchlist -- lucide-svelte Heart imported as WatchlistIcon for consistent icon naming'
  - 'Save button placed between Share and Report in action rail per user decision'
  - 'Watchlist page uses standard grid layout (not masonry) since it does not need JS-based row spanning'
  - 'Idempotent save: POST returns 200 on duplicate (catches Postgres 23505 unique constraint violation)'

patterns-established:
  - 'Watchlist toggle pattern: client-side optimistic toggle with fetch POST/DELETE to /api/watchlist'
  - 'WatchlistIcon exported from $lib/icons for reuse across components'

# Metrics
duration: 6min
completed: 2026-03-13
---

# Phase 4 Plan 3: Watchlist Summary

**Watchlist save/unsave API with heart toggle on ad detail action rail and dedicated watchlist page showing saved ads as AdCard grid**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-13T19:21:02Z
- **Completed:** 2026-03-13T19:27:10Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Watchlist API with POST (save), DELETE (unsave), GET (check) handlers -- all with CSRF and auth checks
- Save/Unsave heart button on ad detail page action rail (only for non-owners on non-expired ads)
- Watchlist page at /(app)/watchlist showing saved ads as AdCard grid with per-ad remove buttons
- Empty state: "No saved ads yet. Browse listings to save ones you like." with link to homepage
- Navbar includes Watchlist link with Heart icon for authenticated users
- Server-side isSaved check in ad page loader for initial button state

## Task Commits

Each task was committed atomically:

1. **Task 1: Watchlist API endpoint** - `213b29c` (feat)
2. **Task 2: Save button + watchlist page + navbar link** - `28d59df` (feat)

## Files Created/Modified

- `src/routes/api/watchlist/+server.ts` - POST/DELETE/GET handlers for watchlist operations
- `src/routes/(app)/watchlist/+page.server.ts` - Watchlist page data loader (joins watchlist with ads table)
- `src/routes/(app)/watchlist/+page.svelte` - Watchlist grid page with AdCard layout and remove buttons
- `src/routes/(public)/ad/[slug]/+page.server.ts` - Added isSaved watchlist check to load function
- `src/routes/(public)/ad/[slug]/+page.svelte` - Added Save/Unsave heart button to action rail
- `src/lib/components/Navbar.svelte` - Added Watchlist link with Heart icon for authenticated users
- `src/lib/icons.ts` - Added WatchlistIcon (Heart) export

## Decisions Made

- Heart icon (lucide-svelte) used for watchlist instead of bookmark -- heart is more universally recognized for "save/favorite"
- Save button positioned between Share and Report in action rail per user decision
- Watchlist page uses standard CSS grid (not masonry) since AdCard components don't need JS-based row spanning
- POST is idempotent on duplicate: catches Postgres 23505 unique constraint violation and returns 200
- GET /api/watchlist returns `{ saved: false }` for unauthenticated users (no error, graceful fallback)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Task 2 commit was bundled with a parallel agent's changes (04-05 mark-as-sold feature) due to lint-staged stash/restore during Task 1 commit. The watchlist code is correct and complete despite the shared commit.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Watchlist feature complete and ready for users
- Retention loop established: users can save ads and return to check them
- Ready for remaining Phase 4 plans (04-05, 04-06)

## Self-Check: PASSED

All files exist, all commits found, all content verified.

---

_Phase: 04-engagement-and-retention_
_Completed: 2026-03-13_
