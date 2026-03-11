# Requirements: Fogr.ai (Fógraí)

**Defined:** 2026-03-11
**Core Value:** Anyone in Ireland can post and find classified ads with minimal effort — brief, honest listings without noise

## v1 Requirements

Requirements for launch. Each maps to roadmap phases.

### SEO Foundation

- [ ] **SEO-01**: Ad pages use human-readable URL slugs instead of UUIDs (e.g., /ad/trek-domane-road-bike-dublin)
- [ ] **SEO-02**: Every page has a unique `<title>` and `<meta description>` tag
- [ ] **SEO-03**: Ad pages include JSON-LD structured data (Product schema with price, image, availability)
- [ ] **SEO-04**: Category and location pages include JSON-LD structured data (ItemList, BreadcrumbList)
- [ ] **SEO-05**: Dynamic sitemap auto-generates from active ads and category/location pages
- [ ] **SEO-06**: Ad pages include Open Graph and Twitter Card meta tags for social sharing previews
- [ ] **SEO-07**: Programmatic SEO pages exist for category+location combinations (e.g., "second-hand bicycles Dublin")
- [ ] **SEO-08**: robots.txt is correctly configured for crawlers
- [ ] **SEO-09**: Canonical URLs set on all pages to prevent duplicate content

### Trust & Transparency

- [ ] **TRST-01**: Every listing displays "Posted X days ago" timestamp visibly
- [ ] **TRST-02**: Location hierarchy includes Northern Ireland counties and localities
- [ ] **TRST-03**: All ad browsing and viewing is accessible without login
- [ ] **TRST-04**: Platform enforces private-seller-only policy with detection for commercial resellers
- [ ] **TRST-05**: Expired ads return a page with "This ad has expired" and similar active listings instead of a 404

### Engagement & Retention

- [ ] **ENGR-01**: User can save ads to a personal watchlist
- [ ] **ENGR-02**: User can view and manage their watchlist
- [ ] **ENGR-03**: User can create saved searches with category, location, and keyword filters
- [ ] **ENGR-04**: User receives email alerts when new ads match their saved searches
- [ ] **ENGR-05**: User can manage and delete their saved searches
- [ ] **ENGR-06**: Saved search emails include one-click unsubscribe (GDPR compliant)

### Email Infrastructure

- [ ] **EMAL-01**: Transactional email service integrated (Resend or equivalent)
- [ ] **EMAL-02**: User receives email notification when they get a new message
- [ ] **EMAL-03**: Seller receives email when their ad is approved by moderation
- [ ] **EMAL-04**: Seller receives email when their ad is rejected with reason
- [ ] **EMAL-05**: Saved search alert emails delivered on schedule (daily digest or immediate)
- [ ] **EMAL-06**: All emails include unsubscribe link and respect user preferences

### Launch Hardening

- [ ] **LNCH-01**: Ads from new accounts (first 3 ads or first 7 days) are held in pending state until moderation completes before becoming publicly visible
- [ ] **LNCH-02**: Primary category (bicycles) seeded with 30+ real listings before public launch
- [ ] **LNCH-03**: Mobile experience audited and any critical issues fixed (65% of Irish users are mobile)
- [ ] **LNCH-04**: Production hosting costs reviewed and kept under control — no surprise billing

### Infrastructure & Cost Control

- [ ] **INFR-01**: Database backups configured with automated schedule and tested restore procedure
- [ ] **INFR-02**: Monitoring/alerting for critical failures (site down, moderation pipeline stuck, R2 storage errors)
- [ ] **INFR-03**: Cost guardrails — spending alerts on Supabase, Cloudflare, OpenAI, and email service
- [ ] **INFR-04**: Graceful degradation when external services fail (OpenAI down → ads queue, not reject; email down → retry queue)
- [ ] **INFR-05**: R2 image storage has redundancy or backup strategy

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Revenue

- **REVN-01**: Seller can pay to bump/boost their listing to top of category (€1-3)
- **REVN-02**: Featured/highlighted listing badge with visual prominence
- **REVN-03**: Stripe Checkout integration for payments

### Trust (Advanced)

- **TRST-06**: Seller trust indicators displayed (account age, listing count, response rate)
- **TRST-07**: "Mark as sold" status visible on listings as social proof

### Quality

- **QUAL-01**: AI-assisted listing quality suggestions at posting time (better descriptions, pricing guidance)

### Commercial

- **COMM-01**: Commercial seller accounts with shop tier and separate listing flow
- **COMM-02**: Category-specific paid listings for high-value categories (cars, property)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time chat / WebSocket messaging | Complex infra, high cost, async messaging sufficient for classifieds |
| Native mobile app (iOS/Android) | Web-first, mobile-responsive covers 65% mobile users; app store overhead too high for solo operator |
| Escrow / payment processing between buyers and sellers | PSD2/AML compliance burden; link to PayPal Goods & Services instead |
| Vehicle history check integration | Requires commercial API agreements; link out to Cartell/HPI |
| User ratings / feedback system | Highly gameable, requires moderation of the ratings themselves; defer to v2+ |
| Display advertising (AdSense) | Contradicts "clean, no-clutter" brand; last resort only |
| Forum / community features | Mission creep; boards.ie already exists |
| Open API / external integrations | Complexity and spam vector; not needed for v1 |
| Profile photo / identity upload for trust | GDPR implications; false security (easily faked) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEO-01 | — | Pending |
| SEO-02 | — | Pending |
| SEO-03 | — | Pending |
| SEO-04 | — | Pending |
| SEO-05 | — | Pending |
| SEO-06 | — | Pending |
| SEO-07 | — | Pending |
| SEO-08 | — | Pending |
| SEO-09 | — | Pending |
| TRST-01 | — | Pending |
| TRST-02 | — | Pending |
| TRST-03 | — | Pending |
| TRST-04 | — | Pending |
| TRST-05 | — | Pending |
| ENGR-01 | — | Pending |
| ENGR-02 | — | Pending |
| ENGR-03 | — | Pending |
| ENGR-04 | — | Pending |
| ENGR-05 | — | Pending |
| ENGR-06 | — | Pending |
| EMAL-01 | — | Pending |
| EMAL-02 | — | Pending |
| EMAL-03 | — | Pending |
| EMAL-04 | — | Pending |
| EMAL-05 | — | Pending |
| EMAL-06 | — | Pending |
| LNCH-01 | — | Pending |
| LNCH-02 | — | Pending |
| LNCH-03 | — | Pending |
| LNCH-04 | — | Pending |
| INFR-01 | — | Pending |
| INFR-02 | — | Pending |
| INFR-03 | — | Pending |
| INFR-04 | — | Pending |
| INFR-05 | — | Pending |

**Coverage:**
- v1 requirements: 35 total
- Mapped to phases: 0
- Unmapped: 35

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-03-11 after initial definition*
