# Fogr.ai (Fógraí)

## What This Is

A fully automated classifieds platform for the island of Ireland — the honest alternative to adverts.ie and donedeal.ie. Short, scannable listings without noise. AI moderation runs the platform with minimal human intervention. Private sellers only — no dealers, no middlemen.

## Core Value

Anyone in Ireland can post and find classified ads with minimal effort — brief, honest listings without noise.

## Requirements

### Validated

- ✓ User accounts via Supabase Auth (OAuth callback, sessions) — existing
- ✓ Ad posting with title, description, price, images — existing
- ✓ Category-specific forms with prefilled options (bicycles and others) — existing
- ✓ Location hierarchy (Country → Province → County → Locality) including NI — v1.0
- ✓ Image upload to Cloudflare R2 with client-side resizing — existing
- ✓ Three-layer content moderation (client profanity filter, server validation, OpenAI moderation via cron) — existing
- ✓ Browse and search ads on home page — existing
- ✓ Category browsing pages — existing
- ✓ Public ad view pages with human-readable slugs — v1.0
- ✓ Anonymized messaging between buyer and seller — existing
- ✓ User can manage their own ads (edit, view, mark sold) — v1.0
- ✓ Report system for flagging ads — existing
- ✓ Admin panel for reports and appeals — existing
- ✓ Rate limiting via Cloudflare KV — existing
- ✓ CSRF protection — existing
- ✓ Automated cron worker (moderation, ad expiry, metrics rollup, email alerts) — v1.0
- ✓ Terms of service and privacy policy pages — existing
- ✓ SEO foundation (meta tags, JSON-LD, sitemap, OG tags, programmatic pages) — v1.0
- ✓ Transactional email (approval, rejection, messages, saved search alerts) — v1.0
- ✓ GDPR-compliant unsubscribe with email preferences — v1.0
- ✓ Watchlist and saved searches — v1.0
- ✓ New-account moderation hold and reseller detection — v1.0
- ✓ Anti-scam safety guidance and private-seller trust messaging — v1.0
- ✓ Health endpoint with DB/cron/R2 monitoring — v1.0
- ✓ Ops documentation (backups, monitoring, cost control, graceful degradation) — v1.0
- ✓ Content seeding (192 bicycle listings across 32 counties) — v1.0

### Active

- [ ] Rethink product direction — niche-first vs broad launch, differentiation strategy
- [ ] Research pain points with adverts.ie/donedeal.ie (boards.ie, reddit)
- [ ] Define revenue model
- [ ] Solve cold start problem (seeding content beyond bicycles)
- [ ] Submit sitemap to Google Search Console
- [ ] Upgrade to Supabase Pro ($25/mo) before public launch
- [ ] Regenerate Supabase types after confirming schema is stable

### Out of Scope

- Active personal marketing/promotion — user is shy, platform must grow organically or through automation
- Mobile native app — web-first, responsive design covers mobile users
- Real-time chat — existing async messaging sufficient
- Escrow/payment processing — PSD2/AML compliance burden too high
- User ratings/feedback system — gameable, requires moderation of ratings themselves
- Display advertising — contradicts clean brand
- Open API — complexity and spam vector

## Context

- **Domain:** fogr.ai (owned). Fógraí is Irish for ads/notices/announcements.
- **Codebase:** Shipped v1.0 with 39,112 LOC TypeScript/Svelte across 118 source files.
- **Stack:** SvelteKit 2 + Svelte 5, Supabase (Postgres + Auth), Cloudflare (Workers, R2, KV), OpenAI moderation, Resend email, TypeScript throughout.
- **Hosting:** Cloudflare Workers + Supabase Pro — ~$38-43/month operational cost.
- **Operator:** Solo developer, no marketing skills, shy. Needs maximum automation. Building for supplementary income.
- **Inspiration:** Newspaper classifieds — brief, scannable, equal treatment of listings.
- **Competition:** adverts.ie, donedeal.ie — established Irish classifieds with significant traffic.
- **Launch status:** Platform feature-complete. Pre-launch checklist: Supabase Pro upgrade, run seed script, UptimeRobot setup, Google Search Console submission.

## Constraints

- **Operator:** Solo, non-technical marketing — growth strategy must be automatable (SEO, programmatic content)
- **Budget:** ~$38-43/month operating cost confirmed; no large ad spend
- **Hosting:** Cloudflare Workers — committed, near-zero compute cost
- **Database:** Supabase PostgreSQL — committed with 7 migrations
- **Moderation:** OpenAI API dependency — $1-5/month at current scale, hard limit $10/month
- **Domain:** .ai TLD costs ~$150/year, renews July 2026

## Key Decisions

| Decision                                            | Rationale                                                      | Outcome                   |
| --------------------------------------------------- | -------------------------------------------------------------- | ------------------------- |
| SvelteKit + Cloudflare Workers                      | Low cost, good performance, already built                      | ✓ Good                    |
| Supabase for auth + database                        | Managed Postgres, built-in auth, free tier                     | ✓ Good                    |
| OpenAI for content moderation                       | Free moderation API, handles text + images                     | ✓ Good                    |
| Three-layer moderation (client → server → cron)     | Defense in depth, fail-open client, strict server              | ✓ Good                    |
| Anonymized messaging (mythologise)                  | Privacy-first, reduces harassment                              | ✓ Good                    |
| Start with bicycles category                        | Narrow focus for launch, 192 seed listings                     | ✓ Good                    |
| Slug migration as Phase 1                           | UUID URLs make all SEO worthless; load-bearing prerequisite    | ✓ Good                    |
| Revenue deferred to v2                              | Premature monetization risks platform before organic inventory | ✓ Good                    |
| Resend via raw fetch (no SDK)                       | Matches cron worker REST pattern, zero new dependencies        | ✓ Good                    |
| Flat URL structure (/bikes, /dublin, /bikes/dublin) | Clean URLs, SvelteKit param matchers handle routing            | ✓ Good                    |
| Hand-rolled sitemap (no super-sitemap)              | directory-tree dep incompatible with Cloudflare Workers        | ✓ Good                    |
| Private-seller-only positioning                     | Differentiator vs adverts.ie/donedeal.ie dealer clutter        | ✓ Good                    |
| R2 risk acceptance (no backup)                      | 11-nines durability sufficient for v1 scale                    | — Pending review at scale |
| Revenue model                                       | Not yet decided — needs research                               | — Pending                 |
| Niche vs broad launch                               | Not yet decided — needs research                               | — Pending                 |

---

_Last updated: 2026-03-14 after v1.0 milestone_
