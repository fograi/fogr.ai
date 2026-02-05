# Plan

- [x] Improve report intake UX (receipt, status link, copy ID, hints)
- [x] Add reporter status page and API
- [x] Expand statement of reasons and decision source
- [x] Add appeal flow and admin review
- [x] Add admin guardrail for personal data in statements

## Context (Current State)

- Stack: SvelteKit on Cloudflare Workers, Supabase (auth + DB), R2 for images, KV for rate limiting.
- Key public routes:
  - Ad detail: `/ad/{id}` (shows moderation decision only to owner when signed in).
  - Report status: `/report-status` (reporter checks by report ID + email).
- Admin routes (email allowlist required):
  - `/admin/reports` (review reports, take actions, write statement of reasons).
  - `/admin/appeals` (review appeals).
- Core API endpoints:
  - Report intake: `POST /api/ads/{id}/report`
  - Report status: `POST /api/reports/status`
  - Appeal: `POST /api/ads/{id}/appeal`
  - Ad detail API: `GET /api/ads/{id}` (includes moderation for owner).
- Required env vars (Cloudflare):
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (required for admin/report/appeal flows)
  - `ADMIN_EMAIL` or `ADMIN_EMAILS` (admin allowlist)
  - `RATE_LIMIT` (KV binding) for rate limit checks
- DB migrations added:
  - `20260205_000005_ad_reports.sql`
  - `20260205_000006_ad_moderation_actions.sql`
  - `20260205_000007_ad_moderation_appeals.sql`

## UX Overhaul Plan (Proposed)

- [x] Define the primary jobs and success metrics for browse, post, and report flows
- [x] Simplify navigation and information architecture around one primary action per screen
- [x] Redesign home and browse with a focused search-first layout and minimal filters
- [x] Convert posting into a short step-by-step wizard with progressive disclosure
- [x] Redesign ad detail with a single primary action rail and collapsible secondary info
- [x] Overhaul copy and error messaging for clarity and consistency
- [x] Update shared UI tokens (typography, spacing, buttons) for simpler hierarchy

## Chat Context (Market Research Summary)

- Main incumbent pain points in Ireland cited by users: scams/deposit fraud, dealers posing as private sellers, misleading listings, lowballing/time-wasters, weak reputation signals, fake prices (e.g., €1/€1234), app reliability complaints, intrusive ads, and perceived pricing gouging.
- Product implications discussed: win on trust, reduce seller time-wasters, enforce honest filters, protect privacy by default, and add scam warnings.
- Evidence is anecdotal (forums/Reddit); validate with user interviews and in-product metrics before heavy investments.
- Selected P0-ish items to pursue first: structured messaging + offer controls, honest pricing rules, listing quality gates, privacy-first messaging, scam pattern warnings.

## P0-ish Tasks (High Signal, Low Ops)

### Recommended Build Sequence (Dependencies First)

1. P0.1 Honest Pricing Rules (new price states + filter/UI + API validation).
2. P0.2 Listing Quality Gates (required fields + photo minimums).
3. P0.3 Structured Messaging (message composer + minimal thread + offer controls).
4. P0.4 Privacy-First Messaging (switch CTA and gate phone reveal).
5. P0.5 Scam Warnings (hook into message send + UI banner).

### P0.1 Honest Pricing Rules (Free/POA)

- Rules/config: `src/lib/constants.ts` (price states per category).
- Post flow UI: `src/lib/components/post/PostFields.svelte`, `src/routes/(app)/post/+page.svelte`.
- Server validation: `src/lib/server/ads-validation.ts`, `src/routes/api/ads/+server.ts`.
- Search/filter UI + query: `src/routes/+page.svelte`, `src/routes/+page.server.ts`, `src/routes/api/ads/+server.ts` (filters).
- Listing display: `src/lib/components/AdCard.svelte`, `src/lib/components/AdCardWide.svelte`.
- Types + fixtures: `src/types/ad-types.d.ts`, `src/lib/supabase.types.ts`, `src/data/mock-ads.ts`, `src/lib/server/e2e-mocks.ts`.

- [x] Define category rules for real price vs Free/POA (config or constants).
- [x] Update listing form validation for price rules and Free/POA states.
- [x] Update search/filter UI to include Free/POA as explicit filter states.
- [x] Enforce server-side validation for price rules.
- [x] Update listing detail UI to display Free/POA clearly.
- [x] Add or update unit and e2e tests for price validation and filters.

### P0.2 Listing Quality Gates

- Required fields + photo minimums config: `src/lib/constants.ts`.
- Post flow UI enforcement: `src/lib/components/post/PostFields.svelte`, `src/lib/components/post/ImageDrop.svelte`, `src/routes/(app)/post/+page.svelte`.
- Server enforcement: `src/lib/server/ads-validation.ts`, `src/routes/api/ads/+server.ts`.
- Types + fixtures: `src/types/ad-types.d.ts`, `src/lib/supabase.types.ts`, `src/data/mock-ads.ts`.

- [x] Define required fields per category and minimum photo counts.
- [x] Update post wizard to enforce required fields and photo minimums.
- [x] Add lightweight client checks with clear error copy.
- [x] Enforce server-side validation to block publish without required fields.
- [x] Add or update tests for required fields and photo minimums.

### P0.3 Structured First Message + Offer Controls

- UI entry point: `src/routes/(public)/ad/[slug]/+page.svelte` (replace/augment contact CTA with in-app message composer).
- New UI components (suggested): `src/lib/components/messages/MessageComposer.svelte`, `src/lib/components/messages/OfferControls.svelte`, `src/lib/components/messages/Thread.svelte`.
- Seller controls surface (owner view): `src/routes/(public)/ad/[slug]/+page.svelte` (owner-only panel) or a new `src/routes/(app)/ads/+page.svelte` for listing management.
- API endpoints (suggested): `src/routes/api/messages/+server.ts`, `src/routes/api/messages/[threadId]/+server.ts`, `src/routes/api/offers/+server.ts`.
- Server validation: `src/lib/server/message-validation.ts` (new), `src/lib/server/ads-validation.ts` (offer rules).
- DB/schema: new migrations for `conversations`, `messages`, `ad_offer_rules` (min_offer, firm_price), and optional `offer_events`.
- Types: update `src/types/ad-types.d.ts` and `src/lib/supabase.types.ts`.

- [x] Define structured message templates and required fields (availability, offer amount, timing, pickup/shipping).
- [x] Update message composer UI to enforce structure and capture metadata.
- [x] Add seller controls: minimum offer, firm price flag, auto-decline message.
- [x] Validate offers server-side against floor/firm rules with clear errors.
- [x] Track metrics: lowball rate, time-to-first-serious-inquiry, offer acceptance rate.
- [x] Add or update unit and e2e tests for message flow and offer validation.

### P0.4 Privacy-First Messaging

- Contact CTA update: `src/lib/components/AdCardWide.svelte`, `src/routes/(public)/ad/[slug]/+page.svelte`.
- Reveal gating UI (if supported): same as above + new messaging components from P0.1.
- API endpoint (suggested): `src/routes/api/ads/[id]/reveal/+server.ts` or add to messages API.
- DB/schema: add `contact_preference` / `phone_reveal_state` fields on ads or users; update `src/lib/supabase.types.ts`.

- [x] Default to in-app messaging; remove phone reveal from initial contact flow.
- [ ] Add optional phone reveal gating (opt-in toggle or after defined actions).
- [x] Update listing/contact UI copy to set expectations.
- [ ] Enforce server-side rules around phone reveal.
- [ ] Add or update tests for contact flow and reveal gating.

### P0.5 Scam Pattern Warnings

- Detection rules: `src/lib/server/scam-patterns.ts` (new).
- Trigger on send: `src/routes/api/messages/+server.ts` (or message create handler).
- UI warning banner: `src/lib/components/messages/Thread.svelte` or message composer.
- Logging/flags: new DB table for `message_flags` (optional).

- [x] Define initial keyword/heuristic patterns (WhatsApp, courier, deposit pressure, PayPal friends and family).
- [x] Implement in-chat warning banner with report CTA for suspicious messages.
- [x] Add server-side logging/flagging to refine rules.
- [x] Add or update tests for warning triggers.

## Workflow Notes

- Add or edit unit and e2e tests as needed for each task.
- Run the relevant tests after each step to catch and prevent regressions.
- Keep changes incremental and measurable (track the core metrics above).

## Tests To Add/Update (Per Step)

- Unit: validation helpers (price rules, required fields, offer rules, scam patterns).
- E2E: posting flow with required fields, price state selection, and blocked submits.
- E2E: message send with structured template and offer auto-decline.
- E2E: contact CTA -> in-app message flow, no phone/email exposed by default.

## UX Overhaul: Jobs and Metrics

- Browse job: find relevant listings fast and evaluate trust; success = time-to-first-relevant-click, search success rate, ad detail dwell time.
- Post job: publish an ad with minimal friction and clear limits; success = post completion rate, time-to-publish, validation error rate.
- Contact job: reach the seller without confusion; success = contact CTA click-through rate, share rate.
- Report job: submit a clear, compliant report quickly; success = report completion rate, median time to submit, report rejection rate (invalid).
- Moderation job (admin): process reports quickly with consistent decisions; success = time-to-decision, decision reversal/appeal rate.
