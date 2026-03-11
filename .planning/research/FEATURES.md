# Feature Research

**Domain:** Irish classifieds marketplace (fogr.ai / Fógraí)
**Researched:** 2026-03-11
**Confidence:** MEDIUM — primary sources are Trustpilot reviews, boards.ie metadata (JS-rendered, content not extractable), and DoneDeal help pages; direct Reddit/boards forum content was inaccessible but search summaries provide representative complaints

---

## Competitor Landscape

### Market Structure

Two dominant players — both owned by the same company (Distilled):
- **DoneDeal.ie** — Ireland's #1 for cars and motors; general marketplace; paid listings for cars (~€11 base, up to €40 for premium); strong brand but expensive and scam-ridden
- **Adverts.ie** — free general classifieds; community-focused; freemium bump model (€1 free monthly bump, paid bumps €3–€5); 2.1M monthly visits; declining trust (Trustpilot 1.9/5 from 207 reviews)

Both losing users to Facebook Marketplace due to pricing and scam problems.

### Key Competitor Pain Points (MEDIUM confidence — from Trustpilot reviews, boards.ie summaries)

**DoneDeal pain points:**
- Pricing increased 120% (€5 → €11 base) with premium packages up to €30–€40 for cars
- Photo upload is broken or "almost impossible" on mobile
- Removing town/location info from listings (users explicitly complained)
- Auto-filled vehicle data users cannot correct (tax amounts, etc.)
- Ad editing limitations after posting
- No Northern Ireland search option (island-of-Ireland gap)
- Misleading analytics (bots counted as "leads")
- Scam messages via WhatsApp suggesting fake An Post courier payment links
- Poor customer service

**Adverts.ie pain points:**
- Account blocks with no explanation and no support response (multiple-month waits)
- Platform taken over by commercial resellers with multiple accounts flooding categories
- Scams rife; reports of Eastern European gangs with multiple accounts selling Amazon returns
- Moderation described as "banning the reporter rather than the scammer"
- User-hostile: requires account/email/Facebook to even view ads
- Free bump changes (users angry about eroding the free tier)
- Platform has declined from "used to be good" to poor

**Shared pain points:**
- Scams and fraud are the #1 complaint across both platforms
- Poor/zero customer support
- Commercial sellers drowning out private sellers
- Price hikes pushing users to Facebook Marketplace (free)
- Trust has collapsed: Trustpilot scores are 1.9/5 and 2.x/5

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Post an ad (title, description, price, images) | Core product function | LOW | Already built |
| Browse ads by category | Core product function | LOW | Already built |
| Search ads (keyword + filters) | Core product function | MEDIUM | Already built; needs quality search |
| View individual ad page | Core product function | LOW | Already built with slugs |
| Location filtering (county/province) | Ireland-specific expectation; users complained DoneDeal removed town info | MEDIUM | Already built with hierarchy |
| User account / profile | Credibility signal; expected for messaging | LOW | Already built via Supabase Auth |
| Contact seller (messaging) | Without this, the platform is a noticeboard not a marketplace | MEDIUM | Already built (anonymized) |
| Ad management (edit, mark sold, delete) | Sellers need lifecycle control | LOW | Already built |
| Free to post | Both competitors started free; Facebook Marketplace is free; Irish users expect free for private sellers | LOW | Core differentiator |
| Mobile-responsive design | 65% of Irish online transactions are mobile | MEDIUM | Must be tested |
| Ad expiry / "still available?" indication | Users need to know if ads are current | LOW | Already built (cron expiry) |
| Report / flag ads | Safety baseline | LOW | Already built |
| Terms of service + privacy policy | Legal baseline; GDPR requirement in Ireland | LOW | Already built |
| Saved/watchlist items | Adverts.ie has this; buyers expect to track items of interest | MEDIUM | NOT yet built |
| Search alerts / saved searches | Adverts.ie has this; drives return visits; key engagement loop | MEDIUM | NOT yet built |

### Differentiators (Competitive Advantage)

Features that set fogr.ai apart. Not required, but valuable — especially given the operator constraints (no marketing, needs organic growth, solo).

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| No mandatory account to browse | Adverts.ie requires sign-in to view; friction drives users away; removing this barrier increases organic reach and SEO indexability | LOW | Critical for SEO — pages must be public and crawlable |
| Strictly private sellers only (or clearly separated) | Both competitors flooded with commercial resellers; users want actual private listings | MEDIUM | Enforce via moderation policy + detection; reduces scams too |
| Clean, fast, no-ad browsing experience | Both competitors plastered with display ads and upsells; newspaper classifieds simplicity is the brand | LOW | Aligns with the fogr.ai aesthetic vision |
| Honest listing duration / "posted X days ago" | DoneDeal removed this; users complained; transparency builds trust | LOW | Simple timestamp display |
| Northern Ireland inclusion | DoneDeal only covers Republic; island of Ireland coverage is a real gap | LOW | Location data already has country-level hierarchy |
| AI-assisted listing quality | Auto-suggest category, flag vague descriptions, warn on suspicious pricing | HIGH | Partial pipeline exists; extend to quality suggestions not just moderation |
| Seller trust indicators | Show account age, listing history, response rate; cheap trust signal to combat scam perception | MEDIUM | No external verification needed — just internal activity data |
| Programmatic SEO pages | "Second-hand bicycles Dublin", "used furniture Cork" — long-tail pages that rank organically; this is the cold start / organic growth strategy | MEDIUM | Schema.org ListingProduct, ItemList structured data; SvelteKit SSR makes this straightforward |
| Brevity-enforced listings | Enforce short descriptions (newspaper style); helps scanability and discoverability; differentiates from noisy competitor listings | LOW | Character limits + UX guidance |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time chat / live messaging | Users want instant responses | Complex infra, WebSocket cost, drives off-platform to WhatsApp anyway; async messaging sufficient for v1 | Already decided out-of-scope; async anonymized messaging handles 90% of use cases |
| User ratings / feedback system | Builds trust; competitors have it | Highly gameable; commercial sellers inflate ratings; requires moderation of the rating system itself; adds complexity without solving the actual scam problem | Focus on seller trust indicators (account age, activity) instead; defer ratings to v2 |
| Escrow / payment processing | Safety for buyers | PSD2, AML compliance, banking relationships, liability; enormous regulatory burden for solo operator | Link to PayPal Goods & Services guidance (what DoneDeal already recommends); do not build payment rails |
| Vehicle history check integration | DoneDeal offers this for cars | Requires commercial API agreements with Cartell/HPI; niche for car category only | Link out to Cartell/HPI; do not build |
| Native mobile app | Users on mobile | 65% mobile usage served well by PWA/responsive web; app store fees, maintenance overhead, separate release cycle | PWA / responsive SvelteKit |
| Promoted/boosted listings paid model from day 0 | Revenue | With no user base, paid features feel exploitative and deter early adopters; chicken-and-egg problem | Build free first, introduce bumps/boosting only after category has sufficient listings |
| Open API / external integrations | Developers want to build on it | Complexity, spam vector, rate limiting complexity; not needed for v1 | Defer until platform has established audience |
| Profile photos / identity upload | Trust | GDPR implications for storing identity documents; false sense of security (photos are easily faked) | Account age and activity indicators are simpler trust signals |
| Forum / community features | Community building | Mission creep; boards.ie already exists; adds moderation burden without classifieds value | Focus on classifieds core |

---

## Revenue Features

Features specifically targeting monetization (to be introduced after initial user base is established).

| Feature | Model | Complexity | When to Introduce | Notes |
|---------|-------|------------|-------------------|-------|
| Paid ad bumps / "bump to top" | Freemium — free to list, pay for visibility | LOW | After category has 50+ active listings | Adverts.ie model: €1 free/month, €3–€5 paid bumps. Proven in Irish market. |
| Featured / highlighted listings | Freemium — visual prominence | LOW | Same as bumps | Simple badge/border; higher in search results for 7 days |
| Commercial seller accounts / shop tier | B2B listing subscription | MEDIUM | After private seller base established | Prevents early commercial flooding while still monetizing professionals later |
| Category-specific paid listing (high-value only) | Per-listing fee for cars, property | MEDIUM | Category-specific rollout | DoneDeal model for cars; makes sense only where transaction value justifies the cost |
| Display advertising (Google AdSense / direct) | Ad impressions | LOW | Once traffic exceeds ~10K monthly visits | Last resort — contradicts "clean" brand; only if other revenue insufficient |

**Revenue model recommendation:** Start fully free (all listing, all browsing, no account required for browsing). Introduce paid bumps once any single category has 50+ active listings. This follows the Adverts.ie model that proved viable in Ireland, avoids the DoneDeal "greed" perception, and doesn't create a chicken-and-egg problem with early adopters.

---

## Growth Features (Organic, No Marketing)

Features specifically for a shy solo operator who cannot do active promotion.

| Feature | Growth Mechanism | Complexity | Notes |
|---------|-----------------|------------|-------|
| Programmatic SEO category/location pages | Google indexes "used [item] [county]" pages; drives organic search traffic before significant listings exist | MEDIUM | SvelteKit SSR + schema.org structured data; location hierarchy already exists |
| Schema.org Product / ItemList markup | Rich snippets in Google search results; higher CTR from organic listings | LOW | JSON-LD in ad view pages and category pages |
| Sitemap generation | Ensures Google indexes all ad pages | LOW | Standard SvelteKit; auto-generate from active ads |
| Open Graph / social meta tags | When users share ad links on WhatsApp, Facebook, Twitter — preview cards drive organic clicks | LOW | Title, price, first image in OG tags |
| Email search alerts | Users subscribe to "bikes in Dublin" alerts; platform re-engages users without paid ads; creates recurring visit habit | MEDIUM | Cron job + Resend/Postmark; needs unsubscribe/GDPR compliance |
| "Mark as sold" with outcome tracking | Social proof; shows platform is active and transactions happen; visible sold badges build trust | LOW | Simple status flag |
| Seed content strategy (bicycles niche-first) | Start one category deep rather than all categories shallow; a single category with 20+ real listings is more credible than 10 categories with 1–2 listings each | LOW | Operational decision, not a feature; but enforced by showing category as "active" only above threshold |
| Referral from seller to buyer network | Each successful transaction creates two users with positive experience who may refer others | LOW | No feature needed — depends on product quality |

---

## Feature Dependencies

```
[Browse / Search]
    └──requires──> [Public pages, no login wall]
                       └──requires──> [SSR / crawlable routes]

[Saved searches / alerts]
    └──requires──> [User accounts]
    └──requires──> [Search functionality]
    └──requires──> [Email delivery (Resend/Postmark)]

[Programmatic SEO]
    └──requires──> [SSR category + location pages]
    └──requires──> [Schema.org markup]
    └──requires──> [Sitemap]
    └──requires──> [Public crawlable pages (no login wall)]

[Paid bumps / featured listings]
    └──requires──> [Sufficient listings to make bump valuable]
    └──requires──> [Payment processing (Stripe)]
    └──requires──> [Ad position/rank system]

[Seller trust indicators]
    └──requires──> [User accounts with history]
    └──requires──> [Ad posting history]

[AI listing quality suggestions]
    └──enhances──> [Ad posting flow]
    └──requires──> [OpenAI API] (already exists for moderation)

[Commercial seller tier]
    └──conflicts──> [Private-sellers-only positioning] (must be clearly separated)
    └──requires──> [Private seller base established first]
```

### Dependency Notes

- **Programmatic SEO requires public crawlable pages:** The single most impactful growth lever requires zero login gates for browsing. This is both a growth feature and an anti-feature decision (no mandatory sign-in to browse).
- **Saved search alerts require email delivery:** Resend or Postmark needed; adds per-email cost but drives return visits.
- **Paid bumps require listings:** Cannot monetize an empty category. Revenue features are blocked until cold start is solved.
- **Seller trust indicators require account history:** Simple to build once accounts have activity; blocks nothing.

---

## MVP Definition

### Already Built (v0 — existing codebase)

- Ad posting with images, category, location, price
- Category browsing and search
- Public ad view pages
- Anonymized messaging
- User accounts
- Content moderation pipeline
- Report system and admin panel
- Ad expiry via cron
- Rate limiting + CSRF

### Launch With (v1 — needed to go live credibly)

- [ ] Watchlist / saved items — users expect this; retention feature
- [ ] Saved search alerts (email) — drives return visits; organic growth engine; critical given no-marketing constraint
- [ ] Programmatic SEO pages (category + location) — cold start organic traffic
- [ ] Schema.org structured data on ad pages — rich snippets, higher organic CTR
- [ ] Sitemap auto-generation — indexability
- [ ] Open Graph / social meta tags on ad pages — WhatsApp/social sharing previews
- [ ] No login required to browse — removes friction for organic traffic and SEO
- [ ] "Posted X days ago" timestamp visible — trust signal; competitors removed this (users complained)
- [ ] Mobile experience audit — 65% mobile usage in Ireland; must work well on phone
- [ ] Northern Ireland location support — island of Ireland gap vs DoneDeal

### Add After Validation (v1.x)

- [ ] Seller trust indicators (account age, listing count, response rate) — add when accounts have history to show
- [ ] Paid bumps / featured listings — add when a category has 50+ active listings
- [ ] AI listing quality prompts (not just moderation) — suggest better descriptions at posting time
- [ ] "Mark as sold" visibility — social proof that platform drives transactions

### Future Consideration (v2+)

- [ ] Commercial seller / shop tier — only after private seller community is established
- [ ] Category-specific paid listing (cars, property) — when those categories have traffic
- [ ] Seller ratings — after trust indicators prove insufficient; high moderation overhead
- [ ] Display advertising — last resort revenue; contradicts brand

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Public browsing (no login gate) | HIGH | LOW | P1 |
| Programmatic SEO pages | HIGH (indirect — organic traffic) | MEDIUM | P1 |
| Schema.org + sitemap | HIGH (indirect) | LOW | P1 |
| Open Graph meta tags | MEDIUM | LOW | P1 |
| Saved search email alerts | HIGH | MEDIUM | P1 |
| Watchlist / saved items | MEDIUM | MEDIUM | P1 |
| "Posted X days ago" timestamp | MEDIUM | LOW | P1 |
| Northern Ireland location | MEDIUM | LOW | P1 |
| Mobile experience audit | HIGH | LOW–MEDIUM | P1 |
| Seller trust indicators | HIGH | MEDIUM | P2 |
| Paid bumps | HIGH (revenue) | MEDIUM | P2 — after listings exist |
| AI listing quality suggestions | MEDIUM | MEDIUM | P2 |
| Mark as sold | LOW | LOW | P2 |
| Commercial seller tier | MEDIUM (revenue) | MEDIUM | P3 |
| Seller ratings | MEDIUM | HIGH | P3 |

---

## Competitor Feature Comparison

| Feature | DoneDeal | Adverts.ie | fogr.ai Plan |
|---------|----------|------------|--------------|
| Posting cost (private seller) | €11–€40 | Free (bumps paid) | Free |
| Browse without account | Yes | No (login required) | Yes — critical |
| Island of Ireland coverage | Republic only | Republic only | Both — gap to fill |
| Location display on listing | Removed (users complained) | County level | County + locality (restored) |
| Listing duration visible | Removed | Shown | Show prominently |
| Watchlist / saved items | Yes | Yes | Build for v1 |
| Saved search alerts | Yes | Yes | Build for v1 |
| Scam prevalence | High | High | Address via moderation + private-only policy |
| Commercial seller separation | Mixed in with private | Mixed in with private | Separate from day 1 |
| Mobile app | iOS + Android | iOS + Android | Web-first, mobile-responsive |
| Ad quality | Variable | Variable | Brief, enforced format |
| Customer support | Poor | Non-existent | Automate via AI; acknowledge fast |
| SEO / indexability | Strong (established domain) | Strong | Build from launch via programmatic pages |
| Revenue from listing | Fees per category | Bumps + premium tiers | Bumps only (deferred to v1.x) |

---

## Strategic Recommendation

**Niche-first before broad.** Evidence supports the bicycles category suggestion: it is concrete, passionate, high-frequency for browsing (people check often for new deals), has clear search intent ("road bikes Dublin"), and private sellers outnumber commercial resellers more than in electronics or cars. Start with bicycles in Dublin/Leinster to seed content credibly, then expand.

**Differentiate on trust and simplicity, not features.** The two competitors have collapsed trust (Trustpilot 1.9–2.x). The single most powerful differentiator is a platform that feels honest: clean listings, no commercial flooding, transparent timestamps, no dark patterns, no login walls, no upsell pressure. This costs nothing to implement — it is a design and policy decision.

**Organic growth requires three things in v1:** (1) public crawlable pages so Google can index ads, (2) programmatic SEO to capture long-tail searches before critical mass of listings, (3) saved search alerts to bring users back without any marketing effort. These three features together are the growth engine for a solo operator who cannot self-promote.

---

## Sources

- [Adverts.ie Trustpilot reviews (207 reviews, 1.9/5)](https://ie.trustpilot.com/review/www.adverts.ie) — MEDIUM confidence
- [DoneDeal.ie Trustpilot reviews](https://ie.trustpilot.com/review/donedeal.ie) — MEDIUM confidence
- [DoneDeal pricing discussion — boards.ie](https://www.boards.ie/discussion/2057740119/donedeal-advertising-rate-increased-by-120-from-5-to-11) — LOW confidence (page JS-rendered, content inaccessible; headline confirmed)
- [DoneDeal price hike — boards.ie](https://www.boards.ie/discussion/2058319282/donedeal-ads-huge-price-hike) — LOW confidence (same)
- [Lots of sellers gone off Adverts/DoneDeal — boards.ie](https://www.boards.ie/discussion/2057235992/lots-of-sellers-gone-off-adverts-donedeal) — LOW confidence (same)
- [Adverts.ie — How ads work (help page)](https://help.adverts.ie/hc/en-us/articles/360001336969-How-they-work) — HIGH confidence (official)
- [DoneDeal pricing help page](https://hello.donedeal.ie/hc/en-us/articles/201381192-How-much-will-my-ad-cost-) — HIGH confidence (official)
- [CSO Ireland Household Digital Consumer Behaviour 2025](https://www.cso.ie/en/releasesandpublications/ep/p-isshdcb/householddigitalconsumerbehaviour2025/keyfindings/) — HIGH confidence
- [Similarweb — adverts.ie competitors](https://www.similarweb.com/website/adverts.ie/competitors/) — MEDIUM confidence
- [Reforge — beat the cold start problem](https://www.reforge.com/guides/beat-the-cold-start-problem-in-a-marketplace) — MEDIUM confidence

---

*Feature research for: Irish classifieds marketplace (fogr.ai)*
*Researched: 2026-03-11*
