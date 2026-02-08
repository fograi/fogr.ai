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
- Persist bike structured fields in generic profile data JSON (not one-off hardcoded columns for each bike attribute).
- Use a single profile payload field in `ads` (`category_profile_data` JSONB) with a stable schema.
- Avoid redundant storage where possible (no separate profile-type column unless proven necessary later).
- Because data is test-only, we can change category labeling directly to `Bikes` where needed instead of building legacy compatibility layers.

### Category Profile Design (target shape)

- Trigger condition: listing category is `Bikes`.
- Stored profile shape (v1) in `category_profile_data`:
  - `version: 1`
  - `profile: "bikes"`
  - `subtype: "adult" | "kids" | "electric"` (UI label: bike type)
  - `bikeType`: bike subtype options depend on selected bike type:
    - `adult`: `"road" | "mountain" | "hybrid" | "gravel" | "commuter" | "touring" | "cargo" | "folding" | "bmx" | "other"`
    - `kids`: `"balance" | "training" | "mountain" | "road" | "bmx" | "hybrid" | "other"`
    - `electric`: `"commuter" | "mountain" | "road" | "hybrid" | "gravel" | "cargo" | "folding" | "other"`
  - `condition: "new" | "like_new" | "used_good" | "used_fair" | "needs_work"`
  - `sizePreset?: "XS" | "S" | "M" | "L" | "XL" | "3-5" | "6-8" | "9-12"`
  - `sizeManual?: string`
  - `titleAutoFilled?: boolean`
  - `descriptionTemplateUsed?: boolean`
- Required bike fields:
  - bike type (`subtype`): `adult | kids | electric`
  - bike subtype (`bikeType`): required; options depend on selected bike type
  - condition: `new | like_new | used_good | used_fair | needs_work`
- Guided fields:
  - bike subtype presets via buttons (with `Other` fallback)
  - size:
    - adult: `XS | S | M | L | XL` or manual text
    - kids: age range presets (example `3-5`, `6-8`, `9-12`)
- Required size rules (locked):
  - adult/electric: require `sizePreset` OR `sizeManual`
  - kids: require kids age-range `sizePreset`
- Derived assistance:
  - title prefill from presets (editable)
  - description prompt template prefill (editable)
- Metrics rule (locked) for `usedPresetOnly`:
  - true only when no manual edits are made to title/description/sizeManual after initial preset/template fill.

### Delivery Plan (parts + checkboxes)

#### Part A - Category foundation + config

- [x] Add `Bikes` category to `src/lib/constants.ts` and update category color map.
- [x] Remove/replace legacy `Sports & Bikes` references in:
  - [x] `src/lib/constants.ts`
  - [x] `src/lib/icons.ts`
  - [x] mock data/fixtures
  - [x] e2e expectations (`e2e/home.test.ts` and any related tests)
  - [x] any search/filter category labels
- [x] Add/update category icon mapping in `src/lib/icons.ts` for `Bikes`.
- [x] Introduce a new config module for category profiles (example path: `src/lib/category-profiles.ts`) containing bike presets and rules.
- [x] Wire constants/helpers so bike checks use config, not scattered string comparisons.

#### Part B - Data model + typing

- [x] Create new Supabase migration adding a generic profile storage field to `ads`:
  - [x] `category_profile_data JSONB NULL`
- [x] Add optional GIN index on `category_profile_data` if query patterns require profile filtering at scale.
- [x] Update `src/lib/supabase.types.ts` for new fields.
- [x] Keep fields optional so non-bike listings remain valid.

#### Part C - Step 1 (Details) bike UX extension

- [x] Extend `PostFields.svelte` Step 1 to show bike-only controls when category is `Bikes`.
- [x] Add required subtype button group: Adult, Kids, Electric.
- [x] Add bike type preset control (button style, not free-text first).
- [x] Add required condition control (preset buttons).
- [x] Add size controls:
  - [x] adult/electric sizes (`XS`..`XL`) + manual fallback
  - [x] kids age ranges
- [x] Auto-prefill title from selected bike presets, still editable.
- [x] Prefill assisted description template prompts, still editable.
- [x] Keep all existing non-bike Step 1 behavior unchanged.

#### Part D - Step 2 (Price) bike tuning

- [x] Ensure POA is unavailable for category `Bikes` in UI and validation.
- [x] Keep existing price flow structure (`fixed`/`free`) and offer controls.
- [x] Add quick min-offer presets for bikes (`70%`, `80%`, `custom`) when price type is fixed and not firm.
- [x] Add non-blocking price hint text for bikes from config (must avoid guarantee language).
- [x] Keep non-bike Step 2 behavior unchanged.

#### Part E - Step 3 (Photo) bike guidance

- [x] Add bike-only checklist guidance copy in photo step:
  - [x] full bike side view
  - [x] frame close-up
  - [x] gears/drivetrain
  - [x] serial area (optional)
- [x] Keep photos optional and do not add any blocking requirements.
- [x] Keep existing image upload/compression flow unchanged.

#### Part F - Validation + API wiring

- [x] Extend `ads-validation.ts` with profile-aware validation entry point (category + profile data).
- [x] Validate bike required fields server-side (subtype + condition + size rules).
- [x] Parse and persist category profile payload in:
  - [x] `src/routes/api/ads/+server.ts` (create)
  - [x] `src/routes/api/ads/[id]/+server.ts` (edit)
- [x] Keep non-bike validation path behavior unchanged.
- [x] Keep anti-abuse, moderation, and age-check behavior unchanged.

#### Part G - Create/Edit page state + payload integration

- [x] Add bike state fields to post flow page (`/post`) and bind through `PostFields`.
- [x] Add the same bike state fields to edit flow page (`/ads/[id]/edit`) and prepopulate from persisted data.
- [x] Include profile payload in form/json submit bodies for create and edit.
- [x] Keep preview modal and step transitions unchanged.

#### Part H - Metrics instrumentation

- [x] Extend `ad_created` metric properties with profile metadata:
  - [x] `categoryProfileUsed`
  - [x] `bikeSubtype`
  - [x] `bikeConditionSet`
  - [x] `bikeSizeSet`
  - [x] `usedPresetOnly` (deterministic using locked rule above)
- [x] Ensure `offer_auto_declined` includes enough context to segment bikes vs non-bikes.
- [x] Add or document query path for:
  - [x] `% listings completed using presets only`
  - [x] `% listings with condition + size set`
  - [x] `% offers auto-declined by minimum price`
  - [x] `time to first serious message`
  - [x] `report rate per listing`

#### Part I - Tests and verification

- [x] Add/extend unit tests in `src/lib/server/ads-validation.spec.ts` for bikes profile validation rules.
- [x] Update e2e tests for category label changes and bike flow happy path.
- [x] Add at least one e2e for bikes min-offer preset + auto-decline behavior.
- [x] Run `npm run test:unit -- --run`.
- [x] Run targeted e2e specs for post/edit/filtering flow.

#### Part J - Ship checklist

- [x] Manual QA on `/post` and `/ads/[id]/edit` for both bike and non-bike categories.
- [x] Confirm no new steps were introduced.
- [x] Confirm existing non-bike posting flow still works unchanged.
- [x] Confirm bike profile data persists and loads correctly in edit flow.
- [ ] Confirm metrics events are emitted with expected properties.

#### Part K - Bike taxonomy UX refinement (labels + overlap fix)

- [x] Correct Step 1 labels so first selector is `Bike type` and second is `Bike subtype`.
- [x] Make bike subtype mandatory (with `Other` available).
- [x] Remove duplicated `Kids` / `Electric` values from second-level subtype choices.
- [x] Drive second-level options from selected bike type via config map.
- [x] Update bike profile validation to enforce valid type/subtype combinations.
- [x] Add unit coverage for missing subtype and invalid type/subtype combinations.
- [x] Add e2e coverage for bike type/subtype branching, required kids size, and valid adult/electric Step 1 progression.
- [x] Re-verify taxonomy accuracy and expand subtype lists (adult folding/touring/commuter/cargo/BMX, broader kids, road/gravel on electric).

#### Part L - Surface presets in listings + smarter description assist

- [x] Add optional guided pills for each description prompt in Step 1:
  - [x] `Reason for selling`
  - [x] `How it has been used`
  - [x] `Known issues or maintenance needed`
- [x] Keep same 3-step flow (no extra step, no hard block); user can still type manually.
- [x] Decide interaction pattern (inline expand vs small popover) and keep it lightweight.
- [x] Store selected guided values in `category_profile_data` (optional fields) for reliable display later.
- [x] Render structured bike summary on ad detail page (e.g. type, subtype, condition, size, guided answers).
- [x] Render compact structured bike badges on listing cards (without clutter).
- [x] Keep non-bike cards/details unchanged.
- [x] Add unit tests for normalization of new optional guided fields.
- [x] Add e2e for guided pills -> payload -> listing/detail render path.

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

## Other todo to add tasks for

- Add ad messages and other relevant stuff to "Export your data" feature on account page.
- In the messages page, where the seller gets messages from multiple people for the same ad, group the messages, similar to maybe how the reports page groups reports for the same ad. Do some deep UX research to see what is best for the user.
- On the message conversation view, I want to emphasise the anonymous nature of the chat, mostly to remind that you have no idea who you are talking to.
- Add the profanity checks on the conversations between users
- Allow users to block chat from users in chat, for this chat only, or for all future chats
  - Consider if status like delivered on messages are useful or not? Maybe creates tension when un-replied?
  - Consider that the block must be two way, so the person who blocks won't accidentally chat to the via their ad
  - Need to ensure blocked lists or references are not send in gdpr, unless required.
    - Will probably just use the uid which should be some what safe, or probably expose partially masked such as 1111-\*\*\*\*-1111
- Set the max price validation to whatever is the max the db field will handle
- Put euro symbols on inputs for monetary amounts, format with commas between 3 digits, e.g. €1,000. Possibly ban decimal places, I can't see how they would be useful.
- Simple but innovative loading spinners where there are API calls or long running tasks like image compression.
- Need to collect location to associate with as ad, Island > Province > County > City / Town / Village etc.
