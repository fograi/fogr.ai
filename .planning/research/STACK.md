# Stack Research

**Domain:** Irish classifieds platform (brownfield — near-MVP, adding launch/growth components)
**Researched:** 2026-03-11
**Confidence:** MEDIUM-HIGH (most recommendations verified via official docs or multiple sources)

---

## Existing Stack (Do Not Re-research)

The following are already committed and should not be replaced:

| Technology | Version | Role |
|------------|---------|------|
| SvelteKit | 2.50.2 | Full-stack framework |
| Svelte | 5.50.0 | UI components |
| Supabase | (postgres + auth) | Database and authentication |
| Cloudflare Workers | (workerd) | Hosting, KV rate limiting, R2 storage |
| OpenAI | API | Content moderation |
| TypeScript | 5.9.3 | All application code |

---

## Recommended Stack: Additional Components

### SEO Infrastructure

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| super-sitemap | 1.0.5 | Dynamic sitemap.xml generation | SvelteKit-native, auto-discovers routes, throws errors when parameterized routes are missing data — prevents silent omissions. Cleanest sitemap solution in the SvelteKit ecosystem. Classifieds live and die by crawlability of hundreds of listing pages. |
| JSON-LD (hand-rolled) | n/a (no npm) | Structured data for Product schema and BreadcrumbList | Google recommends JSON-LD format explicitly. No library needed — inject a `<script type="application/ld+json">` block in each page's `<svelte:head>`. Libraries add abstraction without value here. |

**Schema types to implement (confirmed supported by Google as of 2025-2026):**
- `Product` — individual listing pages (name, price, description, image, availability)
- `BreadcrumbList` — every listing and category page (e.g. Home > Bicycles > Dublin)
- `ItemList` — category index pages (list of Product items)
- `Organization` — root site schema (builds trust with Google)

**Schemas explicitly NOT to implement** (Google retired support in 2025):
- `VehicleListing` — removed from Google's rich results gallery
- `SpecialAnnouncement` — removed
- `ClaimReview` — removed

**Source confidence:** HIGH — verified at [developers.google.com](https://developers.google.com/search/docs/specialty/ecommerce/include-structured-data-relevant-to-ecommerce)

---

### Analytics

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Plausible Analytics | Cloud hosted | Web traffic and conversion tracking | Privacy-first, GDPR-compliant without consent banners. Data stored exclusively on EU servers (Hetzner, Germany). No cookies. No personal data collected. 1.5 kB script vs GA's 45 kB. Plausible is legally assessed as not requiring cookie consent under GDPR + ePrivacy, which matters for an Irish platform. $9/month for Starter (10k pageviews), free 30-day trial. |

**Why not Google Analytics 4:**
- Requires cookie consent banner (GDPR)
- Data flows to US servers — potential Schrems II issue for EU users
- Overkill complexity for solo operator
- Consent banners degrade user trust and conversion on a clean classifieds UI

**Why not self-hosted Plausible/Umami:**
- Solo operator — do not want infrastructure to manage
- Cloudflare Workers cannot run Plausible (requires persistent server process)
- $9/month is justified to keep ops burden at zero

**Pricing tier for fogr.ai:** Start on Starter ($9/month). Upgrade to Growth ($14/month) when traffic exceeds 10k pageviews/month.

**Source confidence:** HIGH — verified at [plausible.io/data-policy](https://plausible.io/data-policy), [plausible.io/blog/legal-assessment-gdpr-eprivacy](https://plausible.io/blog/legal-assessment-gdpr-eprivacy)

---

### Transactional Email

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Resend | SDK (latest) | Send notification emails (new message alerts, listing expiry, moderation results) | Developer-first API. 3,000 emails/month free (100/day). Simple SDK. GDPR compliant. React Email integration is best-in-class for HTML template authoring. Cheapest path from zero to production for a solo operator. |
| @react-email/components | 1.0.8 | Email HTML templates | React Email is the de facto standard for transactional email templates in 2025-2026. Works server-side in SvelteKit (Node runtime, not Cloudflare Workers). Templates written as React components, rendered to HTML string, sent via Resend SDK. |

**Why Resend over alternatives:**
- Postmark: $15/month for 10k (no real free tier beyond 100/month). Better deliverability reputation, but overkill cost at early stage.
- SendGrid: Complex, owned by Twilio, poor developer experience.
- AWS SES: Very cheap ($0.10/1000) but requires AWS account setup, DKIM/SPF configuration burden, no template tooling.
- Resend free tier (3k/month) is sufficient until fogr.ai has significant scale. Move to Resend Pro ($20/month) at 3k+.

**Important:** Resend calls must be made from SvelteKit server routes (`+server.ts` / server-side `load` / form actions), NOT directly from Cloudflare Workers edge code. The Resend SDK uses Node.js APIs. The existing cron Worker (wrangler.cron.jsonc) can trigger email sends by calling a SvelteKit API route.

**Source confidence:** MEDIUM — Resend pricing verified at [resend.com/pricing](https://resend.com/pricing). React Email version from [npmjs.com](https://www.npmjs.com/package/@react-email/components). Cloudflare Workers compatibility is a known constraint from community research (LOW — flag for verification during implementation).

---

### Payments

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| stripe (server SDK) | 20.4.1 | Process payments for premium listings / bumps | Industry standard. Native support in Cloudflare Workers confirmed (as of stripe-node v11.10.0+, no `node_compat` flag needed). Ireland is fully supported with EUR. SEPA Direct Debit available for subscription billing. |
| @stripe/stripe-js | latest | Stripe.js client for browser (if using Elements) | Only needed if building custom checkout forms. If using Stripe Checkout (hosted page), not required. |

**Recommended integration pattern for fogr.ai:**
Use **Stripe Checkout (hosted redirect)**, not Stripe Elements. Rationale:
- Solo operator: minimise PCI scope, no card data touches your server
- Implementation takes hours not days
- Stripe handles mobile-optimised UI, Apple Pay, Google Pay automatically
- Sufficient for "pay to bump your listing to top" one-time payments

**Revenue model recommendation** (based on competitor pricing research):
1. **Bump/Feature listing** — one-time €1-3 payment to push an ad to top of its category for 7 days. Lowest friction, no recurring commitment, immediately valuable to sellers.
2. **No free listing caps initially** — given cold-start problem, remove all friction for supply-side growth first.
3. **Defer subscriptions** — add monthly seller subscriptions only once organic supply is established.

**Cloudflare Workers specific note:**
Stripe webhook handlers must use `stripe.webhooks.constructEventAsync()` (not `constructEvent`) because Workers use the Web Crypto API, not Node's crypto module. This is well-documented and has a sample template at [github.com/stripe-samples/stripe-node-cloudflare-worker-template](https://github.com/stripe-samples/stripe-node-cloudflare-worker-template).

**Source confidence:** HIGH — Stripe Workers support confirmed at [blog.cloudflare.com/announcing-stripe-support-in-workers/](https://blog.cloudflare.com/announcing-stripe-support-in-workers/). Ireland/EUR support confirmed at [stripe.com/resources/more/payments-in-ireland](https://stripe.com/resources/more/payments-in-ireland).

---

### Programmatic SEO Pages

No new library required — this is a SvelteKit routing pattern, not a package. However:

| Tool | Purpose | Why |
|------|---------|-----|
| super-sitemap (see above) | Ensure generated location+category pages are indexed | Already listed under SEO Infrastructure |
| `<link rel="canonical">` (built-in SvelteKit head) | Prevent duplicate content on filtered/sorted listing pages | URL parameters create duplicate content — canonical prevents diluting page authority |

**Programmatic pages to generate:**
- `/[category]` — already exists
- `/[county]` — browse all ads in a county (e.g. `/dublin`, `/cork`)
- `/[county]/[category]` — e.g. `/dublin/bicycles` — these are the highest-SEO-value pages for an Irish classifieds platform
- Each page should have a unique h1, meta description, and ItemList structured data populated from real ad counts

**Source confidence:** MEDIUM — based on classifieds SEO best practices from Shopify/Backlinko programmatic SEO guides and pattern analysis of adverts.ie/donedeal.ie URL structures.

---

### Operational / Observability

| Technology | Purpose | Why |
|------------|---------|-----|
| Cloudflare Workers Analytics (built-in) | Worker invocation counts, errors, CPU time | Free, already available in Cloudflare dashboard. No setup needed. Use for worker-level health monitoring. |
| Sentry (free tier — 5k errors/month) | JavaScript error tracking for production bugs | Solo operator cannot afford to miss production errors. Sentry's Cloudflare Workers integration is documented. Free tier sufficient at early stage. Alternative: Cloudflare's built-in tail workers for log streaming (no third-party account needed, but less ergonomic). |

**Why not Datadog/New Relic:**
- Cost: $15-23/month minimum
- Complexity: Designed for teams
- Cloudflare Workers + Supabase already provide sufficient metrics for a solo operator at MVP stage

**Source confidence:** MEDIUM — Sentry Workers integration based on documentation; free tier limits from Sentry's pricing page (not independently verified in this research session — flag as LOW if billing is a concern).

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Google Analytics 4 | GDPR cookie consent required for EU users; US data residency; Schrems II risk; bloated script | Plausible Analytics |
| Mailchimp / Campaign Monitor | Marketing email tools, not transactional. Overkill and expensive for notification emails. | Resend |
| svelte-email / svelte-email-tailwind | Abandoned packages (search results confirm). No active maintenance. | @react-email/components (server-side render in SvelteKit) |
| Stripe Elements (custom checkout form) | More complex implementation; PCI scope to manage; unnecessary for simple "bump" payments | Stripe Checkout (hosted redirect) |
| Advertising networks (Google AdSense, display ads) | Low RPM for Ireland traffic ($1-3 CPM). Clutters the UI. Contradicts "clean classifieds" positioning. | Premium listing fees via Stripe |
| `VehicleListing` schema markup | Google deprecated and removed from search results in 2025 | `Product` schema for vehicle ads |
| Self-hosted analytics (Umami, Matomo) | Requires persistent server process — incompatible with Cloudflare Workers hosting model | Plausible cloud |
| Sending email directly from Cloudflare Workers edge | Workers have restricted Node.js API access; email SDKs require Node APIs | Trigger email from SvelteKit server routes or a dedicated Worker using fetch to Resend's REST API |

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Plausible ($9/mo cloud) | Fathom ($14/mo) | Fathom if you want slightly more polished UI and don't mind higher cost. Same privacy story. |
| Resend (3k/mo free) | Postmark | Postmark when deliverability is the primary concern (transactional email for commerce, support tickets). Postmark has better reputation tracking. Switch if Resend delivery rates become problematic. |
| Stripe Checkout (hosted) | PayPal | PayPal if targeting older Irish demographic that distrusts card-on-internet. Irish market skews toward card payments; Stripe is the better default. |
| super-sitemap | Manual `sitemap.xml` endpoint | Manual sitemap if route structure is very simple and static. fogr.ai has many dynamic routes (per-ad, per-county, per-category) making super-sitemap justified. |
| JSON-LD hand-rolled | `schema-dts` TypeScript types | schema-dts is worth adding for type safety if structured data grows complex. At MVP, hand-rolled JSON in `<svelte:head>` is fine. |

---

## Installation

```bash
# SEO
npm install super-sitemap

# Analytics (no npm package — script tag in app.html)
# Add to src/app.html: <script defer data-domain="fogr.ai" src="https://plausible.io/js/script.js"></script>

# Email
npm install resend @react-email/components react react-dom

# Payments
npm install stripe

# Optional: TypeScript types for structured data (if JSON-LD grows complex)
npm install -D schema-dts
```

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| stripe@20.4.1 | Cloudflare Workers (workerd) | As of v11.10.0+, no `node_compat = true` needed. Use `constructEventAsync` for webhooks. |
| @react-email/components@1.0.8 | SvelteKit server routes | Server-side only. Never import in `.svelte` components. Add to `$lib/server/emails/`. |
| resend@latest | Cloudflare Workers | Can call Resend REST API via `fetch()` directly from Workers if needed. The npm SDK works in SvelteKit server routes. |
| super-sitemap@1.0.5 | SvelteKit 2.x | Requires SvelteKit route conventions. Works with dynamic routes (ads, categories, locations). |

---

## Context: Irish Market Notes

The competitor research is directly relevant to stack decisions:

- **DoneDeal and Adverts.ie** have significant user trust issues (scams, poor moderation, price hikes). fogr.ai's existing three-layer moderation is already a differentiator — **make this visible** in structured data (e.g. `Organization` schema with trust signals).
- **Price sensitivity:** DoneDeal's listing fee hikes have driven sellers away. fogr.ai's free listings with optional small bumps is well-positioned — the bump fee via Stripe should stay low (€1-2).
- **Cold start:** PropertyGuru solved cold start by manually inputting newspaper classifieds. fogr.ai equivalent: the operator should seed 50-100 real listings across target categories before launch, especially for location+category pages to have content when Google crawls them.

---

## Sources

- [Google Structured Data for Ecommerce](https://developers.google.com/search/docs/specialty/ecommerce/include-structured-data-relevant-to-ecommerce) — confirmed Product, BreadcrumbList, ItemList schema types
- [Google Search Gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery) — confirmed supported schema types in 2025-2026
- [Plausible GDPR data policy](https://plausible.io/data-policy) — EU-only server confirmed (Hetzner, Germany)
- [Plausible legal GDPR assessment](https://plausible.io/blog/legal-assessment-gdpr-eprivacy) — no consent banner required
- [Resend pricing](https://resend.com/pricing) — free tier 3k/month, $20/month Pro verified
- [Cloudflare native Stripe support](https://blog.cloudflare.com/announcing-stripe-support-in-workers/) — Workers compatibility confirmed
- [Stripe Ireland / EUR](https://stripe.com/resources/more/payments-in-ireland) — EUR + SEPA support confirmed
- [super-sitemap GitHub](https://github.com/jasongitmail/super-sitemap) — version 1.0.5, active maintenance
- [react-email npm](https://www.npmjs.com/package/@react-email/components) — version 1.0.8, actively published
- [stripe npm latest](https://github.com/stripe/stripe-node/releases) — version 20.4.1
- Boards.ie/Trustpilot reviews of donedeal.ie and adverts.ie — competitor weakness research (MEDIUM confidence, community sources)

---

*Stack research for: fogr.ai Irish classifieds platform — launch and growth components*
*Researched: 2026-03-11*
