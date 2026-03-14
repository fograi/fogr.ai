---
phase: 01-slug-migration
verified: 2026-03-14T07:05:09Z
status: passed
score: 5/5 must-haves verified
re_verification: false
human_verification:
  - test: 'Run `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/backfill-slugs.ts` against production'
    expected: 'Script reports backfill_complete with totalProcessed count. All pre-migration ads have slug and short_id populated.'
    why_human: 'Requires live Supabase connection and service role credentials. Note: database was emptied during verification (per STATE.md) -- no pre-migration ads currently exist. New ads get slugs automatically via POST handler. Run defensively before launch as a safety check.'
---

# Phase 01: Slug Migration Verification Report

**Phase Goal:** Ad pages use human-readable URLs so that all downstream SEO work has value from the moment it ships.
**Verified:** 2026-03-14T07:05:09Z
**Status:** passed

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                   | Status   | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | --------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Visiting `/ad/{slug}` opens the correct ad -- URL contains title and short ID, not UUID | VERIFIED | `src/routes/(public)/ad/[slug]/+page.server.ts` line 93: `const shortId = parseSlugShortId(params.slug)` extracts the trailing 8-char alphanumeric ID from the slug. Lines 97-103: `.eq('short_id', shortId).maybeSingle()` queries the ads table by short_id to load the correct ad. The slug format `{title}-{county}-{shortid}` is human-readable with no UUID.                                                                                                                                                                                                           |
| 2   | Visiting an old UUID URL redirects with HTTP 301 to the new slug URL                    | VERIFIED | `src/routes/(public)/ad/[slug]/+page.server.ts` line 81: `if (isUuidParam(params.slug))` detects UUID-format parameters using the regex `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i` (defined in `src/lib/server/slugs.ts` line 88). Lines 82-86: queries ads by UUID `id` to find the slug. Line 89: `throw redirect(301, \`/ad/${data.slug}\`)` performs the permanent redirect.                                                                                                                                                                    |
| 3   | New ads posted after migration automatically get a slug at insert time                  | VERIFIED | `src/routes/api/ads/+server.ts` line 35: `import { generateAdSlug } from '$lib/server/slugs'`. Line 579: `const slug = generateAdSlug(title, countyName, category)` generates the slug inside the POST handler's insert retry loop. Line 580: `const shortId = slug.slice(-8)` extracts the short ID. Lines 598-599: `slug` and `short_id` are included in the `.insert()` payload. No manual step required -- slug is assigned automatically at ad creation time.                                                                                                           |
| 4   | Slug collisions handled automatically (identical titles get distinct slugs)             | VERIFIED | `src/routes/api/ads/+server.ts` line 574: `const MAX_SLUG_RETRIES = 3` sets the retry limit. Line 578: `for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++)` wraps the insert. Line 612: `if (result.error.code === '23505')` catches Postgres unique constraint violations (on `ads_short_id_unique_idx` or `ads_slug_unique_idx`). On collision, the loop continues with a fresh `generateAdSlug()` call, which produces a new random 8-char short ID via nanoid (`src/lib/server/slugs.ts` line 4: `customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8)`). |
| 5   | No existing ad link becomes a permanent 404 -- all resolve via redirect                 | VERIFIED | `src/routes/(public)/ad/[slug]/+page.server.ts` provides two redirect paths: (a) UUID redirect at lines 81-89: any old UUID link is 301-redirected to the canonical slug URL. (b) Canonical slug redirect at lines 137-139: `if (params.slug !== ad.slug) { throw redirect(301, \`/ad/${ad.slug}\`) }` ensures that non-canonical slug variations (e.g., with wrong title segment but valid short ID) also redirect to the correct canonical URL. Together, these guarantee no previously-shared link becomes a permanent 404.                                               |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact                                                  | Expected                                                   | Status   | Details                                                                                                                                                                                                        |
| --------------------------------------------------------- | ---------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/server/slugs.ts`                                 | Slug generation, short ID extraction, UUID detection       | VERIFIED | 146 lines; exports `generateAdSlug` (line 97), `extractShortId` (line 132), `parseSlugShortId` (line 136), `isUuidParam` (line 143). Uses `slugify` + `nanoid` customAlphabet.                                 |
| `src/lib/server/slugs.spec.ts`                            | Unit tests for slug generation                             | VERIFIED | File exists; 14 unit tests confirmed in `01-VALIDATION.md`                                                                                                                                                     |
| `supabase/migrations/20260312_000017_ads_slug_column.sql` | Migration adds slug + short_id columns with unique indexes | VERIFIED | 12 lines; `ADD COLUMN IF NOT EXISTS slug text`, `ADD COLUMN IF NOT EXISTS short_id text`, `CREATE UNIQUE INDEX IF NOT EXISTS ads_short_id_unique_idx`, `CREATE UNIQUE INDEX IF NOT EXISTS ads_slug_unique_idx` |
| `scripts/backfill-slugs.ts`                               | One-off backfill for pre-migration ads                     | VERIFIED | 144 lines; line 8: `import { generateAdSlug } from '../src/lib/server/slugs.js'`; batch processing with `BATCH_SIZE = 100`, collision retry with `MAX_RETRIES = 3`, Postgres 23505 error handling at line 105  |
| `src/routes/(public)/ad/[slug]/+page.server.ts`           | Ad page with UUID redirect + slug routing                  | VERIFIED | 361 lines; 4-case routing: UUID redirect (line 81), short ID parse (line 93), lookup by short_id (line 97), canonical redirect (line 137)                                                                      |
| `src/routes/api/ads/+server.ts`                           | POST handler with slug generation at insert time           | VERIFIED | Line 35: `import { generateAdSlug }`. Line 579: `generateAdSlug(title, countyName, category)` in POST handler. Collision retry loop lines 578-621.                                                             |
| `src/lib/components/AdCard.svelte`                        | Ad card with slug prop for link generation                 | VERIFIED | Line 15: `export let slug: string \| undefined = undefined`. Line 112: `href={resolve('/(public)/ad/[slug]', { slug: slug ?? String(id) })}` uses slug for ad links with UUID fallback.                        |
| `src/types/ad-types.d.ts`                                 | AdCard type includes slug field                            | VERIFIED | Line 16: `slug?: string` in `AdCard` interface. Line 49: `slug?: string` in `ApiAdRow` type.                                                                                                                   |
| `src/lib/supabase.types.ts`                               | Supabase types include slug + short_id                     | VERIFIED | Lines 190-191: `slug: string \| null` and `short_id: string \| null` in Row type. Lines 216-217: slug/short_id in Insert type. Lines 242-243: slug/short_id in Update type.                                    |

### Key Link Verification

| From                        | To                        | Via                                      | Status | Details                                                                         |
| --------------------------- | ------------------------- | ---------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| `ad/[slug]/+page.server.ts` | `src/lib/server/slugs.ts` | import statement                         | WIRED  | Line 4: `import { isUuidParam, parseSlugShortId } from '$lib/server/slugs'`     |
| `api/ads/+server.ts`        | `src/lib/server/slugs.ts` | import statement                         | WIRED  | Line 35: `import { generateAdSlug } from '$lib/server/slugs'`                   |
| `scripts/backfill-slugs.ts` | `src/lib/server/slugs.ts` | import statement                         | WIRED  | Line 8: `import { generateAdSlug } from '../src/lib/server/slugs.js'`           |
| `AdCard.svelte`             | slug prop                 | href with resolve()                      | WIRED  | Line 112: `href={resolve('/(public)/ad/[slug]', { slug: slug ?? String(id) })}` |
| `supabase.types.ts`         | ads table                 | slug/short_id in Row/Insert/Update types | WIRED  | Lines 190-191 (Row), 216-217 (Insert), 242-243 (Update)                         |

### Requirements Coverage

| Requirement | Description              | Status    | Blocking Issue                                                                                                                                 |
| ----------- | ------------------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| SEO-01      | Human-readable URL slugs | SATISFIED | Verified by all 5 observable truths above. Slug format `{title}-{county}-{shortid}` replaces UUIDs. 301 redirects preserve all existing links. |

### Anti-Patterns Found

No anti-patterns found. The slug implementation follows established patterns:

- Uses battle-tested libraries (slugify + nanoid)
- Collision handling via retry with new random ID
- Proper 301 redirects for both UUID and non-canonical slug URLs
- Stop word removal keeps slugs concise

### Human Verification Required

#### 1. Backfill Script Execution

**Test:** Run `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/backfill-slugs.ts` against production.
**Expected:** Script reports `backfill_complete` with `totalProcessed` count. All pre-migration ads have `slug` and `short_id` populated.
**Why human:** Requires live Supabase connection and service role credentials. Note: database was emptied during verification (per STATE.md) -- no pre-migration ads currently exist. New ads get slugs automatically via POST handler. Run defensively before launch as a safety check.

---

_Verified: 2026-03-14T07:05:09Z_
_Verifier: Claude (gsd-verifier)_
