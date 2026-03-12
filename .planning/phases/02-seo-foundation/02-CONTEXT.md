# Phase 2: SEO Foundation - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship per-page meta tags, JSON-LD structured data, Open Graph, sitemap, robots.txt, canonical URLs, programmatic SEO pages for category+location combinations, and expired ad handling. Every public page becomes discoverable, correctly indexed, and rich-snippet-eligible. No new user-facing features — this is pure discoverability infrastructure.

</domain>

<decisions>
## Implementation Decisions

### Programmatic pages
- URL structure: flat — `/bicycles/dublin`, `/bicycles`, `/dublin` (no `/category/` prefix)
- Three page levels: category-only (`/bicycles`), county-only (`/dublin`), and category+county combos (`/bicycles/dublin`)
- Page content: listings grid + active filter chips + stats (listing count, price range)
- Minimum listing gate: 3 active listings to appear in sitemap and be indexed (noindex if below threshold)
- Dynamic H1 reflecting the combination (e.g., "Second-Hand Bicycles for Sale in Dublin")

### Expired ad experience
- Show full ad content with prominent "This ad has expired" banner at top
- Display grid of similar active listings below (same category + same county, fallback to category-only)
- Disable messaging/contact on expired ads — hide the message composer
- Return HTTP 200 with `<meta name="robots" content="noindex">` directive
- Switch to HTTP 410 Gone after 90 days post-expiry
- Keep expired ad URLs functional (no redirect) until the 410 cutoff

### Social sharing preview
- og:image: first uploaded image from the ad; fallback to branded placeholder with category icon
- og:description: first ~155 characters of the ad description (truncated cleanly)
- Twitter Card type: `summary_large_image` for ad pages
- Fallback images: one branded placeholder per category with category-specific icon on brand-colored background (pre-generated static assets)

### Page title & description patterns
- Brand name in titles: "Fogr.ai" (pipe-separated at end)
- Full brand with Irish: "Fogr.ai — Fógraí" (used on homepage and standalone pages)
- Ad pages: `{Ad Title} for Sale in {County} | Fogr.ai`
- Category+location pages: `Second-Hand {Category} for Sale in {County} | Fogr.ai`
- Category-only pages: `Second-Hand {Category} for Sale in Ireland | Fogr.ai`
- County-only pages: `Second-Hand Classifieds in {County} | Fogr.ai`
- Homepage: `Buy & Sell Second-Hand in Ireland | Fogr.ai — Fógraí`
- Meta descriptions: derived from page content — ad description for ad pages, listing count + price range for programmatic pages

### Claude's Discretion
- JSON-LD schema structure and field mapping (Product, ItemList, BreadcrumbList)
- Sitemap generation approach (SvelteKit endpoint vs library like super-sitemap)
- Head management pattern (inline svelte:head vs shared utility)
- Exact robots.txt directives for protected routes
- Canonical URL generation logic
- SEO-related cache headers
- Placeholder image design (category icon selection, color scheme)

</decisions>

<specifics>
## Specific Ideas

- Title pattern targets transactional search intent — "for Sale" included deliberately to capture buying queries like "second hand bicycles for sale dublin"
- "Second-Hand" prefix on programmatic pages (not "Used") — matches Irish/UK English search patterns
- The 3-listing gate is deliberately lower than the roadmap's suggested 5 to help with early growth when inventory is sparse
- Expired ad pages keep full content visible to preserve SEO value from inbound links while redirecting buyer intent to similar active listings
- Brand identity is "Fogr.ai — Fógraí" on key pages (homepage, about) but just "Fogr.ai" in title suffixes to keep them short

</specifics>

<code_context>
## Existing Code Insights

### Current SEO State
- Almost nothing exists — only two static pages (privacy, terms) have `<title>` tags
- `static/robots.txt` exists but is permissive (`Disallow:`) with no Sitemap directive
- No sitemap, no Open Graph, no JSON-LD, no canonical `<link>` tags
- No SEO-specific npm packages installed

### Reusable Assets
- Ad page server load already fetches all SEO-relevant data (title, description, price, images, category, location)
- Category page server load fetches ads with filters — has category name and listing data
- `slugToCategory()` function maps category slugs to display names
- Location hierarchy data available in `src/lib/data/ireland_counties.json`
- Image URLs available via `image_keys` array + R2 base URL pattern

### Established Patterns
- SvelteKit `<svelte:head>` for per-page head injection (used in privacy/terms)
- Server load functions in `+page.server.ts` return data to components
- Static files served from `static/` directory
- Route groups: `(public)` for crawlable pages, `(app)` for authenticated pages

### Integration Points
- `src/app.html` — add baseline meta tags
- `src/routes/+layout.svelte` — root layout, currently only sets favicon
- Every public `+page.svelte` — needs `<svelte:head>` blocks
- Every public `+page.server.ts` — needs to return SEO metadata
- `static/robots.txt` — needs Sitemap directive and protected route blocking
- NEW: sitemap endpoint (SvelteKit server route)
- NEW: programmatic page routes (`/[category]/[county]`, `/[category]`, `/[county]`)
- Route conflict risk: new flat routes like `/bicycles` could conflict with existing routes — researcher should verify routing precedence

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-seo-foundation*
*Context gathered: 2026-03-12*
