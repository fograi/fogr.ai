# TODO

- [x] Pending to active workflow (cron re-moderation + promote + upload images)
- [x] Cron worker scheduled every 15 minutes
- [x] Private R2 bucket for pending images
- [x] Client-side image compression (enforce total upload <= 10MB before submit)
- [x] DB constraints + indexes (status check constraint; index on (status, created_at))
- [x] Add /terms and /privacy routes
- [ ] Require prod bindings (OPENAI_API_KEY, ADS_BUCKET, ADS_PENDING_BUCKET, PUBLIC_R2_BASE, RATE_LIMIT, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- [ ] Expand E2E (login flow, posting, ad detail)
- [ ] Add age gate (18+) at signup/posting
- [ ] Implement self-serve GDPR data export and account deletion
- [ ] Implement ad expiry automation for selected durations (default 32 days)
- [ ] Finalize refund/withdrawal flow at checkout (no refunds except required by law)
- [ ] Capture withdrawal waiver + consent at checkout (EEA digital services)
- [ ] Record proof of publication for paid ads (published_at + audit log + payment IDs)
