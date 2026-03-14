# Phase 6: Infrastructure and Cost Control - Research

**Researched:** 2026-03-14
**Domain:** Infrastructure hardening, monitoring, backups, cost control
**Confidence:** HIGH

## Summary

Phase 6 is primarily an operations and configuration phase with a single new code deliverable (the `/api/health` endpoint + cron heartbeat). Most work involves documenting existing behavior, creating operational runbooks, and configuring dashboard-based alerts on external services. The graceful degradation for OpenAI and email already exists in code and just needs verification and documentation.

The health endpoint is the key engineering task: a new SvelteKit API route at `/api/health` that checks DB connectivity, cron freshness via a heartbeat timestamp, and R2 bucket accessibility. The cron worker needs a small addition to write a heartbeat timestamp after each tick. The heartbeat storage decision (KV vs event_metrics) is at Claude's discretion -- research below recommends KV for simplicity and zero DB overhead.

**Primary recommendation:** Keep scope tight -- one new API route, one cron worker addition, three ops documents, and a checklist for dashboard alert configuration. No new npm dependencies needed.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- External uptime monitoring service (free tier) -- monitors independently of the platform itself
- Two monitors: homepage (site up?) + new `/api/health` endpoint
- `/api/health` checks three things: DB reachable, cron ran within last 30 minutes, R2 bucket accessible (HEAD request on known key)
- Cron heartbeat tracked via a timestamp (KV or event_metrics row) updated each tick -- health endpoint checks staleness
- No cron-emails-on-failure -- health endpoint approach is more reliable
- Documented risk acceptance for R2 -- 11-nines durability sufficient for v1, no backup/replication
- R2 accessibility included in /api/health check
- Supabase Pro daily automated backups with 7-day retention (operator must be on Pro tier)
- Documented step-by-step restore procedure -- test once manually
- Secrets/config inventory document listing every env var, KV namespace, R2 bucket binding
- KV namespace (rate limits) is ephemeral -- no backup needed
- Ops documentation lives in `.planning/ops/`
- Hard monthly budget ceiling: $75 (total across all services)
- Dashboard-based billing alerts on each provider -- no code-based cost monitoring
- Setup checklist document for configuring alerts on: Supabase, Cloudflare, OpenAI, Resend
- OpenAI: set hard spending limit on dashboard (~$10/month)
- Resend: dashboard alert at 2,000 emails/month (2/3 of 3,000 free tier limit)
- OpenAI unavailable -> ads already queue as 'pending' -- no additional code changes needed
- Email fire-and-forget via Resend -- Resend handles retries natively
- Verify and document existing degradation paths rather than building new ones

### Claude's Discretion

- Choice of external uptime monitoring service (UptimeRobot, Betterstack, or equivalent)
- Health endpoint implementation details (response format, cache-control headers)
- Cron heartbeat storage mechanism (KV timestamp vs event_metrics row)
- Restore procedure document format and level of detail
- Cost alert threshold percentages per individual service
- Ops documentation structure and naming

### Deferred Ideas (OUT OF SCOPE)

- CI/CD pipeline (GitHub Actions for deploy)
- Automated restore testing (periodic test restore to separate project)
- Code-based cost monitoring via service APIs
- Performance/load testing
  </user_constraints>

## Standard Stack

### Core (no new dependencies)

| Library               | Version       | Purpose                                    | Why Standard                                                |
| --------------------- | ------------- | ------------------------------------------ | ----------------------------------------------------------- |
| SvelteKit             | ^2.50.2       | `/api/health` endpoint                     | Already in project                                          |
| Cloudflare Workers KV | N/A (binding) | Cron heartbeat storage                     | Already bound in main worker, needs addition to cron worker |
| Cloudflare R2         | N/A (binding) | HEAD check in health endpoint              | Already bound                                               |
| Supabase REST API     | N/A           | DB connectivity check from health endpoint | Already used throughout                                     |

### External Services (configuration only)

| Service     | Tier         | Purpose                                                  | Cost                  |
| ----------- | ------------ | -------------------------------------------------------- | --------------------- |
| UptimeRobot | Free         | External uptime monitoring (50 monitors, 5-min interval) | $0                    |
| Supabase    | Pro          | Daily automated backups with 7-day retention             | Already paying $25/mo |
| OpenAI      | API          | Spending limit via dashboard                             | ~$1-5/mo current      |
| Resend      | Free         | Email delivery with built-in quota alerts                | $0                    |
| Cloudflare  | Free/Workers | Usage-based billing notifications                        | $0 (within free tier) |

### Alternatives Considered

| Instead of   | Could Use         | Tradeoff                                                                                                                                   |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| UptimeRobot  | BetterStack       | BetterStack has 30s intervals on free tier but only 5-10 monitors vs 50; UptimeRobot's 5-min interval is sufficient for 5-min alerting SLA |
| KV heartbeat | event_metrics row | event_metrics adds DB write overhead every 15 min; KV is already ephemeral store, zero DB cost, simpler                                    |

**Installation:**

```bash
# No new npm packages needed
# KV binding must be added to wrangler.cron.jsonc (see Architecture Patterns)
```

## Architecture Patterns

### Recommended Project Structure

```
src/
  routes/
    api/
      health/
        +server.ts       # NEW: /api/health endpoint (public, no auth)
  cron-worker.ts          # MODIFIED: add heartbeat write at end of scheduled()
.planning/
  ops/
    RESTORE.md            # NEW: Supabase backup/restore procedure
    SECRETS.md            # NEW: Env var and binding inventory
    COST-ALERTS.md        # NEW: Service-by-service alert setup checklist
    DEGRADATION.md        # NEW: Documented existing graceful degradation paths
```

### Pattern 1: Health Endpoint (GET /api/health)

**What:** Public, unauthenticated API route that returns system health status
**When to use:** External monitoring services ping this endpoint every 5 minutes
**Response format:**

```typescript
// Source: Project conventions from existing API routes
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import type { KVNamespace, R2Bucket } from '@cloudflare/workers-types';

type HealthCheck = {
	status: 'ok' | 'degraded' | 'down';
	checks: {
		database: { ok: boolean; latency_ms?: number };
		cron: { ok: boolean; last_tick?: string; age_minutes?: number };
		r2: { ok: boolean };
	};
	timestamp: string;
};

export const GET: RequestHandler = async ({ platform, locals }) => {
	const checks = { database: { ok: false }, cron: { ok: false }, r2: { ok: false } };

	// 1. DB check: simple SELECT 1
	try {
		const start = Date.now();
		const { error } = await locals.supabase.from('ads').select('id').limit(1);
		checks.database = { ok: !error, latency_ms: Date.now() - start };
	} catch {
		/* leave as false */
	}

	// 2. Cron heartbeat: read KV timestamp, check staleness (<= 30 min)
	const env = platform?.env as { RATE_LIMIT?: KVNamespace } | undefined;
	try {
		const lastTick = await env?.RATE_LIMIT?.get('cron:heartbeat');
		if (lastTick) {
			const age = Date.now() - new Date(lastTick).getTime();
			checks.cron = {
				ok: age <= 30 * 60 * 1000,
				last_tick: lastTick,
				age_minutes: Math.round(age / 60000)
			};
		}
	} catch {
		/* leave as false */
	}

	// 3. R2: HEAD on a known key
	const r2 = (platform?.env as { ADS_BUCKET?: R2Bucket } | undefined)?.ADS_BUCKET;
	try {
		// HEAD returns R2Object | null -- any non-error response means R2 is accessible
		const obj = await r2?.head('_health-check');
		// obj being null is fine (key doesn't exist) -- the point is R2 responded
		checks.r2 = { ok: true };
	} catch {
		/* leave as false */
	}

	const allOk = checks.database.ok && checks.cron.ok && checks.r2.ok;
	const anyDown = !checks.database.ok || !checks.r2.ok;
	const status = anyDown ? 'down' : !checks.cron.ok ? 'degraded' : 'ok';

	return json(
		{ status, checks, timestamp: new Date().toISOString() },
		{
			status: allOk ? 200 : 503,
			headers: { 'cache-control': 'no-store, no-cache, must-revalidate' }
		}
	);
};
```

**Key design decisions:**

- Returns 200 for healthy, 503 for unhealthy (UptimeRobot detects non-2xx as down)
- `degraded` status when cron is stale but DB and R2 work (site usable, moderation delayed)
- `down` when DB or R2 unreachable (site functionality broken)
- `no-store` cache-control prevents CDN caching health responses
- Uses existing `locals.supabase` (anon client) for DB check -- no service role needed
- Uses existing `RATE_LIMIT` KV binding for heartbeat read -- already available in main worker
- R2 HEAD on `_health-check` key: a non-existent key returning null still proves R2 is accessible; only a thrown error indicates R2 is down

### Pattern 2: Cron Heartbeat Write

**What:** Single KV.put() at the end of the cron scheduled() handler
**When to use:** Every cron tick (every 15 minutes)

```typescript
// Source: Cloudflare Workers KV API
// Add to wrangler.cron.jsonc: kv_namespaces binding for RATE_LIMIT
// Add RATE_LIMIT to Env type in cron-worker.ts

// At the end of the scheduled() try block, after all tasks:
const kv = env.RATE_LIMIT;
if (kv) {
	await kv.put('cron:heartbeat', new Date().toISOString(), {
		expirationTtl: 3600 // auto-expire after 1 hour (safety net)
	});
}
```

**Why KV over event_metrics:**

- KV is already used for ephemeral state (rate limiting)
- No DB write overhead (cron already makes many Supabase requests)
- `expirationTtl` auto-cleans stale heartbeats
- Cron worker just needs the same KV binding added to `wrangler.cron.jsonc`

**Wrangler.cron.jsonc change needed:**

```jsonc
// Add to wrangler.cron.jsonc:
"kv_namespaces": [
  {
    "binding": "RATE_LIMIT",
    "id": "cf5daa23362c48639599f07aa6afe7aa"
    // No preview_id needed for cron worker
  }
]
```

**Env type update needed in cron-worker.ts:**

```typescript
import type { KVNamespace } from '@cloudflare/workers-types';

type Env = {
	// ... existing fields ...
	RATE_LIMIT?: KVNamespace;
};
```

### Pattern 3: R2 Health Check via HEAD

**What:** Use R2 bucket binding's `head()` method to verify R2 accessibility
**API signature (verified from Cloudflare docs):**

```typescript
// Source: https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
head(key: string): Promise<R2Object | null>
// Returns R2Object if key exists, null if key doesn't exist
// Throws on R2 service error (binding misconfiguration, outage)
```

**The key `_health-check` does not need to exist.** A `null` return proves R2 responded successfully. Only a thrown exception indicates R2 is unreachable. This means no seed object is needed.

### Anti-Patterns to Avoid

- **Authenticated health endpoint:** External monitoring services cannot provide auth tokens. The health endpoint MUST be public.
- **Heavy health checks:** Do not run full table scans or complex queries. A simple `SELECT id FROM ads LIMIT 1` is sufficient to prove DB connectivity.
- **Health check caching:** Never set cache-control headers that allow CDN caching. A cached 200 would mask an actual outage.
- **Building custom cost monitoring:** Dashboard alerts on each provider are sufficient. Code-based billing API polling adds complexity for zero benefit at this scale.

## Don't Hand-Roll

| Problem               | Don't Build                              | Use Instead                       | Why                                                                                |
| --------------------- | ---------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------- |
| Uptime monitoring     | Custom ping service or cron-based checks | UptimeRobot free tier             | Independent of your infrastructure; alerts even when your whole stack is down      |
| Database backups      | pg_dump scripts or custom backup workers | Supabase Pro automated backups    | Managed, reliable, 7-day retention; operator just needs Pro tier                   |
| Cost monitoring       | API polling of billing endpoints         | Dashboard alerts on each provider | Each service has built-in billing notifications; code adds maintenance burden      |
| Email retry queue     | Custom retry table + worker              | Resend built-in retries           | Resend handles delivery retries natively; fire-and-forget pattern already in place |
| R2 backup/replication | Cross-bucket copy worker                 | Risk acceptance (documented)      | R2's 11-nines durability makes backup cost-ineffective for v1 classifieds          |

**Key insight:** This phase is about operational readiness, not new features. The temptation is to over-engineer monitoring and backup infrastructure. At fogr.ai's scale (solo operator, $75/mo budget), dashboard-based configuration and documentation are the right tools.

## Common Pitfalls

### Pitfall 1: Health Endpoint Behind Auth Middleware

**What goes wrong:** Health endpoint returns 401 to external monitoring service, creating false positives.
**Why it happens:** SvelteKit layout server loads may run auth checks that affect API routes.
**How to avoid:** The health endpoint is at `/api/health` which is outside both `(app)` and `(public)` route groups. API routes in `/api/` do not inherit layout auth. Verify by testing with `curl` without cookies.
**Warning signs:** UptimeRobot showing constant downtime despite site working.

### Pitfall 2: R2 HEAD Check on Non-Existent Key Treated as Failure

**What goes wrong:** `head()` returns `null` for a missing key, and the health check reports R2 as down.
**Why it happens:** Confusing `null` (key doesn't exist, but R2 works) with an error (R2 unreachable).
**How to avoid:** The check logic must treat `null` as success. Only a caught exception means R2 is actually unreachable. A `try/catch` wrapping the `head()` call is the correct approach.
**Warning signs:** R2 health always showing `false` even though image uploads work.

### Pitfall 3: Cron KV Binding Missing from wrangler.cron.jsonc

**What goes wrong:** Cron worker deploys successfully but heartbeat writes silently fail because `RATE_LIMIT` KV is undefined.
**Why it happens:** The KV binding exists in `wrangler.jsonc` (main worker) but not in `wrangler.cron.jsonc` (cron worker). They are separate workers with separate configs.
**How to avoid:** Add the same KV namespace binding to `wrangler.cron.jsonc`. Test with `wrangler dev --config wrangler.cron.jsonc` to verify.
**Warning signs:** Health endpoint cron check always showing stale.

### Pitfall 4: Supabase Spend Cap Confusion

**What goes wrong:** Operator thinks Supabase has fine-grained spending alerts but it only has a binary spend cap toggle.
**Why it happens:** Supabase Pro spend cap is all-or-nothing -- it restricts ALL over-quota usage when enabled. It does NOT allow setting custom budget thresholds or sending email notifications at percentage milestones.
**How to avoid:** Document that Supabase cost control means: (1) enable spend cap to prevent overages entirely, or (2) manually check the Usage page. No email alert at 75% is possible natively. The ops checklist should state this clearly.
**Warning signs:** Unexpected Supabase bills despite thinking alerts were configured.

### Pitfall 5: OpenAI Spending Limit Exceeds Budget Before Alert

**What goes wrong:** OpenAI spending limit is set too high and the project runs up a bill before the operator notices.
**Why it happens:** OpenAI has project-level budget limits. If set to $10/mo but the hard account limit is higher, the API may continue serving if the project limit setting doesn't trigger correctly.
**How to avoid:** Set the hard spending limit at the organization level to $10/month. Verify the "hard limit" vs "soft limit" distinction on the OpenAI billing page. Hard limit actually stops API calls; soft limit sends an email.
**Warning signs:** Monthly OpenAI bill exceeding expected $1-5 range.

## Code Examples

### Health Endpoint Route Structure

```typescript
// Source: Project conventions (src/routes/api/watchlist/+server.ts pattern)
// File: src/routes/api/health/+server.ts

import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import type { KVNamespace, R2Bucket } from '@cloudflare/workers-types';

// No CSRF check needed -- this is a public GET endpoint
// No auth needed -- external monitoring must access without credentials

export const GET: RequestHandler = async ({ platform, locals }) => {
	// Implementation per Pattern 1 above
};
```

### Cron Heartbeat Addition

```typescript
// Source: Existing cron-worker.ts scheduled() handler
// Add at end of try block in scheduled(), after all task calls:

// Write heartbeat timestamp for /api/health staleness check
if (env.RATE_LIMIT) {
	try {
		await env.RATE_LIMIT.put('cron:heartbeat', new Date().toISOString(), {
			expirationTtl: 3600
		});
		console.log('cron_heartbeat_written');
	} catch (err) {
		console.error('cron_heartbeat_failed', err);
	}
}
```

### Supabase DB Connectivity Check

```typescript
// Source: Project Supabase client pattern (locals.supabase is anon client)
// Using locals.supabase avoids needing service role key in health endpoint

const start = Date.now();
const { error } = await locals.supabase.from('ads').select('id').limit(1);
const latency = Date.now() - start;
// error is null on success, PostgrestError on failure
```

## State of the Art

| Old Approach                     | Current Approach                | When Changed | Impact                                                                |
| -------------------------------- | ------------------------------- | ------------ | --------------------------------------------------------------------- |
| Supabase daily backups only      | PITR available as Pro add-on    | 2024         | Not needed for v1; daily backups sufficient                           |
| Cloudflare Workers Tail for logs | Workers Observability dashboard | April 2025   | Already enabled via `observability.enabled: true` in wrangler configs |
| Custom billing API polling       | Provider dashboard alerts       | Current      | All four services support dashboard-based alerts                      |

**Already in place:**

- Cloudflare Workers Observability enabled in both `wrangler.jsonc` and `wrangler.cron.jsonc`
- Fire-and-forget email pattern (Resend handles retries)
- OpenAI moderation unavailable -> `pending` status (both POST handler and cron worker)

## Open Questions

1. **UptimeRobot free tier commercial use restriction**
   - What we know: UptimeRobot's free plan was restricted to "personal, non-commercial use" in 2025
   - What's unclear: Whether fogr.ai (pre-revenue classifieds platform) qualifies as "commercial use"
   - Recommendation: Use UptimeRobot free tier for now. The platform is pre-revenue and has no paying customers. If they enforce the restriction later, migrate to BetterStack free tier (5 monitors, 30s interval) which has no commercial restriction. Only 2 monitors are needed.

2. **Supabase custom spending alerts**
   - What we know: Supabase does NOT support custom spending threshold email alerts. The spend cap is binary (on/off). There is no "alert at 75%" feature.
   - What's unclear: Whether Supabase will add granular alerts in the future.
   - Recommendation: Document this limitation in the cost alerts checklist. The operator should periodically check the Supabase Usage dashboard manually. Enable the spend cap to prevent overages entirely.

3. **R2 HEAD check key selection**
   - What we know: `head()` on a non-existent key returns `null` without error, proving R2 is accessible
   - What's unclear: Whether there is a performance or billing concern with HEAD on non-existent keys
   - Recommendation: Use `_health-check` as the key. R2 HEAD requests are Class B operations (free within generous limits). No object needs to exist at that key.

## Sources

### Primary (HIGH confidence)

- [Supabase Database Backups docs](https://supabase.com/docs/guides/platform/backups) -- backup types, retention, restore process, Pro tier requirements
- [Supabase Cost Control docs](https://supabase.com/docs/guides/platform/cost-control) -- spend cap behavior, limitations, no custom alerts
- [Cloudflare R2 Workers API Reference](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/) -- `head()` method signature, return type
- [Cloudflare Notifications docs](https://developers.cloudflare.com/notifications/notification-available/) -- usage-based billing notifications setup
- Existing codebase: `src/cron-worker.ts`, `wrangler.jsonc`, `wrangler.cron.jsonc` -- current bindings and patterns

### Secondary (MEDIUM confidence)

- [UptimeRobot pricing page](https://uptimerobot.com/pricing/) -- free tier limits (50 monitors, 5-min intervals)
- [OpenAI platform limits](https://platform.openai.com/settings/organization/limits) -- project-level budget, hard vs soft limits
- [Resend account quotas](https://resend.com/docs/knowledge-base/account-quotas-and-limits) -- free tier 3,000/mo, built-in 80% quota alert emails
- [Cloudflare Workers Observability blog](https://blog.cloudflare.com/introducing-workers-observability-logs-metrics-and-queries-all-in-one-place/) -- observability dashboard features

### Tertiary (LOW confidence)

- UptimeRobot commercial use restriction details -- found in community comparisons, not verified against ToS

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- no new libraries needed, all services already in use or well-documented free tiers
- Architecture: HIGH -- health endpoint follows existing SvelteKit API route patterns exactly; KV heartbeat uses established binding patterns
- Pitfalls: HIGH -- verified Supabase spend cap limitations against official docs; R2 HEAD behavior verified against API reference
- Cost alerts: MEDIUM -- each provider's alert capability verified, but Supabase's lack of granular alerts is a notable gap

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (30 days -- infrastructure services are stable)
