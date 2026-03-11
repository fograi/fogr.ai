# Fogr.ai (Fógraí)

## What This Is

A fully automated classifieds ads platform for the island of Ireland, inspired by the brevity and simplicity of traditional newspaper classifieds. fogr.ai aims to be a cleaner, simpler alternative to adverts.ie and donedeal.ie — short scannable listings, no clutter, no upsells. AI handles moderation and listing quality so the platform can run with minimal human intervention.

## Core Value

Anyone in Ireland can post and find classified ads with minimal effort — brief, honest listings without noise.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. Inferred from existing codebase. -->

- ✓ User accounts via Supabase Auth (OAuth callback, sessions) — existing
- ✓ Ad posting with title, description, price, images — existing
- ✓ Category-specific forms with prefilled options (bicycles and others) — existing
- ✓ Location hierarchy (Country → Province → County → Locality) — existing
- ✓ Image upload to Cloudflare R2 with client-side resizing — existing
- ✓ Three-layer content moderation (client profanity filter, server validation, OpenAI moderation via cron) — existing
- ✓ Browse and search ads on home page — existing
- ✓ Category browsing pages — existing
- ✓ Public ad view pages with slugs — existing
- ✓ Anonymized messaging between buyer and seller — existing
- ✓ User can manage their own ads (edit, view) — existing
- ✓ Report system for flagging ads — existing
- ✓ Admin panel for reports and appeals — existing
- ✓ Rate limiting via Cloudflare KV — existing
- ✓ CSRF protection — existing
- ✓ Automated cron worker (moderation, ad expiry, metrics rollup) — existing
- ✓ Terms of service and privacy policy pages — existing

### Active

<!-- Current scope. What we're building toward. -->

- [ ] Rethink product direction — niche-first vs broad launch, differentiation strategy
- [ ] Research pain points with adverts.ie/donedeal.ie (boards.ie, reddit)
- [ ] Define revenue model
- [ ] Solve cold start problem (seeding content without active self-promotion)
- [ ] Polish existing features for launch readiness
- [ ] SEO optimization (structured data, programmatic pages) for organic traffic
- [ ] Launch live with seeded content

### Out of Scope

<!-- Explicit boundaries. -->

- Active personal marketing/promotion — user is shy, platform must grow organically or through automation
- Mobile native app — web-first
- Real-time chat — existing async messaging sufficient for v1

## Context

- **Domain:** fogr.ai (owned). Fógraí is Irish for ads/notices/announcements.
- **Codebase maturity:** Near-MVP. Multiple categories, full moderation pipeline, user accounts, messaging, admin — all functional.
- **Stack:** SvelteKit 2 + Svelte 5, Supabase (Postgres + Auth), Cloudflare (Workers, R2, KV), OpenAI moderation, TypeScript throughout.
- **Hosting:** Cloudflare free/low tier — minimal operational cost.
- **Operator:** Solo developer, no marketing skills, shy. Needs maximum automation and guidance. Building this for supplementary income.
- **Inspiration:** Newspaper classifieds — brief, scannable, equal treatment of listings.
- **Competition:** adverts.ie, donedeal.ie — established Irish classifieds with significant traffic but known user frustrations (to be researched).
- **Strategic uncertainty:** Whether to compete head-on, carve a niche, start with one category, or aggregate. Research needed to inform direction.

## Constraints

- **Operator:** Solo, non-technical marketing — growth strategy must be automatable (SEO, programmatic content)
- **Budget:** Modest — willing to invest if ROI is justifiable, but no large ad spend
- **Hosting:** Cloudflare Workers — already committed, keeps costs near-zero
- **Database:** Supabase PostgreSQL — already committed with migrations
- **Moderation:** OpenAI API dependency — ongoing cost per moderated ad

## Key Decisions

<!-- Decisions that constrain future work. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| SvelteKit + Cloudflare Workers | Low cost, good performance, already built | ✓ Good |
| Supabase for auth + database | Managed Postgres, built-in auth, free tier | ✓ Good |
| OpenAI for content moderation | Free moderation API, handles text + images | ✓ Good |
| Three-layer moderation (client → server → cron) | Defense in depth, fail-open client, strict server | ✓ Good |
| Anonymized messaging (mythologise) | Privacy-first, reduces harassment | ✓ Good |
| Start with bicycles category | ChatGPT recommendation — narrow focus for launch | — Pending |
| Revenue model | Not yet decided — needs research | — Pending |
| Niche vs broad launch | Not yet decided — needs research | — Pending |

---
*Last updated: 2026-03-11 after initialization*
