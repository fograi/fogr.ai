---
phase: 04-engagement-and-retention
verified: 2026-03-13T20:00:00Z
status: passed
score: 27/27 must-haves verified
re_verification: false
---

# Phase 4: Engagement and Retention Verification Report

**Phase Goal:** Watchlist, saved searches, email alerts, Northern Ireland location support, and posted timestamps
**Verified:** 2026-03-13T20:00:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                 | Status   | Evidence                                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Watchlist table exists with user_id + ad_id unique constraint and RLS                 | VERIFIED | `supabase/migrations/20260313_000020_watchlist.sql` — CREATE TABLE with UNIQUE(user_id, ad_id), RLS ENABLE, policy "Users manage own watchlist" FOR ALL                                            |
| 2   | ads table has sale_price integer column (nullable)                                    | VERIFIED | `supabase/migrations/20260313_000021_ads_sale_price_currency.sql` — ALTER TABLE ADD COLUMN IF NOT EXISTS sale_price integer                                                                        |
| 3   | formatRelativeTime() converts ISO dates to compact strings like '2d ago'              | VERIFIED | `src/lib/utils/relative-time.ts` — full Intl.RelativeTimeFormat implementation, exported, walks units year→minute, returns "just now" under 1min                                                   |
| 4   | formatFullDate() converts ISO dates to 'Posted 12 March 2026'                         | VERIFIED | Same file — Intl.DateTimeFormat('en-IE', {day:'numeric',month:'long',year:'numeric'})                                                                                                              |
| 5   | getDefaultCurrency() returns GBP for 6 NI counties, EUR for everything else           | VERIFIED | `src/lib/utils/currency.ts` — NI_COUNTY_IDS Set with antrim/armagh/down/fermanagh/derry/tyrone, getDefaultCurrency returns 'GBP' if countyId in set                                                |
| 6   | AdCard type includes createdAt, salePrice, and status fields                          | VERIFIED | `src/types/ad-types.d.ts` — status?: string (line 12), createdAt?: string (line 17), salePrice?: number\|null (line 18)                                                                            |
| 7   | Every ad card shows relative time (e.g. 'Dublin · 2d ago')                            | VERIFIED | `src/lib/components/AdCard.svelte` — imports formatRelativeTime, $: timeAgo = createdAt ? formatRelativeTime(createdAt) : '', rendered in location line with middot separator                      |
| 8   | AdCardWide also shows relative time                                                   | VERIFIED | `src/lib/components/AdCardWide.svelte` — same import and pattern, rendered in meta-line with middot separator                                                                                      |
| 9   | Sold ads show SOLD badge overlay on AdCard and AdCardWide                             | VERIFIED | Both components: {#if isSold}<div class="badges"><span class="badge sold">SOLD</span></div>{/if}, .badge.sold CSS with 90% fg background reversed colors                                           |
| 10  | Recently sold ads (within 7 days) appear in browse results                            | VERIFIED | `src/routes/api/ads/+server.ts` line 836: `and(status.eq.active,expires_at.gt.${nowIso}),and(status.eq.sold,updated_at.gt.${sevenDaysAgo})`                                                        |
| 11  | Ad detail page shows full posted date and sold price                                  | VERIFIED | `src/routes/(public)/ad/[slug]/+page.svelte` — $: postedDate = formatFullDate(createdAt), $: salePriceLabel = 'Sold for ...', rendered at lines 324-328                                            |
| 12  | All page server loaders pass createdAt, status, salePrice to AdCard                   | VERIFIED | Confirmed in +page.server.ts for: homepage, [category=category], [county=county], [category=category]/[county=county], category/[slug], ad/[slug] — all map createdAt/status/salePrice             |
| 13  | Logged-in user can Save an ad from the ad detail page action rail                     | VERIFIED | `src/routes/(public)/ad/[slug]/+page.svelte` — toggleWatchlist() calls fetch('/api/watchlist', {method: POST/DELETE}), Save/Saved button with WatchlistIcon in action rail                         |
| 14  | Save button toggles to Saved state and only appears for non-owners on non-expired ads | VERIFIED | Button guarded by !data.isOwner && !data.isExpired, isSaved state toggles on res.ok                                                                                                                |
| 15  | Watchlist API has POST (save), DELETE (unsave), GET (check) endpoints                 | VERIFIED | `src/routes/api/watchlist/+server.ts` — all three handlers implemented with CSRF check, auth check, idempotent POST (catches 23505), returns json                                                  |
| 16  | Watchlist page shows saved ads as AdCard grid with remove capability                  | VERIFIED | `src/routes/(app)/watchlist/+page.svelte` — AdCard grid with remove buttons calling unsave() → DELETE /api/watchlist                                                                               |
| 17  | Empty watchlist shows correct empty state                                             | VERIFIED | "No saved ads yet. Browse listings to save ones you like." with Browse listings link to /                                                                                                          |
| 18  | Navbar includes Watchlist and Saved searches links for authenticated users            | VERIFIED | `src/lib/components/Navbar.svelte` lines 141-142: {href:'/(app)/watchlist', label:'Watchlist'} and {href:'/(app)/saved-searches', label:'Saved searches'}                                          |
| 19  | "Save this search" button on all browse pages for authenticated users                 | VERIFIED | `src/routes/+page.svelte`, [category=category]/+page.svelte, [county=county]/+page.svelte, [category=category]/[county=county]/+page.svelte — all have saveSearch() → fetch('/api/saved-searches') |
| 20  | generateSearchName() auto-generates search names from filters                         | VERIFIED | `src/lib/utils/search-name.ts` — exported function produces "Bicycles in Dublin" pattern                                                                                                           |
| 21  | Saved search management page has edit name, toggle notify, delete, run search         | VERIFIED | `src/routes/(app)/saved-searches/+page.svelte` — startEdit/saveName (PATCH), toggleNotify (PATCH notify), deleteSearch (DELETE), buildSearchUrl + "Run search" link                                |
| 22  | Saved searches API POST creates with county ID (not display name)                     | VERIFIED | `src/routes/api/saved-searches/+server.ts` — stores county ID directly, uses getCountyOptionById for display name lookup only in generateSearchName                                                |
| 23  | Seller can mark ad as Sold with optional sale price from My Ads page                  | VERIFIED | `src/routes/(app)/ads/+page.svelte` — soldAdId state triggers inline sold-form with optional price input, confirmSold() calls status API with sale_price                                           |
| 24  | Mark as Sold also available from ad detail page (owner view)                          | VERIFIED | `src/routes/(public)/ad/[slug]/+page.svelte` — {#if data.isOwner && data.ad.status === 'active'} shows inline sold form                                                                            |
| 25  | Sale price cleared automatically on reactivation from sold to active                  | VERIFIED | `src/routes/api/ads/[id]/status/+server.ts` lines 72-74: if nextStatus === 'active' && ad.status === 'sold' → updatePayload.sale_price = null                                                      |
| 26  | Post form has EUR/GBP currency selector defaulting to GBP for NI counties             | VERIFIED | `src/routes/(app)/post/+page.svelte` — currency-toggle fieldset with EUR/GBP radio, getDefaultCurrency imported, reactive $: with prevCountyId guard                                               |
| 27  | Cron worker saved search matching uses JSONB path syntax for county/locality          | VERIFIED | `src/cron-worker.ts` lines 355, 358: `location_profile_data->county->>id` and `location_profile_data->locality->>id`, isEmailSuppressed + buildUnsubscribeHeaders confirmed present                |

**Score:** 27/27 truths verified

---

### Required Artifacts

| Artifact                                                          | Provides                                              | Status   | Details                                                                                                  |
| ----------------------------------------------------------------- | ----------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/20260313_000020_watchlist.sql`               | Watchlist table with RLS                              | VERIFIED | CREATE TABLE with UNIQUE constraint, index, RLS enabled, policy for ALL authenticated                    |
| `supabase/migrations/20260313_000021_ads_sale_price_currency.sql` | sale_price column on ads                              | VERIFIED | ALTER TABLE ADD COLUMN IF NOT EXISTS sale_price integer (nullable)                                       |
| `src/lib/utils/relative-time.ts`                                  | formatRelativeTime and formatFullDate                 | VERIFIED | Both exported, full Intl implementations, 41 lines                                                       |
| `src/lib/utils/currency.ts`                                       | NI county to GBP mapping                              | VERIFIED | NI_COUNTY_IDS Set (6 counties, correct IDs including derry not londonderry), getDefaultCurrency exported |
| `src/lib/utils/search-name.ts`                                    | generateSearchName utility                            | VERIFIED | Exported, produces "Bicycles in Dublin" pattern                                                          |
| `src/types/ad-types.d.ts`                                         | Updated AdCard type with createdAt, salePrice, status | VERIFIED | All three fields present in AdCard interface                                                             |
| `src/lib/components/AdCard.svelte`                                | Timestamp display and sold badge                      | VERIFIED | formatRelativeTime imported, timeAgo computed, location line with middot, isSold badge                   |
| `src/lib/components/AdCardWide.svelte`                            | Timestamp display and sold badge                      | VERIFIED | Same pattern — formatRelativeTime, timeAgo, isSold, badge.sold CSS                                       |
| `src/routes/api/ads/+server.ts`                                   | 7-day sold window in browse results                   | VERIFIED | .or() compound filter with status.eq.sold + updated_at.gt.sevenDaysAgo                                   |
| `src/routes/api/watchlist/+server.ts`                             | POST/DELETE/GET watchlist endpoints                   | VERIFIED | All three handlers, CSRF, auth, idempotent POST, correct DB operations                                   |
| `src/routes/(app)/watchlist/+page.server.ts`                      | Watchlist page data loader                            | VERIFIED | Joins watchlist with ads, maps to AdCard[], includes createdAt/status/salePrice                          |
| `src/routes/(app)/watchlist/+page.svelte`                         | Watchlist grid page with AdCard layout                | VERIFIED | AdCard grid, remove buttons, empty state                                                                 |
| `src/routes/api/saved-searches/+server.ts`                        | POST create saved search endpoint                     | VERIFIED | CSRF, auth, generateSearchName, county ID stored, notify defaults to true                                |
| `src/routes/api/saved-searches/[id]/+server.ts`                   | PATCH and DELETE saved search endpoints               | VERIFIED | Both handlers, CSRF, auth, .eq(user_id) defense-in-depth                                                 |
| `src/routes/(app)/saved-searches/+page.server.ts`                 | Saved searches management page loader                 | VERIFIED | Queries saved_searches table, ordered by created_at desc                                                 |
| `src/routes/(app)/saved-searches/+page.svelte`                    | Saved searches management UI                          | VERIFIED | Edit name, toggle notify, delete, run search link, empty state                                           |
| `src/routes/api/ads/[id]/status/+server.ts`                       | Extended status API accepting sale_price              | VERIFIED | sale_price added to body type, set on sold, cleared on reactivation from sold                            |
| `src/routes/(app)/ads/+page.svelte`                               | Mark as Sold with sale price prompt                   | VERIFIED | soldAdId state, sold-form with optional price input, confirmSold()                                       |
| `src/routes/(app)/post/+page.svelte`                              | Currency selector with county-based default           | VERIFIED | getDefaultCurrency imported, currency-toggle fieldset, reactive prevCountyId guard                       |
| `src/cron-worker.ts`                                              | Fixed JSONB path filtering for saved search matching  | VERIFIED | location_profile_data->county->>id and ->locality->>id, isEmailSuppressed, buildUnsubscribeHeaders       |

---

### Key Link Verification

| From                                              | To                                  | Via                                              | Status | Details                                                                     |
| ------------------------------------------------- | ----------------------------------- | ------------------------------------------------ | ------ | --------------------------------------------------------------------------- |
| `src/lib/components/AdCard.svelte`                | `src/lib/utils/relative-time.ts`    | import formatRelativeTime                        | WIRED  | Line 12: `import { formatRelativeTime } from '$lib/utils/relative-time'`    |
| `src/routes/api/ads/+server.ts`                   | browse query                        | 7-day sold window filter                         | WIRED  | Line 836: compound .or() with status.eq.sold + updated_at.gt.sevenDaysAgo   |
| `src/routes/+page.server.ts`                      | AdCard type                         | createdAt mapping from created_at                | WIRED  | Lines 90-92: createdAt, status, salePrice mapping present                   |
| `src/routes/(public)/ad/[slug]/+page.svelte`      | `/api/watchlist`                    | fetch POST/DELETE for save toggle                | WIRED  | Lines 138-142: fetch('/api/watchlist', {method: POST/DELETE})               |
| `src/routes/(app)/watchlist/+page.server.ts`      | supabase watchlist table            | select with ad join                              | WIRED  | .from('watchlist').select('ad_id, created_at, ads(...)')                    |
| `src/lib/components/Navbar.svelte`                | `/watchlist`                        | navigation link                                  | WIRED  | Line 141: href: '/(app)/watchlist'                                          |
| `src/routes/+page.svelte`                         | `/api/saved-searches`               | fetch POST to save current filters               | WIRED  | Line 35: fetch('/api/saved-searches', ...)                                  |
| `src/routes/(app)/saved-searches/+page.server.ts` | supabase saved_searches table       | select user's saved searches                     | WIRED  | .from('saved_searches').select(...)                                         |
| `src/routes/api/saved-searches/+server.ts`        | `src/lib/utils/search-name.ts`      | generateSearchName                               | WIRED  | Line 4: import generateSearchName; line 36: generateSearchName({...})       |
| `src/routes/api/ads/[id]/status/+server.ts`       | supabase ads table                  | update sale_price on sold, clear on reactivation | WIRED  | Lines 67-74: updatePayload.sale_price set on sold, set null on reactivation |
| `src/routes/(app)/post/+page.svelte`              | `src/lib/utils/currency.ts`         | import getDefaultCurrency                        | WIRED  | Line 35: import { getDefaultCurrency } from '$lib/utils/currency'           |
| `src/cron-worker.ts`                              | supabase ads table                  | JSONB path filter for county/locality matching   | WIRED  | Lines 355, 358: location_profile_data->county->>id and locality->>id        |
| `src/cron-worker.ts`                              | `src/lib/server/email/templates.ts` | buildSearchAlertEmailHtml                        | WIRED  | Line 14: import, line 420: called with digest content                       |

---

### Requirements Coverage

| Requirement | Description                                                                 | Status    | Evidence                                                                                                                                                                                                                        |
| ----------- | --------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ENGR-01     | User can save ads to a personal watchlist                                   | SATISFIED | Watchlist API POST/DELETE, Save button on ad detail page, isSaved check                                                                                                                                                         |
| ENGR-02     | User can view and manage their watchlist                                    | SATISFIED | `/(app)/watchlist` page with AdCard grid and per-ad Remove buttons                                                                                                                                                              |
| ENGR-03     | User can create saved searches with category, location, and keyword filters | SATISFIED | POST /api/saved-searches stores category, county, locality, query; Save buttons on all 4 browse pages                                                                                                                           |
| ENGR-04     | User receives email alerts when new ads match their saved searches          | SATISFIED | Cron worker findMatchingAds queries ads matching saved search filters, sends digest via buildSearchAlertEmailHtml                                                                                                               |
| ENGR-05     | User can manage and delete their saved searches                             | SATISFIED | `/(app)/saved-searches` management page: edit name (PATCH), toggle notify (PATCH), delete (DELETE), run search link                                                                                                             |
| ENGR-06     | Saved search emails include one-click unsubscribe (GDPR compliant)          | SATISFIED | cron-worker.ts: isEmailSuppressed check before sending, buildUnsubscribeHeaders in sendEmail call                                                                                                                               |
| ENGR-07     | Seller can mark ad as "Sold" with optional final sale price                 | SATISFIED | Inline sold form on My Ads and ad detail (owner view), status API accepts sale_price, sale_price cleared on reactivation                                                                                                        |
| TRST-01     | Every listing displays "Posted X days ago" timestamp visibly                | SATISFIED | formatRelativeTime in AdCard.svelte with middot separator; formatFullDate on ad detail page                                                                                                                                     |
| TRST-02     | Location hierarchy includes Northern Ireland counties and localities        | SATISFIED | ireland_counties.json has all 6 NI counties under ie/ulster; county-slugs.ts uses getCountyOptions() which reads this data; getDefaultCurrency uses 'ie/ulster/derry' (correct ID); NI county param matcher works via same data |

---

### Anti-Patterns Found

None. All files are substantive implementations with no TODOs, stubs, or placeholder returns. The `.placeholder` CSS class in My Ads and `placeholder` HTML attribute in the sale price input are legitimate UI patterns, not implementation stubs. The `return null` in cron-worker is proper null error handling (lines 251, 257), not a stub.

---

### Human Verification Required

#### 1. Timestamp Display on Live Browse

**Test:** Browse to any listing page (homepage, category, or county page) — verify "Dublin · 2d ago" pattern appears in each ad card.
**Expected:** Relative time appears next to location with a middot separator. Cards without location still show relative time alone.
**Why human:** AdCard rendering requires browser context; grep confirms code path is wired but not rendered.

#### 2. Save Button Toggle in Action Rail

**Test:** Log in as a non-owner, view an ad. Click "Save". Verify button changes to "Saved" (filled heart). Refresh page. Verify button still shows "Saved". Click again to unsave.
**Expected:** Toggle persists across page loads via server-side isSaved check. Button only visible when not owner and not expired.
**Why human:** Client-side state management and persistence cannot be verified programmatically.

#### 3. Email Alert Matching (End-to-End)

**Test:** Create a saved search for "Bicycles in Dublin" (notify on). Post a new bikes ad in Dublin. Wait for or manually trigger the cron worker. Verify email received with correct content and unsubscribe link.
**Expected:** One-click unsubscribe in email works. Alert contains the new ad.
**Why human:** Requires cron trigger, Resend email delivery, and real-time verification.

#### 4. NI Currency Auto-Default on Post Form

**Test:** Go to post form. Select "Antrim" as county. Verify EUR/GBP radio toggles to GBP automatically. Select "Dublin" — verify it reverts to EUR. Manually select GBP then change to a non-NI county — verify currency stays at user's GBP selection (prevCountyId guard).
**Expected:** Auto-default triggers on county change only. Manual override is preserved.
**Why human:** Reactive Svelte state requires browser interaction to verify.

#### 5. NI Programmatic SEO Pages

**Test:** Navigate to `/antrim`, `/bicycles/antrim`, `/down` — verify pages render correctly with the correct county name and listings.
**Expected:** Pages load, show correct NI county name, show relevant listings.
**Why human:** Route param matching and page rendering require browser context.

---

### Gaps Summary

No gaps found. All 27 must-have truths are verified. All 20 artifacts pass all three levels (exists, substantive, wired). All 13 key links confirmed wired. All 9 requirement IDs (ENGR-01 through ENGR-07, TRST-01, TRST-02) are satisfied.

Notable implementation quality: The NI county ID deviation in 04-01 was correctly auto-fixed — `ie/ulster/derry` used instead of the plan's `ie/ulster/londonderry`, matching actual JSON data. This fix propagated correctly to currency.ts and all dependent features.

---

_Verified: 2026-03-13T20:00:00Z_
_Verifier: Claude (gsd-verifier)_
