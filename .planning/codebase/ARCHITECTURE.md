# Architecture

**Analysis Date:** 2026-02-11

## Pattern Overview

**Overall:** SvelteKit full-stack application with filesystem-based routing, deployed to Cloudflare Workers

**Key Characteristics:**
- Server-side rendering (SSR) with SvelteKit
- Filesystem-based routing with route groups
- Supabase backend (PostgreSQL + Auth)
- Cloudflare Workers runtime (edge compute)
- R2 object storage for images
- Scheduled cron worker for background tasks

## Layers

**Presentation Layer:**
- Purpose: Renders UI and handles user interactions
- Location: `src/routes/**/*.svelte`, `src/lib/components/**/*.svelte`
- Contains: Svelte components, page routes, layout components
- Depends on: Client stores (`src/lib/stores`), utilities (`src/lib/utils`), API routes
- Used by: End users via browser

**API Layer:**
- Purpose: HTTP API endpoints for client-server communication
- Location: `src/routes/api/**/*+server.ts`
- Contains: RESTful request handlers (GET, POST, PATCH, DELETE)
- Depends on: Server utilities (`src/lib/server`), Supabase client, platform bindings (R2, KV, OpenAI)
- Used by: Frontend pages (via fetch), external services

**Server Logic Layer:**
- Purpose: Business logic, validation, and server-side utilities
- Location: `src/lib/server/**/*.ts`
- Contains: Validation functions, moderation logic, rate limiting, pagination, CSRF protection, admin checks
- Depends on: Database types (`src/lib/supabase.types.ts`), external services (Supabase, OpenAI)
- Used by: API routes, page server load functions, cron worker

**Data Access Layer:**
- Purpose: Database operations and external service integrations
- Location: Supabase client (initialized in `src/hooks.server.ts`), platform bindings
- Contains: Supabase queries, R2 storage operations, KV cache operations
- Depends on: Cloudflare platform environment, Supabase service
- Used by: Server logic layer, API routes

**Background Jobs Layer:**
- Purpose: Scheduled tasks and asynchronous processing
- Location: `src/cron-worker.ts`
- Contains: Pending ad moderation retry, ad expiration, metrics rollup
- Depends on: Supabase REST API, R2 buckets, OpenAI API
- Used by: Cloudflare Cron Triggers (scheduled events)

## Data Flow

**User Authentication Flow:**

1. User requests authentication → hits `src/routes/api/auth/magic-link/+server.ts`
2. Magic link sent via Supabase Auth
3. Callback handled by `src/routes/auth/callback/+server.ts`
4. Session cookie set via `src/routes/auth/set-cookie/+server.ts`
5. `src/hooks.server.ts` creates Supabase client with cookie handling
6. `src/routes/+layout.server.ts` loads user data into page context
7. Client-side store `src/lib/stores/user.ts` maintains reactive user state

**Ad Creation Flow:**

1. User submits form → `POST /api/ads` (`src/routes/api/ads/+server.ts`)
2. Request validated: CSRF check, auth check, rate limiting (KV), daily limit (Supabase)
3. Content moderation: profanity filter, OpenAI moderation API
4. Ad record inserted into Supabase `ads` table
5. Images uploaded to R2 bucket (public or pending based on moderation result)
6. Database updated with image keys
7. If moderation unavailable, ad marked `pending` for cron worker retry
8. Response returned with ad ID for redirect

**Ad Listing Flow:**

1. User loads homepage → `src/routes/+page.server.ts` load function
2. Fetch call to `GET /api/ads` with filters
3. API route queries Supabase with category/price/location filters
4. Results cached in Cloudflare edge cache (5-minute TTL)
5. Data transformed to `AdCard` format
6. Rendered in `src/routes/+page.svelte` using `AdCard.svelte` components

**State Management:**
- Server state: Passed via SvelteKit load functions (`+page.server.ts`, `+layout.server.ts`)
- Client state: Svelte 5 runes (`$state`, `$derived`, `$effect`) and stores (`src/lib/stores/user.ts`)
- Form state: Progressive enhancement with `use:enhance` from `@sveltejs/kit/forms`

## Key Abstractions

**Route Groups:**
- Purpose: Organize routes with shared layouts
- Examples: `src/routes/(app)`, `src/routes/(public)`, `src/routes/api`
- Pattern: Parentheses in folder name create non-URL segments for layout grouping

**Page Server Loads:**
- Purpose: Server-side data fetching before page render
- Examples: `src/routes/+page.server.ts`, `src/routes/(public)/ad/[slug]/+page.server.ts`
- Pattern: `+page.server.ts` exports `load` function; data passed to corresponding `+page.svelte`

**API Request Handlers:**
- Purpose: Handle HTTP methods for API endpoints
- Examples: `src/routes/api/ads/+server.ts` (GET, POST), `src/routes/api/ads/[id]/+server.ts` (PATCH, DELETE)
- Pattern: `+server.ts` exports named functions (GET, POST, PATCH, DELETE) matching HTTP methods

**Platform Bindings:**
- Purpose: Access Cloudflare Workers environment (env vars, KV, R2, D1)
- Examples: `platform.env.ADS_BUCKET`, `platform.env.RATE_LIMIT`, `platform.env.OPENAI_API_KEY`
- Pattern: Accessed via `event.platform.env` in handlers and load functions

**Locals Context:**
- Purpose: Per-request server-side context
- Examples: `locals.supabase` (authenticated Supabase client), `locals.getUser()` (helper to fetch current user)
- Pattern: Initialized in `src/hooks.server.ts`, available in all server contexts

## Entry Points

**Web Application:**
- Location: `src/routes/+layout.svelte` (root layout), `src/routes/+page.svelte` (homepage)
- Triggers: HTTP requests to application routes
- Responsibilities: SSR initial HTML, hydrate client-side interactivity

**API Endpoints:**
- Location: `src/routes/api/ads/+server.ts` (primary ad CRUD), `src/routes/api/messages/+server.ts` (messaging)
- Triggers: Fetch calls from frontend or external HTTP requests
- Responsibilities: Validate, authorize, execute business logic, return JSON

**Server Hooks:**
- Location: `src/hooks.server.ts`
- Triggers: Every server-side request
- Responsibilities: Initialize Supabase client with cookie session handling, attach helpers to `event.locals`

**Cron Worker:**
- Location: `src/cron-worker.ts`
- Triggers: Cloudflare Cron Triggers (configured in `wrangler.cron.jsonc`)
- Responsibilities: Retry pending ad moderation, expire old ads, rollup metrics, purge old metrics

**App Initialization:**
- Location: `src/app.html` (HTML shell), `src/app.css` (global styles)
- Triggers: All page loads
- Responsibilities: Provide HTML structure and global CSS for SvelteKit app

## Error Handling

**Strategy:** Centralized error responses with request ID tracking

**Patterns:**
- API routes return structured JSON errors: `{ success: false, message: string, requestId?: string }`
- Status codes: 400 (validation), 401 (auth), 403 (forbidden), 413 (payload too large), 429 (rate limit), 500 (server error), 503 (service unavailable)
- Request IDs generated via `crypto.randomUUID()` for traceability
- Server-side errors logged with structured JSON: `{ level, message, requestId, ...extra }`
- Page load errors: Use SvelteKit's `error()` helper to throw HTTP errors with messages
- Client-side errors: Try/catch in async functions, display user-friendly messages

## Cross-Cutting Concerns

**Logging:** Structured JSON logging to console with log levels (info, warn, error) and request IDs

**Validation:**
- Input validation in `src/lib/server/ads-validation.ts` (centralized rules)
- Category/location validation using helper functions (`asCategory`, `getCountyOptionById`)
- Type safety via TypeScript and Supabase-generated types (`src/lib/supabase.types.ts`)

**Authentication:**
- Supabase Auth with magic link flow
- Session persisted in HTTP-only cookies
- User context loaded in root layout server load
- Protected routes redirect unauthenticated users (e.g., `src/routes/(app)/post/+page.server.ts`)
- Admin role checked via email allowlist (`src/lib/server/admin.ts`)

**Rate Limiting:**
- Cloudflare Workers KV for rate limit counters
- Sliding window algorithm (`src/lib/server/rate-limit.ts`)
- Per-user and per-IP limits
- Returns `429` with `Retry-After` header

**CSRF Protection:**
- Same-origin check in API POST/PATCH/DELETE handlers (`src/lib/server/csrf.ts`)
- Rejects cross-origin requests

**Caching:**
- Cloudflare edge cache for public API responses (5-minute TTL with stale-while-revalidate)
- R2 objects served with immutable cache headers for public images
- Private cache-control headers for authenticated pages

**Content Moderation:**
- Client-side pre-check via Web Worker (`src/lib/workers/moderation.worker.ts`)
- Server-side profanity filter (leo-profanity, obscenity libraries)
- OpenAI Moderation API for text and images
- Pending status for ads when moderation API unavailable (retried by cron worker)

---

*Architecture analysis: 2026-02-11*
