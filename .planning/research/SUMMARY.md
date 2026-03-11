# Project Research Summary

**Project:** fogr.ai (Fógraí) — Irish Classifieds Platform
**Domain:** C2C classifieds marketplace, brownfield near-MVP, launch and growth phase
**Researched:** 2026-03-11
**Confidence:** MEDIUM-HIGH

## Executive Summary

fogr.ai is a near-MVP Irish classifieds platform competing against two dominant but deeply unpopular incumbents — DoneDeal and Adverts.ie, both Trustpilot-rated 1.9–2.x/5 — and Facebook Marketplace as the silent real competitor. The core technical infrastructure is already built: SvelteKit on Cloudflare Workers, Supabase for data and auth, OpenAI-powered content moderation, and a cron-based listing lifecycle. What is missing is everything that makes the platform discoverable, trustworthy, and self-sustaining: SEO foundations, transactional email, organic growth loops, and eventually a monetization layer. The research is unanimous that the right approach is to build these in the order their dependencies demand, not in the order they feel most exciting.

The recommended launch strategy is niche-first, SEO-first, and free-first. Niche-first means opening one category (bicycles) in one region (Dublin/Leinster) with seeded real listings before any public announcement or Google Search Console submission. SEO-first means that human-readable ad slugs, per-page meta tags, JSON-LD structured data, a dynamic sitemap, and correct expired-listing handling must all ship before launch — not as a post-launch improvement. Free-first means no paid features until organic inventory reaches a threshold that makes promotion worth paying for. The cold start problem is the biggest launch risk; everything else is a solved technical problem with well-documented patterns.

The two biggest risks are (1) launching broadly and thinly across all categories with empty pages, which produces high bounce rates and trains Google to deprioritize the domain before organic traffic ever arrives, and (2) treating SEO as a post-launch concern, causing structural URL and schema decisions that are expensive to change retroactively. A third risk — spam flooding the moderation gap between posting and cron-based AI review — is addressable by holding new-account listings in a pending state that is not publicly crawlable. All three risks are preventable with explicit launch gates in the roadmap.

---

## Key Findings

### Recommended Stack

The existing SvelteKit 2 / Svelte 5 / Supabase / Cloudflare Workers / TypeScript stack is correct and requires no changes. The additions needed for launch are all small, composable services that fit naturally into the existing architecture. See [STACK.md](.planning/research/STACK.md) for full rationale and version details.

**Core technology additions:**
- **super-sitemap (1.0.5):** Dynamic sitemap.xml generation — SvelteKit-native, error-throws on missing parameterized route data, prevents silent omissions. Classifieds live and die by crawlability.
- **Plausible Analytics (cloud, $9/mo):** Privacy-first, GDPR-compliant without a cookie consent banner — legally assessed as not requiring consent under ePrivacy. No cookies, EU-only data. Google Analytics 4 is inappropriate for an Irish platform (consent banner required, US data residency, Schrems II exposure).
- **Resend + @react-email/components:** Transactional email. 3,000/month free tier. React Email is the de facto standard for HTML email templates; renders server-side in SvelteKit. Email must originate from SvelteKit server routes or the cron worker — never from Cloudflare Workers edge directly (Node API constraint).
- **Stripe (server SDK 20.4.1, Stripe Checkout hosted redirect):** Payments for future paid bumps/featured listings. Native Cloudflare Workers support confirmed as of v11.10.0+. Use `constructEventAsync` for webhooks (Web Crypto API, not Node crypto). Stripe Checkout (hosted redirect) is recommended over Elements — minimal PCI scope, faster implementation.
- **JSON-LD (hand-rolled, no library):** `Product`, `BreadcrumbList`, `ItemList`, and `Organization` schema types. Inject via `<script type="application/ld+json">` in `<svelte:head>`. Note: `VehicleListing` schema was deprecated by Google in 2025 — do not implement.

**What to avoid:** Google Analytics 4, svelte-email (abandoned), Stripe Elements (overengineered for bump payments), advertising networks (low Irish CPM, contradicts clean UI brand), self-hosted analytics (requires persistent server — incompatible with Workers hosting model).

### Expected Features

The v0 codebase already covers core table stakes: ad posting, category browsing, search, ad view pages, location filtering, user accounts, messaging, ad management, moderation, reporting, and ad expiry. See [FEATURES.md](.planning/research/FEATURES.md) for the full competitor analysis.

**Must have for launch (not yet built):**
- Watchlist / saved items — both competitors have this; buyers expect to track items
- Saved search alerts (email) — the organic growth engine for a no-marketing solo operator; drives return visits without paid channels
- Programmatic SEO pages (county x category) — captures long-tail searches before critical mass of listings exists
- Schema.org structured data on listing and category pages — rich snippets drive higher CTR from organic search
- Dynamic sitemap — enables systematic Google indexing of all ad pages
- Open Graph / social meta tags on ad pages — WhatsApp and Facebook sharing previews drive organic clicks
- Public browsing without login — Adverts.ie requires sign-in to view; removing this barrier is both a UX win and an SEO prerequisite (crawlable public pages)
- "Posted X days ago" timestamp — DoneDeal removed this; users complained; transparency builds trust
- Northern Ireland location support — neither competitor covers the full island

**Should have (add after validation, v1.x):**
- Seller trust indicators (account age, listing count, response rate) — cheap trust signal against scam perception
- Paid bumps / featured listings — introduce only after a category reaches 50+ active listings
- AI listing quality suggestions — extend the existing OpenAI moderation pipeline to suggest better descriptions at post time
- "Mark as sold" visibility — social proof that transactions happen on the platform

**Defer to v2+:**
- Commercial seller / shop tier — only after private seller community is established
- Seller ratings — high moderation overhead; account age indicators are sufficient initially
- Display advertising — contradicts the clean brand; last-resort revenue
- Real-time chat, escrow, native mobile app, open API — all anti-features for a solo operator at this stage

**Strategic recommendation:** Differentiate on trust and simplicity, not features. The competitors have collapsed trust (Trustpilot 1.9–2.x). A platform that feels honest — clean listings, no commercial flooding, transparent timestamps, no dark patterns, no login walls, no upsell pressure — is the meaningful differentiator. This costs nothing to implement; it is a design and policy decision.

### Architecture Approach

The architecture is already well-structured for the goals. The critical gaps are specific and actionable, not systemic. The build order is dictated by dependency chains: human-readable slugs must come before any other SEO work because UUID URLs in sitemaps and meta tags are worthless. Everything else fans out in parallel once slugs are in place. See [ARCHITECTURE.md](.planning/research/ARCHITECTURE.md) for implementation patterns, code samples, and data flow diagrams.

**Major components and their current/target state:**

1. **Ad slug system** — currently UUID-based URLs; must migrate to `[title-words]-[6-char-id-suffix]` before any SEO work. Requires DB migration (`slug text UNIQUE` column + index), slug generation at insert time, 301 redirects from old UUID URLs.
2. **Per-page meta tags** — currently absent on all listing and category pages (only layout has a favicon). Every public page needs `<title>`, `<meta description>`, Open Graph tags, and `<link rel="canonical">` in `<svelte:head>`.
3. **JSON-LD structured data** — absent; `Product` schema on ad pages, `ItemList` on category pages, `BreadcrumbList` and `Organization` on supporting pages.
4. **Dynamic sitemap endpoint** — absent; must be a server-side runtime endpoint (not build-time), querying only active, moderation-approved listings with valid slugs.
5. **Expired ad handling** — currently returns 404 on expiry; must return 200 + `noindex` with similar listings suggestions, then 410 after 90 days to preserve link equity and avoid soft-404 crawl budget waste.
6. **Email notification system** — not built; Resend via HTTP from the cron worker and the messages API endpoint. Events: ad approved, ad rejected, ad expiring soon, new message received.
7. **Revenue integration points** — not built; `is_featured`, `featured_until`, `payment_ref` columns on `ads` table; Stripe Checkout → webhook → flag update flow.
8. **Content seeding system** — not built; a seed script that inserts real-looking listings via Supabase service role, bypassing moderation, for pre-launch category seeding.

**Critical architectural constraint:** Supabase free tier pauses after 1 week of inactivity and has no backups. Upgrade to Supabase Pro ($25/month) before launch — a paused database will cause Googlebot 503s and wreck SEO. This is non-negotiable.

### Critical Pitfalls

The full pitfall analysis is in [PITFALLS.md](.planning/research/PITFALLS.md). The top five with the highest impact on this specific project:

1. **Launching broad with no inventory** — opening all categories on launch day with 0–2 listings each produces high bounce rates, trains Google to deprioritize the domain, and stalls at zero with no recovery path. Prevention: define a hard pre-launch gate — minimum 30 active real listings in the bicycles category before any public announcement or GSC sitemap submission.

2. **SEO as a post-launch activity** — URL structure, schema markup, canonical tags, and expired-listing handling must be designed in before launch. Changing URL slugs retroactively breaks inbound links and causes index churn. Prevention: every listing page template and category page ships with complete structured data; the slug migration happens before any other SEO work.

3. **Programmatic thin pages** — generating county x category pages for every combination regardless of inventory is a Google Helpful Content trigger. Sites saw 30%+ index drops in the March 2024 core update for this pattern. Prevention: only index a location-category page when it has at least 5 real active listings; gate generation on listing count at render time.

4. **Premature monetization** — introducing paid bumps before the platform has proven organic utility thins the supply side and poisons early-adopter trust. Prevention: monetization features are built but not exposed to users until a category reaches 500+ active listings and measurable repeat-buyer traffic. Document the model now, launch the feature later.

5. **Spam flooding the moderation gap** — between posting and the next cron-based AI moderation run, new listings from new accounts are publicly visible and crawlable. A spam bot exploit here causes indexed spam, which is expensive to recover from (Search Console removal requests, disavow file, potential manual action). Prevention: new-account listings enter a pending/held state that is `noindex` until AI moderation clears them. Established accounts (30+ days, approved history) can auto-approve.

---

## Implications for Roadmap

Based on combined research, the phase structure is driven by three hard dependency chains: (1) slugs must precede all SEO work, (2) SEO foundation must precede content seeding and launch, (3) listing inventory must precede monetization. The suggested phases follow these chains.

### Phase 1: SEO Foundation

**Rationale:** Everything else depends on this. UUID URLs make all subsequent SEO work worthless. This phase must complete before anything is publicly announced or submitted to Google. No phase can proceed in parallel that touches public URLs.

**Delivers:** Human-readable ad URLs, per-page meta tags on all public pages, JSON-LD structured data (Product, ItemList, BreadcrumbList, Organization), dynamic sitemap endpoint, robots.txt update pointing to sitemap, canonical tags on paginated and filtered category pages.

**Addresses (from FEATURES.md):** Programmatic SEO pages, Schema.org structured data, sitemap, Open Graph meta tags — all P1 features.

**Avoids (from PITFALLS.md):** Treating SEO as post-launch, UUID URL structure that cannot be changed retroactively, canonical chaos on filtered pages.

**Architecture tasks:** DB migration for slug column, slug generation function, 301 redirect from UUID URLs, `sitemap.xml` server endpoint, `robots.txt` sitemap directive, `<svelte:head>` meta tags on all public routes.

**Research flag:** Standard patterns — well-documented in SvelteKit SEO docs and Google structured data guides. No deeper research phase needed.

---

### Phase 2: Email Notification System

**Rationale:** Required before launch to handle moderation outcomes (ad approved/rejected) and the listing-expiry reminder loop. Also a prerequisite for saved search alerts (Phase 3), which is the main organic re-engagement driver.

**Delivers:** Resend integration in cron worker and messages API, email templates for ad approved/rejected/expiring-soon/new-message, unsubscribe token mechanism, GDPR-compliant transactional email headers.

**Uses (from STACK.md):** Resend SDK, @react-email/components for templates (server-side render in SvelteKit, never imported in .svelte components).

**Implements (from ARCHITECTURE.md):** Email notification architecture — two send sites only: cron worker for batch events, messages API for real-time triggers.

**Avoids (from PITFALLS.md):** Email sends from page server loads (wrong context, no retry, fires on re-render).

**Research flag:** Low risk — Cloudflare Workers + Resend tutorial is officially documented. Confirm React Email server-side rendering works in SvelteKit server routes (flag from STACK.md — MEDIUM confidence, verify during implementation).

---

### Phase 3: Organic Growth Loops

**Rationale:** This is the growth engine for a solo operator who cannot self-promote. Saved search alerts drive return visits without marketing spend. Watchlist keeps buyers engaged. Both require the email system from Phase 2. Northern Ireland location support is low-effort and fills a genuine competitive gap.

**Delivers:** Saved search alerts (search query stored + cron job + Resend delivery), watchlist / saved items (Supabase table + UI), Northern Ireland in location hierarchy, "Posted X days ago" timestamp visible on all listings.

**Addresses (from FEATURES.md):** Saved search email alerts (P1), watchlist/saved items (P1), Northern Ireland location (P1), timestamp visibility (P1).

**Avoids (from PITFALLS.md):** Feature creep — these four items are the complete P1 growth feature set; resist adding more before validating.

**Architecture tasks:** `saved_searches` table, `watchlist` table, cron job for alert matching and dispatch, GDPR unsubscribe compliance for marketing emails (opt-in model, distinct from transactional).

**Research flag:** Saved search alert matching at scale needs design consideration (naive full-table scan per search query won't work beyond 1K searches). Flag for deeper design during phase planning if search alert volume is expected to be high.

---

### Phase 4: Launch Hardening and Content Seeding

**Rationale:** The pre-launch gate phase. Nothing goes public until this passes. Combines the operational prerequisites (Supabase Pro upgrade, moderation hold queue for new accounts) with the content threshold requirement (30+ seeded listings in bicycles before GSC submission).

**Delivers:** New-account listing hold queue (pending + noindex state before AI moderation clears), Supabase Pro upgrade, seed listings script, 30+ real seeded listings in bicycles category across Dublin/Leinster counties, expired listing 200+noindex handling (then 410 at 90 days), `validThrough` schema property on all listings, mobile experience audit and fixes.

**Addresses (from FEATURES.md):** Mobile-responsive design audit (P1), "Mark as sold" visibility groundwork.

**Avoids (from PITFALLS.md):** Launching with no inventory (hard gate: 30 listings required), spam flooding moderation gap, expired listings accumulating as soft-404s, Supabase free-tier pausing causing Googlebot 503s.

**Research flag:** The content seeding strategy (bicycles, cycling clubs, Irish cycling Facebook groups) is an operational activity, not a technical one. No research phase needed — this is execution.

---

### Phase 5: Revenue Integration

**Rationale:** Deliberately deferred until after Phase 4 ships and organic inventory is established. The research is clear: premature monetization thins the supply side and poisons trust. Build the mechanics now; expose the feature only when the inventory milestone is met.

**Delivers:** `is_featured`, `featured_until`, `payment_ref` columns on `ads` table; Stripe Checkout hosted redirect for "Boost" one-time payment (€1–2); Stripe webhook handler using `constructEventAsync`; sort order modification to float featured ads; featured listing badge in browse UI; Plausible analytics goal tracking for conversion; seller trust indicators (account age, listing count, response rate).

**Uses (from STACK.md):** Stripe server SDK 20.4.1, Plausible analytics for conversion funnel visibility.

**Gate:** Do not expose the Boost button to users until any single category has 50+ active listings (hard milestone; document this in the codebase).

**Avoids (from PITFALLS.md):** Premature monetization causing seller abandonment; revenue gates on posting (posting remains free always).

**Research flag:** Standard Stripe Checkout integration — well-documented. Cloudflare Workers compatibility confirmed. No deeper research needed.

---

### Phase Ordering Rationale

- **Slugs first, everything else second:** UUID URLs in a sitemap or structured data give Google nothing. The slug migration is the load-bearing prerequisite for all SEO value. Attempting to do email or growth features before slugs means the domain has no discoverability when those features fire.
- **Email before growth loops:** Saved search alerts require a working, GDPR-compliant email pipeline. Building the feature without the transport is waste.
- **Growth features before launch hardening:** The growth features (alerts, watchlist) should be built and tested before launch hardening runs, so the smoke tests can cover the full user journey including email delivery.
- **Revenue deliberately last:** Not last because it's unimportant — last because building it before inventory exists is actively harmful. The deferred architecture (columns exist, Stripe integrated, but button hidden) means revenue can ship quickly when the milestone is hit.

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 3 (Saved search alerts):** Alert matching algorithm design at scale — a naive implementation (scan all saved searches per new listing) works at 100 searches but degrades at 10K. Needs design attention before implementation if growth is expected.
- **Phase 4 (Content seeding):** The non-technical seeding strategy (cycling clubs, Irish cycling Facebook groups, DMs to real sellers) is the actual launch risk. No technical research needed, but a concrete outreach plan is needed before this phase begins.

**Phases with standard patterns (research phase not needed):**
- **Phase 1 (SEO Foundation):** Well-documented SvelteKit + Google structured data patterns. ARCHITECTURE.md contains implementation-ready code samples.
- **Phase 2 (Email):** Official Cloudflare + Resend tutorial exists. Standard SvelteKit server route patterns apply.
- **Phase 5 (Revenue):** Standard Stripe Checkout integration with documented Workers compatibility.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core existing stack is working. Additions (Stripe, Plausible, Resend, super-sitemap) verified against official docs and confirmed Cloudflare Workers compatible. One flag: React Email in SvelteKit server routes is MEDIUM — community-verified but not officially documented; confirm during Phase 2 implementation. |
| Features | MEDIUM | Competitor analysis from Trustpilot (MEDIUM confidence) and boards.ie summaries (LOW confidence — JS-rendered, not directly inspectable). User pain points are directionally consistent across sources but some specifics (pricing figures, feature lists) from official DoneDeal/Adverts help pages (HIGH). The strategic recommendations are sound. |
| Architecture | HIGH | Based on direct codebase inspection plus verified external sources. All code samples in ARCHITECTURE.md are implementation-ready and consistent with the existing codebase patterns. |
| Pitfalls | MEDIUM-HIGH | Core pitfalls (cold start, SEO structural decisions, spam moderation gap, premature monetization) are verified across multiple independent sources including marketplace failure analyses, Google documentation, and Irish-market-specific competitor reviews. Some Ireland-specific nuance (scam prevalence, Facebook Marketplace adoption) is inferred from market characteristics rather than direct measurement. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Resend / React Email in SvelteKit server routes:** STACK.md flags this as MEDIUM confidence (community-sourced, not officially documented). Confirm compatibility in Phase 2 with a spike before building all templates. Fallback: call Resend REST API directly via `fetch()` from the cron Worker if the npm SDK causes issues.
- **Saved search alert matching at scale:** No research was done on the optimal matching algorithm. At launch scale this is not an issue, but design the schema so it can be indexed properly (index on `category`, `county` columns of `saved_searches` table rather than doing full-text query matching).
- **Seed listing quality and sourcing:** The research recommends seeding 30+ listings in bicycles, but does not validate that 30 is the right threshold for Google to consider a category "active." This is an informed estimate based on Craigslist/Gumtree cold-start case studies. Monitor Google Search Console crawl coverage weekly after launch and adjust if needed.
- **Cloudflare Email Service:** ARCHITECTURE.md notes this was in private beta as of March 2026. If it reaches GA before Phase 2 begins, evaluate as a zero-dependency alternative to Resend (no npm package, native Cloudflare binding).

---

## Sources

### Primary (HIGH confidence)
- [Google Structured Data for Ecommerce](https://developers.google.com/search/docs/specialty/ecommerce/include-structured-data-relevant-to-ecommerce) — Product, BreadcrumbList, ItemList, Organization schema types confirmed
- [Google Search Gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery) — VehicleListing deprecation confirmed 2025
- [Cloudflare: Stripe in Workers](https://blog.cloudflare.com/announcing-stripe-support-in-workers/) — Workers-native Stripe SDK support
- [Cloudflare: Send Emails with Resend](https://developers.cloudflare.com/workers/tutorials/send-emails-with-resend/) — Resend + Workers integration
- [Stripe Ireland/EUR](https://stripe.com/resources/more/payments-in-ireland) — EUR + SEPA support confirmed
- [Plausible GDPR data policy](https://plausible.io/data-policy) — EU-only server (Hetzner, Germany)
- [Plausible legal GDPR assessment](https://plausible.io/blog/legal-assessment-gdpr-eprivacy) — no consent banner required
- [Adverts.ie help: how ads work](https://help.adverts.ie/hc/en-us/articles/360001336969-How-they-work) — pricing and model confirmed
- [DoneDeal pricing](https://hello.donedeal.ie/hc/en-us/articles/201381192-How-much-will-my-ad-cost-) — €11 base price confirmed
- [super-sitemap GitHub](https://github.com/jasongitmail/super-sitemap) — active maintenance, SvelteKit 2.x compatible
- [Google March 2024 Core Update](https://blog.google/products/search/google-search-update-march-2024/) — programmatic thin page penalty confirmed

### Secondary (MEDIUM confidence)
- [Adverts.ie Trustpilot (207 reviews, 1.9/5)](https://ie.trustpilot.com/review/www.adverts.ie) — user pain points
- [DoneDeal Trustpilot](https://ie.trustpilot.com/review/donedeal.ie) — user pain points
- [Failory: 44 Failed Marketplace Startups](https://www.failory.com/startups/marketplace-failures) — failure pattern analysis
- [NFX: 19 Tactics for Cold Start](https://www.nfx.com/post/19-marketplace-tactics-for-overcoming-the-chicken-or-egg-problem) — cold start strategies
- [AIM Group: Facebook Marketplace 2024](https://aimgroup.com/2024/10/12/facebook-marketplace-a-growing-refocus-on-its-strengths-as-a-classical-classified-site/) — Facebook's classifieds competitive position
- [Prerender: Managing Expired Listings for SEO](https://prerender.io/blog/how-to-manage-expired-listings-and-old-content/) — expired listing lifecycle
- [CSO Ireland Digital Consumer 2025](https://www.cso.ie/en/releasesandpublications/ep/p-isshdcb/householddigitalconsumerbehaviour2025/keyfindings/) — 65% mobile usage figure
- [Andrew Chen: Grow First, Monetize Later](https://andrewchen.com/why-its-smart-for-consumer-startups-to-grow-first-and-make-money-later/) — monetization timing rationale
- [Resend pricing](https://resend.com/pricing) — free tier 3k/month verified

### Tertiary (LOW confidence)
- [Boards.ie: DoneDeal price hike discussion](https://www.boards.ie/discussion/2057740119/donedeal-advertising-rate-increased-by-120-from-5-to-11) — JS-rendered, content not directly inspectable; headline confirmed
- [Boards.ie: Sellers leaving platforms](https://www.boards.ie/discussion/2057235992/lots-of-sellers-gone-off-adverts-donedeal) — same constraint
- [Sentry free tier limits](https://sentry.io/pricing/) — from Sentry pricing page, not independently verified in this session; flag if billing is a concern

---

*Research completed: 2026-03-11*
*Ready for roadmap: yes*
