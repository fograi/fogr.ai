# Phase 6: Infrastructure and Cost Control - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

The platform can run unattended — failures are visible before users notice them, costs do not surprise, and data is recoverable if something goes wrong. Delivers: automated database backups with verified restore, monitoring and alerting for critical failures, spending alerts on all external services, graceful degradation when external services fail, and R2 redundancy strategy. Does NOT include CI/CD pipeline, performance/load testing, or Supabase tier changes (operator action, not code).

</domain>

<decisions>
## Implementation Decisions

### Monitoring & alerting

- External uptime monitoring service (free tier) — monitors independently of the platform itself
- Two monitors: homepage (site up?) + new `/api/health` endpoint
- `/api/health` checks three things: DB reachable, cron ran within last 30 minutes, R2 bucket accessible (HEAD request on known key)
- Cron heartbeat tracked via a timestamp (KV or event_metrics row) updated each tick — health endpoint checks staleness
- No cron-emails-on-failure — health endpoint approach is more reliable (works even if email service is down)

### R2 image redundancy

- Documented risk acceptance — R2's 11-nines durability is sufficient for v1
- No backup or replication needed; if Cloudflare has a catastrophic R2 failure, images are lost but ads can be re-posted
- R2 accessibility included in /api/health check to catch binding misconfigs or outages early

### Backup & restore

- Supabase Pro daily automated backups with 7-day retention (operator must be on Pro tier — documented as pre-launch gate in STATE.md)
- Documented step-by-step restore procedure — test once manually against a separate project, record the result
- Secrets/config inventory document listing every env var, KV namespace, R2 bucket binding, and where each is stored (key names only, not values)
- KV namespace (rate limits) is ephemeral — no backup needed, regenerates naturally
- Ops documentation lives in `.planning/ops/` — version-controlled alongside project docs

### Cost ceilings & alerting

- Hard monthly budget ceiling: $75 (roughly 2x current ~$38-43 spend)
- Dashboard-based billing alerts on each provider — no code-based cost monitoring
- Setup checklist document with step-by-step instructions for configuring alerts on: Supabase, Cloudflare, OpenAI, Resend
- OpenAI: set hard spending limit on dashboard (~$10/month). If exceeded, API returns errors and ads queue as 'pending' — existing graceful degradation already handles this
- Resend: dashboard alert at 2,000 emails/month (2/3 of 3,000 free tier limit)

### Graceful degradation

- OpenAI unavailable → ads already queue as 'pending' in both POST handler (line 557) and cron worker (skips 'unavailable'). No additional code changes needed — existing behavior satisfies INFR-04
- Email fire-and-forget via Resend — Resend handles retries natively (Phase 3 decision). No retry queue table
- Verify and document these existing degradation paths rather than building new ones

### Claude's Discretion

- Choice of external uptime monitoring service (UptimeRobot, Betterstack, or equivalent)
- Health endpoint implementation details (response format, cache-control headers)
- Cron heartbeat storage mechanism (KV timestamp vs event_metrics row)
- Restore procedure document format and level of detail
- Cost alert threshold percentages per individual service
- Ops documentation structure and naming

</decisions>

<specifics>
## Specific Ideas

- The $75/month ceiling is a total across all services, not per-service
- OpenAI moderation already handles unavailability gracefully — this phase documents it rather than rebuilding it
- Health endpoint must work without authentication (external monitoring service needs to ping it)
- Secrets inventory lists names and locations, never values — safe to commit to repo

</specifics>

<code_context>

## Existing Code Insights

### Reusable Assets

- `src/cron-worker.ts`: Cron worker with moderation, expiry, digest — add heartbeat timestamp write at end of each tick
- `src/routes/api/ads/+server.ts` (line 557): Already sets status='pending' when OpenAI unavailable — graceful degradation exists
- `src/lib/server/email/send.ts`: Email sending with fire-and-forget pattern — no changes needed
- `src/lib/server/metrics.ts`: `recordMetric()` helper — could be used for cron heartbeat if using event_metrics approach
- `wrangler.jsonc`: Cloudflare bindings config — R2 buckets, KV namespaces, observability already enabled
- `wrangler.cron.jsonc`: Cron schedule config (_/15 _ \* \* \*)

### Established Patterns

- Worker secrets via `Env` type and `platform.env` access pattern
- Cloudflare KV for ephemeral state (rate limiting) — could store cron heartbeat
- Supabase REST API from cron worker via `supabaseHeaders()` helper
- API error responses: `{ success: false, message, requestId }` with status codes
- Public routes under `(public)` route group — health endpoint goes here

### Integration Points

- New route: `/api/health` (public, no auth) — reads DB, KV/metrics heartbeat, R2 HEAD
- Cron worker: add heartbeat write (KV put or metrics insert) at end of scheduled() handler
- New ops docs: `.planning/ops/RESTORE.md`, `.planning/ops/SECRETS.md`, `.planning/ops/COST-ALERTS.md`
- No changes to existing email or moderation code — document existing degradation paths

</code_context>

<deferred>
## Deferred Ideas

- CI/CD pipeline (GitHub Actions for deploy) — would be valuable but not in scope for v1 infrastructure
- Automated restore testing (periodic test restore to separate project) — overkill for solo operator at current scale
- Code-based cost monitoring via service APIs — dashboard alerts sufficient for now
- Performance/load testing — separate concern from infrastructure monitoring

</deferred>

---

_Phase: 06-infrastructure-and-cost-control_
_Context gathered: 2026-03-14_
