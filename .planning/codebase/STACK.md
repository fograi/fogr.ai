# Technology Stack

**Analysis Date:** 2026-02-11

## Languages

**Primary:**
- TypeScript 5.9.3 - All application code, server-side logic, and components
- JavaScript (ES Modules) - Configuration files and build scripts

**Secondary:**
- SQL - Database migrations and queries in `supabase/migrations/`

## Runtime

**Environment:**
- Cloudflare Workers (workerd runtime)
- Node.js >=20.19.6 (development)

**Package Manager:**
- npm
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**
- SvelteKit 2.50.2 - Full-stack web framework
- Svelte 5.50.0 - UI component framework
- @sveltejs/adapter-cloudflare 7.2.6 - Deployment adapter for Cloudflare Workers

**Testing:**
- Vitest 4.0.18 - Unit test runner (client and server projects)
- @vitest/browser 4.0.18 - Browser-based component testing
- @vitest/browser-playwright 4.0.18 - Playwright provider for browser tests
- vitest-browser-svelte 2.0.2 - Svelte-specific browser testing utilities
- Playwright 1.58.2 - E2E testing framework (@playwright/test)

**Build/Dev:**
- Vite 7.3.1 - Build tool and dev server
- Wrangler 4.63.0 - Cloudflare Workers CLI for deployment and local development
- svelte-check 4.3.6 - Type checking for Svelte components

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.95.3 - Supabase JavaScript client for database and auth
- @supabase/ssr 0.8.0 - Server-side rendering helpers for Supabase auth
- openai 6.18.0 - OpenAI API client for content moderation

**Infrastructure:**
- @cloudflare/workers-types - TypeScript definitions for Workers runtime (KVNamespace, R2Bucket)

**UI/Utilities:**
- lucide-svelte 0.563.0 - Icon components
- pica 9.0.1 - Image resizing library
- leo-profanity 1.9.0 - Profanity filter
- obscenity 0.4.6 - Content moderation library for text

## Configuration

**Environment:**
- Environment variables configured via `.env` file (present, not tracked in git)
- Cloudflare bindings configured in `wrangler.jsonc`:
  - KV namespace: RATE_LIMIT
  - R2 buckets: ADS_BUCKET, ADS_PENDING_BUCKET
  - Env vars: PUBLIC_R2_BASE (and secrets via `wrangler secret put`)

**Required env vars:**
- `PUBLIC_SUPABASE_URL` - Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key for client-side
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `OPENAI_API_KEY` - OpenAI API key for moderation
- `PUBLIC_R2_BASE` - CDN base URL for R2 bucket
- `ADMIN_EMAIL` or `ADMIN_EMAILS` - Admin user allowlist

**Build:**
- `svelte.config.js` - SvelteKit configuration with Cloudflare adapter
- `vite.config.ts` - Vite configuration with Vitest test projects (client/server)
- `tsconfig.json` - TypeScript compiler options (strict mode enabled)
- `eslint.config.js` - ESLint flat config with TypeScript and Svelte rules
- `.prettierrc` - Code formatting (tabs, single quotes, 100-char width)
- `playwright.config.ts` - E2E test configuration (runs on port 8787 with wrangler dev)
- `wrangler.jsonc` - Main worker configuration
- `wrangler.cron.jsonc` - Cron worker configuration (every 15 minutes)

## Platform Requirements

**Development:**
- Node.js 20.19.6 or higher
- npm for package management
- Local Supabase connection or hosted project
- Optional: Cloudflare Workers account for local wrangler dev with real bindings

**Production:**
- Cloudflare Workers platform
- Supabase hosted database and auth
- Cloudflare R2 storage (two buckets: public and pending)
- Cloudflare KV namespace for rate limiting
- OpenAI API account

---

*Stack analysis: 2026-02-11*
