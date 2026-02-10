# fogr.ai

Local classifieds for Ireland focused on trust and low friction: structured messaging, honest pricing states (Fixed/Free/POA), privacy‑first contact, and clearer reporting/moderation.

## Stack

- SvelteKit on Cloudflare Workers
- Supabase (auth + Postgres)
- R2 for ad images (public + pending buckets)
- KV for rate limiting and per‑ad edit backoff
- OpenAI moderation for text/image checks

## Core Product Flows

- **Post ad**: 3‑step wizard (Details → Price → Photo) with preview modal, price state rules, and quality gates.
- **Messaging**: structured first messages (availability/offer/pickup/question), offer rules (firm/min), auto‑decline, scam warnings, contact reveal after messaging.
- **My ads**: manage status (active/sold/archived), edit flow with exponential per‑ad edit backoff.
- **Reports & moderation**: public report intake, admin review, statements of reasons, and appeals.

## Key Routes

- Public: `/`, `/ad/[slug]`, `/about`, `/privacy`, `/terms`, `/report-status`
- App: `/post`, `/ads` (My ads), `/ads/[id]/edit`, `/messages`, `/messages/[id]`
- Admin (allowlist required): `/admin/reports`, `/admin/appeals`

## API Endpoints (non‑exhaustive)

- Ads: `GET /api/ads`, `POST /api/ads`, `GET/PATCH /api/ads/[id]`, `POST /api/ads/[id]/status`
- Messaging: `POST /api/messages`, `GET /api/messages?adId=...`
- Reports/Appeals: `POST /api/ads/[id]/report`, `POST /api/reports/status`, `POST /api/ads/[id]/appeal`
- Contact reveal: `POST /api/ads/[id]/reveal`

## Environment / Bindings

Required for production‑like behavior:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL` or `ADMIN_EMAILS`
- `OPENAI_API_KEY`
- `PUBLIC_R2_BASE`
- `ADS_BUCKET` (R2)
- `ADS_PENDING_BUCKET` (R2)
- `RATE_LIMIT` (KV)

## Cron / Jobs

- `src/cron-worker.ts` runs scheduled jobs.
- Schedules live in `wrangler.cron.jsonc` (daily rollups, weekly purge for metrics).

## Development

```sh
npm install
npm run dev
```

Build:

```sh
npm run build
```

Unit tests:

```sh
npm run test:unit
```

Collision risk report for pseudonym handles:

```sh
npm run mythologise:collisions
```

Custom scenarios:

```sh
npm run mythologise:collisions -- --users 100000,1000000 --tag-chars 4,6,8,12 --target-prob 0.01
```

E2E tests:

```sh
npm run test:e2e
```

## E2E Mocks

Set `E2E_MOCK=1` to use mocked Supabase data for tests and local flows.
