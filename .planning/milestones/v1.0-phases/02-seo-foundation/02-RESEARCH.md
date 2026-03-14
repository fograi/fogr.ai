# Phase 2: SEO Foundation - Research

**Researched:** 2026-03-12
**Domain:** SvelteKit SEO -- meta tags, structured data, sitemaps, programmatic pages, social sharing
**Confidence:** HIGH

## Summary

This phase adds discoverability infrastructure to every public page: per-page meta tags, JSON-LD structured data, Open Graph/Twitter Cards, a dynamic sitemap, robots.txt configuration, programmatic SEO pages for category+county combinations, and expired ad handling. The existing codebase has almost no SEO -- only two static pages have `<title>` tags, there is no sitemap, no Open Graph, no JSON-LD, and the existing `static/robots.txt` is a permissive stub.

The codebase is well-structured for this work. Server load functions already return all SEO-relevant data (title, description, price, images, category, location). The `(public)` and `(app)` route group split means we can cleanly identify what crawlers should access. SvelteKit's `<svelte:head>` and SSR-by-default make meta tag injection straightforward. The main complexity lies in the programmatic SEO pages -- flat URL routes (`/bicycles`, `/dublin`, `/bicycles/dublin`) require careful route design with param matchers to avoid conflicts with existing routes like `/about`, `/login`, `/ad/[slug]`.

**Primary recommendation:** Use SvelteKit's native `<svelte:head>` for all meta/OG tags (no third-party SEO component library needed), hand-roll JSON-LD as inline `<script type="application/ld+json">` blocks in `<svelte:head>`, use `super-sitemap` for sitemap generation, and implement programmatic pages with param matchers to resolve route conflicts cleanly.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- URL structure: flat -- `/bicycles/dublin`, `/bicycles`, `/dublin` (no `/category/` prefix)
- Three page levels: category-only (`/bicycles`), county-only (`/dublin`), and category+county combos (`/bicycles/dublin`)
- Page content: listings grid + active filter chips + stats (listing count, price range)
- Minimum listing gate: 3 active listings to appear in sitemap and be indexed (noindex if below threshold)
- Dynamic H1 reflecting the combination (e.g., "Second-Hand Bicycles for Sale in Dublin")
- Expired ads: full ad content with "This ad has expired" banner, similar active listings below, disable messaging, HTTP 200 + noindex, HTTP 410 after 90 days
- og:image: first uploaded image from the ad; fallback to branded placeholder with category icon
- og:description: first ~155 characters of the ad description (truncated cleanly)
- Twitter Card type: `summary_large_image` for ad pages
- Brand name patterns: "Fogr.ai" (pipe-separated at end), "Fogr.ai -- Fograí" (homepage/standalone)
- Ad page titles: `{Ad Title} for Sale in {County} | Fogr.ai`
- Category+location page titles: `Second-Hand {Category} for Sale in {County} | Fogr.ai`
- Category-only page titles: `Second-Hand {Category} for Sale in Ireland | Fogr.ai`
- County-only page titles: `Second-Hand Classifieds in {County} | Fogr.ai`
- Homepage title: `Buy & Sell Second-Hand in Ireland | Fogr.ai -- Fograí`
- Meta descriptions: derived from page content -- ad description for ad pages, listing count + price range for programmatic pages
- "Second-Hand" prefix (not "Used") -- matches Irish/UK English search patterns
- 3-listing gate (not 5) -- deliberately lower for early growth

### Claude's Discretion

- JSON-LD schema structure and field mapping (Product, ItemList, BreadcrumbList)
- Sitemap generation approach (SvelteKit endpoint vs library like super-sitemap)
- Head management pattern (inline svelte:head vs shared utility)
- Exact robots.txt directives for protected routes
- Canonical URL generation logic
- SEO-related cache headers
- Placeholder image design (category icon selection, color scheme)

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core

| Library       | Version           | Purpose                                      | Why Standard                                                                                           |
| ------------- | ----------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| SvelteKit     | ^2.50 (installed) | SSR framework, `<svelte:head>`, route system | Already in use; SSR by default gives crawlers rendered HTML                                            |
| super-sitemap | ^1.0.6            | Dynamic XML sitemap generation               | Purpose-built for SvelteKit, handles parameterized routes, auto-splits at 50k URLs, active maintenance |

### Supporting

| Library | Version            | Purpose                                                         | When to Use                         |
| ------- | ------------------ | --------------------------------------------------------------- | ----------------------------------- |
| slugify | ^1.6.6 (installed) | Generate URL-safe slugs for county names in programmatic routes | Already used for ad slug generation |

### Not Needed

| Library          | Why Not                                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| svelte-meta-tags | Overhead for what `<svelte:head>` handles natively; adds component abstraction over simple HTML meta tags         |
| svelte-seo       | Same reasoning -- project is small enough that inline `<svelte:head>` blocks are simpler and more transparent     |
| schema-dts       | TypeScript types for schema.org -- nice-to-have but adds dependency for what is essentially a JSON object literal |

**Installation:**

```bash
npm i -D super-sitemap
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── seo/
│   │   ├── meta.ts              # Helper functions: buildTitle(), buildDescription(), buildCanonical()
│   │   ├── jsonld.ts            # JSON-LD builders: productJsonLd(), itemListJsonLd(), breadcrumbJsonLd()
│   │   └── og.ts                # OG tag data builders: buildOgTags()
│   └── data/
│       └── ireland_counties.json # Already exists -- used for county slug matching
├── params/
│   ├── category.ts              # Route matcher: validates category slugs
│   └── county.ts                # Route matcher: validates county slugs
├── routes/
│   ├── (public)/
│   │   ├── [category=category]/
│   │   │   ├── [county=county]/
│   │   │   │   └── +page.server.ts  # Category + county combo page
│   │   │   │   └── +page.svelte
│   │   │   └── +page.server.ts      # Category-only page
│   │   │   └── +page.svelte
│   │   ├── [county=county]/
│   │   │   └── +page.server.ts      # County-only page (falls through only when no category match)
│   │   │   └── +page.svelte
│   │   ├── ad/[slug]/
│   │   │   └── +page.server.ts      # Existing -- add SEO data to return
│   │   ├── category/[slug]/
│   │   │   └── +page.server.ts      # Existing category browse -- keep as-is, add SEO
│   │   └── ...
│   ├── sitemap.xml/
│   │   └── +server.ts               # super-sitemap endpoint
│   └── robots.txt/
│       └── +server.ts               # Dynamic robots.txt (replaces static/robots.txt)
└── static/
    ├── og-fallback/                  # Pre-generated OG placeholder images per category
    └── (remove robots.txt)           # Replaced by dynamic endpoint
```

### Pattern 1: SEO Data in Server Load Functions

**What:** Every public page's `+page.server.ts` returns an `seo` object alongside existing data.
**When to use:** All public routes.
**Example:**

```typescript
// src/routes/(public)/ad/[slug]/+page.server.ts
import { buildAdSeo } from '$lib/seo/meta';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	// ... existing ad loading logic ...

	return {
		ad: mapped,
		// ... existing fields ...
		seo: {
			title: `${ad.title} for Sale in ${countyName} | Fogr.ai`,
			description: ad.description.slice(0, 155).replace(/\s+\S*$/, '...'),
			canonical: `${url.origin}/ad/${ad.slug}`,
			og: {
				title: `${ad.title} for Sale in ${countyName}`,
				description: ad.description.slice(0, 155).replace(/\s+\S*$/, '...'),
				image: ad.image_keys?.[0]
					? `${R2_BASE}/${ad.image_keys[0]}`
					: `/og-fallback/${categorySlug}.png`,
				url: `${url.origin}/ad/${ad.slug}`,
				type: 'product'
			},
			jsonLd: productJsonLd(ad, url.origin),
			robots: ad.status === 'expired' ? 'noindex' : undefined
		}
	};
};
```

### Pattern 2: svelte:head SEO Block in Page Components

**What:** Each `+page.svelte` includes a `<svelte:head>` block consuming the `seo` data from load.
**When to use:** Every page component.
**Example:**

```svelte
<svelte:head>
	<title>{data.seo.title}</title>
	<meta name="description" content={data.seo.description} />
	<link rel="canonical" href={data.seo.canonical} />
	{#if data.seo.robots}
		<meta name="robots" content={data.seo.robots} />
	{/if}
	<!-- Open Graph -->
	<meta property="og:title" content={data.seo.og.title} />
	<meta property="og:description" content={data.seo.og.description} />
	<meta property="og:image" content={data.seo.og.image} />
	<meta property="og:url" content={data.seo.og.url} />
	<meta property="og:type" content={data.seo.og.type} />
	<meta property="og:site_name" content="Fogr.ai" />
	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={data.seo.og.title} />
	<meta name="twitter:description" content={data.seo.og.description} />
	<meta name="twitter:image" content={data.seo.og.image} />
	<!-- JSON-LD -->
	{@html `<script type="application/ld+json">${JSON.stringify(data.seo.jsonLd)}</script>`}
</svelte:head>
```

### Pattern 3: Route Matchers for Flat Programmatic URLs

**What:** Use SvelteKit param matchers to validate that a route segment is a known category slug or county slug, preventing route conflicts.
**When to use:** Programmatic SEO pages at `/(public)/[category=category]/` and `/(public)/[county=county]/`.
**Why critical:** Without matchers, `/about`, `/login`, `/privacy`, `/terms`, `/ad/...` would all try to match `[category]` or `[county]`. Matchers ensure only valid category/county slugs match.

```typescript
// src/params/category.ts
import { slugToCategory } from '$lib/category-browse';

export function match(param: string): boolean {
	return slugToCategory(param) !== null;
}
```

```typescript
// src/params/county.ts
// Build a Set of valid county slugs at module load time
import { getCountyOptions } from '$lib/location-hierarchy';
import slugify from 'slugify';

const COUNTY_SLUGS = new Set(
	getCountyOptions().map((c) => slugify(c.name, { lower: true, strict: true }))
);

export function match(param: string): boolean {
	return COUNTY_SLUGS.has(param.toLowerCase());
}
```

**Route priority analysis:**

- `/about` -- static route, highest priority, matches first
- `/ad/[slug]` -- static prefix `ad/`, then dynamic, matches second
- `/category/[slug]` -- static prefix `category/`, then dynamic
- `/[category=category]/[county=county]` -- matcher-qualified dynamic, checked next
- `/[category=category]` -- matcher-qualified dynamic
- `/[county=county]` -- matcher-qualified dynamic (lower priority since no `/` nesting)

SvelteKit sorts routes: static > matcher-qualified dynamic > unqualified dynamic. Because `about`, `login`, `ad`, `category`, `privacy`, `terms`, `report-status` are all inside `(public)` as static directories, they will always take priority over `[category=category]` and `[county=county]` matcher routes. No conflicts.

### Pattern 4: JSON-LD as Serializable Objects

**What:** Build JSON-LD as plain JS objects in server load functions, serialize in the template.
**When to use:** All structured data.
**Why:** Keeps structured data testable (unit test the builder functions), avoids XSS from string interpolation.

```typescript
// src/lib/seo/jsonld.ts
export function productJsonLd(ad: AdSeoData, origin: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: ad.title,
		description: ad.description,
		image: ad.imageUrl,
		url: `${origin}/ad/${ad.slug}`,
		offers: {
			'@type': 'Offer',
			price: ad.price ?? undefined,
			priceCurrency: ad.currency ?? 'EUR',
			availability: ad.isExpired ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
			itemCondition: 'https://schema.org/UsedCondition'
		}
	};
}
```

### Anti-Patterns to Avoid

- **Global layout SEO component:** Do NOT put a single SEO component in the root layout that tries to handle all pages. Each page's `+page.server.ts` should return its own SEO data -- this keeps the logic colocated and testable.
- **String template JSON-LD:** Do NOT build JSON-LD with template strings. Use `JSON.stringify()` on objects to prevent XSS and ensure valid JSON.
- **Client-side-only meta tags:** Do NOT set meta tags in `onMount()` or reactive statements. They must be in `<svelte:head>` so SSR renders them for crawlers.
- **Catch-all route for programmatic pages:** Do NOT use `[...rest]` params. Use specific `[category=category]` and `[county=county]` matchers to avoid swallowing all unmatched routes.

## Don't Hand-Roll

| Problem                         | Don't Build                      | Use Instead                                             | Why                                                                                               |
| ------------------------------- | -------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| XML sitemap generation          | Custom XML builder               | super-sitemap                                           | Handles XML escaping, sitemap index splitting at 50k URLs, correct namespaces, lastmod formatting |
| Sitemap URL discovery           | Manual route listing             | super-sitemap auto-discovers routes from `/src/routes`  | Impossible to forget routes; throws error for unhandled params                                    |
| Category/county slug validation | if/else chains in load functions | SvelteKit param matchers (`src/params/category.ts`)     | Runs before load function, returns 404 automatically, works in both server and client             |
| HTML entity escaping in meta    | Manual escaping                  | Svelte's built-in attribute escaping in `<svelte:head>` | Svelte auto-escapes attribute values; only JSON-LD needs `JSON.stringify`                         |

**Key insight:** The biggest "don't hand-roll" in this phase is the sitemap. XML sitemap generation has edge cases (URL encoding, entity escaping, 50k URL limit, proper xmlns declarations, gzip support) that super-sitemap handles correctly. The rest of the SEO work (meta tags, JSON-LD, OG tags) is genuinely simple enough to hand-write as HTML in `<svelte:head>`.

## Common Pitfalls

### Pitfall 1: Route Conflicts with Flat Programmatic URLs

**What goes wrong:** A route like `/(public)/[category]/` matches `/about`, `/login`, `/privacy`, etc., returning 404 or wrong content.
**Why it happens:** Dynamic route params without matchers are greedy -- they match any string.
**How to avoid:** Use param matchers (`[category=category]`). The matcher function returns `false` for `about`, `login`, etc., so SvelteKit falls through to the correct static route.
**Warning signs:** 404 errors on existing static pages after adding programmatic routes.

### Pitfall 2: Ambiguous Route Priority Between Category and County

**What goes wrong:** `/dublin` could match both `[category=category]` and `[county=county]`. "Dublin" is a county but not a category. However, if a category slug ever collides with a county slug (unlikely but possible with future categories), routes become ambiguous.
**Why it happens:** SvelteKit needs unambiguous route resolution.
**How to avoid:** Category slugs and county slugs are from controlled vocabularies. Verify at build time that no category slug collides with any county slug. Current analysis shows zero collisions:

- Category slugs: `home-garden`, `electronics`, `baby-kids`, `bikes`, `clothing-accessories`, `services-gigs`, `lessons-tutoring`, `lost-found`, `free-giveaway`
- County slugs: `galway`, `dublin`, `cork`, `kerry`, `limerick`, `waterford`, `wexford`, `wicklow`, `kilkenny`, `carlow`, `cavan`, `clare`, `donegal`, `kildare`, `laois`, `leitrim`, `longford`, `louth`, `mayo`, `meath`, `monaghan`, `offaly`, `roscommon`, `sligo`, `tipperary`, `westmeath`, `antrim`, `armagh`, `derry`, `down`, `fermanagh`, `tyrone`
  **Warning signs:** Build-time assertion comparing the two Sets should catch this.

### Pitfall 3: Expired Ad Access Gating

**What goes wrong:** The current ad page server load blocks non-owner access to expired ads (line 49: `if (!isOwner) throw error(404, 'Ad not found')`). This breaks the SEO requirement to show expired ads publicly with noindex.
**Why it happens:** Original design assumed expired ads are private.
**How to avoid:** Change the access logic: expired ads are publicly visible (with noindex + similar listings), but moderation-removed ads remain owner-only.

### Pitfall 4: JSON-LD XSS via Script Injection

**What goes wrong:** Ad titles containing `</script>` break out of the JSON-LD script tag.
**Why it happens:** Raw string interpolation in `<script>` tags.
**How to avoid:** Use `JSON.stringify()` which escapes `</` sequences. For extra safety, replace `</` with `<\/` in the serialized output.
**Warning signs:** Rich Results Test showing invalid JSON-LD.

### Pitfall 5: Missing OG Image for Ads Without Photos

**What goes wrong:** WhatsApp/Twitter previews show broken image or generic fallback when ad has no uploaded image.
**Why it happens:** Not all ads have images (current `MAX_IMAGE_COUNT` is 1, `MIN_PHOTOS_BY_CATEGORY` is 0 for all categories).
**How to avoid:** Pre-generate branded placeholder images per category (static assets). The fallback chain: first ad image > category placeholder.

### Pitfall 6: Sitemap Including Non-Public Content

**What goes wrong:** Sitemap includes expired ads, pending ads, or admin routes, causing crawl budget waste and soft 404s.
**Why it happens:** Overly broad query in sitemap generation.
**How to avoid:** Sitemap query must filter: `status = 'active' AND expires_at > NOW()`. Exclude `(app)` routes entirely. Programmatic pages only included when listing count >= 3.

### Pitfall 7: Static robots.txt Cannot Be Dynamically Generated

**What goes wrong:** The existing `static/robots.txt` is served directly by Cloudflare's static asset serving, bypassing SvelteKit. If you create a dynamic `robots.txt/+server.ts` route, it conflicts with the static file.
**Why it happens:** Static files take priority over SvelteKit routes in Cloudflare adapter.
**How to avoid:** Delete `static/robots.txt` and create `src/routes/robots.txt/+server.ts` as a dynamic endpoint.

### Pitfall 8: Canonical URLs with Trailing Slashes or Query Params

**What goes wrong:** Google sees `/bicycles/dublin` and `/bicycles/dublin/` and `/bicycles/dublin?sort=newest` as different URLs, diluting link equity.
**Why it happens:** No canonical URL normalization.
**How to avoid:** Canonical URLs should always be the clean path without trailing slash or query params. Use `url.origin + url.pathname` (SvelteKit strips trailing slashes by default via `trailingSlash: 'never'` which is the default).

## Code Examples

### Dynamic Sitemap with super-sitemap

```typescript
// src/routes/sitemap.xml/+server.ts
import * as sitemap from 'super-sitemap';
import type { RequestHandler } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

export const GET: RequestHandler = async ({ platform }) => {
	const env = platform?.env as {
		PUBLIC_SUPABASE_URL?: string;
		SUPABASE_SERVICE_ROLE_KEY?: string;
	};

	const supabase = createClient(env!.PUBLIC_SUPABASE_URL!, env!.SUPABASE_SERVICE_ROLE_KEY!, {
		auth: { persistSession: false, autoRefreshToken: false }
	});

	const now = new Date().toISOString();

	// Fetch active ad slugs for sitemap
	const { data: ads } = await supabase
		.from('ads')
		.select('slug, updated_at')
		.eq('status', 'active')
		.gt('expires_at', now)
		.not('slug', 'is', null);

	const adSlugs = (ads ?? []).map((a) => a.slug!);

	// Fetch category+county combos with >= 3 active listings
	// (query aggregated counts from database)

	return await sitemap.response({
		origin: 'https://fogr.ai',
		excludeRoutePatterns: [
			'.*\\(app\\).*', // All authenticated routes
			'.*/api/.*', // API endpoints
			'.*/auth/.*', // Auth routes
			'.*/login.*' // Login page
		],
		paramValues: {
			'/(public)/ad/[slug]': adSlugs,
			'/(public)/[category=category]': validCategorySlugs,
			'/(public)/[county=county]': validCountySlugs,
			'/(public)/[category=category]/[county=county]': validCombos
		}
	});
};
```

### Dynamic robots.txt Endpoint

```typescript
// src/routes/robots.txt/+server.ts
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	const body = `User-agent: *
Allow: /

# Block authenticated/private routes
Disallow: /account
Disallow: /admin
Disallow: /ads
Disallow: /messages
Disallow: /post
Disallow: /auth
Disallow: /api

# Sitemap
Sitemap: ${url.origin}/sitemap.xml
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain',
			'Cache-Control': 'public, max-age=86400'
		}
	});
};
```

### Product JSON-LD for Ad Pages

```typescript
// src/lib/seo/jsonld.ts
interface AdSeoData {
	title: string;
	description: string;
	slug: string;
	price: number | null;
	currency: string;
	imageUrl: string | null;
	category: string;
	countyName: string | null;
	isExpired: boolean;
	createdAt: string;
}

export function productJsonLd(ad: AdSeoData, origin: string) {
	const jsonLd: Record<string, unknown> = {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: ad.title,
		description: ad.description,
		url: `${origin}/ad/${ad.slug}`,
		category: ad.category,
		offers: {
			'@type': 'Offer',
			priceCurrency: ad.currency || 'EUR',
			availability: ad.isExpired ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
			itemCondition: 'https://schema.org/UsedCondition'
		}
	};

	if (ad.imageUrl) {
		jsonLd.image = ad.imageUrl;
	}

	// Only include price if it's a fixed-price listing (not POA)
	if (ad.price !== null && ad.price > 0) {
		(jsonLd.offers as Record<string, unknown>).price = ad.price;
	}

	return jsonLd;
}
```

### BreadcrumbList JSON-LD for Category/Location Pages

```typescript
export function breadcrumbJsonLd(crumbs: Array<{ name: string; url: string }>, origin: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: crumbs.map((crumb, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: crumb.name,
			item: `${origin}${crumb.url}`
		}))
	};
}

// Usage for /bicycles/dublin:
// breadcrumbJsonLd([
//   { name: 'Home', url: '/' },
//   { name: 'Bikes', url: '/bikes' },
//   { name: 'Dublin', url: '/bikes/dublin' }
// ], 'https://fogr.ai')
```

### ItemList JSON-LD for Category Pages

```typescript
export function itemListJsonLd(
	items: Array<{ name: string; url: string; position: number }>,
	origin: string
) {
	return {
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		itemListElement: items.map((item) => ({
			'@type': 'ListItem',
			position: item.position,
			url: `${origin}${item.url}`
		}))
	};
}
```

### Safe JSON-LD Serialization in Svelte Template

```svelte
<!-- Prevents </script> injection -->
{@html `<script type="application/ld+json">${JSON.stringify(data.seo.jsonLd).replace(/</g, '\\u003c')}</script>`}
```

## State of the Art

| Old Approach                                   | Current Approach                     | When Changed          | Impact                                                      |
| ---------------------------------------------- | ------------------------------------ | --------------------- | ----------------------------------------------------------- |
| `<meta name="keywords">`                       | Ignored by Google since ~2009        | 2009                  | Do not include -- waste of bytes                            |
| Separate Twitter meta tags                     | Twitter falls back to OG tags        | 2020+                 | Only `twitter:card` is strictly needed; OG tags serve both  |
| `changefreq` and `priority` in sitemaps        | Ignored by Google                    | 2023+                 | super-sitemap excludes by default -- leave them off         |
| `<meta name="robots" content="index, follow">` | Default behavior, unnecessary        | Always                | Only add robots meta when you need `noindex` or `nofollow`  |
| Microdata/RDFa for structured data             | JSON-LD (Google's stated preference) | 2015+                 | JSON-LD is decoupled from HTML, easier to maintain and test |
| Static sitemaps                                | Dynamic sitemaps from database       | Current best practice | Essential for sites with user-generated content             |

**Deprecated/outdated:**

- Google dropped support for `HowTo` and `FAQ` rich results in 2023 -- not relevant here but worth noting
- `Product` rich results are for single-product pages only -- do NOT add Product schema to category/listing pages (use ItemList instead)

## Open Questions

1. **super-sitemap with Cloudflare adapter-cloudflare**
   - What we know: super-sitemap works with SvelteKit server endpoints; it runs at request time not build time. The Cloudflare adapter compiles all server code to a single worker.
   - What's unclear: Whether `super-sitemap`'s file-system route discovery (via `directory-tree` dependency) works in the Cloudflare Workers runtime which has no filesystem access. It may need the route list to be pre-computed at build time.
   - Recommendation: Test immediately in plan 02-04. If `super-sitemap` fails on Cloudflare, fall back to a hand-rolled sitemap endpoint that manually lists routes and fetches param values from Supabase. The XML generation is straightforward -- the library's main value is auto-discovery, which we can replace with an explicit route list.

2. **OG Fallback Placeholder Images**
   - What we know: Need one branded image per category (9 categories). Decision says "category icon on brand-colored background."
   - What's unclear: Whether to generate these at build time (static PNGs in `static/og-fallback/`) or use a dynamic image generation service.
   - Recommendation: Pre-generate 9 static PNG images (1200x630px) during development. Store in `static/og-fallback/{category-slug}.png`. This avoids runtime image generation complexity and works on Cloudflare Workers which cannot run canvas/sharp.

3. **Expired Ads: Fetching "Similar Active Listings"**
   - What we know: Expired ad pages should show similar active listings (same category + county, fallback to category-only).
   - What's unclear: Whether to query this in the existing ad page server load or create a separate component/endpoint.
   - Recommendation: Add a secondary Supabase query in the ad page server load when `isExpired` is true. Query active ads with same category + county (limit 6), falling back to category-only if fewer than 3 results. Return as `similarAds` in the page data.

4. **410 Gone at 90 Days: Implementation Mechanism**
   - What we know: Expired ads should return 410 after 90 days post-expiry.
   - What's unclear: Whether to check `expires_at + 90 days` in the server load function or use a Supabase database function/cron to mark ads as "gone."
   - Recommendation: Check in the ad page server load: `if (daysSinceExpiry > 90) throw error(410, 'This ad has been removed')`. Simple, no cron needed. The `expires_at` column already exists.

## Sources

### Primary (HIGH confidence)

- SvelteKit SEO docs: https://svelte.dev/docs/kit/seo -- meta tags, SSR, structured data guidance
- SvelteKit Advanced Routing docs: https://svelte.dev/docs/kit/advanced-routing -- param matchers, route priority, route sorting
- Google Product Snippet docs: https://developers.google.com/search/docs/appearance/structured-data/product-snippet -- required/recommended properties, Offer sub-type
- Google Product Structured Data intro: https://developers.google.com/search/docs/appearance/structured-data/product -- Product snippets vs Merchant listings distinction
- Schema.org Product: https://schema.org/Product -- property definitions
- Schema.org BreadcrumbList: https://schema.org/BreadcrumbList -- breadcrumb structure
- super-sitemap GitHub: https://github.com/jasongitmail/super-sitemap -- API, configuration, paramValues, Svelte 4-5 compatibility
- Codebase analysis: `/src/routes/`, `/src/lib/category-browse.ts`, `/src/lib/location-hierarchy.ts`, ad page server load

### Secondary (MEDIUM confidence)

- Google Breadcrumb structured data guide: https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
- Open Graph / Twitter Card best practices: multiple sources cross-verified (EverywhereMarketer, DigitalOcean, Coywolf)

### Tertiary (LOW confidence)

- super-sitemap Cloudflare Workers compatibility: not explicitly documented; inferred from architecture analysis. Needs validation (Open Question #1).

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- SvelteKit `<svelte:head>` and super-sitemap are well-documented, verified against official docs
- Architecture: HIGH -- Route matcher pattern verified against SvelteKit advanced routing docs; route priority rules confirmed
- Pitfalls: HIGH -- Route conflict analysis performed against actual codebase route structure and category/county slug sets
- JSON-LD structure: HIGH -- Verified against Google's Product Snippet documentation and schema.org definitions
- super-sitemap on Cloudflare: LOW -- Needs runtime testing due to filesystem dependency concern

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (30 days -- stable domain, no fast-moving dependencies)
