# Phase 4: Engagement and Retention - Research

**Researched:** 2026-03-13
**Domain:** SvelteKit UI features, Supabase RLS tables, cron worker email alerts, currency handling
**Confidence:** HIGH

## Summary

Phase 4 adds six discrete features to the existing fogr.ai classifieds platform: watchlist (save/unsave ads), saved search creation UI, saved search email alerts (fixing existing cron worker), posted timestamps on cards/listings, NI location verification with GBP currency, and mark-as-sold with sale price. The codebase is mature -- SvelteKit 2 + Svelte 5, Supabase Postgres, Cloudflare Workers -- with well-established patterns for new pages, API endpoints, and component extensions.

Most infrastructure already exists from Phase 3: the `saved_searches` table, the cron worker digest function, email templates, and unsubscribe/preference system. The primary new database work is the `watchlist` table and a `sale_price` column on ads. The UI work is moderate: new pages under `(app)/` route group, component modifications to AdCard/AdCardWide, and a currency selector on the post form.

**Primary recommendation:** Follow existing patterns exactly -- new Supabase tables with RLS, API routes in `/api/`, authenticated pages under `(app)/`, and the established component prop-passing style. The critical fix is the cron worker's saved search matching which queries nonexistent `county`/`locality` columns on the ads table -- it must use JSONB path filters instead.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Watchlist

- Save button on ad page action rail only -- not on AdCards (keeps cards clean, newspaper aesthetic)
- Watchlist page uses AdCard grid layout -- reuses existing AdCard component, consistent with browse pages
- No limit on saved ads -- low volume classifieds site, not worth adding friction
- Empty state: simple text "No saved ads yet. Browse listings to save ones you like." with link to home page
- Login required to save -- no guest state management
- New `watchlist` Supabase table: user_id + ad_id, RLS per user

#### Saved search creation

- "Save this search" button appears on browse/filter results pages -- captures current filters (category, county, keyword)
- Auto-generated search names from filters (e.g., "Bicycles in Dublin") -- user can edit later from management page
- Management page lives under (app)/account area -- consistent with My Ads and Messages
- Login required to save a search -- button only shown to authenticated users
- Existing `saved_searches` table from Phase 3 already has category, county, locality, query, notify columns
- Daily digest cron already built in Phase 3 -- no new alert infrastructure needed

#### Mark as sold

- Sold ads remain visible in browse/search with prominent "SOLD" badge for 7 days, then fade from results
- Sale price visible to everyone on the sold ad page -- "Sold for X" -- transparency differentiator
- "Mark as Sold" available from My Ads management page AND ad detail page (owner view)
- Prompt for optional sale price in simple inline form when marking sold
- Reactivation allowed (sold -> active) -- clears sale price when reactivated
- Existing `ad-status.ts` already handles sold transitions -- extend status API to accept sale_price parameter
- New `sale_price` column on ads table

#### Posted timestamps

- AdCards show relative time: "2d ago", "3h ago" -- scannable, below location line with dot separator ("Dublin . 2d ago")
- Ad detail page shows full date: "Posted 12 March 2026"
- `created_at` already exists on all ads -- no new DB column needed, just UI rendering

#### Northern Ireland & GBP currency

- NI counties already in location data (all 9 Ulster counties) -- location picker works today
- Ensure programmatic SEO pages work for NI counties (e.g., /antrim, /bicycles/antrim) -- verify county slugs and param matcher
- Add GBP as available currency option alongside EUR
- Currency selector on post form -- default based on county (EUR for ROI counties, GBP for NI counties)
- Buyer sees price in whatever currency seller picked -- no conversion
- Price display: euro sign for EUR, pound sign for GBP

### Claude's Discretion

- Watchlist table schema details (indexes, constraints)
- Sold badge visual design and overlay approach
- Relative time formatting function implementation
- How the 7-day sold visibility window is enforced (query filter vs cron cleanup)
- SEO page verification approach for NI counties
- Currency default logic implementation (mapping county IDs to default currency)

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core (Already Installed)

| Library               | Version  | Purpose             | Why Standard                                |
| --------------------- | -------- | ------------------- | ------------------------------------------- |
| SvelteKit             | ^2.50.2  | Framework           | Already committed                           |
| Svelte                | ^5.50.0  | UI components       | Already committed                           |
| @supabase/supabase-js | ^2.95.3  | Database client     | Already committed                           |
| @supabase/ssr         | ^0.8.0   | Server-side auth    | Already committed                           |
| lucide-svelte         | ^0.563.0 | Icons               | Already used for ShareIcon, ReportIcon etc. |
| slugify               | ^1.6.6   | URL slug generation | Already used in county-slugs.ts             |

### No New Dependencies Required

This phase requires zero new npm packages. All functionality is achievable with:

- Native `Intl.RelativeTimeFormat` for relative timestamps
- Native `Intl.DateTimeFormat` for full date formatting
- Native `Intl.NumberFormat` for GBP currency (already works via existing `formatMoney` in price.ts)
- Supabase client for all database operations
- Existing email infrastructure from Phase 3

## Architecture Patterns

### Recommended Project Structure (New Files)

```
supabase/migrations/
  20260313_000020_watchlist.sql           # watchlist table + RLS
  20260313_000021_ads_sale_price.sql      # sale_price column on ads
  20260313_000022_ads_currency_gbp.sql    # currency constraint update (if needed)

src/lib/
  utils/
    relative-time.ts                       # formatRelativeTime() utility
  server/
    watchlist.ts                           # (optional) shared watchlist logic

src/routes/
  api/
    watchlist/+server.ts                   # POST (save) / DELETE (unsave) / GET (check)
    saved-searches/+server.ts              # POST (create) / DELETE (remove)
    saved-searches/[id]/+server.ts         # PATCH (edit name/notify) / DELETE
    ads/[id]/status/+server.ts             # PATCH existing to accept sale_price
  (app)/
    watchlist/
      +page.server.ts                      # Load watchlist with ad data
      +page.svelte                         # Watchlist grid page
    saved-searches/
      +page.server.ts                      # Load user's saved searches
      +page.svelte                         # Saved searches management page
```

### Pattern 1: New Authenticated API Endpoint

**What:** API routes that require auth, validate input, and interact with Supabase
**When to use:** Watchlist save/unsave, saved search CRUD
**Example:**

```typescript
// Follows established pattern from src/routes/api/ads/[id]/status/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { isSameOrigin } from '$lib/server/csrf';

export const POST: RequestHandler = async ({ request, locals, url }) => {
	if (!isSameOrigin(request, url)) return json({ error: 'Forbidden' }, { status: 403 });

	const {
		data: { user }
	} = await locals.supabase.auth.getUser();
	if (!user) return json({ error: 'Auth required' }, { status: 401 });

	// ... validate body, interact with Supabase
	const { error } = await locals.supabase
		.from('watchlist')
		.insert({ user_id: user.id, ad_id: adId });

	if (error) return json({ error: 'Could not save' }, { status: 500 });
	return json({ success: true });
};
```

### Pattern 2: New Authenticated Page

**What:** Pages under `(app)` route group that require login
**When to use:** Watchlist page, saved searches management
**Example:**

```typescript
// +page.server.ts follows (app)/ads/+page.server.ts pattern
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();
	if (!user) return { items: [] };

	const { data, error } = await locals.supabase
		.from('watchlist')
		.select('ad_id, ads(id, slug, title, price, ...)')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	return { items: data ?? [] };
};
```

### Pattern 3: Extending Existing Components with New Props

**What:** Adding new display data to AdCard/AdCardWide without breaking existing usage
**When to use:** Adding timestamps, sold badges
**Example:**

```svelte
<!-- AdCard.svelte -- new optional props with defaults -->
export let createdAt: string | undefined = undefined; export let status: string | undefined = undefined;
export let salePrice: number | null = null; $: timeAgo = createdAt ? formatRelativeTime(createdAt) : '';
$: isSold = status === 'sold';
```

### Pattern 4: Supabase RLS Table

**What:** User-scoped tables with row-level security
**When to use:** Watchlist table
**Example:**

```sql
-- Follows saved_searches migration pattern exactly
CREATE TABLE IF NOT EXISTS public.watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, ad_id)
);

CREATE INDEX IF NOT EXISTS watchlist_user_id_idx
  ON public.watchlist (user_id);

ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own watchlist"
  ON public.watchlist FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Anti-Patterns to Avoid

- **Adding save icons to AdCards:** User explicitly decided against this -- newspaper aesthetic preserved
- **Guest watchlist with localStorage:** User decided login required -- no guest state management
- **Currency conversion:** No conversion between EUR/GBP -- buyer sees seller's chosen currency
- **Real-time alert infrastructure:** Daily digest cron already exists -- no WebSocket/push needed
- **Custom date formatting libraries:** Use native `Intl.RelativeTimeFormat` -- zero dependencies

## Don't Hand-Roll

| Problem                            | Don't Build                          | Use Instead                                      | Why                                                              |
| ---------------------------------- | ------------------------------------ | ------------------------------------------------ | ---------------------------------------------------------------- |
| Relative time formatting           | Custom "X days ago" string builder   | `Intl.RelativeTimeFormat`                        | Handles localization, edge cases, future-proof                   |
| Currency formatting                | Manual symbol + number concatenation | `Intl.NumberFormat` with currency option         | Already works in `formatMoney()` -- handles EUR and GBP natively |
| Unique constraint enforcement      | Application-level duplicate checking | Postgres UNIQUE constraint on `(user_id, ad_id)` | Race-condition-proof, DB handles it                              |
| Rate-limited saved search creation | Custom throttle logic                | Supabase RLS + reasonable UI                     | Low-volume site, not worth complexity                            |

**Key insight:** The Intl APIs already handle both EUR and GBP formatting correctly -- `formatMoney(350, 'GBP', 'en-IE')` produces "GBP 350" or with `en-GB` locale produces the pound sign. The existing `price.ts` utility already accepts currency as a parameter.

## Common Pitfalls

### Pitfall 1: Cron Worker Saved Search Matching Queries Wrong Columns

**What goes wrong:** The existing `findMatchingAds` function in `cron-worker.ts` (lines 343-358) queries `county` and `locality` as top-level columns on the ads table. The ads table does NOT have these columns -- location data is stored in `location_profile_data` JSONB column.
**Why it happens:** The saved_searches table stores county/locality as flat text, but ads store them as `location_profile_data->'county'->>'id'`.
**How to avoid:** The cron worker must use Supabase PostgREST JSONB filter syntax: `location_profile_data->county->>id` with `eq.{county_id}`. Existing indexes already support this (`ads_location_county_id_idx` and `ads_status_county_created_idx`).
**Warning signs:** Saved search alerts never finding matches despite new ads being posted in matching categories/locations.
**Confidence:** HIGH -- verified by cross-referencing cron-worker.ts lines 353-354 with supabase.types.ts (no county/locality columns) and migration 20260209_000016 (JSONB indexes exist).

### Pitfall 2: Saved Search Stores County Name vs County ID

**What goes wrong:** The `saved_searches` table has `county text` column. If this stores the county display name (e.g., "Dublin") rather than the county ID, matching against `location_profile_data->'county'->>'id'` will fail.
**Why it happens:** The browse page filter uses `county_id` query parameter (county ID), but the saved search creation needs to capture the same county ID, not the display name.
**How to avoid:** When creating a saved search from current filters, capture `county_id` (the ID) into the `county` column. The cron worker must query using the same ID format.
**Warning signs:** Saved search creation appears to work but email alerts never match.

### Pitfall 3: Sold Visibility Window Leaking into Search/Browse

**What goes wrong:** Sold ads should be visible for 7 days then fade from browse results, but may appear indefinitely if not filtered.
**Why it happens:** No automatic mechanism to hide sold ads after 7 days.
**How to avoid:** Enforce the 7-day window via query filter rather than cron cleanup. Add a WHERE clause to browse/search queries: `status = 'active' OR (status = 'sold' AND updated_at > now() - interval '7 days')`. This is simpler and more predictable than a cron job that changes status.
**Warning signs:** Old sold ads cluttering search results.

### Pitfall 4: Sale Price Not Cleared on Reactivation

**What goes wrong:** User marks as sold with sale price, then reactivates. The sale price remains visible.
**Why it happens:** The status change API updates `status` but not `sale_price`.
**How to avoid:** When status changes from `sold` to `active`, explicitly set `sale_price = null` in the update query.
**Warning signs:** Active ads showing "Sold for X" price.

### Pitfall 5: Currency Default Logic Coupling

**What goes wrong:** Hard-coding NI county IDs in the currency default logic creates a maintenance burden.
**Why it happens:** Need to map counties to default currencies.
**How to avoid:** Use the province as the discriminator. All NI counties are under the "Ulster" province. But note: Ulster includes 3 ROI counties (Donegal, Cavan, Monaghan). Use a simple county-to-jurisdiction map: the 6 NI counties (Antrim, Armagh, Down, Fermanagh, Londonderry, Tyrone) default to GBP; the 3 ROI Ulster counties (Cavan, Donegal, Monaghan) default to EUR. This is the correct political/currency boundary.
**Warning signs:** Donegal/Cavan/Monaghan defaulting to GBP when they should be EUR.

### Pitfall 6: AdCard Prop Changes Breaking Callers

**What goes wrong:** Adding new required props to AdCard breaks every page that renders it.
**Why it happens:** Multiple pages pass data to AdCard -- homepage, category pages, SEO pages, ad detail page, watchlist.
**How to avoid:** All new props MUST have defaults: `export let createdAt: string | undefined = undefined;`. Only pages that want the new feature pass the prop.
**Warning signs:** TypeScript build errors across many files after AdCard changes.

## Code Examples

### Relative Time Formatting

```typescript
// src/lib/utils/relative-time.ts
// Use native Intl.RelativeTimeFormat -- zero dependencies

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
	['year', 365 * 24 * 60 * 60 * 1000],
	['month', 30 * 24 * 60 * 60 * 1000],
	['week', 7 * 24 * 60 * 60 * 1000],
	['day', 24 * 60 * 60 * 1000],
	['hour', 60 * 60 * 1000],
	['minute', 60 * 1000]
];

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'always', style: 'narrow' });

/**
 * Format a created_at ISO string as "2d ago", "3h ago", etc.
 * Returns "just now" for < 1 minute.
 */
export function formatRelativeTime(isoDate: string): string {
	const diff = Date.now() - new Date(isoDate).getTime();
	if (diff < 60_000) return 'just now';

	for (const [unit, ms] of UNITS) {
		if (diff >= ms) {
			const value = Math.floor(diff / ms);
			return rtf.format(-value, unit);
		}
	}
	return 'just now';
}

/**
 * Format a created_at ISO string as full date: "Posted 12 March 2026"
 */
export function formatFullDate(isoDate: string): string {
	return new Intl.DateTimeFormat('en-IE', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}).format(new Date(isoDate));
}
```

### Watchlist Toggle (Ad Page Action Rail)

```svelte
<!-- Added to ad detail page action rail, alongside Share and Report -->
{#if !data.isOwner && !data.isExpired}
	<button type="button" class="btn ghost" disabled={saveBusy} on:click={toggleWatchlist}>
		<span class="btn-icon" aria-hidden="true">
			<!-- HeartIcon from lucide-svelte -->
		</span>
		{isSaved ? 'Saved' : 'Save'}
	</button>
{/if}
```

### Saved Search Auto-Name Generation

```typescript
/**
 * Generate a human-readable name from search filters.
 * "Bicycles in Dublin" or "Electronics" or "All listings in Cork"
 */
export function generateSearchName(filters: {
	category?: string | null;
	countyName?: string | null;
	query?: string | null;
}): string {
	const parts: string[] = [];
	if (filters.category) parts.push(filters.category);
	if (filters.query) parts.push(`"${filters.query}"`);
	if (!parts.length) parts.push('All listings');
	if (filters.countyName) parts.push(`in ${filters.countyName}`);
	return parts.join(' ');
}
```

### Currency Default Logic

```typescript
// NI counties that use GBP (the 6 counties of Northern Ireland)
// NOT all Ulster counties -- Cavan, Donegal, Monaghan are ROI (EUR)
const NI_COUNTY_IDS = new Set([
	// These IDs come from ireland_counties.json
	// Must be verified against actual data
]);

export function getDefaultCurrency(countyId: string | null): 'EUR' | 'GBP' {
	if (!countyId) return 'EUR';
	return NI_COUNTY_IDS.has(countyId) ? 'GBP' : 'EUR';
}
```

### Status API Extension for Sale Price

```typescript
// Extend the existing POST handler in api/ads/[id]/status/+server.ts
// Parse sale_price from the request body alongside status
let body: { status?: string; sale_price?: number | null } = {};
// ... existing validation ...

const updatePayload: Record<string, unknown> = {
	status: nextStatus,
	updated_at: new Date().toISOString()
};

// Add sale_price when marking as sold
if (nextStatus === 'sold' && typeof body.sale_price === 'number' && body.sale_price > 0) {
	updatePayload.sale_price = body.sale_price;
}

// Clear sale_price when reactivating from sold
if (nextStatus === 'active' && ad.status === 'sold') {
	updatePayload.sale_price = null;
}
```

### Cron Worker Fix: JSONB Path Filtering

```typescript
// CURRENT (BROKEN) -- queries nonexistent columns:
if (search.county) url.searchParams.set('county', `eq.${search.county}`);
if (search.locality) url.searchParams.set('locality', `eq.${search.locality}`);

// FIXED -- use PostgREST JSONB path syntax:
if (search.county) {
	url.searchParams.set('location_profile_data->county->>id', `eq.${search.county}`);
}
if (search.locality) {
	url.searchParams.set('location_profile_data->locality->>id', `eq.${search.locality}`);
}
```

### 7-Day Sold Window Query Filter

```typescript
// For browse/search queries that should include recently-sold ads:
// Instead of just: .eq('status', 'active')
// Use: .or(`status.eq.active,and(status.eq.sold,updated_at.gt.${sevenDaysAgo})`)
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
query.or(`status.eq.active,and(status.eq.sold,updated_at.gt.${sevenDaysAgo})`);
```

## State of the Art

| Old Approach                                | Current Approach                       | When Changed       | Impact                          |
| ------------------------------------------- | -------------------------------------- | ------------------ | ------------------------------- |
| `Intl.RelativeTimeFormat` (limited support) | Fully supported in all modern browsers | 2020+              | Safe to use, no polyfill needed |
| Moment.js for date formatting               | Native Intl APIs                       | 2022+              | Zero dependency date formatting |
| Flat columns for location                   | JSONB `location_profile_data`          | Phase 1 (existing) | Must use JSONB path queries     |

**Deprecated/outdated:**

- The cron worker's flat-column approach to county/locality filtering on ads table was never correct -- needs JSONB path fix

## NI County Identification

The `ireland_counties.json` data includes all 9 Ulster counties. The 6 Northern Ireland counties (for GBP default) are:

- Antrim
- Armagh
- Down
- Fermanagh
- Londonderry (sometimes called Derry)
- Tyrone

The 3 Republic of Ireland Ulster counties (EUR default) are:

- Cavan
- Donegal
- Monaghan

The county IDs must be read from the JSON data at implementation time. The `location-hierarchy.ts` already exposes `getCountyOptions()` and province lookups that can identify which counties are under which province, but the ROI/NI split within Ulster requires explicit mapping.

## Existing Infrastructure Inventory

### Already Built (Phase 3)

| Component                   | Location                           | Status                                                         |
| --------------------------- | ---------------------------------- | -------------------------------------------------------------- |
| `saved_searches` table      | migration 000019                   | Schema ready, RLS in place                                     |
| `email_preferences` table   | migration 000018                   | Working, suppression checks in cron                            |
| Cron worker digest function | `cron-worker.ts:361-449`           | **BROKEN** -- county/locality matching uses wrong column names |
| Email templates             | `email/templates.ts`               | Working -- `buildSearchAlertEmailHtml` exists                  |
| Unsubscribe flow            | `email/unsubscribe.ts` + API route | Complete and working                                           |
| Email send function         | `email/send.ts`                    | Working via Resend REST API                                    |

### Already Built (Earlier Phases)

| Component               | Location                                   | Status                                         |
| ----------------------- | ------------------------------------------ | ---------------------------------------------- |
| Ad status transitions   | `server/ad-status.ts`                      | Working -- sold<->active transitions allowed   |
| Status change API       | `api/ads/[id]/status/+server.ts`           | Working -- needs sale_price extension          |
| My Ads page             | `(app)/ads/+page.svelte`                   | Working -- has Mark Sold button                |
| Account page            | `(app)/account/+page.svelte`               | Working -- data export, delete account         |
| AdCard component        | `components/AdCard.svelte`                 | Working -- needs timestamp + sold badge        |
| AdCardWide component    | `components/AdCardWide.svelte`             | Working -- needs timestamp + sold badge        |
| Ad detail page          | `(public)/ad/[slug]/+page.svelte`          | Working -- has action rail for Save button     |
| Price formatting        | `utils/price.ts`                           | Working -- already accepts currency param      |
| Location hierarchy      | `location-hierarchy.ts`                    | Working -- all 32 counties including NI        |
| County slugs            | `seo/county-slugs.ts`                      | Working -- all counties slugified              |
| Homepage/browse filters | `+page.server.ts` + `+page.svelte`         | Working -- category, county, locality, keyword |
| Programmatic SEO pages  | `[category=category]/`, `[county=county]/` | Working -- param matchers in place             |

## Open Questions

1. **Exact NI county IDs in ireland_counties.json**
   - What we know: Ulster province has 9 counties, 6 are NI
   - What's unclear: The exact string IDs used in the JSON (likely slugified names but must verify)
   - Recommendation: Read IDs from the JSON at implementation time, create a `NI_COUNTY_IDS` Set

2. **Saved search `county` column data format**
   - What we know: The column is `text` type. The browse page uses county IDs (e.g., from `location-hierarchy.ts`)
   - What's unclear: Whether any saved searches already exist with county names vs IDs
   - Recommendation: Store county IDs (not names) since the cron worker needs to match against `location_profile_data->'county'->>'id'`

3. **GBP currency validation in ads-validation.ts**
   - What we know: `validateAdMeta` checks `/^[A-Z]{3}$/` for currency -- GBP already passes
   - What's unclear: Whether any other validation or constraint limits currency to EUR only
   - Recommendation: Verify the Supabase ads table has no CHECK constraint on currency column

4. **Sold ad visibility in programmatic SEO pages**
   - What we know: Programmatic pages query ads with `status = 'active'`
   - What's unclear: Whether sold ads should appear on SEO pages (e.g., /bicycles/dublin)
   - Recommendation: Include sold ads (with badge) on SEO pages to boost content density, with 7-day window

## Sources

### Primary (HIGH confidence)

- Codebase inspection: `src/cron-worker.ts` -- verified saved search digest logic and JSONB mismatch bug
- Codebase inspection: `supabase/migrations/` -- verified all table schemas and indexes
- Codebase inspection: `src/lib/supabase.types.ts` -- confirmed ads table has no county/locality columns
- Codebase inspection: `src/lib/server/ad-status.ts` -- verified sold transition logic
- Codebase inspection: `src/lib/utils/price.ts` -- verified `formatMoney` accepts currency parameter
- Codebase inspection: `src/lib/location-hierarchy.ts` -- verified 32-county data including NI
- Codebase inspection: `src/lib/data/ireland_counties.json` -- verified Ulster province with 9 counties

### Secondary (MEDIUM confidence)

- `Intl.RelativeTimeFormat` browser support: widely supported since 2020 across all modern browsers
- PostgREST JSONB filtering syntax: verified against Supabase documentation patterns and existing codebase usage in `ad/[slug]/+page.server.ts` line 165

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- no new dependencies, all existing patterns documented
- Architecture: HIGH -- follows established codebase patterns, all source files inspected
- Pitfalls: HIGH -- critical cron worker bug verified through code cross-referencing
- NI county mapping: MEDIUM -- county data verified present but exact IDs need runtime reading

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable codebase, no external dependency changes expected)
