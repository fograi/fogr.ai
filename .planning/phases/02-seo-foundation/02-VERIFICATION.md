---
phase: 02-seo-foundation
verified: 2026-03-12T16:40:11Z
status: gaps_found
score: 29/30 truths verified
re_verification: false
gaps:
  - truth: "County pages have og:image and twitter:image tags for social sharing previews"
    status: failed
    reason: "The county page (+page.svelte) is missing og:image and twitter:image meta tags. It has og:title, og:description, og:url, og:type, og:site_name, and twitter:card but omits the image tags. Social sharing previews for /dublin-style pages will show no image."
    artifacts:
      - path: "src/routes/(public)/[county=county]/+page.svelte"
        issue: "Missing og:image and twitter:image meta tags in svelte:head block (lines 23-43). Category page and category+county page both have og:image; county page does not."
    missing:
      - "Add <meta property=\"og:image\" content=\"{origin}/og-fallback/home-garden.png\" /> in svelte:head"
      - "Add <meta name=\"twitter:image\" content=\"{origin}/og-fallback/home-garden.png\" /> in svelte:head"
      - "Alternatively, add a fallback image URL to the seo object returned from the county page server load"
human_verification:
  - test: "Visit /bikes in a browser and inspect og:image"
    expected: "og:image points to https://fogr.ai/og-fallback/bikes.png"
    why_human: "Cannot verify the canonical.split() technique (used to derive origin in programmatic pages) produces the correct full URL at runtime"
  - test: "Share an expired ad URL on Slack or Facebook"
    expected: "Shows 'This ad has expired' banner, full ad content visible, similar listings grid appears below, message composer is absent"
    why_human: "Social sharing preview and visual layout require a live browser to verify"
  - test: "Visit /sitemap.xml in a browser after seeding test ads"
    expected: "Valid XML containing /ad/{slug} entries, category and county pages only when >= 3 listings, no pending/rejected ads"
    why_human: "Sitemap correctness against live data cannot be verified from source code alone"
---

# Phase 02: SEO Foundation Verification Report

**Phase Goal:** Every public page is discoverable, correctly indexed, and rich-snippet-eligible before any public launch announcement.
**Verified:** 2026-03-12T16:40:11Z
**Status:** gaps_found (1 gap)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every ad page has a unique `<title>` matching `{Ad Title} for Sale in {County} | Fogr.ai` | VERIFIED | `buildAdTitle()` in meta.ts; consumed in ad/[slug]/+page.server.ts and rendered in svelte:head |
| 2 | Every ad page has `<meta name="description">` derived from ad description (max ~155 chars) | VERIFIED | `buildDescription()` in meta.ts; ad server load returns `seo.description` |
| 3 | Every ad page has `<link rel="canonical">` pointing to the clean slug URL | VERIFIED | `buildCanonical(url.origin, '/ad/' + ad.slug)` in server load; rendered in svelte:head line 221 |
| 4 | Every ad page has OG and Twitter Card meta tags with correct title, description, image, and URL | VERIFIED | ad/[slug]/+page.svelte lines 225-234; all 6 og: properties and 4 twitter: properties present |
| 5 | Every ad page has JSON-LD Product schema with name, description, url, offers (price, currency, availability, condition) | VERIFIED | `productJsonLd()` in jsonld.ts; rendered via `{@html}` in ad/[slug]/+page.svelte line 235 |
| 6 | The homepage has title `Buy & Sell Second-Hand in Ireland | Fogr.ai — Fógra­í` | VERIFIED | `buildHomepageTitle()` returns this; +page.server.ts sets seo.title; +page.svelte renders it |
| 7 | Category pages have title `Second-Hand {Category} for Sale in Ireland | Fogr.ai` | VERIFIED | `buildCategoryTitle()` without county arg; used in category/[slug]/+page.server.ts and [category=category]/+page.server.ts |
| 8 | 9 static OG fallback placeholder images exist in static/og-fallback/, one per category slug (1200x630px) | VERIFIED | All 9 PNGs confirmed present and all 1200x630px |
| 9 | Visiting /bikes renders a category listing page with a dynamic H1 | VERIFIED | [category=category]/+page.svelte: `<h1>Second-Hand {data.category} for Sale in Ireland</h1>` |
| 10 | Visiting /dublin renders a county listing page with a dynamic H1 | VERIFIED | [county=county]/+page.svelte: `<h1>Second-Hand Classifieds in {data.countyName}</h1>` |
| 11 | Visiting /bikes/dublin renders a category+county listing page with correct H1 | VERIFIED | [category=category]/[county=county]/+page.svelte: `<h1>Second-Hand {data.category} for Sale in {data.countyName}</h1>` |
| 12 | Visiting /about still renders the about page (not captured by param matchers) | VERIFIED | category.ts validates against slugToCategory(); "about" is not a category slug. county.ts validates against getCountyOptions(); "about" is not a county. |
| 13 | Programmatic pages with fewer than 3 active listings include noindex meta directive | VERIFIED | All 3 server loads: `shouldNoindex = listingCount < NOINDEX_THRESHOLD (3)`; robots: 'noindex' in seo object; rendered in svelte:head |
| 14 | Programmatic pages show listing count and price range stats | VERIFIED | All 3 page components render `.stats` div with `{data.listingCount}` and `priceRangeText` |
| 15 | All programmatic page types have `<link rel="canonical">` in svelte:head | VERIFIED | All 6 programmatic page svelte files have `<link rel="canonical" href={data.seo.canonical} />` |
| 16 | GET /sitemap.xml returns valid XML sitemap with active approved ads and programmatic pages | VERIFIED | sitemap.xml/+server.ts: queries `.eq('status', 'active').gt('expires_at', nowIso).not('slug', 'is', null)`; returns `<?xml version...><urlset ...>` |
| 17 | Sitemap contains only active ads with valid slugs (no expired, pending, or rejected ads) | VERIFIED | `.eq('status', 'active').gt('expires_at', nowIso)` filters; `.not('slug', 'is', null)` ensures slugs exist |
| 18 | Sitemap includes programmatic pages only when they have >= 3 active listings | VERIFIED | `NOINDEX_THRESHOLD = 3`; category/county/combo pages only added when count >= threshold |
| 19 | GET /robots.txt returns correct directives: Allow /, Disallow for admin/private routes, Sitemap directive | VERIFIED | robots.txt/+server.ts: User-agent *, Allow: /, 8 Disallow directives, Sitemap: ${url.origin}/sitemap.xml |
| 20 | robots.txt blocks /account, /admin, /ads, /messages, /post, /auth, /api, /login | VERIFIED | All 8 routes present as Disallow directives (lines 24-31) |
| 21 | robots.txt explicitly allows AI crawlers for AI discovery | VERIFIED | 8 AI crawlers with dedicated User-agent + Allow: / blocks: GPTBot, ChatGPT-User, ClaudeBot, anthropic-ai, PerplexityBot, Applebot-Extended, Google-Extended, Bytespider |
| 22 | static/robots.txt is deleted to prevent Cloudflare static asset conflict | VERIFIED | `test -f static/robots.txt` returns "DELETED_OK" |
| 23 | An expired ad page returns HTTP 200 (not 404) when visited by anyone | VERIFIED | ad/[slug]/+page.server.ts: expired check does NOT throw 404; only moderation-removed ads block non-owners |
| 24 | An expired ad page shows a prominent "This ad has expired" banner | VERIFIED | +page.svelte lines 245-249: `.expired` div with "This ad has expired. Browse similar listings below." |
| 25 | An expired ad page shows similar active listings using county-filter-first fallback | VERIFIED | server load lines 156-206: county-filter-first query, falls back to category-only if < 3 matches |
| 26 | The message composer is hidden on expired ad pages | VERIFIED | +page.svelte line 292: `{:else if !data.isExpired}` guards MessageComposer |
| 27 | An ad expired for more than 90 days returns HTTP 410 Gone | VERIFIED | server load lines 47-53: `daysSinceExpiry > 90` throws `error(410, ...)` |
| 28 | Category and category+county programmatic pages include JSON-LD ItemList and BreadcrumbList schemas | VERIFIED | All 3 programmatic page server loads return `seo.jsonLd` array; all 3 svelte files iterate and render `{@html}` script tags |
| 29 | All public browse and view pages load without requiring login — anonymous crawlers access all public content | VERIFIED | (public)/+layout.server.ts returns `{}`; no auth gate on any public route; getUser() is optional-only |
| 30 | County pages have og:image and twitter:image tags for social sharing previews | FAILED | [county=county]/+page.svelte has og:title, og:description, og:url, og:type, og:site_name but no og:image. Twitter card has no twitter:image. Social share previews for county pages will show no image. |

**Score:** 29/30 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/seo/meta.ts` | Title, description, canonical builders | VERIFIED | Exports: buildAdTitle, buildCategoryTitle, buildCountyTitle, buildHomepageTitle, buildDescription, buildCanonical |
| `src/lib/seo/jsonld.ts` | JSON-LD builder functions | VERIFIED | Exports: productJsonLd, itemListJsonLd, breadcrumbJsonLd; AdSeoData interface |
| `src/lib/seo/og.ts` | Open Graph data builders | VERIFIED | Exports: buildAdOg, buildCategoryOg, buildHomepageOg; OgData type |
| `src/lib/seo/county-slugs.ts` | County slug utility | VERIFIED | Exports: countySlugToOption, countyIdToSlug, getAllCountySlugs |
| `src/params/category.ts` | SvelteKit param matcher for category slugs | VERIFIED | Exports match; validates via slugToCategory() |
| `src/params/county.ts` | SvelteKit param matcher for county slugs | VERIFIED | Exports match; validates via pre-built Set from getCountyOptions() |
| `src/routes/(public)/[category=category]/+page.server.ts` | Category programmatic page server load | VERIFIED | Substantive: fetches /api/ads, builds SEO object with jsonLd array |
| `src/routes/(public)/[county=county]/+page.server.ts` | County programmatic page server load | VERIFIED | Substantive: fetches /api/ads with county_id, builds SEO object |
| `src/routes/(public)/[category=category]/[county=county]/+page.server.ts` | Category+county programmatic page server load | VERIFIED | Substantive: fetches /api/ads with both filters, 3-level breadcrumb |
| `src/routes/sitemap.xml/+server.ts` | Dynamic XML sitemap endpoint | VERIFIED | Exports GET; queries supabase ads, builds XML with aggregate listing counts |
| `src/routes/robots.txt/+server.ts` | Dynamic robots.txt endpoint | VERIFIED | Exports GET; returns text/plain with all directives |
| `static/og-fallback/` (9 PNGs) | 9 OG fallback placeholder images 1200x630px | VERIFIED | All 9 files present; all confirmed 1200x630px PNG |
| `src/routes/(public)/ad/[slug]/+page.server.ts` | Updated ad server load with expired support | VERIFIED | Expired ads return 200; 410 after 90 days; similar listings query |
| `src/routes/(public)/ad/[slug]/+page.svelte` | Updated ad component with expired UX | VERIFIED | Banner, hidden MessageComposer, similar listings grid |
| `src/routes/(public)/[county=county]/+page.svelte` | County page component with full OG tags | STUB | Missing og:image and twitter:image |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `ad/[slug]/+page.server.ts` | `src/lib/seo/meta.ts` | import and call in load function | WIRED | Line 6: `import { buildAdTitle, buildDescription, buildCanonical } from '$lib/seo/meta'` |
| `ad/[slug]/+page.svelte` | svelte:head | SEO data rendered in head | WIRED | Lines 217-237: full svelte:head block with title, meta, OG, Twitter, JSON-LD |
| `src/lib/seo/og.ts` | `static/og-fallback/` | fallback image URL | WIRED | Line 34: `${origin}/og-fallback/${ad.categorySlug}.png` |
| `src/params/category.ts` | `src/lib/category-browse.ts` | slugToCategory() for validation | WIRED | Line 1: `import { slugToCategory } from '$lib/category-browse'` |
| `src/params/county.ts` | `src/lib/location-hierarchy.ts` | getCountyOptions() for building valid slug set | WIRED | Line 1: `import { getCountyOptions } from '$lib/location-hierarchy'` |
| `[category=category]/[county=county]/+page.server.ts` | `/api/ads` | fetch with category and county_id filters | WIRED | Line 30: `fetch('/api/ads?...')` with both params |
| `sitemap.xml/+server.ts` | Supabase ads table | Direct query for active ads with slugs | WIRED | Lines 58-63: `.from('ads').select(...).eq('status', 'active').gt('expires_at', nowIso).not('slug', 'is', null)` |
| `robots.txt/+server.ts` | sitemap.xml | Sitemap directive in response body | WIRED | Line 60: `Sitemap: ${url.origin}/sitemap.xml` |
| `[category=category]/+page.svelte` | `src/lib/seo/jsonld.ts` | JSON-LD rendered as script tag | WIRED | Lines 39-43: `{#each data.seo.jsonLd as ld}` renders `application/ld+json` script tags |
| `(public)/+layout.server.ts` | No auth check | Layout does not redirect unauthenticated users | WIRED | Returns `{}` — no auth logic whatsoever |

### Requirements Coverage

| Requirement | Description | Status | Blocking Issue |
|-------------|-------------|--------|----------------|
| SEO-02 | Every page has unique `<title>` and `<meta description>` | SATISFIED | All public pages (ad, category, county, programmatic, homepage) verified |
| SEO-03 | Ad pages include JSON-LD Product schema | SATISFIED | productJsonLd() wired in ad/[slug]/+page.server.ts; rendered in svelte:head |
| SEO-04 | Category and location pages include JSON-LD ItemList, BreadcrumbList | SATISFIED | All 3 programmatic page types have both schemas in svelte:head |
| SEO-05 | Dynamic sitemap auto-generates from active ads and category/location pages | SATISFIED | sitemap.xml/+server.ts queries Supabase, aggregates counts, filters >= 3 |
| SEO-06 | Ad pages include OG and Twitter Card meta tags | PARTIAL | Ad pages: SATISFIED. County programmatic pages: MISSING og:image and twitter:image tags |
| SEO-07 | Programmatic SEO pages exist for category+location combinations | SATISFIED | /bikes, /dublin, /bikes/dublin all created with param matchers |
| SEO-08 | robots.txt correctly configured for crawlers | SATISFIED | Dynamic endpoint with correct Allow/Disallow, AI crawler blocks, Sitemap directive |
| SEO-09 | Canonical URLs on all pages | SATISFIED | All pages return seo.canonical; all svelte:head blocks render `<link rel="canonical">` |
| TRST-03 | All ad browsing and viewing accessible without login | SATISFIED | (public)/+layout.server.ts is empty; no auth gates on any public route |
| TRST-05 | Expired ads show "This ad has expired" and similar listings instead of 404 | SATISFIED | Expired ads return HTTP 200, show banner and similar listings grid |

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `src/routes/(public)/[county=county]/+page.svelte` | Missing og:image and twitter:image meta tags | Warning | County pages will render `summary_large_image` Twitter cards with no image; Facebook/Slack share previews for /dublin-style URLs will show no image |
| `src/lib/seo/og.ts` lines 51, 62 | `buildCategoryOg()` and `buildHomepageOg()` hardcode `home-garden.png` as image | Info | Category and homepage OG images always use the home-garden placeholder. Category page svelte overrides this directly (computing from categorySlug), so practical impact is only on the old `/category/[slug]` route |

### Human Verification Required

#### 1. Programmatic Page OG Image URL at Runtime

**Test:** Open browser DevTools on /bikes. Inspect og:image content attribute value.
**Expected:** `https://fogr.ai/og-fallback/bikes.png` (correct absolute URL)
**Why human:** The category page derives origin by splitting `data.seo.canonical.split('/').slice(0, 3).join('/')` — this string manipulation must be verified to produce the correct value at runtime, not just in source.

#### 2. Social Share Preview for Expired Ad

**Test:** Share a URL for an expired ad (status=expired) on any social platform or use a card validator.
**Expected:** Preview shows the ad's OG image (or category fallback), title with "for Sale in {County}", and description. No broken image.
**Why human:** Requires live ad data and a social card validator or real share.

#### 3. Sitemap Correctness Against Live Data

**Test:** After deploying, visit https://fogr.ai/sitemap.xml.
**Expected:** Valid XML, contains active ad /ad/{slug} entries, only includes /bikes (category) if >= 3 active bikes listings, excludes expired/pending ads.
**Why human:** Sitemap correctness depends on live Supabase data that cannot be queried from source code.

### Gaps Summary

One gap was found:

The county-only programmatic page (`/dublin`, `/cork`, etc.) is missing `og:image` and `twitter:image` meta tags. This is inconsistent with the category page and category+county page, both of which include `og:image` pointing to the appropriate OG fallback. The county page has `twitter:card: summary_large_image` but no image to display, which will cause broken social sharing previews for any county-scoped page shared on social media or messaging platforms.

This gap affects SEO-06 (OG and Twitter Card tags for social sharing previews) but does not affect any other requirement. The fix is a two-line addition to `src/routes/(public)/[county=county]/+page.svelte`.

All other phase goals, artifacts, and key links are fully verified. All 10 requirement IDs (SEO-02 through SEO-09, TRST-03, TRST-05) are accounted for and 9 of 10 are fully satisfied (SEO-06 is partial due to the county page gap).

---

_Verified: 2026-03-12T16:40:11Z_
_Verifier: Claude (gsd-verifier)_
