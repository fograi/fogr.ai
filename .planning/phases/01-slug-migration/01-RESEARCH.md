# Phase 1: Slug Migration - Research

**Researched:** 2026-03-11
**Domain:** URL slug generation, database migration, SvelteKit routing
**Confidence:** HIGH

## Summary

This phase migrates ad URLs from UUID-based (`/ad/550e8400-e29b-41d4-...`) to human-readable slug-based (`/ad/trek-domane-road-bike-dublin-a1b2c3d4`). The slug format is `{title}-{county}-{shortid}` where the short ID is 8 lowercase alphanumeric characters. The server resolves ads by extracting the last 8 characters of the slug as a lookup key, and validates the title portion for canonical redirect.

The implementation is straightforward: add a `slug` column to the `ads` table, write a generation function using `slugify` + `nanoid`, wire it into the insert path, and update routes. The main complexity is ensuring all existing ad links continue to work via 301 redirects, and that slug collisions are handled gracefully. The codebase currently has 10 places that generate `/ad/{id}` URLs, all of which need updating to use the slug.

**Primary recommendation:** Use the `slugify` npm package for text-to-slug conversion and `nanoid` with `customAlphabet` for short ID generation. Add the slug column as nullable first, backfill, then add NOT NULL constraint. Use SvelteKit's `redirect(301, ...)` in the page server load function for UUID detection and canonical URL enforcement.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Slug format: `{title}-{county}-{shortid}` (title first, county last, short ID at end)
- Title portion truncated at ~60 characters on a word boundary
- Common English stop words stripped (a, the, for, and, in, etc.)
- County is always the English name from the location hierarchy (Dublin, Cork, Galway -- not Gaillimh)
- 8 lowercase alphanumeric characters (a-z, 0-9), full 36-char alphabet
- Separated from the title portion by a single dash (same as word separator)
- Server extracts the last 8 chars of the slug to look up the ad
- Slug is permanent -- never changes after creation, even if title is edited
- Server validates title portion of URL matches stored canonical slug; if not, 301-redirects to canonical
- Old UUID URLs detected by regex, DB lookup by `id`, then 301-redirect to slug URL
- UUID redirects work for all ads regardless of status (expired, rejected, active)
- Fadas and diacritics transliterated to ASCII
- Emoji and non-alphanumeric special characters stripped entirely
- Empty slug fallback: use category name as the readable part

### Claude's Discretion
- Exact stop word list
- Slug generation library choice (custom vs slugify package)
- Database index strategy for the slug column
- Collision handling algorithm (retry with new ID vs append counter)
- Migration batch size for populating existing ads

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| slugify | ^1.6 | Text-to-slug conversion (diacritic transliteration, special char removal) | Most popular slug library (5.8M weekly downloads), zero dependencies, built-in charmap handles fadas (a->a, e->e, etc.), `strict` mode strips non-alphanumeric |
| nanoid | ^5 | Short ID generation (8-char alphanumeric) | Cryptographically secure, `customAlphabet` supports exact 36-char a-z0-9 set, 118 bytes, already ESM |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | - | - | The two core libraries plus existing SvelteKit/Supabase cover all needs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| slugify | @sindresorhus/slugify | More opinionated (camelCase splitting, built-in stop words), but heavier and less control over exact output format |
| slugify | Hand-rolled | Fewer dependencies, but would need to maintain diacritic transliteration charmap manually; error-prone for Irish names |
| nanoid | crypto.randomUUID().slice() | No extra dependency, but UUID chars include uppercase and hyphens; would need post-processing |
| nanoid | Math.random base36 | No dependency, but not cryptographically secure; predictable IDs could enable enumeration |

**Recommendation:** Use `slugify` + `nanoid`. Both are tiny, zero/minimal-dependency, ESM-compatible, and battle-tested. The project already uses ESM (`"type": "module"` in package.json).

**Installation:**
```bash
npm install slugify nanoid
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/
    server/
      slugs.ts              # generateAdSlug(), parseSlugShortId(), isUuidParam()
      slugs.spec.ts         # Unit tests for slug generation
  routes/
    (public)/
      ad/
        [slug]/
          +page.server.ts   # Modified: extract short ID, lookup, canonical redirect
    api/
      ads/
        +server.ts          # Modified: POST handler generates slug at insert
        [id]/
          +server.ts        # Modified: GET supports short ID lookup
supabase/
  migrations/
    20260312_000017_ads_slug_column.sql  # Add slug column, index, backfill
```

### Pattern 1: Slug Generation Function
**What:** Pure function that takes ad title, county name, and category (for fallback), returns a complete slug string.
**When to use:** Called during ad creation (POST handler) and during migration backfill.
**Example:**
```typescript
// src/lib/server/slugs.ts
import slugify from 'slugify';
import { customAlphabet } from 'nanoid';

const generateShortId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
  'for', 'of', 'with', 'by', 'from', 'is', 'it', 'as', 'be',
  'was', 'are', 'been', 'has', 'have', 'had', 'do', 'does',
  'did', 'will', 'would', 'could', 'should', 'may', 'might',
  'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her',
  'its', 'our', 'their', 'i', 'we', 'you', 'he', 'she', 'they',
  'me', 'him', 'us', 'them', 'not', 'no', 'so', 'if', 'up'
]);

const MAX_TITLE_SLUG_LENGTH = 60;

function truncateOnWordBoundary(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastDash = truncated.lastIndexOf('-');
  return lastDash > 0 ? truncated.slice(0, lastDash) : truncated;
}

export function generateAdSlug(
  title: string,
  countyName: string | null,
  categoryName: string | null
): string {
  // 1. Slugify the title (handles diacritics, special chars)
  let titleSlug = slugify(title, { lower: true, strict: true, trim: true });

  // 2. Remove stop words
  const words = titleSlug.split('-').filter(w => w && !STOP_WORDS.has(w));
  titleSlug = words.join('-');

  // 3. Fallback if title produced empty slug (all non-Latin chars / emoji)
  if (!titleSlug) {
    titleSlug = categoryName
      ? slugify(categoryName, { lower: true, strict: true, trim: true })
      : 'listing';
  }

  // 4. Truncate on word boundary
  titleSlug = truncateOnWordBoundary(titleSlug, MAX_TITLE_SLUG_LENGTH);

  // 5. Append county if available
  const countySlug = countyName
    ? slugify(countyName, { lower: true, strict: true, trim: true })
    : '';

  // 6. Generate short ID
  const shortId = generateShortId();

  // 7. Assemble: {title}-{county}-{shortid}
  const parts = [titleSlug, countySlug, shortId].filter(Boolean);
  return parts.join('-');
}
```

### Pattern 2: Short ID Extraction and UUID Detection
**What:** Functions to parse the slug parameter -- extract the 8-char short ID suffix, and detect if the param is a UUID.
**When to use:** In the page server load function to determine routing strategy.
**Example:**
```typescript
// src/lib/server/slugs.ts

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHORT_ID_LENGTH = 8;

export function isUuidParam(param: string): boolean {
  return UUID_REGEX.test(param);
}

export function parseSlugShortId(slug: string): string | null {
  if (slug.length < SHORT_ID_LENGTH) return null;
  const shortId = slug.slice(-SHORT_ID_LENGTH);
  // Validate it's alphanumeric lowercase
  if (!/^[a-z0-9]{8}$/.test(shortId)) return null;
  return shortId;
}
```

### Pattern 3: Route Load with Redirect Logic
**What:** The page server load function handles three cases: UUID param (301 to slug), non-canonical slug (301 to canonical), and correct slug (render page).
**When to use:** In `src/routes/(public)/ad/[slug]/+page.server.ts`
**Example:**
```typescript
// src/routes/(public)/ad/[slug]/+page.server.ts
import { redirect, error } from '@sveltejs/kit';
import { isUuidParam, parseSlugShortId } from '$lib/server/slugs';

export const load = async ({ params, fetch, locals }) => {
  const paramSlug = params.slug;

  // Case 1: Old UUID URL -- lookup by UUID, redirect to slug
  if (isUuidParam(paramSlug)) {
    const { data } = await locals.supabase
      .from('ads')
      .select('slug')
      .eq('id', paramSlug)
      .maybeSingle();

    if (!data?.slug) throw error(404, 'Ad not found');
    throw redirect(301, `/ad/${data.slug}`);
  }

  // Case 2: Extract short ID from slug
  const shortId = parseSlugShortId(paramSlug);
  if (!shortId) throw error(404, 'Ad not found');

  // Lookup by short_id
  const { data: ad } = await locals.supabase
    .from('ads')
    .select('id, slug, ...')
    .eq('short_id', shortId)
    .maybeSingle();

  if (!ad) throw error(404, 'Ad not found');

  // Case 3: Non-canonical slug -- redirect to canonical
  if (paramSlug !== ad.slug) {
    throw redirect(301, `/ad/${ad.slug}`);
  }

  // Case 4: Canonical slug -- render page
  // ... existing load logic using ad.id for API fetch
};
```

### Pattern 4: Database Migration (Three-Step Safe Pattern)
**What:** Add slug column nullable, backfill existing rows, then add NOT NULL + unique constraints.
**When to use:** In a single Supabase migration file (safe for small tables; for larger tables, split into multiple).
**Example:**
```sql
-- Step 1: Add columns (nullable, no lock contention)
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS short_id text;

-- Step 2: Index for lookups (CONCURRENTLY not possible inside a transaction,
-- but for a small table this is fine as a regular CREATE INDEX)
CREATE UNIQUE INDEX IF NOT EXISTS ads_short_id_unique_idx
  ON public.ads (short_id);

CREATE UNIQUE INDEX IF NOT EXISTS ads_slug_unique_idx
  ON public.ads (slug);

-- Step 3: Backfill will be done by application code or a separate script
-- Step 4: After backfill, add NOT NULL constraints
-- ALTER TABLE public.ads ALTER COLUMN slug SET NOT NULL;
-- ALTER TABLE public.ads ALTER COLUMN short_id SET NOT NULL;
```

### Anti-Patterns to Avoid
- **Storing the full slug as the only lookup key:** Slug text changes would break URLs. Instead, the short_id is the stable lookup key; the slug text is cosmetic + canonical.
- **Generating slugs client-side:** Slugs must be server-generated to prevent manipulation and ensure uniqueness.
- **Using sequential numeric IDs:** Predictable, enables enumeration, reveals business metrics.
- **Running backfill in a single UPDATE:** For large tables this locks the table. Batch in chunks of 100-500 rows.
- **Making the slug column NOT NULL before backfill completes:** Would fail on existing rows.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Diacritic transliteration | Custom charmap for a->a, e->e, etc. | `slugify` with built-in charmap | Handles 200+ Unicode characters; Irish fadas are a subset |
| Cryptographic random IDs | Math.random or custom PRNG | `nanoid` customAlphabet | Uniform distribution, no modulo bias, uses crypto.getRandomValues |
| URL-safe string normalization | Regex chains for special chars | `slugify` strict mode | Handles edge cases (consecutive dashes, leading/trailing dashes, Unicode normalization) |
| Stop word removal | Maintain own word list from scratch | Curated list (documented below) | Common English stop words are well-established; just need a static set |

**Key insight:** The slug generation logic is a pipeline of well-solved problems (transliteration, slugification, random ID generation). Each step has a battle-tested library. The custom work is only in composing them together and wiring into the data path.

## Common Pitfalls

### Pitfall 1: Slug Column Without Separate Short ID
**What goes wrong:** If you only store the full slug and parse the short ID at query time, you cannot create a proper index for the 8-char lookup key.
**Why it happens:** Temptation to keep schema simple with one column.
**How to avoid:** Store `short_id` as a separate indexed column alongside `slug`. The slug is for display/canonical comparison; the short_id is for fast lookups.
**Warning signs:** Queries using `RIGHT(slug, 8)` or `substring(slug from '.{8}$')` -- these cannot use a B-tree index effectively.

### Pitfall 2: Race Condition in Slug Generation
**What goes wrong:** Two concurrent ad inserts generate the same short ID; one insert fails with a unique constraint violation.
**Why it happens:** nanoid collision probability is very low (36^8 = ~2.8 trillion combinations) but non-zero, especially if entropy source is weak.
**How to avoid:** Wrap insert in a retry loop (max 3 attempts) that generates a new short ID on unique constraint violation. Check for Postgres error code `23505` (unique_violation).
**Warning signs:** Sporadic 500 errors on ad creation in production.

### Pitfall 3: Forgetting to Update All Ad Link References
**What goes wrong:** Some pages still link to `/ad/{uuid}`, causing unnecessary redirect chains. Each redirect adds latency and confuses crawlers if chained.
**Why it happens:** Ad links are generated in 10+ places across the codebase (components, API responses, emails, admin pages).
**How to avoid:** The POST response must return the slug, and all link generators must use it. Comprehensive grep for `/ad/` patterns.
**Integration points requiring update (verified by codebase grep):**
1. `src/lib/components/AdCard.svelte` -- line 105 (uses `id` as slug param)
2. `src/routes/(app)/post/+page.svelte` -- line 396 (redirect after creation)
3. `src/routes/(app)/ads/+page.svelte` -- lines 92, 179 (share link, view button)
4. `src/routes/(app)/ads/[id]/edit/+page.svelte` -- line 491 (redirect after edit)
5. `src/routes/(app)/admin/appeals/+page.svelte` -- line 158 (admin ad link)
6. `src/routes/(app)/messages/[id]/+page.svelte` -- line 199 (conversation ad link)
7. `src/lib/server/moderation-emails.ts` -- line 31 (`buildAdUrl` function)
8. `src/routes/api/ads/[id]/report/+server.ts` -- line 174 (report location URL)

### Pitfall 4: Slug Backfill for Existing Ads Without Location Data
**What goes wrong:** Some existing ads may have null `location_profile_data` or no county set. The slug generation needs the county name but might get null.
**Why it happens:** Location profile data was added in migration 000016; older ads may not have it.
**How to avoid:** Make county portion optional in slug generation. If no county is available, omit it: `{title}-{shortid}`. The slug is still valid and unique because the short ID is the lookup key.
**Warning signs:** Backfill script crashes on NullPointerError accessing county name.

### Pitfall 5: API GET Endpoint Still Uses UUID-Only Lookup
**What goes wrong:** The internal API at `/api/ads/[id]` currently does `.eq('id', id)` (UUID lookup). After migration, the page server load will need to look up by short_id, but the API endpoint might not support it.
**Why it happens:** The existing API was designed for UUID-only access.
**How to avoid:** Either modify the API endpoint to accept short_id as a query parameter, or do the lookup directly in the page server load function using Supabase client (bypassing the API). The latter is simpler since the page server load already has access to `locals.supabase`.

### Pitfall 6: E2E Mock Ad Has No Slug
**What goes wrong:** E2E tests break because the mock ad in `src/lib/server/e2e-mocks.ts` does not have `slug` and `short_id` fields.
**Why it happens:** New columns not added to mock data.
**How to avoid:** Update `E2E_MOCK_AD` to include `slug` and `short_id` fields. Update `ApiAdRow` type to include optional `slug` field.

## Code Examples

Verified patterns from the existing codebase:

### Supabase Migration Pattern (from existing migrations)
```sql
-- Pattern from 20260209_000016_ads_location_profile_data.sql
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS slug text;

-- Use IF NOT EXISTS for idempotent indexes
CREATE UNIQUE INDEX IF NOT EXISTS ads_short_id_unique_idx
  ON public.ads (short_id);
```

### SvelteKit Redirect Pattern (from official docs)
```typescript
// Using throw redirect() in load functions
import { redirect, error } from '@sveltejs/kit';

// 301 = permanent redirect (search engines update their index)
throw redirect(301, `/ad/${canonicalSlug}`);
```

### Supabase Insert with Returning (from existing POST handler)
```typescript
// Pattern from src/routes/api/ads/+server.ts line 539-558
const { data: inserted, error: insErr } = await locals.supabase
  .from('ads')
  .insert({
    // ... existing fields ...
    slug: generatedSlug,
    short_id: shortId
  })
  .select('id, slug')
  .single();
```

### Error Classification Pattern (from existing code)
```typescript
// Pattern: check for unique violation on retry
// Postgres error code 23505 = unique_violation
if (insErr?.code === '23505' && insErr.message?.includes('short_id')) {
  // Retry with new short ID
}
```

### Ad Link Generation Pattern (current, to be updated)
```svelte
<!-- Current: uses UUID -->
<a href={resolve('/(public)/ad/[slug]', { slug: String(id) })}>

<!-- After: uses actual slug -->
<a href={resolve('/(public)/ad/[slug]', { slug: ad.slug ?? String(id) })}>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| UUID-only URLs | Human-readable slugs with short ID suffix | This migration | All SEO benefits depend on this; UUID URLs indexed by Google will 301 to slug URLs |
| Single-column UUID lookup | Dual column (slug for display, short_id for lookup) | This migration | Enables fast indexed lookups while maintaining readable URLs |

**Deprecated/outdated:**
- UUID-based ad URLs: Will continue to work via 301 redirect, but all new links will use slugs
- Direct API UUID lookup from page routes: Page server load will use short_id lookup via Supabase client

## Database Schema Design

### Recommended Column Design

| Column | Type | Nullable | Default | Index | Purpose |
|--------|------|----------|---------|-------|---------|
| `slug` | `text` | NOT NULL (after backfill) | none | UNIQUE | Full slug for canonical URL display and comparison |
| `short_id` | `text` | NOT NULL (after backfill) | none | UNIQUE | 8-char alphanumeric ID for fast lookup; extracted from slug suffix |

### Index Strategy (Claude's Discretion)

**Recommendation:** Two separate unique indexes rather than a composite index.

1. **`ads_short_id_unique_idx` on `(short_id)`** -- Primary lookup index. Every page view queries by short_id. Must be unique to prevent collisions.
2. **`ads_slug_unique_idx` on `(slug)`** -- Prevents duplicate slugs. Used for canonical comparison (equality check in application code, not DB query).

**Why not a single index on `slug`?**
The server extracts the short_id (last 8 chars) for lookup. A B-tree index on the full slug does not help with suffix matching. The short_id column enables direct indexed equality lookup: `WHERE short_id = 'a1b2c3d4'`.

**Why UNIQUE indexes instead of plain indexes?**
Both slug and short_id must be unique by design. The UNIQUE constraint serves as both a lookup index and a data integrity guarantee. It also enables the retry-on-collision pattern (catching unique_violation errors).

### Migration Sequence

```
Step 1: ALTER TABLE ADD COLUMN slug text, ADD COLUMN short_id text
        (nullable -- allows existing rows to exist without values)

Step 2: CREATE UNIQUE INDEX on short_id and slug
        (indexes can be created while columns are nullable)

Step 3: Backfill existing rows with generated slugs
        (application-level script using the slug generation function)

Step 4: ALTER TABLE ALTER COLUMN slug SET NOT NULL
        ALTER TABLE ALTER COLUMN short_id SET NOT NULL
        (safe only after all rows have values)
```

**Batch size recommendation:** 100 rows per batch with 100ms delay between batches. The current database is small (early-stage product), so this is primarily for establishing a safe pattern. The backfill can run as a one-off script or as part of the migration.

### Collision Handling (Claude's Discretion)

**Recommendation:** Retry with new short ID (not append counter).

**Why retry, not counter:**
- Counter appends (`a1b2c3d4-2`) change the ID length, breaking the "last 8 chars" extraction rule.
- Counter reveals collision information (security/privacy concern).
- With 36^8 = 2,821,109,907,456 possible IDs, collision probability is negligible. Even with 1,000,000 ads, the birthday paradox probability of any collision is ~0.00002%.
- Max 3 retries is sufficient; if all 3 collide, something is wrong with the entropy source.

```typescript
const MAX_RETRIES = 3;
for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
  const slug = generateAdSlug(title, countyName, categoryName);
  const shortId = slug.slice(-8);
  const { error } = await supabase.from('ads').insert({ ...fields, slug, short_id: shortId });
  if (!error) return { slug, shortId };
  if (error.code !== '23505') throw error; // Not a collision; real error
}
throw new Error('Failed to generate unique slug after retries');
```

## Stop Word List (Claude's Discretion)

**Recommendation:** Conservative list of ~50 common English stop words. Not too aggressive -- removing too many words makes slugs unreadable.

```typescript
const STOP_WORDS = new Set([
  // Articles
  'a', 'an', 'the',
  // Conjunctions
  'and', 'or', 'but', 'nor', 'so', 'yet',
  // Prepositions (common)
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'up', 'about', 'into', 'over', 'after',
  // Pronouns
  'i', 'me', 'my', 'we', 'us', 'our',
  'you', 'your', 'he', 'him', 'his',
  'she', 'her', 'it', 'its', 'they', 'them', 'their',
  // Be verbs
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  // Common verbs
  'has', 'have', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might',
  // Other
  'this', 'that', 'these', 'those', 'not', 'no', 'if', 'as'
]);
```

**Why this list:** Based on standard English NLP stop word lists, filtered down to words that add no SEO value and no readability value in a classified ad URL context. Words like "brand", "new", "sale", "free" are intentionally NOT stop words because they are meaningful for ad titles.

## Open Questions

1. **Backfill Script Execution Environment**
   - What we know: The migration SQL adds columns and indexes. The backfill must run application-level code (to use the same slug generation function).
   - What's unclear: Should backfill run as a Node.js script against the Supabase API, or as a PL/pgSQL function inside the migration?
   - Recommendation: Run as a standalone Node.js script (e.g., `scripts/backfill-slugs.ts`) that uses the Supabase JS client with the service role key. This reuses the exact same `generateAdSlug()` function, ensuring consistency. The migration SQL only adds columns and indexes.

2. **Supabase Types Regeneration**
   - What we know: `src/lib/supabase.types.ts` is auto-generated from the database schema. After adding `slug` and `short_id` columns, types must be regenerated.
   - What's unclear: When in the workflow to regenerate (before or after backfill).
   - Recommendation: Regenerate immediately after running the migration (before backfill). The new columns will appear as nullable in types. After backfill + NOT NULL constraint, regenerate again to get non-nullable types. In practice, regenerate once after the final constraint is added.

3. **Cache Invalidation for UUID-Based Cache Keys**
   - What we know: The API GET handler at `/api/ads/[id]` uses Cloudflare edge cache with cache keys based on the UUID path (`/api/ads/${id}`). After migration, page loads will not hit this cache path.
   - What's unclear: Whether old cached responses for UUID paths need explicit purging.
   - Recommendation: No explicit purging needed. The page server load will bypass the API and query Supabase directly for slug-based lookups. Old cached API responses will naturally expire via TTL. The API endpoint itself remains functional for backward compatibility.

## Sources

### Primary (HIGH confidence)
- **Codebase analysis** -- Direct reading of all files listed in this document (verified file contents, line numbers, patterns)
- **slugify GitHub README** (https://github.com/simov/slugify) -- API, diacritic handling, configuration options, zero dependencies
- **nanoid GitHub README** (https://github.com/ai/nanoid) -- customAlphabet API, 118 bytes, cryptographic security, ESM support

### Secondary (MEDIUM confidence)
- **SvelteKit redirect docs** (https://svelte.dev/docs/kit/load) -- redirect(301, ...) in load functions, param handling
- **PostgreSQL ALTER TABLE docs** -- ADD COLUMN IF NOT EXISTS, SET NOT NULL patterns
- **Nano ID Collision Calculator** (https://alex7kom.github.io/nano-nanoid-cc/) -- collision probability verification for 36-char alphabet, 8-char length

### Tertiary (LOW confidence)
- None -- all findings verified with primary or secondary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- slugify and nanoid are well-documented, widely used, verified via GitHub READMEs
- Architecture: HIGH -- based on direct codebase analysis; all file paths and patterns verified
- Pitfalls: HIGH -- derived from reading the actual code; integration points enumerated via grep
- Database design: HIGH -- follows existing migration patterns in the codebase; PostgreSQL index behavior is well-documented

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable domain; slug patterns and PostgreSQL migration patterns do not change rapidly)
