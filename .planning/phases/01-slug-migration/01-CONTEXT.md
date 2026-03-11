# Phase 1: Slug Migration - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate ad URLs from UUIDs to human-readable slugs. Every ad gets a permanent slug containing the title, county, and a short ID. Old UUID URLs 301-redirect to the new slug URL. New ads auto-generate slugs at insert time. This is the load-bearing prerequisite for all downstream SEO work.

</domain>

<decisions>
## Implementation Decisions

### Slug composition
- Slug format: `{title}-{county}-{shortid}` (title first, county last, short ID at end)
- Title portion truncated at ~60 characters on a word boundary
- Common English stop words stripped (a, the, for, and, in, etc.)
- County is always the English name from the location hierarchy (Dublin, Cork, Galway — not Gaillimh)

### Short ID format
- 8 lowercase alphanumeric characters (a-z, 0-9)
- No confusable character exclusions — full 36-char alphabet
- Separated from the title portion by a single dash (same as word separator)
- Server extracts the last 8 chars of the slug to look up the ad

### Slug stability
- Slug is permanent — never changes after creation, even if the title is edited
- Server validates that the title portion of the URL matches the stored canonical slug; if it doesn't, 301-redirects to the canonical URL
- Old UUID URLs detected by regex, DB lookup by `id`, then 301-redirect to the slug URL
- UUID redirects work for all ads regardless of status (expired, rejected, active) — the slug route decides what to display

### Character handling
- Fadas and diacritics transliterated to ASCII (á→a, é→e, ó→o, ú→u, í→i)
- No special Irish language translation — just diacritic stripping applied uniformly
- Emoji and non-alphanumeric special characters stripped entirely
- Empty slug fallback (all non-Latin title): use category name as the readable part (e.g., /ad/bicycles-a1b2c3d4)

### Claude's Discretion
- Exact stop word list
- Slug generation library choice (custom vs slugify package)
- Database index strategy for the slug column
- Collision handling algorithm (retry with new ID vs append counter)
- Migration batch size for populating existing ads

</decisions>

<specifics>
## Specific Ideas

- Example target URL: `/ad/trek-domane-road-bike-dublin-a1b2c3d4`
- Slug lookup is by short ID suffix — the title portion is cosmetic but validated for canonical redirect
- Stack Overflow-style approach: the readable portion is for humans, the ID is for the database

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- Route `src/routes/(public)/ad/[slug]/` already exists — currently passes param as UUID to API
- API endpoint `src/routes/api/ads/[id]/+server.ts` handles GET with Cloudflare edge caching
- Location hierarchy in `src/lib/location-hierarchy.ts` provides county names
- Category data in `src/lib/category-profiles.ts` provides category names for fallback slugs

### Established Patterns
- Supabase migrations in `supabase/migrations/` with sequential numbering
- Server-side validation in `src/lib/server/` returning `string | null`
- Ad creation via POST to `/api/ads` in `src/routes/api/ads/+server.ts`
- Ad types defined in `src/types/ad-types.d.ts` and `src/lib/supabase.types.ts`

### Integration Points
- Ad insert path in POST handler needs slug generation wired in
- Ad view route `[slug]/+page.server.ts` needs to parse slug param differently (extract short ID)
- API GET endpoint needs to support lookup by short ID in addition to UUID
- `AdCard.svelte` component likely generates ad links — needs to use slug URLs
- Internal links in messages, reports, and admin that reference `/ad/{id}` need updating

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-slug-migration*
*Context gathered: 2026-03-11*
