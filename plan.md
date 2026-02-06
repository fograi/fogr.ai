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

## Notes

- Keep tasks small and test after each step.
- Add or update unit/e2e tests alongside feature work.
