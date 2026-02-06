# Plan

## Open Work

### Ad Card UX Improvements

- [ ] Add “New / Updated” chip (requires `created_at`/`updated_at` in list API).
- [ ] Add “Verified seller” badge once verification exists.

### Payments + Monetization

- [ ] Implement payment system (Stripe or alternative) + checkout flow.
- [ ] Decide paid upsells and pricing (extra images, extra text, extended duration, local pin).
- [ ] Finalize refund/withdrawal flow at checkout (no refunds except required by law).
- [ ] Capture withdrawal waiver + consent at checkout (EEA digital services).
- [ ] Record proof of publication for paid ads for chargeback protection (published_at, audit log, consent timestamp, IP, user agent, terms version, payment IDs).

### Safety + Abuse

- [ ] Add image reuse detection (hashing).

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

### Moderation Ops (Low-Cost)

- [ ] Implement moderation workflow states (report received → review → decision → SoR sent → appeal → final).
- [ ] Add Supabase tables `moderation_events` and `reports`.
- [ ] Ensure moderation logging captures `content_id`, `user_id`, `report_id`, `decision`, `legal_basis`, `automated_flag`, `timestamp`.
- [ ] Add email templates for takedown, SoR, and appeal outcomes.

## Notes

- Keep tasks small and test after each step.
- Add or update unit/e2e tests alongside feature work.
