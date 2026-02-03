# TODO

- [x] Pending to active workflow (cron re-moderation + promote + upload images)
- [x] Cron worker scheduled every 15 minutes
- [x] Private R2 bucket for pending images
- [x] Client-side image compression (enforce total upload <= 10MB before submit)
- [x] DB constraints + indexes (status check constraint; index on (status, created_at))
- [x] Add /terms and /privacy routes
- [x] Require prod bindings (OPENAI_API_KEY, ADS_BUCKET, ADS_PENDING_BUCKET, PUBLIC_R2_BASE, RATE_LIMIT, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- [x] Expand E2E (login flow, posting, ad detail)
- [x] Add age gate (18+) at signup/posting
- [x] Persist age confirmation per user (user_age_confirmations)
- [x] Implement self-serve GDPR data export and account deletion
- [x] Implement ad expiry automation for selected durations (default 32 days)
- [ ] Finalize refund/withdrawal flow at checkout (no refunds except required by law)
- [ ] Capture withdrawal waiver + consent at checkout (EEA digital services)
- [ ] Record proof of publication for paid ads for chargeback protection (published_at, audit log, consent timestamp, IP, user agent, terms version, payment IDs)
