# Architecture Research

**Domain:** Irish classifieds platform (fogr.ai / Fógraí)
**Researched:** 2026-03-11
**Confidence:** HIGH (based on direct codebase analysis + verified web research)

## Current Architecture (Brownfield Baseline)

The system is already built. This document describes what exists, what gaps exist for the
stated goals (SEO growth, monetization, cold-start), and how the architecture should evolve.

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER / CLIENT                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Home     │  │ Category │  │ Ad View  │  │ Post/Edit│   │
│  │ /        │  │ /cat/[s] │  │/ad/[id]  │  │ /post    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼──────────────┼─────────┘
        │ SSR         │ SSR         │ SSR           │ SSR+Auth
┌───────┼─────────────┼─────────────┼──────────────┼─────────┐
│                  SVELTEKIT (Cloudflare Workers)              │
│                  +page.server.ts load functions              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  src/routes/+page.server.ts                        │     │
│  │  src/routes/(public)/category/[slug]/+page.server  │     │
│  │  src/routes/(public)/ad/[slug]/+page.server        │     │
│  │  src/routes/(app)/** (auth-gated)                  │     │
│  └───────────────────┬────────────────────────────────┘     │
│                      │ internal fetch                        │
│  ┌────────────────────────────────────────────────────┐     │
│  │  API LAYER  src/routes/api/                        │     │
│  │  GET/POST /api/ads          (listings + creation)  │     │
│  │  GET/PATCH/DELETE /api/ads/[id]  (single ad ops)   │     │
│  │  POST /api/ads/[id]/report  (reporting)            │     │
│  │  GET/POST /api/messages     (messaging)            │     │
│  │  /api/me/**                 (account ops)          │     │
│  └───────────┬────────────────────────────────────────┘     │
└──────────────┼─────────────────────────────────────────────-┘
               │
┌──────────────┼──────────────────────────────────────────────┐
│           EXTERNAL SERVICES                                  │
│  ┌──────────────────┐   ┌──────────────┐   ┌─────────────┐ │
│  │  Supabase        │   │ Cloudflare   │   │  OpenAI     │ │
│  │  - Postgres DB   │   │  - R2 images │   │  Moderation │ │
│  │  - Auth/Sessions │   │  - KV rate   │   │  (cron)     │ │
│  │  - RLS policies  │   │    limiting  │   │             │ │
│  └──────────────────┘   └──────────────┘   └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
               │
┌──────────────┼──────────────────────────────────────────────┐
│           CRON WORKER  src/cron-worker.ts                    │
│  - Moderate pending ads (OpenAI omni-moderation)            │
│  - Move approved images (pending R2 → public R2)           │
│  - Expire old ads (status → 'expired')                     │
│  - Rollup metrics (event_metrics table)                     │
└─────────────────────────────────────────────────────────────┘
```

### Current Component Inventory

| Component | File Location | Status | SEO Relevance |
|-----------|--------------|--------|---------------|
| Home page | `src/routes/+page.server.ts` | Working | High — entry point |
| Category browse | `src/routes/(public)/category/[slug]/` | Working | High — `/category/bikes` etc. |
| Ad view | `src/routes/(public)/ad/[slug]/` | Working | Critical — individual listings |
| API: list ads | `src/routes/api/ads/+server.ts` | Working | None (JSON API) |
| API: single ad | `src/routes/api/ads/[id]/+server.ts` | Working | None (JSON API) |
| Cron worker | `src/cron-worker.ts` | Working | None directly |
| Admin | `src/routes/(app)/admin/` | Working | None |
| Auth | `src/routes/auth/` | Working | None |
| Messaging | `src/routes/(app)/messages/` | Working | None |

### Data Model (Relevant Fields)

```
ads table:
  id            UUID (primary key — currently used as URL slug)
  title         string
  description   string
  category      string (enum: 'Bikes', 'Electronics', etc.)
  category_profile_data  JSONB (bike subtype, condition, size)
  location_profile_data  JSONB (county, locality, geo)
  price         integer | null
  currency      string
  image_keys    string[] (R2 object keys)
  status        'active' | 'pending' | 'rejected' | 'expired' | 'archived'
  expires_at    timestamptz (default: now() + 32 days)
  created_at    timestamptz
  user_id       UUID
```

---

## SEO Architecture Gaps (Current State)

Analysis of the existing codebase reveals these specific SEO gaps:

### Gap 1: UUID URLs on Ad Pages (Critical)

The ad view route is `/ad/[slug]` but the "slug" is the UUID (`/ad/abc-123-def-456`).
UUID URLs are not indexable keywords — they contribute nothing to ranking.

**Evidence:** `src/routes/api/ads/[id]/+server.ts` line 187: `.eq('id', id)` — the lookup is by raw UUID.

**Required:** Add a `slug` column to the `ads` table: `[title-words]-[short-id]` e.g. `/ad/giant-defy-road-bike-a3f2`.

### Gap 2: No Page-Level Meta Tags (Critical)

Only `+layout.svelte` has a `<svelte:head>` block, and it only sets the favicon.
Individual ad pages, category pages, and the home page have no `<title>`, no `<meta description>`,
no Open Graph tags, and no canonical URLs.

**Evidence:** `grep -r "og:" src/routes/` returns no matches. Only `terms` and `privacy` pages have `<title>` tags.

### Gap 3: No Structured Data (JSON-LD)

No `application/ld+json` structured data exists anywhere in the codebase. Ad pages should
emit `Product` schema (for individual listing pages) and category pages should emit `ItemList` schema.

### Gap 4: No Sitemap

`static/` contains only `robots.txt`. No sitemap.xml exists. Google cannot discover ad
pages or category pages systematically.

**robots.txt current state:** Allows everything but provides no sitemap directive.

### Gap 5: Expired Ads Return 404 (SEO Risk)

Active ads are filtered by `status = 'active' AND expires_at > now()`. When an ad expires,
the URL returns 404. High-value expired pages that accumulated backlinks lose that equity.

**Better approach:** Return 200 with a "this ad has expired — see similar listings" page,
using the ad data still in the database. This preserves link equity and provides crawlable content.

---

## Target Architecture for Launch + Growth

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Public browse routes | SSR HTML with meta/JSON-LD, Cloudflare edge-cacheable | Supabase via API layer |
| API layer (`/api/ads`) | JSON data, edge-cached 5 min | Supabase, KV, R2 |
| Sitemap endpoint | Dynamic XML from Supabase | Supabase (service role) |
| Cron worker | Background moderation, expiry, slug generation, email dispatch | Supabase, OpenAI, R2, email service |
| Email service | Transactional notifications | Resend API (or Cloudflare Email) |
| Revenue hooks | Featured/bumped listing state | Supabase ads table (flag columns) |

### Evolved System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  GOOGLE / SEARCH ENGINES                     │
│            ↓ crawls sitemap.xml          ↑ indexes          │
├────────────┼────────────────────────────┼────────────────────┤
│            ↓                            │                    │
│   /sitemap.xml  ←─ Supabase (ad slugs) │                    │
│   /robots.txt   (add Sitemap: directive)│                    │
│                                         │                    │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  SSR PAGES (all emit meta + JSON-LD)                 │  │
│   │  /                    ← home page (ItemList)         │  │
│   │  /category/[slug]     ← category (ItemList)          │  │
│   │  /ad/[human-slug]     ← listing (Product)            │  │
│   │  /ad/[expired-slug]   ← expired (410 or redirect)    │  │
│   └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  EMAIL ARCHITECTURE                          │
│                                                             │
│  Trigger sources:                                           │
│    - Cron worker (ad approved, ad expired, ad rejected)     │
│    - API endpoint (new message notification)                │
│                                                             │
│  Transport: Resend (HTTP API, works from CF Workers)        │
│    or Cloudflare Email Service (native, private beta 2025)  │
│                                                             │
│  Templates: server-side string generation (no template      │
│  engine needed at v1 scale)                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  REVENUE INTEGRATION POINTS                  │
│                                                             │
│  ads table additions:                                       │
│    is_featured   boolean (highlighted in browse)           │
│    bumped_at     timestamptz (affects sort order)          │
│    payment_ref   string (Stripe/Paddle reference)          │
│                                                             │
│  Revenue flow:                                              │
│    User clicks "Boost" → payment page → webhook → flag ad  │
│    API sort: featured/bumped ads float to top (cap: N/page) │
└─────────────────────────────────────────────────────────────┘
```

---

## SEO Architecture: Specific Patterns

### Pattern 1: Human-Readable Ad Slugs

**What:** Store a `slug` column in the `ads` table. Generated at insert time as
`[title-first-4-words]-[6-char-id-suffix]`.

**When to use:** Every new ad. Backfill existing ads at migration time.

**Implementation:**
```typescript
// src/lib/server/slug.ts
export function generateAdSlug(title: string, id: string): string {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .join('-');
  const suffix = id.replace(/-/g, '').slice(0, 6);
  return `${words}-${suffix}`;
}
// Result: "giant-defy-road-bike-a3f2b1"
// URL: /ad/giant-defy-road-bike-a3f2b1
```

**Database migration:**
```sql
ALTER TABLE public.ads ADD COLUMN slug text UNIQUE;
CREATE INDEX ads_slug_idx ON public.ads(slug);
-- Backfill with trigger or one-time script
```

**Route lookup change:** `src/routes/api/ads/[id]/+server.ts` — add `.eq('slug', id)` fallback
to support both old UUID URLs (301 redirect to slug URL) and new slug URLs.

### Pattern 2: Per-Page Meta Tags

**What:** Each public-facing page emits `<title>`, `<meta name="description">`,
and Open Graph tags appropriate to its content.

**Implementation via SvelteKit `<svelte:head>`:**
```svelte
<!-- src/routes/(public)/ad/[slug]/+page.svelte -->
<svelte:head>
  <title>{ad.title} — fogr.ai</title>
  <meta name="description" content={descriptionSnippet} />
  <meta property="og:title" content={ad.title} />
  <meta property="og:description" content={descriptionSnippet} />
  <meta property="og:image" content={primaryImageUrl} />
  <meta property="og:type" content="product" />
  <link rel="canonical" href="https://fogr.ai/ad/{ad.slug}" />
</svelte:head>
```

**Description strategy:** First 155 chars of ad description, truncated at word boundary.
**Image strategy:** First image from R2 public bucket, fallback to site OG image.

### Pattern 3: JSON-LD Structured Data

**What:** Inject schema.org markup as `<script type="application/ld+json">` in `<svelte:head>`.

**Ad view page (Product schema):**
```svelte
<svelte:head>
  {@html `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": ad.title,
    "description": ad.description,
    "image": primaryImageUrl,
    "offers": {
      "@type": "Offer",
      "price": ad.price ?? 0,
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock",
      "url": `https://fogr.ai/ad/${ad.slug}`
    }
  })}</script>`}
</svelte:head>
```

**Category page (ItemList schema):**
```svelte
{@html `<script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": `${categoryName} for sale in Ireland`,
  "numberOfItems": ads.length,
  "itemListElement": ads.slice(0, 10).map((ad, i) => ({
    "@type": "ListItem",
    "position": i + 1,
    "url": `https://fogr.ai/ad/${ad.slug}`
  }))
})}</script>`}
```

### Pattern 4: Dynamic Sitemap Endpoint

**What:** A SvelteKit server endpoint that generates sitemap XML by querying Supabase.
Do NOT use a build-time sitemap generator (listings change daily).

**File:** `src/routes/sitemap.xml/+server.ts`

```typescript
export const GET: RequestHandler = async ({ locals }) => {
  const { data: ads } = await locals.supabaseServiceRole
    .from('ads')
    .select('slug, updated_at')
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(10000); // Google's sitemap limit per file

  const urls = [
    `<url><loc>https://fogr.ai/</loc></url>`,
    ...CATEGORIES.map(c =>
      `<url><loc>https://fogr.ai/category/${categoryToSlug(c)}</loc></url>`
    ),
    ...(ads ?? []).map(ad =>
      `<url><loc>https://fogr.ai/ad/${ad.slug}</loc><lastmod>${ad.updated_at.split('T')[0]}</lastmod></url>`
    )
  ].join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/0.5/sitemap">${urls}</urlset>`,
    { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' } }
  );
};
```

**robots.txt update:**
```
User-agent: *
Disallow: /api/
Disallow: /(app)/
Sitemap: https://fogr.ai/sitemap.xml
```

### Pattern 5: Expired Ad Handling

**What:** When an ad expires, instead of 404, serve a 200 page with "This ad has expired"
and a list of similar active ads.

**Why:** 404 wastes any inbound links accumulated during the ad's lifetime. 200 with
`noindex` preserves link equity and provides a useful re-engagement surface.

**Implementation:**
```typescript
// In +page.server.ts for ad view — query without status filter,
// then handle expired state in the page
if (ad.status === 'expired') {
  // Query similar ads: same category, similar price
  const similar = await fetchSimilarAds(ad.category, ad.price);
  return { ad, isExpired: true, similar };
}
```

```svelte
<!-- Expired state rendering -->
{#if data.isExpired}
  <svelte:head>
    <meta name="robots" content="noindex" />
    <title>Ad expired — {data.ad.title} — fogr.ai</title>
  </svelte:head>
  <p>This ad has expired.</p>
  <SimilarAds ads={data.similar} />
{/if}
```

---

## Email Notification Architecture

### Transport Choice

**Resend** over Cloudflare Email Service (private beta, not yet GA as of March 2026).

- Resend works today from Cloudflare Workers via HTTP API
- `npm install resend` — minimal dependency
- Free tier: 3,000 emails/month — more than sufficient at launch scale
- Confidence: HIGH (official Cloudflare Workers tutorial exists)

### Notification Events

| Event | Trigger Location | Template |
|-------|-----------------|----------|
| Ad approved | `src/cron-worker.ts` (after status → active) | "Your ad is live: [title]" |
| Ad rejected | `src/cron-worker.ts` (after status → rejected) | "Your ad was not approved: [reason]" |
| Ad expiring soon | `src/cron-worker.ts` (48h before expires_at) | "Renew your ad: [title]" |
| New message | `src/routes/api/messages/+server.ts` | "Someone messaged about: [title]" |

### Email Architecture Boundaries

```
Email flows out from two places only:
  1. src/cron-worker.ts  — batch events (moderation outcomes, expiry)
  2. src/routes/api/messages/+server.ts — real-time trigger (new message)

Never send email from:
  - Page server loads (wrong context, no retry)
  - Client-side code (never has credentials)
```

### Unsubscribe Architecture

At v1, emails are transactional (account-related), not marketing. GDPR allows
transactional email without marketing consent. Add `List-Unsubscribe` header with
a signed token pointing to `/api/me/email-prefs` — this is sufficient for compliance
and avoids a full preference center.

---

## Content Seeding Architecture

The cold-start problem requires content before users arrive. Two viable approaches
that fit the no-active-marketing constraint:

### Approach 1: Manual Seed Listings (Recommended for Day 1)

Create ~30-50 real-looking listings in the bicycles category using a seed script.
These act as genuine content for Google to index.

```
Architecture:
  scripts/seed-listings.ts
    → reads from seed-data/bikes.json (curated realistic listings)
    → inserts via Supabase service role (bypasses moderation)
    → assigns status = 'active', user_id = SEED_USER_ID
    → generates proper slugs
    → uses real Irish locations from location-hierarchy
```

**Seed user:** Create a dedicated `fograi_listings@fogr.ai` account. Mark seed ads
clearly in the database (`is_seed: boolean` flag) so they can be cleaned up later.

### Approach 2: Programmatic Location × Category Pages

Create static/SSR pages for every county × category combination even with zero listings.
These rank for "[category] for sale in [county]" long-tail searches.

**Examples:**
- `/category/bikes?county=cork` → "Bikes for sale in Cork, Ireland"
- `/category/electronics?county=dublin` → "Electronics for sale in Dublin, Ireland"

These pages already exist via filter params on the category route — the SEO gap is:
1. They need proper `<title>` and `<meta>` tags with the county name
2. They need to be submitted in the sitemap
3. They need internal links from a "Browse by location" component on the home page

---

## Revenue Integration Architecture

### Minimal Revenue Model (v1)

Based on classifieds industry patterns: **freemium + featured listings**.

Free: post up to N ads/month, visible in standard sort order.
Paid: "Boost" an ad to the top of its category for 7 days.

**Schema additions (one migration):**
```sql
ALTER TABLE public.ads
  ADD COLUMN is_featured boolean DEFAULT false,
  ADD COLUMN featured_until timestamptz,
  ADD COLUMN payment_ref text;
```

**Sort order modification in `/api/ads` GET:**
```
ORDER BY is_featured DESC, featured_until > now() DESC, created_at DESC
```

**Payment integration point:** The API endpoint `POST /api/payments/boost` calls
Stripe Checkout, receives a webhook at `POST /api/payments/webhook`, then sets
`is_featured = true, featured_until = now() + interval '7 days'`.

**Why Stripe over Paddle:** Stripe supports Irish business accounts directly, has
a Workers-compatible SDK, and is the industry standard. Paddle is better for SaaS,
not classified-ad microtransactions.

---

## Data Flow

### Public Browse Flow (SEO Critical Path)

```
Googlebot / User → GET /category/bikes
  ↓
+page.server.ts load()
  → fetch('/api/ads?category=Bikes&page=1')
    → Supabase query (edge-cached 5 min at Cloudflare)
  ← { ads, nextPage }
  ↓
+page.svelte renders with:
  - <svelte:head> meta tags (title, description, og:*)
  - <script type="application/ld+json"> ItemList schema
  - AdCard grid with links to /ad/[slug]
  ↓
Googlebot indexes page, follows links to individual ad pages
```

### Ad Creation Flow (With SEO Enhancement)

```
User POSTs /api/ads
  ↓
Server validates + inserts row
  → generateAdSlug(title, id) → store in slug column
  → status = 'pending' (if needs moderation) or 'active'
  ↓
Cron worker runs (every N minutes)
  → moderate pending ads
  → on approval: status → 'active', send approval email
  → ad now crawlable via sitemap
```

### Email Notification Flow

```
Trigger event (ad approved, message received)
  ↓
src/lib/server/email.ts (new)
  → Resend.emails.send({ from, to, subject, html })
  ↓
User inbox receives notification
  → Click → returns to fogr.ai
```

---

## Scaling Considerations

The current architecture on Cloudflare Workers + Supabase free tier is appropriate
for 0-10K listings. Here is what to watch:

| Scale | Concern | Architecture Response |
|-------|---------|----------------------|
| 0-100 listings | Nothing breaks | Current architecture is fine |
| 100-1K listings | Sitemap size, cold Supabase DB | Add sitemap, upgrade Supabase to Micro ($10/mo) |
| 1K-10K listings | Search performance, image count | Add Postgres full-text index on title+description; consider pagination of sitemap |
| 10K-100K listings | Supabase connection limits, sitemap splits | Supavisor pooling (already in Supabase), split sitemap into index + sub-sitemaps |
| 100K+ listings | Consider dedicated search | Typesense on Fly.io or Algolia for search; Supabase remains source of truth |

### First Bottleneck: Supabase Free Tier

Supabase free tier: 500 MB database, pauses after 1 week of inactivity, no backups.
**Action:** Upgrade to Pro ($25/mo) before launch. This is non-negotiable for a production
classifieds platform — free tier pausing will kill SEO by causing Googlebot 503s.

### Second Bottleneck: Search at Scale

Current search uses `ILIKE %term%` which does not use indexes and is O(n) on the ads table.
At ~5K listings this will be noticeable. Action: Add PostgreSQL GIN index with `tsvector`
for full-text search before reaching this threshold.

```sql
ALTER TABLE public.ads
  ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || description)) STORED;
CREATE INDEX ads_fts_idx ON public.ads USING GIN(fts);
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Prerendering Ad Pages

**What people do:** Use `export const prerender = true` on ad routes to get static files.
**Why it's wrong:** Classifieds listings change constantly — new ads, expired ads, price changes.
Prerendered pages become stale immediately. Also, prerendering UUIDs (10K+ URLs) bloats builds.
**Do this instead:** SSR with Cloudflare edge caching (`Cache-Control: s-maxage=300`). Already
implemented correctly in `/api/ads/[id]/+server.ts`.

### Anti-Pattern 2: Blocking Google From the API Layer

**What people do:** Add `/api/` to robots.txt Disallow, then forget that the API is
the data source for the SSR pages.
**Why it's wrong:** Blocking `/api/` is correct and already implied — Googlebot sees
the SSR HTML, not the JSON API calls. The risk is forgetting to keep SSR pages rendering
complete HTML (not relying on client-side fetch for the initial content).
**Do this instead:** Ensure every public page loads its data in `+page.server.ts` (server-side),
not in a client-side `onMount`. Current architecture does this correctly.

### Anti-Pattern 3: Canonical URL Chaos With Filters

**What people do:** `/category/bikes?sort=price_low&county=cork` gets indexed by Google
as a separate page from `/category/bikes`. 10 filter combinations = 10 duplicate pages.
**Why it's wrong:** Google may penalize or dilute ranking across duplicates.
**Do this instead:** Add `<link rel="canonical" href="/category/bikes">` on all filtered
category page variants. The canonical always points to the unfiltered URL.

### Anti-Pattern 4: Sending Email From Page Server Loads

**What people do:** Put `sendEmail()` calls inside `+page.server.ts` actions or load functions.
**Why it's wrong:** No retry on failure, blocks page response, fires on every re-render.
**Do this instead:** All email sends go through the cron worker (for batch events) or the
API endpoint handler (for immediate events like new messages). Never from page loads.

### Anti-Pattern 5: Revenue Gates on Posting

**What people do:** Require payment before first listing to "validate willingness to pay."
**Why it's wrong:** Kills cold-start. Zero listings = zero SEO = zero organic traffic = no revenue.
**Do this instead:** Posting is always free. Revenue comes from boosting existing listings.
Users who have already posted and got a message are the most willing to pay.

---

## Build Order Implications

Based on dependency analysis, the correct sequence for evolving the architecture:

**Must happen before anything else:**
1. Human-readable slugs (database migration + slug generation) — every subsequent SEO
   feature depends on this. UUID URLs in the sitemap or meta tags are worthless.

**Can happen in parallel after slugs:**
2. Per-page meta tags (`<svelte:head>` with title, description, og:*)
3. JSON-LD structured data on ad and category pages
4. Expired ad handling (200 + noindex instead of 404)

**Depends on meta tags being in place:**
5. Dynamic sitemap endpoint (pointless without canonical slugs + proper pages)
6. robots.txt update pointing to sitemap

**Independent infrastructure:**
7. Email notification system (Resend integration in cron worker)
8. Supabase Pro upgrade (operational concern, not a feature)

**After SEO foundation is solid:**
9. Content seeding (seed listings + location×category internal links)
10. Revenue integration (featured listings flag + payment webhook)

---

## Integration Points

### External Services

| Service | Integration Pattern | Current State | Notes |
|---------|---------------------|---------------|-------|
| Supabase | supabase-js client, service role in cron | Working | Upgrade free→Pro before launch |
| Cloudflare R2 | Direct bucket bindings in Workers | Working | Two buckets: pending + public |
| Cloudflare KV | Rate limiting | Working | |
| OpenAI | REST API via openai SDK | Working (cron only) | Cost: ~$0.002/ad |
| Resend | HTTP API, no Cloudflare binding needed | Not yet built | Free tier: 3K/mo |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Page server ↔ API layer | Internal fetch (same-origin) | Works correctly today |
| API layer ↔ Supabase | supabase-js | Must use service role in cron, user-scoped in app |
| Cron worker ↔ Supabase | Direct REST (no supabase-js, uses fetch) | Current pattern in cron-worker.ts |
| Cron worker ↔ Email | HTTP to Resend API | To be built |
| API ↔ R2 | Cloudflare Workers binding | Working, two-bucket pattern correct |

---

## Sources

- SvelteKit SEO Docs: https://kit.svelte.dev/docs/seo
- Google JSON-LD Product Schema: https://developers.google.com/search/docs/appearance/structured-data/product
- Google ItemList Schema: https://developers.google.com/search/docs/appearance/structured-data/merchant-listing
- Resend + Cloudflare Workers: https://developers.cloudflare.com/workers/tutorials/send-emails-with-resend/
- Programmatic SEO patterns: https://backlinko.com/programmatic-seo
- super-sitemap (SvelteKit sitemap library): https://github.com/jasongitmail/super-sitemap
- Supabase connection management: https://supabase.com/docs/guides/database/connection-management

---
*Architecture research for: fogr.ai Irish classifieds platform*
*Researched: 2026-03-11*
*Confidence: HIGH — based on direct codebase inspection + verified external sources*
