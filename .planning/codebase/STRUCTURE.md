# Codebase Structure

**Analysis Date:** 2026-02-11

## Directory Layout

```
fogr.ai/
├── src/                          # Source code root
│   ├── routes/                   # SvelteKit file-based routes
│   │   ├── +layout.svelte        # Root layout (navbar, global styles)
│   │   ├── +layout.server.ts     # Root server layout (global data)
│   │   ├── +page.svelte          # Home page (listing search/browse)
│   │   ├── +page.server.ts       # Home page server load
│   │   ├── (app)/                # Authenticated routes group
│   │   │   ├── +layout.server.ts # Fetch current user
│   │   │   ├── post/             # Create new ad
│   │   │   ├── ads/              # Manage user's ads
│   │   │   ├── messages/         # User messaging
│   │   │   ├── account/          # Account settings
│   │   │   └── admin/            # Admin panel (reports, appeals)
│   │   ├── (public)/             # Public routes group
│   │   │   ├── ad/[slug]/        # View single ad (public)
│   │   │   ├── category/[slug]/  # Browse category
│   │   │   ├── login/            # Login page
│   │   │   ├── terms/            # Terms of service
│   │   │   ├── privacy/          # Privacy policy
│   │   │   └── report-status/    # Check report status
│   │   ├── auth/                 # Auth endpoints
│   │   │   ├── callback/         # OAuth callback handler
│   │   │   ├── logout/           # Logout handler
│   │   │   └── set-cookie/       # Cookie management
│   │   └── api/                  # REST API endpoints
│   │       ├── ads/              # Ad operations
│   │       │   ├── +server.ts    # GET list, POST create
│   │       │   └── [id]/         # Individual ad operations
│   │       ├── messages/         # Messaging API
│   │       ├── reports/          # Report operations
│   │       └── me/               # User account endpoints
│   ├── lib/                      # Reusable library code
│   │   ├── components/           # Svelte components
│   │   │   ├── AdCard.svelte     # Ad listing card
│   │   │   ├── Navbar.svelte     # Navigation bar
│   │   │   ├── post/             # Post/edit form components
│   │   │   │   ├── PostFields.svelte
│   │   │   │   ├── ImageDrop.svelte
│   │   │   │   └── StickyCTA.svelte
│   │   │   ├── loading/          # Loading UI components
│   │   │   │   ├── SkeletonBlock.svelte
│   │   │   │   ├── InlineSpinner.svelte
│   │   │   │   └── ProgressBar.svelte
│   │   │   └── messages/         # Message components
│   │   ├── server/               # Server-only utilities
│   │   │   ├── ads-validation.ts # Ad field validators
│   │   │   ├── rate-limit.ts     # Rate limiting logic
│   │   │   ├── metrics.ts        # Event tracking
│   │   │   ├── admin.ts          # Admin permission checks
│   │   │   ├── csrf.ts           # CSRF protection
│   │   │   ├── pagination.ts     # Pagination helpers
│   │   │   ├── moderation-events.ts  # Record moderation actions
│   │   │   ├── moderation-emails.ts  # Email templates
│   │   │   └── e2e-mocks.ts      # Test mock data
│   │   ├── utils/                # Client utilities
│   │   │   ├── tag-to-avatar.ts  # Avatar generation
│   │   │   ├── mythologise.ts    # Identity anonymization
│   │   │   ├── price.ts          # Price formatting
│   │   │   └── loading.ts        # Loading state logic
│   │   ├── clients/              # Client service classes
│   │   │   └── moderationClient.ts # Web Worker moderation client
│   │   ├── workers/              # Web Workers
│   │   │   └── moderation.worker.ts # Text moderation worker
│   │   ├── stores/               # Svelte stores
│   │   │   └── user.ts           # Current user store
│   │   ├── data/                 # Static data files
│   │   │   ├── mock-ads.ts       # Mock ad data
│   │   │   └── ireland_counties.json # Location tree
│   │   ├── assets/               # Static assets
│   │   │   ├── favicon.ico
│   │   │   └── fógraí.svg
│   │   ├── category-profiles.ts  # Category validators & options
│   │   ├── location-hierarchy.ts # Location tree utilities
│   │   ├── location-profile.ts   # Location data helpers
│   │   ├── category-browse.ts    # Category filtering
│   │   ├── constants.ts          # Business rule constants
│   │   ├── banned-words.ts       # Profanity word list
│   │   ├── icons.ts              # Icon definitions
│   │   ├── index.ts              # Library barrel export
│   │   └── supabase.types.ts     # Database schema types (generated)
│   ├── types/                    # TypeScript type definitions
│   │   ├── ad-types.d.ts         # Ad data type definitions
│   │   ├── cloudflare-cache.d.ts # Cloudflare types
│   ├── hooks.server.ts           # Server hooks (auth, supabase init)
│   ├── cron-worker.ts            # Cloudflare Workers cron job
│   ├── app.html                  # HTML shell
│   ├── app.css                   # Global styles
│   ├── worker-configuration.d.ts # Cloudflare bindings (generated)
├── e2e/                          # End-to-end tests
├── static/                       # Static files served at root
├── supabase/                     # Supabase migrations and config
├── scripts/                      # Build and utility scripts
├── .planning/                    # GSD planning documents
│   └── codebase/                 # This directory
├── .svelte-kit/                  # Generated SvelteKit config
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript config
├── svelte.config.js              # SvelteKit config
├── vite.config.ts                # Vite build config
├── playwright.config.ts          # E2E test config
├── eslint.config.js              # Linting config
├── .prettierrc                   # Code formatting config
└── .gitignore                    # Git ignore rules
```

## Directory Purposes

**src/routes/**

- Purpose: File-based routing - each directory becomes a route
- Contains: `.svelte` pages, `+page.server.ts` loaders, `+layout.svelte` wrappers
- SvelteKit compiles this directory into navigable routes
- Groups: `(app)` for authenticated, `(public)` for public, `api/` for REST

**src/lib/components/**

- Purpose: Reusable Svelte UI components
- Contains: Generic components (buttons, cards, inputs) and page-specific components
- Co-organized by feature: `post/`, `messages/`, `loading/`
- Pattern: Components receive props, emit events, use stores sparingly

**src/lib/server/**

- Purpose: Server-only utilities that run on backend
- Contains: Validators, auth, rate limiting, database operations
- Server-side-only imports (Supabase, OpenAI) only allowed here
- NOT accessible from client code (no accidental exports)

**src/lib/utils/**

- Purpose: Pure client-side utility functions
- Contains: Formatting helpers, transformations, calculations
- No side effects, no external API calls
- Used by components and pages for display logic

**src/lib/data/**

- Purpose: Static or semi-static data (location trees, mock data)
- Contains: JSON files, constant lists, test fixtures
- Imported as needed, not loaded on every request

**src/types/**

- Purpose: Shared TypeScript type definitions
- Contains: Database schema types, API response shapes, enums
- `ad-types.d.ts` defines AdCard, ApiAdRow, etc.
- `supabase.types.ts` auto-generated from schema

**src/cron-worker.ts**

- Purpose: Cloudflare Workers scheduled task
- Single file deployed separately from main app
- Runs on schedule (e.g., every 5 minutes)
- Handles: Ad moderation, ad expiry, metrics rollup/purge

## Key File Locations

**Entry Points:**

| File | Purpose |
|------|---------|
| `src/routes/+layout.svelte` | Root HTML layout, Navbar, global styles |
| `src/routes/+page.svelte` | Home page (listing browse/search) |
| `src/routes/+layout.server.ts` | Initialize auth for all routes |
| `src/hooks.server.ts` | Supabase client initialization |
| `src/cron-worker.ts` | Cloudflare cron job entry point |

**Configuration:**

| File | Purpose |
|------|---------|
| `svelte.config.js` | SvelteKit config, Cloudflare adapter |
| `tsconfig.json` | TypeScript compiler options |
| `vite.config.ts` | Vite bundler config |
| `playwright.config.ts` | E2E test configuration |

**Core Logic:**

| File | Purpose |
|------|---------|
| `src/lib/constants.ts` | Business rules (price limits, image size, etc.) |
| `src/lib/category-profiles.ts` | Category validators and metadata |
| `src/lib/location-hierarchy.ts` | Ireland location tree and validators |
| `src/lib/server/ads-validation.ts` | Comprehensive ad field validation |
| `src/lib/server/rate-limit.ts` | Rate limiting with Cloudflare KV |

**Testing:**

| File | Purpose |
|------|---------|
| `e2e/` | Playwright E2E tests |
| `src/lib/**/*.spec.ts` | Vitest unit tests (colocated) |
| `src/demo.spec.ts` | Example test file |

## Naming Conventions

**Files:**

| Pattern | Example | Usage |
|---------|---------|-------|
| `+page.svelte` | `src/routes/(app)/ads/+page.svelte` | Route page component |
| `+page.server.ts` | `src/routes/(app)/ads/+page.server.ts` | Server data loading |
| `+layout.svelte` | `src/routes/(app)/+layout.svelte` | Layout wrapper |
| `+layout.server.ts` | `src/routes/(app)/+layout.server.ts` | Layout-wide server logic |
| `+server.ts` | `src/routes/api/ads/+server.ts` | API endpoint handler |
| `.spec.ts` | `src/lib/utils/price.spec.ts` | Unit tests |
| `.worker.ts` | `src/lib/workers/moderation.worker.ts` | Web Worker script |

**Directories:**

| Pattern | Example | Usage |
|---------|---------|-------|
| `(group)` | `(app)`, `(public)` | Route groups (optional in URL) |
| `[param]` | `[id]`, `[slug]` | Dynamic route segments |
| `[[optional]]` | Rest parameters for advanced routing |

**Components:**

- PascalCase with `.svelte` extension: `AdCard.svelte`, `Navbar.svelte`
- Feature-grouped in subdirectories: `post/`, `messages/`, `loading/`
- Reusable components in `src/lib/components/`
- Page-specific components colocated in route directory

**Functions & Variables:**

- camelCase: `validateAdMeta()`, `tagToAvatar()`, `adList`
- Validators return `string | null`: `validateX() -> string | null`
- Stores end with `$`: `user$`, `user$ = writable()`
- Event handlers start with `on`: `onClick`, `onSubmit`

**Constants:**

- UPPER_SNAKE_CASE: `MAX_TITLE_LENGTH`, `RATE_LIMIT_10M`, `ADS_BUCKET`
- Grouped in `src/lib/constants.ts` or near usage

## Where to Add New Code

**New Feature (Complete Flow):**

1. **Database Schema:** Add migration in `supabase/migrations/`
2. **Types:** Update `src/types/ad-types.d.ts` if shape changes
3. **API Endpoint:** Create `src/routes/api/feature/+server.ts`
4. **Validation:** Add validators in `src/lib/server/feature-validation.ts`
5. **Server Load:** Create `src/routes/(app)/feature/+page.server.ts`
6. **Components:** Create `src/lib/components/Feature.svelte`
7. **Page:** Create `src/routes/(app)/feature/+page.svelte`
8. **Tests:** Add `src/lib/server/feature-validation.spec.ts`

**New Component:**

- Location: `src/lib/components/` (if reusable) or `src/routes/(app)/feature/` (if page-specific)
- File: PascalCase.svelte with props + event dispatching
- Export: Default export only, no named exports

**New Utility Function:**

- Location: `src/lib/utils/feature.ts` if client-side, `src/lib/server/feature.ts` if server-only
- Pattern: Named export, pure function, TypeScript types
- Add `.spec.ts` file alongside with tests

**New Validator:**

- Location: `src/lib/server/feature-validation.ts`
- Pattern: Function named `validate*()` returning `string | null`
- Import and call in API endpoints before database operations

**New API Endpoint:**

- Location: `src/routes/api/resource/[param]/+server.ts`
- Pattern: Export `GET`, `POST`, `PATCH`, `DELETE` RequestHandlers
- Always include:
  - Auth check (`locals.getUser()` if needed)
  - Input validation
  - Error handling with requestId
  - Metrics recording
  - Appropriate HTTP status codes

**New Constants:**

- Add to `src/lib/constants.ts` with comment explaining business rule
- Export named constant in UPPER_SNAKE_CASE
- Group related constants together

## Special Directories

**src/.svelte-kit/**

- Purpose: Generated SvelteKit configuration
- Generated: Yes (build output)
- Committed: No (in .gitignore)
- Do NOT edit manually

**node_modules/**

- Purpose: NPM dependencies
- Generated: Yes (via npm install)
- Committed: No (in .gitignore)
- Update via `npm update`

**supabase/migrations/**

- Purpose: Database schema migrations
- Generated: No (hand-written)
- Committed: Yes
- Run via `supabase migration up`

**e2e/**

- Purpose: End-to-end tests using Playwright
- Generated: No (hand-written)
- Committed: Yes
- Run via `npm run test:e2e`

**test-results/**

- Purpose: Test output and trace files
- Generated: Yes (from Playwright runs)
- Committed: No (in .gitignore)
- Auto-cleanup on new runs

## Route Groups & Organization

**Protected Routes (app):**

- Routes: `src/routes/(app)/**`
- Access: Only authenticated users
- Check: `locals.getUser()` in `+page.server.ts`
- Redirect: To `/login` if not authenticated

**Public Routes (public):**

- Routes: `src/routes/(public)/**`
- Access: Anyone (no auth required)
- No redirect, allows anonymous viewing

**API Routes:**

- Routes: `src/routes/api/**`
- Pattern: JSON responses, `RequestHandler` pattern
- Status: Return appropriate HTTP codes
- Auth: Individual endpoint checks

**Auth Routes:**

- Routes: `src/routes/auth/**`
- Purpose: Login, logout, oauth callback
- Pattern: Redirect-based, no JSON responses

## Import Paths

**Alias:** `$lib/` points to `src/lib/`

- Usage: `import { Component } from '$lib/components/...'`
- Defined in: SvelteKit automatically handles this
- Examples:
  - `import { user$ } from '$lib/stores/user'`
  - `import { validateAdMeta } from '$lib/server/ads-validation'`
  - `import { tagToAvatar } from '$lib/utils/tag-to-avatar'`

**Relative Imports:**

- Use for local sibling files: `import './style.css'`
- Use for parent directory: `import { Component } from '../Component.svelte'`

**Package Imports:**

- ESM only: `import { createClient } from '@supabase/supabase-js'`
- Entry defined in package.json or package's export map

## Database Type Generation

- Source: Supabase schema in PostgreSQL
- Output: `src/lib/supabase.types.ts`
- Generated: Via `wrangler types` or Supabase CLI
- Commit: Yes (include in git)
- Update: When schema changes
