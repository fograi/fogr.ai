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

- [ ] Define the primary jobs and success metrics for browse, post, and report flows
- [ ] Simplify navigation and information architecture around one primary action per screen
- [ ] Redesign home and browse with a focused search-first layout and minimal filters
- [ ] Convert posting into a short step-by-step wizard with progressive disclosure
- [ ] Redesign ad detail with a single primary action rail and collapsible secondary info
- [ ] Overhaul copy and error messaging for clarity and consistency
- [ ] Update shared UI tokens (typography, spacing, buttons) for simpler hierarchy
