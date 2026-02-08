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

- Research snapshot date: February 8, 2026.

### Task 1 - Expand "Export your data" to include messages and relevant account data

#### Snapshot (for fresh agent chats)

- Current export endpoint `src/routes/api/me/export/+server.ts` returns user profile, age confirmation, and ads only.
- Export trigger/UI lives on `src/routes/(app)/account/+page.svelte`.
- Current payload excludes conversations, messages, and trust/safety records tied to the user.

#### UX and policy decisions (research-backed)

- Keep export machine-readable and contract-based (`schema_version`) so users can move/inspect data easily.
- Include personal data the user provided or generated through usage (messages, conversation metadata, listing interactions).
- Apply rights-of-others guardrails: redact or pseudonymize counterpart identifiers unless full disclosure is legally required.
- Include only block references created by the requesting user by default; avoid exposing who blocked them.
- If payload becomes large, move to async export job UX (status + later download) instead of blocking account page actions.

#### Delivery checklist

- [ ] Define `export_payload_v2` contract (versioned JSON schema) and store it in docs.
- [ ] Extend `src/routes/api/me/export/+server.ts` to include: `conversations`, `messages`, and user-relevant moderation/report records.
- [ ] Add redaction/pseudonymization helper for third-party identifiers before payload serialization.
- [ ] Add optional async export flow (job status endpoint + signed download) for large payloads.
- [ ] Update account page copy in `src/routes/(app)/account/+page.svelte` to explain included datasets.
- [ ] Update E2E mock export payload in `src/lib/server/e2e-mocks.ts` and any dependent tests.
- [ ] Add tests for: completeness, schema stability, and third-party data redaction behavior.

#### Acceptance criteria

- Export contains message and conversation data relevant to the signed-in user.
- Payload is versioned and documented for future migrations.
- Third-party identifiers are handled per redaction policy.
- Export endpoint and account UI pass updated unit/e2e tests.

#### Research references

- `https://gdpr-info.eu/art-15-gdpr/`
- `https://gdpr-info.eu/art-20-gdpr/`
- `https://www.edpb.europa.eu/sme-data-protection-guide/respect-individuals-rights/right-data-portability_en`

### Task 2 - Group seller inbox conversations by listing (ad-first view)

#### Snapshot (for fresh agent chats)

- Inbox query and shaping lives in `src/routes/(app)/messages/+page.server.ts`.
- Inbox UI is currently flat conversation cards in `src/routes/(app)/messages/+page.svelte`.
- Seller handling many buyers on one ad currently gets noisy, high-switch-cost navigation.

#### UX decisions (research-backed)

- Seller inbox default should be grouped by `ad_id`; buyer view can remain individual-first.
- Provide a clear toggle between `Grouped by listing` and `Individual chats`.
- Group cards should show: ad title, unread total, active buyer count, and latest activity timestamp.
- Inside a group, sort chats by `unread first`, then `latest activity`.
- Preserve fast filters (`Selling`, `Buying`, offer-state filters) to avoid forcing one navigation model.

#### Delivery checklist

- [x] Extend inbox load model in `src/routes/(app)/messages/+page.server.ts` with grouped seller view data.
- [x] Add inbox toggle and grouped rendering in `src/routes/(app)/messages/+page.svelte`.
- [x] Show per-group aggregate unread and per-thread unread counts.
- [x] Add drill-in behavior: group card opens threads list, then conversation.
- [x] Persist last-used inbox mode in local storage for UX continuity.
- [ ] Add metrics events for mode usage and thread-open latency by mode.
- [x] Update `e2e/messages.test.ts` for grouped mode rendering and navigation.

#### Acceptance criteria

- Seller can manage multi-buyer traffic on one listing without losing conversation context.
- Buyer inbox remains simple and unaffected unless user toggles mode.
- Unread prioritization works both at group and thread levels.
- Grouped inbox behavior is covered by tests.

#### Research references

- `https://www.facebook.com/help/347147066002616/`
- `https://developer.ebay.com/devzone/xml/docs/reference/ebay/GetMemberMessages.html`

### Task 3 - Emphasize anonymous-chat safety in conversation view

#### Snapshot (for fresh agent chats)

- Conversation page: `src/routes/(app)/messages/[id]/+page.svelte`.
- Ad-side composer: `src/lib/components/messages/MessageComposer.svelte`.
- Anonymous context is currently lightly signposted and easy to ignore.

#### UX decisions (research-backed)

- Add a persistent but compact safety callout near composer: "You may not know who this is; keep chat on-platform."
- Add contextual friction when users type high-risk details (phone, email, external payment, OTP-like text).
- Keep warnings non-blocking for normal use; only escalate on explicit high-risk patterns.
- Include direct actions in warning area: `Report`, `Block`, `Safety tips`.
- Use first-contact context cues where possible (for example, unknown contact / no prior trust signals).

#### Delivery checklist

- [ ] Add reusable safety banner component for message views and ad-side composer.
- [ ] Add pre-send risk phrase detector in client UX and confirm-before-send dialog for risky content.
- [ ] Create lightweight safety tips page and link it from warning surfaces.
- [ ] Add event instrumentation: warning shown, warning bypassed, warning-confirmed send.
- [ ] Ensure all warning copy is concise and non-alarmist.
- [ ] Add e2e tests for safety warning trigger and send-confirm flow.

#### Acceptance criteria

- Conversation UI consistently reminds users about anonymous counterpart risk.
- Risky content attempts receive contextual warnings before send.
- Warnings do not block normal conversation flow for low-risk text.
- Report/block/safety actions are always reachable from warning surfaces.

#### Research references

- `https://support.signal.org/hc/en-us/articles/360007459591-Signal-Profiles-and-Message-Requests`
- `https://support.signal.org/hc/en-us/articles/9932739446426-Defending-against-phishing-attempts-in-Signal`
- `https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/RomanceScams.html`

### Task 4 - Add profanity checks for user-to-user conversations

#### Snapshot (for fresh agent chats)

- Message send pipeline is `src/routes/api/messages/+server.ts`.
- Current messaging pipeline includes scam-pattern checks but no profanity/toxicity moderation layer.
- Ad posting routes already include moderation components that can inform architecture reuse.

#### UX and trust/safety decisions (research-backed)

- Use layered moderation: rule-based profanity detection plus model-based severity classification.
- Apply severity tiers:
  - hard block for threats/hate/severe abuse,
  - soft warn-and-edit for lower-severity profanity,
  - allow benign text.
- Build for false-positive handling and calibration by language/community context.
- Log moderation outcomes for audit and threshold tuning without over-retaining sensitive text.

#### Delivery checklist

- [ ] Add `src/lib/server/message-moderation.ts` with deterministic + model-assisted checks.
- [ ] Integrate moderation decision into `src/routes/api/messages/+server.ts` before insert.
- [ ] Define blocked/warned response contracts for client UX.
- [ ] Add moderation event logging table and server write path.
- [ ] Add admin tooling hook for reviewing false positives and threshold updates.
- [ ] Add unit coverage for edge cases and adversarial variants.
- [ ] Add e2e coverage for blocked and warn-then-edit paths.

#### Acceptance criteria

- Severe abusive content is blocked at send time.
- Borderline content is warned with editable retry path.
- Moderation decisions are auditable and tunable.
- False-positive handling is test-covered.

#### Research references

- `https://openai.com/transparency-and-content-moderation/`
- `https://openai.com/index/a-holistic-approach-to-undesired-content-detection-in-the-real-world/`
- `https://research.google/pubs/designing-toxic-content-classification-for-a-diversity-of-perspectives/`

### Task 5 - Add chat blocking controls (chat-only + global) and finalize receipt UX

#### Snapshot (for fresh agent chats)

- No block model currently exists in DB schema/messaging APIs.
- Conversation UI currently surfaces `Delivered`/`Seen` state for latest outgoing message.
- User requirement includes chat-only block, global block, two-way effect, and GDPR export safety.

#### UX and policy decisions (research-backed)

- Support two scopes:
  - `Block this chat` (conversation scope),
  - `Block this user` (all future chats).
- Enforce two-way block semantics for sends and conversation creation.
- Keep historical thread readable but disable composer with clear unblock CTA for blocker.
- For MVP, remove in-thread `Delivered`/`Seen` labels to reduce social pressure; keep local "Message sent" acknowledgment.
- Export only outbound block records for requester, with masked counterpart IDs in exports.

#### Delivery checklist

- [ ] Create migration(s) for `conversation_blocks` and `user_blocks` plus indexes and RLS.
- [ ] Add block/unblock endpoints and server checks in `src/routes/api/messages/+server.ts`.
- [ ] Enforce block checks when creating new conversations and sending new messages.
- [ ] Add block controls in `src/routes/(app)/messages/[id]/+page.svelte`.
- [ ] Disable composer when blocked and show block state explanation.
- [ ] Remove `Delivered`/`Seen` labels from thread bubble metadata in conversation UI.
- [ ] Add export integration in `src/routes/api/me/export/+server.ts` with masked identifiers.
- [ ] Add unit/e2e tests for both block scopes and two-way enforcement.

#### Acceptance criteria

- Users can block per-chat or globally.
- Blocked pairs cannot continue messaging in either direction.
- Conversation receipt UX no longer pressures for immediate response.
- Export includes requester-created block records only, per policy.

#### Research references

- `https://support.signal.org/hc/en-us/articles/360007060072-Block-numbers-usernames-or-groups`
- `https://support.signal.org/hc/en-us/articles/360007059812-Read-Receipts`
- `https://www.facebook.com/help/447613741984126/`

### Task 6 - Cap ad price validation to DB-safe maximum

#### Snapshot (for fresh agent chats)

- Price validation currently checks positivity but not upper bounds.
- Relevant validation and API files:
  - `src/lib/server/ads-validation.ts`
  - `src/routes/api/ads/+server.ts`
  - `src/routes/api/ads/[id]/+server.ts`

#### Technical decisions (for UX consistency)

- Derive max from actual DB column type, then codify as shared constant.
- Enforce same max on both client and server to avoid inconsistent errors.
- Return user-facing validation error that includes allowed maximum.

#### Delivery checklist

- [ ] Confirm `ads.price` and `ads.min_offer` DB types and compute exact max safe value.
- [ ] Add/verify DB check constraint for max allowed price.
- [ ] Add shared `MAX_AD_PRICE` constant and use it in all validators.
- [ ] Mirror max in post/edit input attributes and inline error copy.
- [ ] Add boundary unit tests at `max`, `max + 1`, and invalid numeric formats.
- [ ] Add regression tests ensuring no overflow-like inserts reach DB.

#### Acceptance criteria

- No request can submit price above DB-supported maximum.
- Client and server show identical upper-bound behavior.
- Bound is documented and test-covered.

#### Research references

- Internal schema and Supabase typing inspection in this repo.

### Task 7 - Add euro-prefixed money inputs with grouping and whole-euro policy

#### Snapshot (for fresh agent chats)

- Prices are formatted for display via `src/lib/utils/price.ts`, but editing inputs are mostly plain numeric.
- Relevant input surfaces include post/edit flows and offer composer.

#### UX decisions (research-backed)

- Show currency symbol in money-entry fields to reduce ambiguity (`EUR` / `€`).
- Accept forgiving pasted input (`€`, commas, spaces), normalize before validation.
- Store and validate whole-euro amounts for listing and offer flows unless a future requirement requires cents.
- Keep display formatting locale-aware via `Intl.NumberFormat('en-IE', ...)`.

#### Delivery checklist

- [ ] Add shared parser/formatter helper for editable currency inputs.
- [ ] Update price/min-offer inputs in `src/lib/components/post/PostFields.svelte`.
- [ ] Update offer amount input in `src/lib/components/messages/MessageComposer.svelte`.
- [ ] Ensure server validators reject decimal amounts if whole-euro policy is enabled.
- [ ] Add inline helper/error copy explaining no-decimal rule.
- [ ] Add tests for typing/pasting values like `€1,000`, `1000`, and `1 000`.

#### Acceptance criteria

- Users can enter currency values naturally and see consistent euro formatting.
- Whole-euro rule is enforced across create/edit/message offer flows.
- Existing display labels remain consistent with edited values.

#### Research references

- `https://design.tax.service.gov.uk/hmrc-design-patterns/currency-input/`
- `https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat`

### Task 8 - Introduce stronger loading states for API and long-running tasks

#### Snapshot (for fresh agent chats)

- Current UX mainly uses button text swaps (`Sending...`, `Preparing...`) with limited visual progress language.
- Image compression/upload and export generation are clear candidates for richer progress UX.

#### UX decisions (research-backed)

- Use determinate progress when completion can be measured (upload/compression/export stages).
- Use indeterminate spinner only for short unknown waits.
- Use skeleton placeholders for content regions on initial loads.
- Respect reduced-motion preferences and keep indicators non-blocking where possible.

#### Delivery checklist

- [x] Build shared loading primitives (skeleton, inline spinner, progress bar).
- [x] Add determinate progress feedback to image compression/upload in post flow.
- [x] Add account export progress state (preparing -> ready) for async path.
- [x] Add skeleton states for messages inbox and conversation initial fetch.
- [x] Add accessibility labels (`aria-busy`, live regions, reduced-motion variants).
- [x] Add visual regression/e2e checks for key loading states.

#### Acceptance criteria

- Long-running tasks always show visible progress feedback.
- Loading states map to task type (determinate vs indeterminate vs skeleton).
- Accessibility checks pass for motion and assistive-tech announcements.

#### Research references

- `https://developer.apple.com/design/human-interface-guidelines/loading`
- `https://material-web.dev/components/progress/`
- `https://fluent2.microsoft.design/components/ios/core/activityindicator/usage`

### Task 9 - Add hierarchical location capture to listings (Island -> Province -> County -> Locality)

#### Snapshot (for fresh agent chats)

- Ads currently do not capture structured location hierarchy fields.
- Post/edit flow candidates:
  - `src/lib/components/post/PostFields.svelte`
  - `src/routes/(app)/post/+page.svelte`
  - `src/routes/(app)/ads/[id]/edit/+page.svelte`

#### UX and data decisions (research-backed)

- Use progressive location selection, not a single long dropdown.
- Keep county and locality as core required fields; treat province as optional/derived metadata.
- Do not require exact street address for public ad discovery; keep privacy-preserving granularity.
- Store both canonical IDs and display labels for stable filtering and rendering.
- Support autocomplete semantics for address-like fields for accessibility and browser assist.

#### Delivery checklist

- [ ] Define `location_profile_data` contract (`island`, `province`, `county`, `locality`, optional geo).
- [ ] Add migration for location storage and indexes for county/locality filters.
- [ ] Add data seed/lookup source for Irish county and settlement hierarchy.
- [ ] Implement progressive selectors and local search in Step 1 of post/edit flows.
- [ ] Add server validation for required location levels.
- [ ] Surface location summary on listing cards/details with privacy-safe granularity.
- [ ] Add filters by county/locality on browse/category pages.
- [ ] Add unit/e2e tests for selection, validation, and filtering behavior.

#### Acceptance criteria

- Listings can be created with structured location hierarchy.
- Users can filter/search listings by county and locality.
- Location UX remains fast on mobile and desktop.
- Public listing display avoids over-disclosure of exact addresses.

#### Research references

- `https://www.cso.ie/en/census/census2011boundaryfiles/`
- `https://design-system.service.gov.uk/patterns/addresses/`
- `https://mdn2.netlify.app/en-us/docs/web/html/attributes/autocomplete/`
