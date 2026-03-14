# Requirements: Fogr.ai (Fógraí)

**Defined:** 2026-03-11
**Core Value:** Anyone in Ireland can post and find classified ads with minimal effort — brief, honest listings without noise

## v1 Requirements

Requirements for launch. Each maps to roadmap phases.

### SEO Foundation

- [x] **SEO-01**: Ad pages use human-readable URL slugs instead of UUIDs (e.g., /ad/trek-domane-road-bike-dublin)
- [x] **SEO-02**: Every page has a unique `<title>` and `<meta description>` tag
- [x] **SEO-03**: Ad pages include JSON-LD structured data (Product schema with price, image, availability)
- [x] **SEO-04**: Category and location pages include JSON-LD structured data (ItemList, BreadcrumbList)
- [x] **SEO-05**: Dynamic sitemap auto-generates from active ads and category/location pages
- [x] **SEO-06**: Ad pages include Open Graph and Twitter Card meta tags for social sharing previews
- [x] **SEO-07**: Programmatic SEO pages exist for category+location combinations (e.g., "second-hand bicycles Dublin")
- [x] **SEO-08**: robots.txt is correctly configured for crawlers
- [x] **SEO-09**: Canonical URLs set on all pages to prevent duplicate content

### Trust & Transparency

- [x] **TRST-01**: Every listing displays "Posted X days ago" timestamp visibly
- [x] **TRST-02**: Location hierarchy includes Northern Ireland counties and localities
- [x] **TRST-03**: All ad browsing and viewing is accessible without login
- [x] **TRST-04**: Platform enforces private-seller-only policy with detection for commercial resellers
- [x] **TRST-05**: Expired ads return a page with "This ad has expired" and similar active listings instead of a 404
- [x] **TRST-06**: Anti-scam safety guidance displayed during ad creation and when viewing ads (meeting tips, payment safety)
- [x] **TRST-07**: Private-seller-only trust messaging displayed prominently throughout the platform (positioning vs Facebook Marketplace)

### Engagement & Retention

- [x] **ENGR-01**: User can save ads to a personal watchlist
- [x] **ENGR-02**: User can view and manage their watchlist
- [x] **ENGR-03**: User can create saved searches with category, location, and keyword filters
- [x] **ENGR-04**: User receives email alerts when new ads match their saved searches
- [x] **ENGR-05**: User can manage and delete their saved searches
- [x] **ENGR-06**: Saved search emails include one-click unsubscribe (GDPR compliant)
- [x] **ENGR-07**: Seller can mark ad as "Sold" with optional final sale price (creates price signal data)

### Email Infrastructure

- [x] **EMAL-01**: Transactional email service integrated (Resend or equivalent)
- [x] **EMAL-02**: User receives email notification when they get a new message
- [x] **EMAL-03**: Seller receives email when their ad is approved by moderation
- [x] **EMAL-04**: Seller receives email when their ad is rejected with reason
- [x] **EMAL-05**: Saved search alert emails delivered on schedule (daily digest or immediate)
- [x] **EMAL-06**: All emails include unsubscribe link and respect user preferences

### Launch Hardening

- [x] **LNCH-01**: Ads from new accounts (first 3 ads or first 7 days) are held in pending state until moderation completes before becoming publicly visible
- [x] **LNCH-02**: Primary category (bicycles) seeded with 30+ real listings before public launch
- [x] **LNCH-03**: Mobile experience audited and any critical issues fixed (65% of Irish users are mobile)
- [x] **LNCH-04**: Production hosting costs reviewed and kept under control — no surprise billing

### Infrastructure & Cost Control

- [x] **INFR-01**: Database backups configured with automated schedule and tested restore procedure
- [x] **INFR-02**: Monitoring/alerting for critical failures (site down, moderation pipeline stuck, R2 storage errors)
- [x] **INFR-03**: Cost guardrails — spending alerts on Supabase, Cloudflare, OpenAI, and email service
- [x] **INFR-04**: Graceful degradation when external services fail (OpenAI down → ads queue, not reject; email down → retry queue)
- [x] **INFR-05**: R2 image storage has redundancy or backup strategy

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Revenue

- **REVN-01**: Seller can pay to bump/boost their listing to top of category (€1-3)
- **REVN-02**: Featured/highlighted listing badge with visual prominence
- **REVN-03**: Stripe Checkout integration for payments

### Trust (Advanced)

- **TRST-08**: Seller trust indicators displayed (account age, listing count, response rate)

### Quality

- **QUAL-01**: AI-assisted listing quality suggestions at posting time (better descriptions, pricing guidance)

### Commercial

- **COMM-01**: Commercial seller accounts with shop tier and separate listing flow
- **COMM-02**: Category-specific paid listings for high-value categories (cars, property)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature                                                | Reason                                                                                              |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Real-time chat / WebSocket messaging                   | Complex infra, high cost, async messaging sufficient for classifieds                                |
| Native mobile app (iOS/Android)                        | Web-first, mobile-responsive covers 65% mobile users; app store overhead too high for solo operator |
| Escrow / payment processing between buyers and sellers | PSD2/AML compliance burden; link to PayPal Goods & Services instead                                 |
| Vehicle history check integration                      | Requires commercial API agreements; link out to Cartell/HPI                                         |
| User ratings / feedback system                         | Highly gameable, requires moderation of the ratings themselves; defer to v2+                        |
| Display advertising (AdSense)                          | Contradicts "clean, no-clutter" brand; last resort only                                             |
| Forum / community features                             | Mission creep; boards.ie already exists                                                             |
| Open API / external integrations                       | Complexity and spam vector; not needed for v1                                                       |
| Profile photo / identity upload for trust              | GDPR implications; false security (easily faked)                                                    |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase                          | Status    |
| ----------- | ------------------------------ | --------- |
| SEO-01      | Phase 1, Phase 7 (gap closure) | Satisfied |
| SEO-02      | Phase 2                        | Satisfied |
| SEO-03      | Phase 2                        | Satisfied |
| SEO-04      | Phase 2                        | Satisfied |
| SEO-05      | Phase 2                        | Satisfied |
| SEO-06      | Phase 2                        | Satisfied |
| SEO-07      | Phase 2                        | Satisfied |
| SEO-08      | Phase 2                        | Satisfied |
| SEO-09      | Phase 2                        | Satisfied |
| TRST-01     | Phase 4                        | Satisfied |
| TRST-02     | Phase 4                        | Satisfied |
| TRST-03     | Phase 2                        | Satisfied |
| TRST-04     | Phase 5                        | Satisfied |
| TRST-05     | Phase 2                        | Satisfied |
| TRST-06     | Phase 5                        | Satisfied |
| TRST-07     | Phase 5                        | Satisfied |
| ENGR-01     | Phase 4                        | Satisfied |
| ENGR-02     | Phase 4                        | Satisfied |
| ENGR-03     | Phase 4                        | Satisfied |
| ENGR-04     | Phase 4                        | Satisfied |
| ENGR-05     | Phase 4                        | Satisfied |
| ENGR-06     | Phase 4                        | Satisfied |
| ENGR-07     | Phase 4                        | Satisfied |
| EMAL-01     | Phase 3                        | Satisfied |
| EMAL-02     | Phase 3                        | Satisfied |
| EMAL-03     | Phase 3                        | Satisfied |
| EMAL-04     | Phase 3                        | Satisfied |
| EMAL-05     | Phase 3                        | Satisfied |
| EMAL-06     | Phase 3                        | Satisfied |
| LNCH-01     | Phase 5                        | Satisfied |
| LNCH-02     | Phase 5                        | Satisfied |
| LNCH-03     | Phase 5                        | Satisfied |
| LNCH-04     | Phase 5                        | Satisfied |
| INFR-01     | Phase 6                        | Satisfied |
| INFR-02     | Phase 6                        | Satisfied |
| INFR-03     | Phase 6                        | Satisfied |
| INFR-04     | Phase 6                        | Satisfied |
| INFR-05     | Phase 6                        | Satisfied |

**Coverage:**

- v1 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0

---

_Requirements defined: 2026-03-11_
_Last updated: 2026-03-14 — all 38 v1 requirements verified and marked satisfied_
