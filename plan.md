# Plan

## Open Work

### Moderation Ops (Low-Cost)

- [x] Implement moderation workflow states (report received → review → decision → SoR sent → appeal → final) via moderation event logging.
- [x] Add Supabase table `moderation_events` (ad_reports already exists).
- [x] Ensure moderation logging captures `content_id`, `user_id`, `report_id`, `decision`, `legal_basis`, `automated_flag`, `timestamp`.
- [x] Add email templates for takedown, SoR, and appeal outcomes.
- [x] Add manual copy/paste email template UI in admin reports and appeals.
- [x] Add “Take action on ad” workflow to appeals page (restore/reject/expire + SoR templates).
- [x] Group admin reports by ad to consolidate multiple reports per listing.

### Safety + Abuse

- [ ] Add image reuse detection (hashing).

### Ad Card UX Improvements

- [ ] Add “New / Updated” chip (requires `created_at`/`updated_at` in list API).
- [ ] Add “Verified seller” badge once verification exists.

### Payments + Monetization

- [ ] Implement payment system (Stripe or alternative) + checkout flow.
- [ ] Decide paid upsells and pricing (extra images, extra text, extended duration, local pin).
- [ ] Finalize refund/withdrawal flow at checkout (no refunds except required by law).
- [ ] Capture withdrawal waiver + consent at checkout (EEA digital services).
- [ ] Record proof of publication for paid ads for chargeback protection (published_at, audit log, consent timestamp, IP, user agent, terms version, payment IDs).

### Legal + Compliance (EU/UK, DSA)

- [ ] Integrate finalized Terms copy (from external draft) covering hosting/intermediary role, moderation disclosure, age gating, repeat infringer policy, graduated enforcement, UK note, and term-change notice.
- [ ] Integrate finalized Privacy copy (from external draft) including cookie classification, OpenAI processor/sub-processor clarity, and a retention table.
- [ ] Add DSA single point of contact for authorities and users (e.g., `dsa@fogr.ai`) and publish on a dedicated DSA page.
- [ ] Create “Report Illegal Content (DSA)” page and submission form with required fields (URL, reason, contact) and timelines/appeal info.
- [ ] Create “Why your ad was removed” page with Statement of Reasons templates and appeal instructions.
- [ ] Implement DSA statement-of-reasons logging with fields: `legal_basis`, `content_type`, `automated_or_human`, `decision_timestamp`.
- [ ] Codify internal complaint handling timelines and process (DSA Article 20) and surface them on the DSA page.
- [ ] Add trader vs private seller framework (required once paid ads/traders launch).
- [ ] Define refund/withdrawal waiver UX for future paid ads (explicit consent checkbox at checkout).
- [ ] Create `/cookies` page documenting strictly-necessary cookies and block accidental third-party scripts.
- [ ] Publish an annual DSA transparency page with counts: removals, user reports, appeals, reversals, automated vs human.

## Bikes Launch Plan (Single Category, Context + Checklist)

### Snapshot (for fresh agent chats)

- Date context: February 7, 2026.
- Launch focus: one category only, `Bikes` (non-motorized).
- Included bikes: adult bicycles, kids bicycles, electric bicycles (e-bikes).
- Excluded bikes: motorbikes/scooters, cars, stationary exercise bikes.
- Current posting flow is intentionally simple and must stay fixed:
  - Step 1: `Details`
  - Step 2: `Price`
  - Step 3: `Photo`
- This is an extension, not a redesign or rewrite.
- UX principle: presets/defaults/light validation; avoid heavy form logic.
- Current data/users are test-only, so we do not need migration/back-compat complexity for old real user behavior.

### Scope Boundaries

- In scope:
  - Add bike-specific behavior when category is `Bikes`.
  - Keep the same 3 steps and same base components.
  - Add bike subtype, bike condition, and bike size guidance to Step 1.
  - Tune Step 2 for bikes (no POA, firm/min-offer presets, optional hint).
  - Add bike photo checklist guidance in Step 3 (no enforcement).
  - Persist bike attributes in a reusable category-profile data shape.
  - Add metrics to evaluate listing quality and negotiation outcomes.
- Out of scope:
  - Adding/removing/reordering steps.
  - Building a new wizard flow.
  - Changing messaging privacy/safety flow.
  - Escrow/verification or other anti-scam guarantees.
  - Expansion to other categories in this iteration.

### Current Architecture Map (as of now)

- Posting page: `src/routes/(app)/post/+page.svelte`.
- Edit page (mirrors post flow): `src/routes/(app)/ads/[id]/edit/+page.svelte`.
- Shared fields component: `src/lib/components/post/PostFields.svelte`.
- Photo component: `src/lib/components/post/ImageDrop.svelte`.
- Server create endpoint: `src/routes/api/ads/+server.ts`.
- Server edit endpoint: `src/routes/api/ads/[id]/+server.ts`.
- Validation helpers: `src/lib/server/ads-validation.ts`.
- Category constants: `src/lib/constants.ts`.
- Category icon map: `src/lib/icons.ts`.
- Metrics helper: `src/lib/server/metrics.ts`.
- DB typing: `src/lib/supabase.types.ts`.
- Existing tests:
  - unit: `src/lib/server/ads-validation.spec.ts`
  - e2e: `e2e/flows.test.ts`, `e2e/home.test.ts`, `e2e/messages.test.ts`

### Implementation Decisions (locked for this task)

- Keep core flow and component structure.
- Move category handling toward configuration-first design.
- Introduce a reusable category profile config (Bikes is first profile).
- Persist bike structured fields in generic profile data (not one-off hardcoded columns for each bike attribute).
- Because data is test-only, we can change category labeling directly to `Bikes` where needed instead of building legacy compatibility layers.

### Category Profile Design (target shape)

- Profile key: `bikes`.
- Trigger condition: listing category is `Bikes`.
- Required bike fields:
  - subtype: `adult | kids | electric`
  - condition: `new | like_new | used_good | used_fair | needs_work`
- Guided fields:
  - bike type: `road | mountain | hybrid | gravel | electric | kids | other`
  - size:
    - adult: `XS | S | M | L | XL` or manual text
    - kids: age range presets (example `3-5`, `6-8`, `9-12`)
- Derived assistance:
  - title prefill from presets (editable)
  - description prompt template prefill (editable)

### Delivery Plan (parts + checkboxes)

#### Part A - Category foundation + config

- [ ] Add `Bikes` category to `src/lib/constants.ts` and update category color map.
- [ ] Remove/replace legacy `Sports & Bikes` references in UI/test fixtures since we are test-data only.
- [ ] Add/update category icon mapping in `src/lib/icons.ts` for `Bikes`.
- [ ] Introduce a new config module for category profiles (example path: `src/lib/category-profiles.ts`) containing bike presets and rules.
- [ ] Wire constants/helpers so bike checks use config, not scattered string comparisons.

#### Part B - Data model + typing

- [ ] Create new Supabase migration adding generic profile storage fields to `ads` (example: `category_profile` + `category_profile_data` JSONB).
- [ ] Update `src/lib/supabase.types.ts` for new fields.
- [ ] Keep fields optional so non-bike listings remain valid.

#### Part C - Step 1 (Details) bike UX extension

- [ ] Extend `PostFields.svelte` Step 1 to show bike-only controls when category is `Bikes`.
- [ ] Add required subtype button group: Adult, Kids, Electric.
- [ ] Add bike type preset control (button style, not free-text first).
- [ ] Add required condition control (preset buttons).
- [ ] Add size controls:
  - [ ] adult/electric sizes (`XS`..`XL`) + manual fallback
  - [ ] kids age ranges
- [ ] Auto-prefill title from selected bike presets, still editable.
- [ ] Prefill assisted description template prompts, still editable.
- [ ] Keep all existing non-bike Step 1 behavior unchanged.

#### Part D - Step 2 (Price) bike tuning

- [ ] Ensure POA is unavailable for category `Bikes` in UI and validation.
- [ ] Keep existing price flow structure (`fixed`/`free`) and offer controls.
- [ ] Add quick min-offer presets for bikes (`70%`, `80%`, `custom`) when price type is fixed and not firm.
- [ ] Add non-blocking price hint text for bikes from config (must avoid guarantee language).
- [ ] Keep non-bike Step 2 behavior unchanged.

#### Part E - Step 3 (Photo) bike guidance

- [ ] Add bike-only checklist guidance copy in photo step:
  - [ ] full bike side view
  - [ ] frame close-up
  - [ ] gears/drivetrain
  - [ ] serial area (optional)
- [ ] Keep photos optional and do not add any blocking requirements.
- [ ] Keep existing image upload/compression flow unchanged.

#### Part F - Validation + API wiring

- [ ] Extend `ads-validation.ts` with profile-aware validation entry point (category + profile data).
- [ ] Validate bike required fields server-side (subtype + condition + size rules).
- [ ] Parse and persist category profile payload in:
  - [ ] `src/routes/api/ads/+server.ts` (create)
  - [ ] `src/routes/api/ads/[id]/+server.ts` (edit)
- [ ] Keep non-bike validation path behavior unchanged.
- [ ] Keep anti-abuse, moderation, and age-check behavior unchanged.

#### Part G - Create/Edit page state + payload integration

- [ ] Add bike state fields to post flow page (`/post`) and bind through `PostFields`.
- [ ] Add the same bike state fields to edit flow page (`/ads/[id]/edit`) and prepopulate from persisted data.
- [ ] Include profile payload in form/json submit bodies for create and edit.
- [ ] Keep preview modal and step transitions unchanged.

#### Part H - Metrics instrumentation

- [ ] Extend `ad_created` metric properties with profile metadata:
  - [ ] `categoryProfileUsed`
  - [ ] `bikeSubtype`
  - [ ] `bikeConditionSet`
  - [ ] `bikeSizeSet`
  - [ ] `usedPresetOnly` (best-effort boolean)
- [ ] Ensure `offer_auto_declined` includes enough context to segment bikes vs non-bikes.
- [ ] Add or document query path for:
  - [ ] `% listings completed using presets only`
  - [ ] `% listings with condition + size set`
  - [ ] `% offers auto-declined by minimum price`
  - [ ] `time to first serious message`
  - [ ] `report rate per listing`

#### Part I - Tests and verification

- [ ] Add/extend unit tests in `src/lib/server/ads-validation.spec.ts` for bikes profile validation rules.
- [ ] Update e2e tests for category label changes and bike flow happy path.
- [ ] Add at least one e2e for bikes min-offer preset + auto-decline behavior.
- [ ] Run `npm run test:unit -- --run`.
- [ ] Run targeted e2e specs for post/edit/filtering flow.

#### Part J - Ship checklist

- [ ] Manual QA on `/post` and `/ads/[id]/edit` for both bike and non-bike categories.
- [ ] Confirm no new steps were introduced.
- [ ] Confirm existing non-bike posting flow still works unchanged.
- [ ] Confirm bike profile data persists and loads correctly in edit flow.
- [ ] Confirm metrics events are emitted with expected properties.

### Acceptance Criteria (definition of done)

- 3-step flow remains exactly `Details -> Price -> Photo`.
- Bike-specific controls only appear for category `Bikes`.
- Bike listings require subtype + condition and guided size input.
- POA is not available for bikes.
- Photo step remains optional, with guidance only.
- Non-bike categories preserve prior behavior.
- Bike profile logic is config-driven and reusable for future categories.

### Future Reuse Notes

- Next categories should only require:
  - a new profile config entry
  - profile-specific UI rendering blocks in existing step components
  - profile-specific validation rules using shared validation hooks
- Avoid duplicating category logic directly in route handlers/components; keep profile interpretation centralized.

## Notes

- Keep tasks small and test after each step.
- Add or update unit/e2e tests alongside feature work.
