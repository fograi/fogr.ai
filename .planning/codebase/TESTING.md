# Testing Patterns

**Analysis Date:** 2026-02-11

## Test Framework

**Runner:**

- Vitest 4.0.18
- Config: `vite.config.ts` (dual-project setup)

**Assertion Library:**

- Vitest's built-in `expect` API
- Playwright assertions for E2E tests (`@playwright/test` 1.58.2)

**Run Commands:**

```bash
npm run test:unit          # Run all unit tests (runs both projects then exits)
npm run test:e2e           # Run E2E tests with Playwright
npm test                   # Run unit tests then E2E tests
```

**Watch mode:**

- Vitest supports watch mode but no npm script defined
- Run directly: `npx vitest` or `npx vitest --watch`

**Coverage:**

- No coverage script defined
- Can run: `npx vitest --coverage`

## Test File Organization

**Location:**

- Co-located with source files (preferred pattern)
- E2E tests in separate `e2e/` directory
- Server tests: `src/lib/server/*.spec.ts`
- Utility tests: `src/lib/utils/*.spec.ts`
- Svelte component tests: `src/routes/*.svelte.spec.ts`, `src/lib/components/**/*.svelte.spec.ts`

**Naming:**

- Unit tests: `*.spec.ts` (e.g., `pagination.spec.ts`, `ads-validation.spec.ts`)
- E2E tests: `*.test.ts` (e.g., `home.test.ts`, `flows.test.ts`, `avatar-visual.test.ts`)
- Svelte component tests: `*.svelte.spec.ts` (e.g., `page.svelte.spec.ts`)

**Structure:**

```
src/lib/server/
├── pagination.ts
├── pagination.spec.ts
├── ads-validation.ts
└── ads-validation.spec.ts

e2e/
├── home.test.ts
├── flows.test.ts
├── loading.test.ts
├── messages.test.ts
└── avatar-visual.test.ts
```

## Test Structure

**Suite Organization:**

```typescript
// Server/utility tests (src/lib/server/pagination.spec.ts)
import { describe, it, expect } from 'vitest';
import { getPagination } from './pagination';

describe('getPagination', () => {
  it('uses defaults when params are missing', () => {
    const params = new URLSearchParams();
    const { page, limit, from, to } = getPagination(params, 24, 100);
    expect(page).toBe(1);
    expect(limit).toBe(24);
  });

  it('clamps page and limit to valid ranges', () => {
    const params = new URLSearchParams({ page: '0', limit: '500' });
    const { page, limit } = getPagination(params, 24, 100);
    expect(page).toBe(1);
    expect(limit).toBe(100);
  });
});

// E2E tests (e2e/home.test.ts)
import { expect, test } from '@playwright/test';

test('home page renders the main nav', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'fogr.ai' })).toBeVisible();
  await expect(page.locator('header .brand svg')).toBeVisible();
});
```

**Patterns:**

- `describe()` groups related tests by function or feature
- `it()` describes specific behavior in plain English
- Arrange-Act-Assert pattern for unit tests
- E2E tests use `test()` directly (no nested `describe()`)
- One assertion per `it()` preferred, but related assertions grouped
- Test names complete the sentence "it [test name]"

## Mocking

**Framework:** Vitest's built-in `vi` mocking utilities

**Patterns:**

```typescript
// From src/lib/server/moderation-events.spec.ts
import { describe, expect, it, vi } from 'vitest';
import { recordModerationEvent } from './moderation-events';

describe('recordModerationEvent', () => {
  it('inserts moderation event with correct fields', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
    const mockSupabase = { from: mockFrom } as unknown as SupabaseClient<Database>;

    await recordModerationEvent(mockSupabase, { /* params */ });

    expect(mockFrom).toHaveBeenCalledWith('moderation_events');
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ /* fields */ }));
  });
});
```

**What to Mock:**

- External API clients (Supabase, OpenAI) in unit tests
- Browser APIs not available in Node environment
- Cloudflare Workers bindings (KV, R2) when testing locally
- Time-dependent functions (not observed but would use `vi.useFakeTimers()`)

**What NOT to Mock:**

- Pure utility functions
- Type definitions
- Constants
- Validation logic (test actual implementation)

## Fixtures and Factories

**Test Data:**

```typescript
// From src/routes/page.svelte.spec.ts
function buildPageData(overrides: Record<string, unknown> = {}) {
  return {
    user: null,
    isAdmin: false,
    ads: [
      {
        id: 'ad-1',
        title: 'Test Ad',
        price: 10,
        img: '',
        description: 'Test description',
        category: 'Electronics',
        currency: 'EUR',
        locale: 'en-IE'
      }
    ],
    page: 1,
    nextPage: null,
    requestId: undefined,
    q: '',
    category: '',
    priceState: '',
    countyId: '',
    localityId: '',
    locationOptions: {
      counties: [],
      localities: []
    },
    ...overrides
  };
}

describe('/+page.svelte', () => {
  it('should render ad titles', async () => {
    render(Page, {
      props: {
        data: buildPageData()
      }
    });
    // Assertions...
  });
});
```

**Location:**

- Test data factories defined inline in test files
- E2E mocks in `src/lib/server/e2e-mocks.ts`
- Identity lock fixtures in `src/lib/utils/identity-lock.spec.ts` as const arrays

**Pattern:**

- Factory functions accept `overrides` parameter for customization
- Use `...overrides` spread to allow test-specific data
- Const arrays for deterministic test vectors
- E2E tests rely on environment variable `E2E_MOCK:1` to trigger mock data

## Coverage

**Requirements:** No explicit target enforced

**Current state:**

- Vitest configured with `expect: { requireAssertions: true }` (all tests must have at least one assertion)
- Good coverage of validation logic (`ads-validation.spec.ts` has 165 lines)
- Server utilities well-tested (pagination, redirect, rate-limit, etc.)
- Visual regression tests for avatar rendering

**View Coverage:**

```bash
npx vitest --coverage
```

## Test Types

**Unit Tests:**

- Scope: Pure functions, validation logic, utilities
- Environment: Node for server code, Chromium browser for client code via `@vitest/browser-playwright`
- Approach: Test inputs/outputs, edge cases, error conditions
- Examples: `src/lib/server/pagination.spec.ts`, `src/lib/utils/loading.spec.ts`, `src/lib/server/ads-validation.spec.ts`

**Integration Tests:**

- Scope: Not explicitly separated; validation tests cover integration of multiple rules
- Approach: Test complete validation flows with realistic data
- Example: `src/lib/server/ads-validation.spec.ts` tests category profile validation with location data

**E2E Tests:**

- Framework: Playwright (`@playwright/test`)
- Scope: Full user flows, page rendering, navigation, interactions
- Browser: Chromium (headless)
- Server: Wrangler dev server on port 8787 with `E2E_MOCK:1` variable
- Examples: `e2e/home.test.ts`, `e2e/flows.test.ts`, `e2e/avatar-visual.test.ts`

**Vitest Projects:**

```typescript
// From vite.config.ts
test: {
  expect: { requireAssertions: true },
  projects: [
    {
      test: {
        name: 'client',
        browser: {
          enabled: true,
          provider: playwright(),
          instances: [{ browser: 'chromium' }]
        },
        include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
        exclude: ['src/lib/server/**'],
        setupFiles: ['./vitest-setup-client.ts']
      }
    },
    {
      test: {
        name: 'server',
        environment: 'node',
        include: ['src/**/*.{test,spec}.{js,ts}'],
        exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
      }
    }
  ]
}
```

## Common Patterns

**Async Testing:**

```typescript
// Unit tests - simple async/await
it('inserts moderation event', async () => {
  await recordModerationEvent(mockSupabase, params);
  expect(mockInsert).toHaveBeenCalled();
});

// E2E tests - Playwright auto-waits
test('home page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'fogr.ai' })).toBeVisible();
});
```

**Error Testing:**

```typescript
// From src/lib/utils/mythologise.spec.ts
it('throws TypeError when tagChars is not a whole finite number', () => {
  const uid = '351c1f1d-a5e7-48b4-8e51-6706a5428a70';
  const badValues = [3.5, Number.NaN, Number.POSITIVE_INFINITY, '4'] as const;

  for (const badValue of badValues) {
    expect(() => mythologise(uid, TEST_SECRET, { tagChars: badValue as unknown as number }))
      .toThrow(TypeError);
  }
});

it('throws RangeError when tagChars is out of supported bounds', () => {
  const uid = '53b4be17-e238-4e6a-adb3-595229ce134b';
  const badValues = [1, 0, -1, 49] as const;

  for (const badValue of badValues) {
    expect(() => mythologise(uid, TEST_SECRET, { tagChars: badValue }))
      .toThrow(RangeError);
  }
});
```

**Parametric Testing:**

```typescript
// From src/lib/utils/mythologise.spec.ts
it('returns the expected default handles for the provided Supabase UIDs', () => {
  for (const testCase of SUPABASE_UID_EXPECTATIONS) {
    expect(mythologise(testCase.uid, TEST_SECRET)).toBe(testCase.expected);
  }
});

// From src/lib/server/ads-validation.spec.ts
const expectWholeEuroVariant = (result: string | null, rawValue: string) => {
  expect(result).toBeTruthy();
  expect(getWholeEuroValidationMessagesForAmount(rawValue)).toContain(result as string);
};
```

**Svelte Component Testing:**

```typescript
// From src/routes/page.svelte.spec.ts
import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

it('renders unified discovery controls with current filter state', async () => {
  render(Page, {
    props: {
      data: buildPageData({ q: 'bike', category: 'Electronics' })
    }
  });

  await expect.element(page.getByRole('searchbox', { name: 'Search' })).toHaveValue('bike');
  await expect.element(page.getByLabelText('Category')).toHaveValue('Electronics');
});
```

**Visual Regression Testing:**

```typescript
// From e2e/avatar-visual.test.ts
test('avatar rendering is visually consistent', async ({ page }, testInfo) => {
  const first = tagToAvatar(seed, { format: 'svg', size: 96 });
  const second = tagToAvatar(`  ${seed.toLowerCase()}  `, { format: 'svg', size: 96 });

  await page.setContent(`<img src="${svgToDataUri(first.svg)}" />`);

  const comparison = await page.evaluate(async () => {
    // Pixel-by-pixel comparison using canvas
    const pixelHash = (image) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      return canvas.toDataURL('image/png');
    };
    return { aEqualsB: hashA === hashB };
  });

  expect(comparison.aEqualsB).toBe(true);

  const screenshot = await page.getByTestId('avatar-grid').screenshot();
  await testInfo.attach('avatar-visual-grid', {
    body: screenshot,
    contentType: 'image/png'
  });
});
```

---

*Testing analysis: 2026-02-11*
