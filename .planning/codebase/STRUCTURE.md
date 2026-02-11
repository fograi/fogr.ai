# Codebase Structure

**Analysis Date:** 2026-02-11

## Directory Layout

```
fogr.ai/
├── .claude/                    # Claude AI agent configurations (GSD system)
├── .github/workflows/          # GitHub Actions CI/CD
├── .planning/                  # Project planning and codebase analysis
│   └── codebase/              # Architecture and structure docs
├── e2e/                       # Playwright end-to-end tests
├── scripts/                   # Build and utility scripts
├── src/                       # Application source code
│   ├── data/                  # Mock data for testing
│   ├── lib/                   # Shared library code
│   │   ├── assets/           # Static assets
│   │   ├── clients/          # Client-side service clients
│   │   ├── components/       # Reusable Svelte components
│   │   ├── data/             # Data utilities and constants
│   │   ├── server/           # Server-only utilities
│   │   ├── stores/           # Svelte stores
│   │   ├── utils/            # Shared utilities
│   │   └── workers/          # Web Workers
│   ├── routes/               # SvelteKit filesystem routes
│   │   ├── (app)/           # Authenticated route group
│   │   ├── (public)/        # Public route group
│   │   ├── api/             # API endpoints
│   │   └── auth/            # Auth callback routes
│   ├── types/                # TypeScript type definitions
│   ├── app.css               # Global styles
│   ├── app.d.ts              # App-level TypeScript declarations
│   ├── app.html              # HTML shell template
│   ├── cron-worker.ts        # Scheduled background worker
│   └── hooks.server.ts       # SvelteKit server hooks
├── static/                    # Static files served from root
├── supabase/                  # Supabase migrations and config
├── test-results/              # Test output artifacts
├── package.json               # Node dependencies and scripts
├── playwright.config.ts       # Playwright test configuration
├── svelte.config.js          # SvelteKit configuration
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite build configuration
└── wrangler.jsonc            # Cloudflare Workers deployment config
```

## Directory Purposes

**`.claude/`:**
- Purpose: Claude AI agent system configurations (GSD - Get Shit Done)
- Contains: Agent definitions, command workflows, templates, references
- Key files: Various workflow definitions for project management automation

**`e2e/`:**
- Purpose: End-to-end tests using Playwright
- Contains: Browser-based integration tests
- Key files: Test specifications for user flows

**`src/data/`:**
- Purpose: Mock and test data
- Contains: Sample ad data for testing
- Key files: `mock-ads.ts`

**`src/lib/`:**
- Purpose: Shared library code (both client and server)
- Contains: Components, utilities, business logic
- Key files: `category-profiles.ts`, `location-hierarchy.ts`, `constants.ts`, `supabase.types.ts`

**`src/lib/server/`:**
- Purpose: Server-only code (never bundled to client)
- Contains: Validation, rate limiting, admin checks, moderation logic
- Key files: `ads-validation.ts`, `rate-limit.ts`, `csrf.ts`, `admin.ts`, `moderation-events.ts`

**`src/lib/components/`:**
- Purpose: Reusable Svelte components
- Contains: UI components used across multiple pages
- Key files: `AdCard.svelte`, `AdCardWide.svelte`, `Navbar.svelte`

**`src/lib/clients/`:**
- Purpose: Client-side service integrations
- Contains: Web Worker clients for browser-side processing
- Key files: `moderationClient.ts`

**`src/lib/stores/`:**
- Purpose: Svelte stores for reactive state
- Contains: Global client-side state management
- Key files: `user.ts`

**`src/lib/utils/`:**
- Purpose: Utility functions shared across client and server
- Contains: Helper functions, formatters, algorithms
- Key files: `mythologise.ts`, `tag-to-avatar.ts`, `identity-lock.ts`, `price.ts`, `loading.ts`

**`src/lib/workers/`:**
- Purpose: Web Workers for background processing
- Contains: Client-side workers that run off main thread
- Key files: `moderation.worker.ts`

**`src/routes/`:**
- Purpose: SvelteKit filesystem-based routes
- Contains: Pages, layouts, API endpoints
- Key files: `+page.svelte` (homepage), `+layout.svelte` (root layout), `+layout.server.ts` (root server load)

**`src/routes/(app)/`:**
- Purpose: Authenticated application routes
- Contains: Pages requiring login
- Key files: `post/+page.svelte` (create ad), `ads/+page.svelte` (user's ads), `messages/+page.svelte`, `account/+page.svelte`, `admin/`

**`src/routes/(public)/`:**
- Purpose: Public-facing routes
- Contains: Pages accessible without login
- Key files: `ad/[slug]/+page.svelte` (ad detail), `category/[slug]/+page.svelte`, `login/+page.svelte`, `terms/+page.svelte`, `privacy/+page.svelte`

**`src/routes/api/`:**
- Purpose: RESTful API endpoints
- Contains: HTTP request handlers
- Key files: `ads/+server.ts` (list/create ads), `ads/[id]/+server.ts` (update/delete), `messages/+server.ts`, `reports/`

**`src/routes/auth/`:**
- Purpose: Authentication callback routes
- Contains: OAuth/magic link callback handlers
- Key files: `callback/+server.ts`, `logout/+server.ts`, `set-cookie/+server.ts`

**`src/types/`:**
- Purpose: TypeScript type definitions
- Contains: Application-specific types
- Key files: `ad-types.d.ts`, `cloudflare-cache.d.ts`

**`supabase/`:**
- Purpose: Supabase database migrations and configuration
- Contains: SQL migrations, database schema
- Key files: Migration files, seed data

**`static/`:**
- Purpose: Static files served from application root
- Contains: Favicons, robots.txt, images
- Generated: No

## Key File Locations

**Entry Points:**
- `src/app.html`: HTML shell for all pages
- `src/routes/+layout.svelte`: Root layout (wraps all pages)
- `src/routes/+page.svelte`: Homepage
- `src/hooks.server.ts`: Server-side request interceptor
- `src/cron-worker.ts`: Background job entry point

**Configuration:**
- `svelte.config.js`: SvelteKit configuration (adapter, preprocessors)
- `vite.config.ts`: Vite build configuration and test setup
- `tsconfig.json`: TypeScript compiler options
- `wrangler.jsonc`: Cloudflare Workers deployment settings
- `wrangler.cron.jsonc`: Cloudflare Cron Triggers schedule
- `playwright.config.ts`: E2E test configuration
- `eslint.config.js`: Linting rules
- `.prettierrc`: Code formatting rules

**Core Logic:**
- `src/routes/api/ads/+server.ts`: Ad creation and listing API (868 lines - primary business logic)
- `src/lib/server/ads-validation.ts`: Ad validation rules
- `src/lib/server/rate-limit.ts`: Rate limiting logic
- `src/lib/category-profiles.ts`: Category-specific field schemas
- `src/lib/location-hierarchy.ts`: Location data and filtering
- `src/lib/utils/mythologise.ts`: Pseudonymous username generation

**Testing:**
- `src/lib/server/*.spec.ts`: Unit tests for server utilities
- `src/lib/utils/*.spec.ts`: Unit tests for utility functions
- `e2e/*.spec.ts`: End-to-end browser tests
- `src/routes/home-page.server.spec.ts`: Homepage server load tests
- `src/routes/page.svelte.spec.ts`: Homepage component tests

## Naming Conventions

**Files:**
- `+page.svelte`: SvelteKit page component
- `+page.server.ts`: Server-side page load function
- `+layout.svelte`: Layout component
- `+layout.server.ts`: Server-side layout load function
- `+server.ts`: API endpoint request handlers
- `*.spec.ts`: Unit/integration test files
- `*.d.ts`: TypeScript declaration files
- `(groupname)/`: Route group (non-URL segment)
- `[param]/`: Dynamic route segment

**Directories:**
- kebab-case for folders: `src/routes/admin/reports/`
- Parentheses for route groups: `(app)`, `(public)`
- Square brackets for dynamic routes: `[id]`, `[slug]`

**TypeScript:**
- PascalCase for types/interfaces: `AdCard`, `ApiAdRow`, `PageServerLoad`
- camelCase for variables/functions: `getCountyOptions`, `validateAdMeta`
- UPPER_SNAKE_CASE for constants: `MAX_IMAGE_SIZE`, `DEFAULT_LIMIT`

## Where to Add New Code

**New Feature:**
- Primary code: Determine if public or authenticated → `src/routes/(public)/` or `src/routes/(app)/`
- Tests: Co-located `*.spec.ts` files or `e2e/` for integration tests

**New API Endpoint:**
- Implementation: `src/routes/api/[resource]/+server.ts`
- Validation: `src/lib/server/[resource]-validation.ts`
- Types: `src/types/[resource]-types.d.ts`

**New Page:**
- Route: `src/routes/(public)/[page-name]/+page.svelte` or `src/routes/(app)/[page-name]/+page.svelte`
- Server data: `src/routes/(public)/[page-name]/+page.server.ts` (if needed)
- Components: `src/lib/components/[ComponentName].svelte` (if reusable)

**New Component:**
- Reusable UI: `src/lib/components/[ComponentName].svelte`
- Feature-specific: Co-locate with page in `src/routes/[route]/[ComponentName].svelte`
- Subdirectories: Group related components in `src/lib/components/[feature]/`

**New Utility:**
- Shared helpers: `src/lib/utils/[utility-name].ts`
- Server-only: `src/lib/server/[utility-name].ts`
- Tests: `src/lib/utils/[utility-name].spec.ts`

**New Type:**
- App-specific: `src/types/[domain]-types.d.ts`
- Database: Regenerate `src/lib/supabase.types.ts` via Supabase CLI
- Global augmentation: `src/app.d.ts`

**New Store:**
- Global state: `src/lib/stores/[store-name].ts`
- Pattern: Export writable/readable store with typed interface

**New Worker:**
- Background processing: `src/lib/workers/[worker-name].worker.ts`
- Client: `src/lib/clients/[worker-name]Client.ts`

## Special Directories

**`src/routes/(app)/`:**
- Purpose: Authenticated-only routes with shared layout
- Generated: No
- Committed: Yes
- Pattern: All routes require user authentication; redirect to login if not authenticated

**`src/routes/(public)/`:**
- Purpose: Public routes accessible without login
- Generated: No
- Committed: Yes
- Pattern: No authentication required; may have different layout from app routes

**`node_modules/`:**
- Purpose: npm package dependencies
- Generated: Yes (via `npm install`)
- Committed: No (.gitignore)

**`.svelte-kit/`:**
- Purpose: SvelteKit build output and generated files
- Generated: Yes (during build/dev)
- Committed: No (.gitignore)

**`.wrangler/`:**
- Purpose: Cloudflare Wrangler local development cache
- Generated: Yes (during `wrangler dev`)
- Committed: No (.gitignore)

**`test-results/`:**
- Purpose: Playwright test artifacts (screenshots, traces)
- Generated: Yes (during test runs)
- Committed: No (.gitignore)

**`.planning/codebase/`:**
- Purpose: Codebase analysis documentation for GSD system
- Generated: Yes (by `/gsd:map-codebase` command)
- Committed: Yes (part of project documentation)

---

*Structure analysis: 2026-02-11*
