# Coding Conventions

**Analysis Date:** 2026-02-11

## Naming Patterns

**Files:**
- TypeScript: `kebab-case.ts` (e.g., `ads-validation.ts`, `moderation-events.ts`)
- Test files: `*.spec.ts` for server/utils, `*.test.ts` for E2E (e.g., `pagination.spec.ts`, `home.test.ts`)
- Svelte components: `PascalCase.svelte` (e.g., `AdCard.svelte`, `MessageComposer.svelte`)
- Component test files: `*.svelte.spec.ts` (e.g., `page.svelte.spec.ts`)
- Config files: `kebab-case.config.*` (e.g., `playwright.config.ts`, `vite.config.ts`)

**Functions:**
- Exported functions: `camelCase` (e.g., `getPagination`, `validateAdMeta`, `mythologise`)
- Helper/internal functions: `camelCase` (e.g., `normalizePriceType`, `parseWholeEuro`, `pickMessageVariant`)
- Event handlers: `on` prefix not enforced; descriptive action names used
- Validators return `string | null` (error message or null for valid)

**Variables:**
- Constants at module level: `SCREAMING_SNAKE_CASE` (e.g., `MAX_AD_PRICE`, `COMPRESSION_STAGE_PROGRESS`, `CATEGORIES`)
- Regular variables: `camelCase` (e.g., `limit`, `pageRaw`, `priceType`)
- Private/internal: no special prefix; same `camelCase`
- Destructured params: `camelCase` (e.g., `{ page, limit, from, to }`)

**Types:**
- Type definitions: `PascalCase` (e.g., `Pagination`, `CompressionStage`, `AdValidationInput`)
- Union types from const arrays: `typeof ARRAY[number]` pattern (e.g., `type Category = (typeof CATEGORIES)[number]`)
- Enum-like: const arrays with `as const` (e.g., `PRICE_TYPES = ['fixed', 'free', 'poa'] as const`)
- Generic type parameters: single uppercase letter or descriptive `PascalCase`

## Code Style

**Formatting:**
- Prettier 3.8.1 with prettier-plugin-svelte
- Tabs for indentation (`useTabs: true`)
- Single quotes (`singleQuote: true`)
- No trailing commas (`trailingComma: "none"`)
- 100 character line width (`printWidth: 100`)
- Config: `.prettierrc`

**Linting:**
- ESLint 9.39.2 with typescript-eslint 8.54.0
- Flat config format (`eslint.config.js`)
- Extends: `@eslint/js`, `typescript-eslint`, `eslint-plugin-svelte`, `eslint-config-prettier`
- `no-undef` disabled for TypeScript (per typescript-eslint recommendation)
- `@typescript-eslint/no-unused-vars` disabled for Svelte files
- Generated files ignored: `src/worker-configuration.d.ts`

**TypeScript:**
- Strict mode enabled (`strict: true` in `tsconfig.json`)
- `checkJs: true` and `allowJs: true` for gradual typing
- Module resolution: `bundler`
- Path alias: `$lib` resolves to `src/lib` (SvelteKit default)
- `$env/static/public` and `$env/static/private` for environment variables

## Import Organization

**Order:**
1. Type imports from external packages (e.g., `import type { Handle } from '@sveltejs/kit'`)
2. Value imports from external packages (e.g., `import { createServerClient } from '@supabase/ssr'`)
3. Environment variables (e.g., `import { PUBLIC_SUPABASE_URL } from '$env/static/public'`)
4. Internal types (e.g., `import type { Database } from '$lib/supabase.types'`)
5. Internal utilities and functions

**Path Aliases:**
- `$lib` → `src/lib` (all internal library code)
- `$app/environment` → SvelteKit app module
- `$env/static/public` → public environment variables
- `$env/static/private` → private environment variables
- Relative imports used for route-specific files (e.g., `./$types`, `../../../../types/ad-types`)

**Patterns:**
- Group imports by source (external, environment, internal)
- Type imports use `import type` syntax
- Destructure named exports inline (e.g., `import { createClient } from '@supabase/supabase-js'`)

## Error Handling

**Patterns:**
- Validation functions return `string | null` (error message or null for success)
- API routes throw `error(status, message)` from SvelteKit (e.g., `error(404, 'Not found')`)
- Client-side forms throw `new Error(message)` for user-facing errors
- Type-safe errors: `TypeError` for type violations, `RangeError` for bounds violations
- Async operations use try-catch with console warnings for non-critical failures

**Examples:**
```typescript
// Validation pattern (src/lib/server/ads-validation.ts)
export function validateAdMeta(input: AdValidationInput): string | null {
  if (!category) return 'Category is required.';
  if (price <= 0) return 'Fixed price must be greater than 0.';
  return null; // Success
}

// SvelteKit error throwing (routes)
if (!ad) {
  error(404, 'Ad not found');
}

// Client-side error (Svelte components)
if (!res.ok) throw new Error('We could not post your ad. Try again.');

// Type validation (src/lib/utils/mythologise.ts)
if (!Number.isInteger(tagChars) || !Number.isFinite(tagChars)) {
  throw new TypeError('tagChars must be a whole number.');
}
```

**Non-critical failures:**
- Log with `console.warn` and continue (e.g., rate limit KV errors, metrics failures)
- Pattern: `console.warn('descriptive_snake_case_event', errorOrContext)`

## Logging

**Framework:** `console` (built-in)

**Patterns:**
- Error logs: `console.error('snake_case_event_name', contextObject)`
- Warning logs: `console.warn('snake_case_event_name', contextObject)`
- Info logs: `console.log('snake_case_event_name', contextObject)`
- Event names use snake_case with domain prefix (e.g., `cron_supabase_fetch_failed`, `moderation_event_insert_failed`)
- Always include context object with relevant IDs and error details

**When to Log:**
- Infrastructure failures (database, KV, R2 bucket errors)
- Rate limit violations
- Moderation events
- Cron job lifecycle events
- Missing required environment variables or bindings

**Examples:**
```typescript
// From src/cron-worker.ts
console.error('cron_supabase_fetch_failed', await res.text());
console.log('cron_ad_activated', { id: ad.id });
console.warn('cron_missing_image', { id: ad.id, key: keys[0] });

// From src/lib/server/rate-limit.ts
console.warn('Rate limit KV error', err);

// From src/lib/server/moderation-events.ts
console.warn('moderation_event_insert_failed', error);
```

## Comments

**When to Comment:**
- Data integrity warnings (e.g., "APPEND ONLY. Never reorder, or existing users' names will change.")
- Complex algorithms or non-obvious logic
- TypeScript workarounds with links to documentation
- Regex patterns and validation rules
- Business logic rationale (e.g., why certain categories allow POA)

**JSDoc/TSDoc:**
- Used sparingly on exported utilities with non-obvious behavior
- Type definitions in JSDoc style for key functions in `src/lib/utils/mythologise.ts` and `src/lib/utils/tag-to-avatar.ts`
- Most functions rely on TypeScript signatures rather than JSDoc

**Examples:**
```typescript
// From eslint.config.js
// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors

// From src/lib/utils/mythologise.ts
/**
 * APPEND ONLY. Never reorder, or existing users' names will change.
 * gender: "m" | "f"
 * type: "myth" | "nature" | "place"
 */
```

## Function Design

**Size:** Functions generally under 50 lines; validation functions under 100 lines

**Parameters:**
- Use object destructuring for multiple related params
- Optional params use `?:` TypeScript syntax
- Default values in function signature (e.g., `getPagination(params, defaultLimit = 24, maxLimit = 100)`)
- Type parameters constrained with `extends` when needed

**Return Values:**
- Validation functions: `string | null` (error or success)
- Utilities: explicit return type when non-obvious
- Server functions: SvelteKit types (`PageServerLoad`, `RequestHandler`, etc.)
- Prefer early returns for error cases

**Examples:**
```typescript
// From src/lib/server/pagination.ts
export function getPagination(
  params: URLSearchParams,
  defaultLimit = 24,
  maxLimit = 100
): Pagination {
  // Implementation with early bounds checking
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), maxLimit)
    : defaultLimit;
  return { page, limit, from, to };
}

// From src/lib/server/ads-validation.ts
export function validateAdMeta({
  category,
  currency,
  priceStr,
  priceType: priceTypeRaw
}: AdValidationInput): string | null {
  if (!category) return 'Category is required.';
  // More validation...
  return null;
}
```

## Module Design

**Exports:**
- Named exports preferred (e.g., `export function getPagination`, `export const CATEGORIES`)
- Default exports only for Svelte components and SvelteKit page/layout files
- Constants exported as `export const` with uppercase names
- Types exported with `export type`

**Barrel Files:**
- Minimal use; `src/lib/index.ts` contains only a comment placeholder
- No re-export patterns observed
- Each module imports directly from source files

**Module Organization:**
- Server-only code in `src/lib/server/` (excluded from client builds)
- Shared utilities in `src/lib/utils/`
- Type definitions in `src/types/` or co-located with implementation
- Data files in `src/lib/data/` (JSON) and `src/data/`

---

*Convention analysis: 2026-02-11*
