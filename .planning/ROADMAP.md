# Roadmap: Fogr.ai (Fógraí)

## Overview

Fogr.ai is a near-MVP Irish classifieds platform with core functionality already working. This roadmap takes it from brownfield MVP to a publicly launched, organically growing platform. The dependency chain is strict: human-readable ad slugs must land first (everything else in SEO is worthless on UUID URLs), email must land before engagement loops, and the platform must have real content and operational hardening before any public launch announcement or Google Search Console submission.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Slug Migration** - Migrate ad URLs from UUIDs to human-readable slugs — load-bearing prerequisite for all SEO work
- [x] **Phase 2: SEO Foundation** - Ship per-page meta tags, JSON-LD structured data, sitemap, robots.txt, canonical URLs, Open Graph tags, programmatic pages, and expired ad handling
- [x] **Phase 3: Email Infrastructure** - Integrate Resend transactional email with templates for all lifecycle events
- [x] **Phase 4: Engagement and Retention** - Watchlist, saved searches, email alerts, Northern Ireland location support, and posted timestamps
- [x] **Phase 5: Launch Hardening** - New-account moderation hold queue, mobile audit, commercial reseller detection, and content seeding
- [ ] **Phase 6: Infrastructure and Cost Control** - Backups, monitoring, spending alerts, graceful degradation, and R2 redundancy

## Phase Details

### Phase 1: Slug Migration

**Goal**: Ad pages use human-readable URLs so that all downstream SEO work has value from the moment it ships.

**Depends on**: Nothing (first phase)

**Requirements**: SEO-01

**Success Criteria** (what must be TRUE):

1. Visiting `/ad/trek-domane-road-bike-dublin-a1b2c3` opens the correct ad — the URL contains the ad title and a short ID suffix, not a UUID
2. Visiting an old UUID URL (`/ad/550e8400-e29b-41d4-...`) redirects with HTTP 301 to the new slug URL
3. New ads posted after the migration automatically get a slug assigned at insert time — no manual step required
4. Slug collisions are handled automatically (two ads with identical titles generate distinct slugs)
5. No existing ad link that was previously shared becomes a permanent 404 — all resolve via redirect

**Plans:** 2 plans

Plans:

- [x] 01-01-PLAN.md — DB migration, slug generation function with tests, backfill script, wire into POST handler
- [x] 01-02-PLAN.md — Route migration (UUID/canonical redirects), update all ad link references across codebase

---

### Phase 2: SEO Foundation

**Goal**: Every public page is discoverable, correctly indexed, and rich-snippet-eligible before any public launch announcement.

**Depends on**: Phase 1 (slugs must exist before meta tags and sitemaps reference them)

**Requirements**: SEO-02, SEO-03, SEO-04, SEO-05, SEO-06, SEO-07, SEO-08, SEO-09, TRST-03, TRST-05

**Success Criteria** (what must be TRUE):

1. Every ad page has a unique `<title>`, `<meta description>`, and `<link rel="canonical">` that reflect the listing content
2. Google's Rich Results Test validates Product schema on an ad page and ItemList/BreadcrumbList on a category page
3. `/sitemap.xml` is accessible, contains only active approved listings with valid slugs, and updates dynamically as ads are posted or expire
4. `/robots.txt` references the sitemap URL and correctly blocks crawling of private/admin routes
5. Open Graph preview renders correctly when an ad URL is pasted into WhatsApp or Twitter (shows title, description, image)
6. Programmatic pages exist for category+location combinations (e.g., `/bicycles/dublin`) and only appear in the sitemap when they have at least 3 active listings
7. An expired ad page returns HTTP 200 with a "This ad has expired" message and similar active listings rather than a 404; it carries a `noindex` directive
8. All ad browsing and viewing pages load without requiring a login — anonymous crawlers can access all public content

**Plans:** 6 plans

Plans:

- [x] 02-01-PLAN.md — SEO utility modules (meta, jsonld, og) + meta tags, OG, JSON-LD, canonical on ad/category/home pages
- [x] 02-02-PLAN.md — Param matchers + programmatic SEO pages (category-only, county-only, category+county)
- [x] 02-03-PLAN.md — Dynamic sitemap.xml + robots.txt endpoints
- [x] 02-04-PLAN.md — Expired ad handling (public access, similar listings, 410 at 90 days)
- [x] 02-05-PLAN.md — Programmatic page JSON-LD (ItemList, BreadcrumbList) + public browsing audit
- [x] 02-06-PLAN.md — Gap closure: add missing og:image and twitter:image to county programmatic pages

---

### Phase 3: Email Infrastructure

**Goal**: The platform can send reliable, GDPR-compliant transactional email for every lifecycle event that affects a user.

**Depends on**: Phase 1 (emails link to ad pages — slugs must be stable)

**Requirements**: EMAL-01, EMAL-02, EMAL-03, EMAL-04, EMAL-05, EMAL-06

**Success Criteria** (what must be TRUE):

1. A seller who posts an ad receives an email when it is approved by moderation, with a link to the live ad page using its slug URL
2. A seller who posts an ad receives an email when it is rejected by moderation, including the stated rejection reason
3. A user who receives a message receives an email notification within the cron cycle — the email does not reveal the sender's identity
4. Saved search alert emails are delivered on a schedule (daily digest or configurable) — this is the foundation for Phase 4 alerts
5. Every email contains a working one-click unsubscribe link; clicking it immediately suppresses that email type without requiring login
6. Sending an email does not block the ad posting flow — failures queue for retry and do not surface as user-facing errors

**Plans:** 4 plans

Plans:

- [x] 03-01-PLAN.md — DB migrations (email_preferences, saved_searches) + email core utilities (send, templates, unsubscribe tokens, preferences)
- [x] 03-02-PLAN.md — Unsubscribe flow (RFC 8058 API endpoint + browser confirmation page with re-subscribe)
- [x] 03-03-PLAN.md — Wire email sending into cron worker (approve/reject) + messages API (new message notification)
- [x] 03-04-PLAN.md — Saved search daily digest cron dispatch (08:00 UTC, top 3 listings, preference-aware)

---

### Phase 4: Engagement and Retention

**Goal**: Buyers have reasons to return to the platform without any marketing spend — saved searches pull them back; the watchlist and trust signals keep them engaged.

**Depends on**: Phase 3 (saved search alerts require a working email pipeline)

**Requirements**: ENGR-01, ENGR-02, ENGR-03, ENGR-04, ENGR-05, ENGR-06, ENGR-07, TRST-01, TRST-02

**Success Criteria** (what must be TRUE):

1. A logged-in user can tap a "Save" button on any ad and find it later in their watchlist page
2. A logged-in user can create a saved search with category, location, and keyword filters, and manage or delete it from their profile
3. When a new ad matches a user's saved search, the user receives an email alert — the email includes one-click unsubscribe and is GDPR-opt-in
4. Every listing shows "Posted X days ago" visibly — no timestamps are hidden or approximate only for buyers
5. The location picker includes Northern Ireland counties and localities — ads can be posted to and filtered by NI locations
6. A seller can mark their ad as "Sold" with an optional final sale price — sold ads display a "Sold" badge and create price signal data

**Plans:** 6 plans

Plans:

- [x] 04-01-PLAN.md — DB migrations (watchlist table, sale_price column) + shared utilities (relative-time, NI currency mapping, type updates)
- [x] 04-02-PLAN.md — Timestamps and sold badges on AdCard/AdCardWide + 7-day sold visibility window in browse queries
- [x] 04-03-PLAN.md — Watchlist feature: save/unsave API, ad page save button, watchlist page with AdCard grid, navbar link
- [x] 04-04-PLAN.md — Saved search creation UI + management page: "Save this search" on browse pages, CRUD API, management under account area
- [x] 04-05-PLAN.md — Mark as Sold with sale price prompt + GBP currency selector on post form with NI county detection
- [x] 04-06-PLAN.md — Fix cron worker saved search JSONB matching for email alerts (critical bug: county/locality queries wrong columns)

---

### Phase 5: Launch Hardening

**Goal**: The platform is safe to expose to the public internet — no spam can flood through the moderation gap, real inventory exists to greet first visitors, and the mobile experience works for the 65% of Irish users on phone.

**Depends on**: Phase 4 (launch gate requires full feature set to be testable end-to-end)

**Requirements**: TRST-04, TRST-06, TRST-07, LNCH-01, LNCH-02, LNCH-03, LNCH-04

**Success Criteria** (what must be TRUE):

1. An ad posted by a new account (fewer than 3 approved ads or younger than 7 days) is held in a pending state that is not publicly visible and carries `noindex` — it does not appear in search results or browse pages until moderation clears it
2. The bicycles category has at least 30 real, non-spam listings active and publicly visible before the sitemap is submitted to Google Search Console
3. A critical path user journey (post ad, browse, view, contact seller) tested on a real mobile device shows no blocking UX issues — layout does not break on 375px width
4. Commercial reseller patterns (bulk posting, price lists, dealer language) are detected and flagged for moderation review — the platform enforces private-seller-only policy
5. Production hosting cost for the current load is reviewed and confirmed within the budget ceiling — no services are on a default trial tier that will auto-escalate
6. Anti-scam safety guidance is displayed during ad creation and when viewing ads — meeting tips, payment safety, common scam warnings
7. Private-seller-only trust messaging is displayed prominently across the platform — positioning fogr.ai as the honest alternative

**Plans:** 6 plans

Plans:

- [x] 05-01-PLAN.md — Backend hardening: new-account noindex enforcement, reseller detection heuristics, private-seller validation in POST handler
- [x] 05-02-PLAN.md — Safety and trust UI: safety tips module, /safety page, accordion on ad view, safety checklist + private-seller elements in post form
- [x] 05-03-PLAN.md — Trust content pages: homepage hero copy, about page rewrite with brand story, footer trust messaging + safety link
- [x] 05-04-PLAN.md — Content seeding: seed script with ~192 locally-flavoured bicycle listings across all 32 counties
- [x] 05-05-PLAN.md — Mobile audit at 375px viewport + production cost review checkpoint
- [x] 05-06-PLAN.md — Gap closure: wire isNewAccount() into POST handler for new-account pending hold (LNCH-01)

---

### Phase 6: Infrastructure and Cost Control

**Goal**: The platform can run unattended — failures are visible before users notice them, costs do not surprise, and data is recoverable if something goes wrong.

**Depends on**: Phase 5 (infrastructure hardening finalizes the platform for ongoing operation post-launch)

**Requirements**: INFR-01, INFR-02, INFR-03, INFR-04, INFR-05

**Success Criteria** (what must be TRUE):

1. Automated database backups run on a schedule and a restore from backup has been verified to produce a working database
2. A site-down event or stuck moderation cron generates an alert to the operator within 5 minutes — the operator does not discover failures from user complaints
3. Spending on Supabase, Cloudflare, OpenAI, and the email service each have alerts configured at a threshold below their hard limits — no bill arrives as a surprise
4. If OpenAI is unreachable, ads queue for later moderation rather than being rejected — the platform degrades gracefully rather than blocking posting
5. R2 image storage has a documented backup or redundancy strategy — a single storage failure does not permanently destroy user-uploaded images

**Plans**: TBD

Plans:

- [ ] 06-01: Database backups — configure Supabase automated backups (requires Pro tier), document and test restore procedure
- [ ] 06-02: Monitoring and alerting — configure uptime monitoring for critical endpoints, alert on cron worker failures and R2 errors
- [ ] 06-03: Cost guardrails — set spending alerts on all external services at 75% of intended monthly ceiling
- [ ] 06-04: Graceful degradation — OpenAI unavailable path queues ads; email unavailable path retries; surface no hard failures to posting users
- [ ] 06-05: R2 redundancy — evaluate and implement backup strategy for image storage (cross-bucket copy, periodic export, or equivalent)

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase                              | Plans Complete | Status                          | Completed  |
| ---------------------------------- | -------------- | ------------------------------- | ---------- |
| 1. Slug Migration                  | 2/2            | Complete (pending verification) | 2026-03-11 |
| 2. SEO Foundation                  | 6/6            | Complete                        | 2026-03-12 |
| 3. Email Infrastructure            | 4/4            | Complete                        | 2026-03-13 |
| 4. Engagement and Retention        | 6/6            | Complete                        | 2026-03-13 |
| 5. Launch Hardening                | 6/6            | Complete                        | 2026-03-14 |
| 6. Infrastructure and Cost Control | 0/5            | Not started                     | -          |

---

_Roadmap created: 2026-03-11_
_Last updated: 2026-03-14 -- Phase 5 complete (LNCH-01 gap closure executed: isNewAccount() wired into POST handler)_
