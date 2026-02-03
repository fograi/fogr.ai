# TODO

- [ ] Pending to active workflow (admin review or cron re-moderation + upload images)
- [ ] Client-side image compression (enforce total upload <= 10MB before submit)
- [ ] DB constraints + indexes (status check constraint; index on (status, created_at))
- [ ] Add /terms and /privacy routes
- [ ] Require prod bindings (OPENAI_API_KEY, ADS_BUCKET, PUBLIC_R2_BASE, RATE_LIMIT)
- [ ] Expand E2E (login flow, posting, ad detail)
