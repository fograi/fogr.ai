# Phase 5: Launch Hardening - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the platform safe for public launch. Deliver: new-account moderation hold, content seeding (32 counties x bike types), mobile audit at 375px, commercial reseller detection, anti-scam safety guidance, and private-seller trust messaging. Does NOT include Google Search Console submission, performance/load testing, user banning system, or Supabase tier changes (documented as pre-launch gate in STATE.md).

</domain>

<decisions>
## Implementation Decisions

### New-account moderation hold

- Instant AI moderation stays — no behaviour change from current flow for new accounts
- Text-only ads from new accounts still get synchronous OpenAI check and auto-approve if clean (same as established accounts)
- Image ads from new accounts still go through cron queue (same as established accounts — already a 15-min max wait)
- No separate "hold queue" concept — the existing pending→active flow via AI moderation is sufficient
- New accounts defined as: fewer than 3 approved ads OR account age < 7 days (per success criteria)

### Content seeding

- **Volume**: 32 counties x ~6 bike types (electric, folding, mountain, kids, BMX, road) = ~192 listings
- **Tone**: Humorous, satirical, locally-flavoured per county. Not insulting — witty with local references. Each listing is informative about how posting works on the platform
- **No shortcuts**: Every listing gets unique content tailored to its county and bike type
- **Images**: Royalty-free stock photos from Unsplash/Pexels only. No AI-generated images (Irish users react negatively to AI imagery)
- **Presentation**: Blend in as real ads — no "Example" badge or special label
- **Lifecycle**: Active with 14-day expiry. Site looks alive at launch; seeds naturally expire within 2 weeks
- **Seller account**: Single 'fogr.ai' system account posts all seeds. Transparent that it's platform content if you check the seller
- **Messaging**: Contact Seller enabled — if someone messages, it goes to the operator. This is useful market signal for early traction
- **Script**: Standalone seed script using Supabase service role key, bypasses API rate limits and moderation. Pre-approved (status: 'active'), valid slugs, location_profile_data JSONB, category_profile_data JSONB

### Mobile audit

- Test critical path (post ad, browse, view, contact seller) at 375px width
- Fix blocking layout/interaction issues only — no style redesign
- Use existing breakpoint conventions (@media max-width: 640px)
- Newspaper aesthetic preserved — no visual changes beyond fixes

### Commercial reseller detection

- Rule-based heuristics in the ad POST handler — not ML
- Signals: bulk posting rate, dealer language patterns ("call for price", "stock #", phone numbers in description, URL patterns, price lists)
- Flagged ads route to pending for review — not auto-rejected
- Seller is NOT notified of flagging (to avoid gaming the system)
- Uses existing moderation pipeline — no new admin UI needed beyond existing reports panel

### Safety guidance

- **Post form**: Summary safety checklist shown on the final review step before submission (not scattered through form steps)
- **Ad view page**: Collapsible "Stay Safe" accordion below the ad description, above similar listings. Collapsed by default
- **Tone**: Friendly and brief — 3-4 short bullet points. "Meet in a public place", "Cash on collection is safest". Matches newspaper-simple brand
- **Dedicated page**: /safety page with comprehensive guidance. Inline tips link to it with "Learn more"
- **No tracking of dismissed tips** — no localStorage state management

### Trust messaging

- **Positioning strategy**: Three angles combined across different pages:
  - Anti-dealer (browse pages): "No dealers. No middlemen. Real people selling real things."
  - Simplicity (homepage hero): "Honest ads. Fair prices. No clutter."
  - Community (about page): "Your local noticeboard, online." Irish identity angle.
- **Homepage**: Woven into existing hero subtitle/description — no new section added, just better copy
- **Post form**: Brief private-seller note at top of form ("Fogr.ai is for private sellers only") + private-seller confirmation checkbox at submission step (enforceable)
- **About page**: New /about page with mission, values, Irish-language brand story ("Fograí" meaning), who made it, why it exists, private-seller-only policy
- **Footer**: Trust points already in footer area — update copy to align with positioning

### Claude's Discretion

- Exact safety tip wording and bullet points
- /safety page content structure and comprehensiveness
- /about page copywriting and layout
- Reseller detection heuristic thresholds and keyword lists
- Mobile audit fix prioritisation
- Seed script technical implementation (batch insert vs individual)
- Seed listing content (titles, descriptions, prices) within the tone guidelines
- Hero copy updates — specific wording within "simplicity and honesty" angle

</decisions>

<specifics>
## Specific Ideas

- Seed listings should set a tone for each county — e.g., a Dublin mountain bike listing reads differently from a Kerry one. Local humour, local references, how the bike was used in that area
- "Second-Hand" language established in Phase 2 — carry through to all new copy
- Brand is "Fogr.ai — Fograí" on key pages (homepage, about), just "Fogr.ai" in compact contexts
- Private-seller checkbox on post form is legally enforceable — creates basis for removing commercial listings
- Operator receives messages to seed listings — early market signal before real sellers arrive
- The 14-day seed expiry means the site needs real listings within 2 weeks of launch or it goes quiet again

</specifics>

<code_context>

## Existing Code Insights

### Reusable Assets

- `src/routes/api/ads/+server.ts`: Ad POST handler with existing moderation flow — reseller detection hooks in here
- `src/cron-worker.ts`: Moderation cron with pending→active flow — new-account hold uses existing pipeline
- `src/lib/components/post/PostFields.svelte`: Multi-step form — safety checklist goes in review step
- `src/routes/(public)/ad/[slug]/+page.svelte`: Ad view page — collapsible safety section goes below description
- `src/lib/components/AdCard.svelte` / `AdCardWide.svelte`: No changes needed — seed ads use standard cards
- `src/lib/data/ireland_counties.json`: All 32 counties with hierarchical structure — seed script iterates these
- `src/lib/location-hierarchy.ts`: buildLocationProfileData() for seed listing JSONB
- `src/lib/category-profiles.ts`: Category data for seed listing category_profile_data JSONB
- `src/lib/server/slug.ts`: generateSlug() for seed listing slugs
- Expired ad handling from Phase 2 — seed ads naturally use this when they expire after 14 days

### Established Patterns

- Supabase migrations in `supabase/migrations/` with sequential numbering
- Status values: 'active', 'pending', 'rejected', 'expired', 'sold', 'archived'
- Rate limiting via Cloudflare KV — seed script bypasses via service role
- Responsive breakpoints: 640px (mobile), 768px (tablet), 1024px (desktop)
- Route groups: (public) for crawlable, (app) for authenticated
- Email notifications respect email_preferences table
- DSA-compliant moderation events audit trail

### Integration Points

- Ad POST handler: add reseller heuristic check before/after existing moderation
- Post form review step: add safety checklist component
- Ad view page: add collapsible safety section
- Homepage hero: update copy in existing +page.svelte
- Footer: update trust copy in +layout.svelte
- New routes: /safety (public), /about (public)
- New migration: possibly add account_trust or posting_count tracking if not derivable from existing data
- Seed script: standalone file, runs once, uses Supabase service role client

</code_context>

<deferred>
## Deferred Ideas

- UK DUA Act 2025 complaints handling procedure — noted in Phase 3 context, not addressed in this phase
- Supabase Pro upgrade ($25/mo) — documented as pre-launch gate in STATE.md, operator action not code change
- Google Search Console submission — post-launch action, not this phase
- User banning/suspension system — not needed for v1, reseller detection flags for review only

</deferred>

---

_Phase: 05-launch-hardening_
_Context gathered: 2026-03-13_
