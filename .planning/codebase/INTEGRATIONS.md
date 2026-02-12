# External Integrations

**Analysis Date:** 2026-02-11

## APIs & External Services

**AI/ML:**

- OpenAI - Content moderation for text and images
  - SDK/Client: `openai` (6.18.0)
  - Auth: `OPENAI_API_KEY` (env var)
  - Used in: `src/routes/api/ads/+server.ts`, `src/routes/api/ads/[id]/+server.ts`, `src/cron-worker.ts`
  - Purpose: Moderate ad text and images before publishing

**Content Filtering:**

- leo-profanity - Profanity filtering library
  - Client: `leo-profanity` (1.9.0)
  - No auth required (local library)
  - Extended with custom banned words from `src/lib/banned-words.ts`
- obscenity - Advanced content moderation
  - Client: `obscenity` (0.4.6)
  - No auth required (local library)
  - Used in: `src/routes/api/ads/+server.ts`

**Disposable Email Detection:**

- Local list-based validation in `src/lib/disposable-email-domains.ts`
  - No external API calls
  - Used in: `src/routes/api/auth/magic-link/+server.ts`

## Data Storage

**Databases:**

- Supabase (PostgreSQL)
  - Connection: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - Client: `@supabase/supabase-js` (2.95.3), `@supabase/ssr` (0.8.0)
  - SSR client created in: `src/hooks.server.ts`
  - Admin/service client used in: API routes with service role key
  - Schema migrations: `supabase/migrations/*.sql`
  - Tables: ads, messages, ad_reports, ad_moderation_actions, ad_moderation_appeals, event_metrics, read_receipts

**File Storage:**

- Cloudflare R2 (S3-compatible object storage)
  - Binding: `ADS_BUCKET` (public bucket for approved ad images)
  - Binding: `ADS_PENDING_BUCKET` (private bucket for pending moderation images)
  - CDN URL: `PUBLIC_R2_BASE` (e.g., `https://cdn.fogr.ai/`)
  - Used in: `src/routes/api/ads/+server.ts`, `src/routes/api/ads/[id]/+server.ts`, `src/cron-worker.ts`
  - Image processing: `pica` (9.0.1) for client-side resizing

**Caching:**

- Cloudflare KV (key-value store)
  - Binding: `RATE_LIMIT` (KV namespace)
  - Purpose: Rate limiting for API endpoints and auth flows
  - Used in: `src/lib/server/rate-limit.ts`, `src/routes/api/auth/magic-link/+server.ts`, `src/routes/api/ads/+server.ts`, `src/routes/api/ads/[id]/report/+server.ts`, `src/routes/api/reports/status/+server.ts`
  - Also used for per-ad edit backoff

## Authentication & Identity

**Auth Provider:**

- Supabase Auth
  - Implementation: Magic link (passwordless email)
  - Server setup: `src/hooks.server.ts` (createServerClient with cookie handling)
  - Client usage: `@supabase/supabase-js` createClient in components
  - Magic link endpoint: `src/routes/api/auth/magic-link/+server.ts`
  - Rate limiting: 5 requests per 10 minutes per email, 20 per day
  - Disposable email blocking enabled

**Identity Generation:**

- Deterministic pseudonymous usernames via `mythologise` function
  - Uses userId + server secret to generate consistent handles
  - Deterministic avatar generation from user tag (`tagToAvatar`)
  - Identity lock tests: `src/lib/utils/identity-lock.spec.ts`

## Monitoring & Observability

**Error Tracking:**

- Cloudflare Workers observability enabled in `wrangler.jsonc`
  - Built-in metrics and logs via Cloudflare dashboard
  - Custom request IDs generated for API routes (e.g., `x-request-id` header)

**Logs:**

- Console logging to Cloudflare Workers logs
- Event metrics stored in Supabase (`event_metrics` table)
  - Metrics helper: `src/lib/server/metrics.ts`
  - Rollup jobs run via cron worker

## CI/CD & Deployment

**Hosting:**

- Cloudflare Workers (Pages)
  - Main app: deployed via `wrangler deploy` (configured in `wrangler.jsonc`)
  - Cron worker: separate deployment with `wrangler.cron.jsonc`

**CI Pipeline:**

- Not detected in repository (no `.github/workflows/` or other CI config files found)
  - Deployment appears to be manual via `npm run deploy` script

**Build Process:**

- SvelteKit builds to `.svelte-kit/cloudflare/` via `@sveltejs/adapter-cloudflare`
- Wrangler deploys the built worker from `.svelte-kit/cloudflare/_worker.js`

## Environment Configuration

**Required env vars:**

- `PUBLIC_SUPABASE_URL` - Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY` - Public anon key for client-side auth
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `OPENAI_API_KEY` - OpenAI API key for moderation
- `PUBLIC_R2_BASE` - CDN base URL for R2 public bucket
- `ADMIN_EMAIL` or `ADMIN_EMAILS` - Admin user allowlist

**Secrets location:**

- Production secrets managed via `wrangler secret put` command or Cloudflare dashboard
- Development: `.env` file (present, gitignored)

**Cloudflare Bindings:**

- Configured in `wrangler.jsonc` and `wrangler.cron.jsonc`
- Accessed via `platform.env` in SvelteKit request handlers

## Webhooks & Callbacks

**Incoming:**

- Supabase Auth magic link callback (handled by Supabase, redirects to app)
- No custom webhook endpoints detected

**Outgoing:**

- None detected
- Moderation is pull-based (cron worker checks pending ads every 15 minutes)

## Scheduled Jobs

**Cron Worker:**

- Worker: `src/cron-worker.ts`
- Schedule: Every 15 minutes (`*/15 * * * *`)
- Config: `wrangler.cron.jsonc`
- Jobs:
  - Moderate pending ads (batch of 25)
  - Move approved images from pending to public R2 bucket
  - Delete rejected images from pending bucket
  - Expire old ads
  - Rollup event metrics (daily/weekly purges for old data)

**Trigger:**

- Cloudflare Cron Triggers (configured in wrangler)
- Scheduled event handler: `cron-worker.ts` exports `scheduled` function

---

*Integration audit: 2026-02-11*
