# Phase 4: Engagement and Retention - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Give buyers reasons to return without marketing spend. Deliver: watchlist (save/unsave ads), saved search creation UI with email alerts, "Mark as Sold" with optional sale price, posted timestamps on all listings, and Northern Ireland location + GBP currency support. Does NOT include real-time notifications, user ratings, or any marketing/growth features.

</domain>

<decisions>
## Implementation Decisions

### Watchlist

- Save button on ad page action rail only — not on AdCards (keeps cards clean, newspaper aesthetic)
- Watchlist page uses AdCard grid layout — reuses existing AdCard component, consistent with browse pages
- No limit on saved ads — low volume classifieds site, not worth adding friction
- Empty state: simple text "No saved ads yet. Browse listings to save ones you like." with link to home page
- Login required to save — no guest state management
- New `watchlist` Supabase table: user_id + ad_id, RLS per user

### Saved search creation

- "Save this search" button appears on browse/filter results pages — captures current filters (category, county, keyword)
- Auto-generated search names from filters (e.g., "Bicycles in Dublin") — user can edit later from management page
- Management page lives under (app)/account area — consistent with My Ads and Messages
- Login required to save a search — button only shown to authenticated users
- Existing `saved_searches` table from Phase 3 already has category, county, locality, query, notify columns
- Daily digest cron already built in Phase 3 — no new alert infrastructure needed

### Mark as sold

- Sold ads remain visible in browse/search with prominent "SOLD" badge for 7 days, then fade from results
- Sale price visible to everyone on the sold ad page — "Sold for €350" — transparency differentiator
- "Mark as Sold" available from My Ads management page AND ad detail page (owner view)
- Prompt for optional sale price in simple inline form when marking sold
- Reactivation allowed (sold → active) — clears sale price when reactivated
- Existing `ad-status.ts` already handles sold transitions — extend status API to accept sale_price parameter
- New `sale_price` column on ads table

### Posted timestamps

- AdCards show relative time: "2d ago", "3h ago" — scannable, below location line with dot separator ("Dublin · 2d ago")
- Ad detail page shows full date: "Posted 12 March 2026"
- `created_at` already exists on all ads — no new DB column needed, just UI rendering

### Northern Ireland & GBP currency

- NI counties already in location data (all 9 Ulster counties) — location picker works today
- Ensure programmatic SEO pages work for NI counties (e.g., /antrim, /bicycles/antrim) — verify county slugs and param matcher
- Add GBP as available currency option alongside EUR
- Currency selector on post form — default based on county (EUR for ROI counties, GBP for NI counties)
- Buyer sees price in whatever currency seller picked — no conversion
- Price display: €350 for EUR, £350 for GBP

### Claude's Discretion

- Watchlist table schema details (indexes, constraints)
- Sold badge visual design and overlay approach
- Relative time formatting function implementation
- How the 7-day sold visibility window is enforced (query filter vs cron cleanup)
- SEO page verification approach for NI counties
- Currency default logic implementation (mapping county IDs to default currency)

</decisions>

<specifics>
## Specific Ideas

- Sold price visibility is a key differentiator from adverts.ie/donedeal.ie — emphasize transparency
- Cards stay clean — no save icons on cards, newspaper aesthetic preserved
- Auto-generated saved search names to minimize friction ("Bicycles in Dublin" not "My search #3")
- Dot separator pattern for card metadata: "Dublin · 2d ago"

</specifics>

<code_context>

## Existing Code Insights

### Reusable Assets

- `AdCard.svelte` and `AdCardWide.svelte`: Add timestamp display and sold badge
- `ad-status.ts`: Already validates active/sold/archived transitions — extend for sale_price
- `src/routes/api/ads/[id]/status/+server.ts`: Status change API — add sale_price to payload
- `saved_searches` table + migration: Already exists from Phase 3
- Cron worker daily digest: Already dispatches saved search alerts
- `location-hierarchy.ts`: Full Ulster province with all 9 counties already loaded
- `county-slugs.ts`: Generates slugs for all counties including NI — SEO pages may already work
- `src/lib/utils/price.ts`: Price formatting — extend for GBP symbol
- Email unsubscribe + preferences: Complete from Phase 3

### Established Patterns

- Action rail on ad page for Share/Report buttons — add Save button here
- (app) route group for authenticated pages — watchlist and saved search management go here
- Status management via API endpoint + `validateAdStatusChange()` function
- Supabase RLS per user for data isolation

### Integration Points

- Ad page action rail: add Save/Unsave toggle button
- My Ads page: add "Mark as Sold" with sale price prompt
- Browse/filter results pages: add "Save this search" button (home, category, programmatic SEO pages)
- Account area: new saved searches management page
- AdCard component: add timestamp and sold badge
- Post form: add currency selector (EUR/GBP)
- ads-validation.ts: accept currency field
- Price display utilities: handle GBP formatting

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 04-engagement-and-retention_
_Context gathered: 2026-03-13_
