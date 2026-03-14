# Secrets and Configuration Inventory

> **This document lists configuration names and locations only. Never add actual secret values to this file.**

Complete inventory of every environment variable, secret, KV namespace, and R2 bucket binding for fogr.ai.

## Main Worker (wrangler.jsonc)

### Cloudflare Workers Secrets

Set via `wrangler secret put <NAME>` or Cloudflare Dashboard > Workers & Pages > fogr-ai > Settings > Variables and Secrets.

| Secret                      | Purpose                                            | Where to Find Value                                            |
| --------------------------- | -------------------------------------------------- | -------------------------------------------------------------- |
| `PUBLIC_SUPABASE_URL`       | Supabase project URL                               | Supabase Dashboard > Project Settings > API > Project URL      |
| `PUBLIC_SUPABASE_ANON_KEY`  | Supabase anonymous/public key                      | Supabase Dashboard > Project Settings > API > anon/public key  |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin access)           | Supabase Dashboard > Project Settings > API > service_role key |
| `OPENAI_API_KEY`            | OpenAI API key for content moderation              | platform.openai.com > API Keys                                 |
| `ADMIN_EMAIL`               | Admin email address for admin route access control | Operator's admin email address                                 |
| `RESEND_API_KEY`            | Resend API key for transactional email             | resend.com > API Keys                                          |
| `UNSUBSCRIBE_SECRET`        | HMAC secret for email unsubscribe token generation | Generate with `openssl rand -hex 32`                           |

### Vars (Committed in Config, Not Secret)

Defined in `wrangler.jsonc` under `"vars"`. These are NOT secret.

| Variable         | Purpose                      | Current Value          |
| ---------------- | ---------------------------- | ---------------------- |
| `PUBLIC_R2_BASE` | CDN URL for R2 public bucket | `https://cdn.fogr.ai/` |

### Bindings

Defined in `wrangler.jsonc`. These are infrastructure bindings, not secrets.

| Binding              | Type           | Resource                  | ID/Name                                |
| -------------------- | -------------- | ------------------------- | -------------------------------------- |
| `RATE_LIMIT`         | KV namespace   | Rate limiting counters    | id: `cf5daa23362c48639599f07aa6afe7aa` |
| `ADS_BUCKET`         | R2 bucket      | Public approved images    | bucket_name: `fograi`                  |
| `ADS_PENDING_BUCKET` | R2 bucket      | Pending moderation images | bucket_name: `fograi-pending`          |
| `ASSETS`             | Assets binding | SvelteKit static assets   | (auto-configured)                      |

## Cron Worker (wrangler.cron.jsonc)

### Cloudflare Workers Secrets

Set via `wrangler secret put <NAME> --config wrangler.cron.jsonc` or Cloudflare Dashboard > Workers & Pages > fogr-ai-cron > Settings > Variables and Secrets.

> **Same values as main worker, but must be set separately** on the cron worker.

| Secret                      | Purpose                                | Where to Find Value |
| --------------------------- | -------------------------------------- | ------------------- |
| `PUBLIC_SUPABASE_URL`       | Supabase project URL                   | Same as main worker |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key              | Same as main worker |
| `OPENAI_API_KEY`            | OpenAI API key for batch moderation    | Same as main worker |
| `RESEND_API_KEY`            | Resend API key for notification emails | Same as main worker |
| `UNSUBSCRIBE_SECRET`        | HMAC secret for unsubscribe tokens     | Same as main worker |

### Bindings

Defined in `wrangler.cron.jsonc`.

| Binding              | Type         | Resource                  | ID/Name                                |
| -------------------- | ------------ | ------------------------- | -------------------------------------- |
| `RATE_LIMIT`         | KV namespace | Cron heartbeat writes     | id: `cf5daa23362c48639599f07aa6afe7aa` |
| `ADS_BUCKET`         | R2 bucket    | Public approved images    | bucket_name: `fograi`                  |
| `ADS_PENDING_BUCKET` | R2 bucket    | Pending moderation images | bucket_name: `fograi-pending`          |

> **Note:** The cron worker does not have `PUBLIC_R2_BASE` -- it does not serve user requests or generate image URLs. It does have `RATE_LIMIT` KV for writing heartbeat timestamps read by `/api/health`.

## Local Development (.env)

The `.env` file is gitignored and must be created manually for local development.

| Variable                    | Source                                      |
| --------------------------- | ------------------------------------------- |
| `PUBLIC_SUPABASE_URL`       | Supabase Dashboard > Project Settings > API |
| `PUBLIC_SUPABASE_ANON_KEY`  | Supabase Dashboard > Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Project Settings > API |
| `OPENAI_API_KEY`            | platform.openai.com > API Keys              |
| `RESEND_API_KEY`            | resend.com > API Keys                       |
| `UNSUBSCRIBE_SECRET`        | Generate with `openssl rand -hex 32`        |
| `ADMIN_EMAIL`               | Operator's admin email address              |

## Supabase (Dashboard Configuration)

Configured in the Supabase Dashboard, not in the codebase.

| Configuration                                   | Location                                                |
| ----------------------------------------------- | ------------------------------------------------------- |
| Auth providers (magic link enabled)             | Dashboard > Authentication > Providers                  |
| RLS policies on all tables                      | Dashboard > Database > Tables > (each table) > Policies |
| Database function: `rollup_event_metrics_daily` | Dashboard > Database > Functions                        |
| Database function: `purge_event_metrics`        | Dashboard > Database > Functions                        |
| Custom domain or project URL                    | Dashboard > Project Settings > General                  |
| Spend cap (enable for cost protection)          | Dashboard > Project Settings > Billing > Spend Cap      |

## Cloudflare (Dashboard Configuration)

Configured in the Cloudflare Dashboard, not in the codebase.

| Configuration                        | Location                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| Domain DNS (fogr.ai)                 | Dashboard > fogr.ai > DNS                                                       |
| R2 public access for `fograi` bucket | Dashboard > R2 > fograi > Settings > Public Access (custom domain: cdn.fogr.ai) |
| Workers routes                       | Dashboard > Workers & Pages > fogr-ai > Settings > Triggers > Routes            |
| Domain registration and auto-renewal | Dashboard > Registrar > fogr.ai                                                 |

## Setup Checklist for New Deployment

If setting up the platform from scratch:

1. [ ] Create Supabase project (Pro tier for backups)
2. [ ] Run database migrations
3. [ ] Set all main worker secrets via `wrangler secret put`
4. [ ] Set all cron worker secrets via `wrangler secret put --config wrangler.cron.jsonc`
5. [ ] Create R2 buckets (`fograi` and `fograi-pending`)
6. [ ] Configure R2 public access with custom domain (cdn.fogr.ai)
7. [ ] Create KV namespace for rate limiting
8. [ ] Configure DNS records in Cloudflare
9. [ ] Deploy main worker: `npm run deploy`
10. [ ] Deploy cron worker: `npx wrangler deploy --config wrangler.cron.jsonc`
11. [ ] Verify both workers are running in Cloudflare Dashboard

---

_Document: SECRETS.md_
_Last updated: 2026-03-14_
_Covers: Complete env var and binding inventory_
