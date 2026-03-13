---
phase: 04-engagement-and-retention
plan: 01
subsystem: database, utils
tags: [supabase, rls, intl, currency, typescript, watchlist]

# Dependency graph
requires:
  - phase: 03-email-infrastructure
    provides: saved_searches table, email preferences, cron worker
provides:
  - watchlist table with RLS and user_id + ad_id unique constraint
  - sale_price integer column on ads table
  - formatRelativeTime() and formatFullDate() utilities via native Intl APIs
  - getDefaultCurrency() mapping NI counties to GBP
  - NI_COUNTY_IDS Set for reuse in post form and display logic
  - Updated AdCard type with createdAt and salePrice fields
  - Updated ApiAdRow type with sale_price field
  - Watchlist table types in supabase.types.ts
affects: [04-02, 04-03, 04-04, 04-05, 04-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Native Intl.RelativeTimeFormat for compact time display (zero dependencies)'
    - 'NI county ID Set for currency defaults (6 counties, not all 9 Ulster)'

key-files:
  created:
    - supabase/migrations/20260313_000020_watchlist.sql
    - supabase/migrations/20260313_000021_ads_sale_price_currency.sql
    - src/lib/utils/relative-time.ts
    - src/lib/utils/currency.ts
  modified:
    - src/types/ad-types.d.ts
    - src/lib/supabase.types.ts

key-decisions:
  - "Used 'ie/ulster/derry' not 'ie/ulster/londonderry' for NI county ID -- matches actual ireland_counties.json data"
  - 'sale_price stored as integer cents matching existing price column pattern'
  - 'No DB CHECK constraint change needed for GBP -- application validation already accepts any 3-letter currency code'

patterns-established:
  - 'NI county detection via NI_COUNTY_IDS Set from currency.ts'
  - 'Relative time formatting via formatRelativeTime() from relative-time.ts'

# Metrics
duration: 3min
completed: 2026-03-13
---

# Phase 4 Plan 01: Foundation Migrations and Utilities Summary

**Watchlist table with RLS, sale_price column on ads, relative time formatting via native Intl APIs, and NI county GBP currency defaults**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-13T18:44:22Z
- **Completed:** 2026-03-13T18:47:38Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Watchlist table with unique constraint, RLS policy, and user_id index ready for Phase 4 save/unsave features
- sale_price column on ads table for mark-as-sold flow with optional price recording
- Zero-dependency relative time utilities using native Intl.RelativeTimeFormat and Intl.DateTimeFormat
- NI county-to-GBP mapping correctly excluding 3 ROI Ulster counties (Cavan, Donegal, Monaghan)
- All TypeScript types updated for downstream plan consumption

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migrations (watchlist table + sale_price column)** - `3a167aa` (feat)
2. **Task 2: Shared utilities and type updates** - `a7149ea` (feat)

## Files Created/Modified

- `supabase/migrations/20260313_000020_watchlist.sql` - Watchlist table with RLS, unique constraint, user_id index
- `supabase/migrations/20260313_000021_ads_sale_price_currency.sql` - sale_price integer column on ads, currency constraint verification
- `src/lib/utils/relative-time.ts` - formatRelativeTime() and formatFullDate() using native Intl APIs
- `src/lib/utils/currency.ts` - NI_COUNTY_IDS Set and getDefaultCurrency() function
- `src/types/ad-types.d.ts` - Added createdAt, salePrice to AdCard; sale_price to ApiAdRow
- `src/lib/supabase.types.ts` - Added sale_price to ads Row/Insert/Update; added watchlist table types

## Decisions Made

- Used `ie/ulster/derry` (not `ie/ulster/londonderry`) as NI county ID -- matches actual data in ireland_counties.json
- sale_price stored as integer in cents, matching existing price column pattern for consistency
- No DB CHECK constraint modification needed -- ads-validation.ts uses `/^[A-Z]{3}$/` which already accepts GBP
- Watchlist table placed before user_age_confirmations in supabase.types.ts (alphabetical ordering)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected NI county ID from 'londonderry' to 'derry'**

- **Found during:** Task 2 (currency.ts creation)
- **Issue:** Plan specified `ie/ulster/londonderry` as NI county ID, but ireland_counties.json uses `ie/ulster/derry`
- **Fix:** Used actual data ID `ie/ulster/derry` in NI_COUNTY_IDS Set
- **Files modified:** src/lib/utils/currency.ts
- **Verification:** Confirmed via grep of ireland_counties.json -- 9 Ulster counties use: antrim, armagh, cavan, derry, donegal, down, fermanagh, monaghan, tyrone
- **Committed in:** a7149ea (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential correctness fix -- using the wrong county ID would cause getDefaultCurrency() to never return GBP for Derry.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All database migrations ready for downstream plans (watchlist CRUD, mark-as-sold)
- Utility functions importable by any Phase 4 plan for timestamp display and currency defaults
- TypeScript types updated -- downstream plans can reference createdAt, salePrice, sale_price immediately
- No blockers for Phase 4 plans 02-06

---

## Self-Check: PASSED

All 5 created files verified on disk. Both task commits (3a167aa, a7149ea) verified in git log.

---

_Phase: 04-engagement-and-retention_
_Completed: 2026-03-13_
