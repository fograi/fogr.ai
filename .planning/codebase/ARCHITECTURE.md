# Architecture

**Analysis Date:** 2026-02-11

## Pattern Overview

**Overall:** Layered SvelteKit full-stack application with strict separation between client-side, server-side, and API layers. Follows SvelteKit conventions with file-based routing, server-side data loading, and isolated API endpoints.

**Key Characteristics:**

- Full-stack TypeScript with SvelteKit 2.x framework
- Server-side rendering with Svelte 5 components
- RESTful API layer for app operations
- Cloudflare Workers integration for scheduled tasks (cron-worker.ts)
- Supabase PostgreSQL database with server-side authentication
- OpenAI integration for AI-based content moderation
- Cloudflare R2 for image storage (pending and public buckets)
- Svelte stores for lightweight client-side state
- Web Workers for client-side moderation checks

## Layers

**Presentation (Client):**

- Purpose: Render UI with Svelte components and handle user interactions
- Location: `src/routes/`, `src/lib/components/`
- Contains: `.svelte` route pages, layout components, UI elements
- Depends on: Server data from `+page.server.ts`, Svelte stores, client utilities
- Used by: Browser requests, handles forms and navigation

**Server-Side Routes:**

- Purpose: Execute server logic, validate user authentication, fetch initial page data
- Location: `src/routes/**/+page.server.ts`, `src/routes/**/+layout.server.ts`
- Contains: `PageServerLoad`, `LayoutServerLoad` functions
- Depends on: Supabase client from hooks, utility validators, permission checks
- Used by: SvelteKit to load data before rendering pages
- Pattern: Each route's data loading is colocated with the `.svelte` file

**API Endpoints:**

- Purpose: Handle HTTP requests for data mutations, searches, and external integrations
- Location: `src/routes/api/**/+server.ts`
- Contains: `RequestHandler` functions (GET, POST, PATCH, DELETE)
- Depends on: Supabase client, OpenAI SDK, Cloudflare R2 bucket access, rate limiting
- Used by: Frontend XHR requests, webhook endpoints

**Server Utilities:**

- Purpose: Reusable business logic for validation, auth, metrics, and moderation
- Location: `src/lib/server/`
- Contains: Validators, rate limiting, CSRF checks, moderation logic

**Client Utilities:**

- Purpose: Client-side helpers for formatting, Avatar generation, UI utilities
- Location: `src/lib/utils/`
- Contains: Pure functions for formatting, mapping, transforms

**Data & Configuration:**

- Purpose: Static data, type definitions, and configuration constants
- Location: `src/lib/`, `src/types/`, `src/data/`
- Contains: Category profiles, location hierarchies, constants

**Database Client:**

- Purpose: Manage Supabase database connection and session handling
- Location: `src/hooks.server.ts`
- Contains: Server request handler that initializes Supabase client

**Scheduled Tasks:**

- Purpose: Background processing on Cloudflare Workers schedule
- Location: `src/cron-worker.ts`
- Responsibilities: Moderate pending ads, move approved images, expire old ads, rollup metrics

## Data Flow

**Browsing & Searching (Public):**

1. User navigates to `/` → `src/routes/+page.server.ts` load()
2. Function extracts query params (search, category, location, pagination)
3. Calls fetch('/api/ads?...') with query parameters
4. `/api/ads` GET endpoint validates, queries Supabase, returns filtered ads list
5. Server load returns data to `src/routes/+page.svelte`
6. Page renders ad grid with `AdCard` components

**Creating/Editing Ads:**

1. User navigates to `/post` → `src/routes/(app)/post/+page.server.ts` checks auth
2. Page renders `PostFields` and `ImageDrop` components
3. Form submit → POST `/api/ads`:
   - Client-side moderation check via Web Worker (leo-profanity)
   - Server validation (text, images, category/location data, rate limit)
   - If valid → store ad with status='pending', upload images to R2
4. Cron worker (`src/cron-worker.ts`) processes pending ads:
   - Fetches ads with status='pending'
   - Calls OpenAI omni-moderation API for text + images
   - If passes → copies images to public bucket, updates status='active'
   - If flagged → updates status='rejected'

**Reporting & Moderation:**

1. User clicks "Report" → POST `/api/ads/[id]/report` creates report entry
2. Admin navigates to `/admin/reports` → checks admin permission
3. Admin approves/rejects → POST `/api/ads/[id]/status` updates ad status
4. Records moderation event, sends email to user

**Messaging Between Users:**

1. User views ad → clicks "Message"
2. Creates/fetches conversation, displays thread via `/api/messages`
3. Both users' identities anonymized using `mythologise()` function
4. Avatar generated from user tag via `tagToAvatar()`

## Key Abstractions

**AdCard & ApiAdRow:**

- Transform database rows into display objects
- Location: `src/types/ad-types.d.ts`, `src/routes/+page.server.ts`

**LocationProfileData:**

- Hierarchical location selection (Country → Province → County → Locality)
- Location: `src/lib/location-hierarchy.ts`

**CategoryProfileData:**

- Category-specific attributes (e.g., bike type, size, condition)
- Location: `src/lib/category-profiles.ts`

**ModerationDecision:**

- Three-state outcome: 'allow' | 'flagged' | 'unavailable'
- Used in client/server moderation, cron moderation

**UserLite Store:**

- Minimal Svelte store with id + email
- Location: `src/lib/stores/user.ts`

## Entry Points

**Web App (SvelteKit):**

- Location: `src/routes/+layout.svelte`
- Triggers: HTTP requests to any route
- Responsibilities: Root layout, global assets, Navbar setup

**API Root:**

- Location: `src/routes/api/` directory
- Triggers: XHR/fetch requests
- Endpoints: `/api/ads`, `/api/messages`, `/api/me/*`, etc.

**Authentication:**

- Location: `src/routes/auth/callback/+server.ts`
- Triggers: OAuth callback from Supabase
- Responsibilities: Exchange code for session

**Public Ad Viewing:**

- Location: `src/routes/(public)/ad/[slug]/+page.server.ts`
- Triggers: Public ad link visit (no auth required)

**Admin Routes:**

- Location: `src/routes/(app)/admin/`
- Triggers: Admin navigation
- Checks: Admin permission via `isAdminUser()`

**Cron Worker:**

- Location: `src/cron-worker.ts`
- Triggers: Cloudflare Workers scheduled event
- Tasks: Batch-process pending ads, expire ads, rollup metrics

## Error Handling

**Input Validation:**

- Happens in `src/lib/server/ads-validation.ts`
- Returns `string | null` (null = valid, string = error)
- Validators: `validateAdMeta()`, `validateAdImages()`, `validateLocationProfileData()`

**Rate Limiting:**

- Two windows: 10 minutes (5 posts), 24 hours (30 posts)
- Uses Cloudflare KV namespace
- Returns 429 with `Retry-After` header
- Logic in `src/lib/server/rate-limit.ts`

**Permission Checks:**

- `isAdminUser()` verifies admin flag
- Protected routes redirect unauthenticated users to login

**API Responses:**

- Standardized: `{ success: false, message: string, requestId?: string }`
- Status codes: 400 (validation), 401 (auth), 403 (permission), 429 (rate limit), 500 (error)
- Example in `src/routes/api/ads/+server.ts`

**Content Moderation:**

- Client-side check (Web Worker) timeout 1.5s → fail-open
- Server-side text checks synchronous, always enforce
- OpenAI moderation (cron) can return 'unavailable' → retry later

**Database Errors:**

- Logged but don't crash handlers
- User sees generic error message with requestId for debugging

## Cross-Cutting Concerns

**Logging:**

- Structured event names + context object
- Examples: `cron_ad_activated`, `cron_missing_image`

**Validation:**

- Pure functions return `string | null`
- Fail-fast on first error

**Authentication:**

- Supabase Auth + Session Cookies via `@supabase/ssr`
- Hook initializes client in `src/hooks.server.ts`
- `locals.getUser()` fetches current user

**Rate Limiting:**

- Hard limits per time window
- Checked before expensive operations

**Metrics:**

- Async insert into `event_metrics` table via `recordMetric()`
- Daily rollup, weekly purge (90 days)

**CSRF Protection:**

- Same-origin check in `src/lib/server/csrf.ts`
- Applied to sensitive endpoints

**Content Security:**

- HTML escaping automatic in Svelte templates
- Image URLs validated before rendering
- Text passed through moderation before storage
