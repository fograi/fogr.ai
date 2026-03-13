# Phase 5: Launch Hardening - Research

**Researched:** 2026-03-13
**Domain:** Platform safety, content seeding, mobile UX, trust messaging
**Confidence:** HIGH

## Summary

Phase 5 hardens fogr.ai for public launch across six plans: new-account moderation hold, content seeding (~192 listings), mobile audit at 375px, commercial reseller detection, anti-scam safety guidance, and private-seller trust messaging. All six areas involve modifications to existing code rather than greenfield builds. The codebase already has the moderation pipeline (pending/active status flow), the location hierarchy (32 counties), the ad POST handler, the multi-step post form, and the ad view page -- Phase 5 hooks into these.

The main technical risks are: (1) the seed script generating ~192 listings with valid JSONB for both `location_profile_data` and `category_profile_data`, requiring correct use of `buildLocationProfileData()` and the bikes profile schema; (2) reseller detection heuristics needing careful regex/threshold tuning to avoid false positives on legitimate sellers; and (3) mobile audit requiring testing on actual 375px viewport to catch issues invisible in desktop dev tools.

**Primary recommendation:** Leverage existing patterns throughout -- Supabase REST API for the seed script (matching cron-worker pattern), existing `pending` status flow for moderation, `details` HTML element for the safety accordion, and the established `(public)` route group for new /safety page.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**New-account moderation hold:**

- Instant AI moderation stays -- no behaviour change from current flow for new accounts
- Text-only ads from new accounts still get synchronous OpenAI check and auto-approve if clean (same as established accounts)
- Image ads from new accounts still go through cron queue (same as established accounts -- already a 15-min max wait)
- No separate "hold queue" concept -- the existing pending->active flow via AI moderation is sufficient
- New accounts defined as: fewer than 3 approved ads OR account age < 7 days (per success criteria)

**Content seeding:**

- Volume: 32 counties x ~6 bike types (electric, folding, mountain, kids, BMX, road) = ~192 listings
- Tone: Humorous, satirical, locally-flavoured per county. Not insulting -- witty with local references. Each listing is informative about how posting works on the platform
- No shortcuts: Every listing gets unique content tailored to its county and bike type
- Images: Royalty-free stock photos from Unsplash/Pexels only. No AI-generated images (Irish users react negatively to AI imagery)
- Presentation: Blend in as real ads -- no "Example" badge or special label
- Lifecycle: Active with 14-day expiry. Site looks alive at launch; seeds naturally expire within 2 weeks
- Seller account: Single 'fogr.ai' system account posts all seeds. Transparent that it's platform content if you check the seller
- Messaging: Contact Seller enabled -- if someone messages, it goes to the operator. This is useful market signal for early traction
- Script: Standalone seed script using Supabase service role key, bypasses API rate limits and moderation. Pre-approved (status: 'active'), valid slugs, location_profile_data JSONB, category_profile_data JSONB

**Mobile audit:**

- Test critical path (post ad, browse, view, contact seller) at 375px width
- Fix blocking layout/interaction issues only -- no style redesign
- Use existing breakpoint conventions (@media max-width: 640px)
- Newspaper aesthetic preserved -- no visual changes beyond fixes

**Commercial reseller detection:**

- Rule-based heuristics in the ad POST handler -- not ML
- Signals: bulk posting rate, dealer language patterns ("call for price", "stock #", phone numbers in description, URL patterns, price lists)
- Flagged ads route to pending for review -- not auto-rejected
- Seller is NOT notified of flagging (to avoid gaming the system)
- Uses existing moderation pipeline -- no new admin UI needed beyond existing reports panel

**Safety guidance:**

- Post form: Summary safety checklist shown on the final review step before submission (not scattered through form steps)
- Ad view page: Collapsible "Stay Safe" accordion below the ad description, above similar listings. Collapsed by default
- Tone: Friendly and brief -- 3-4 short bullet points. "Meet in a public place", "Cash on collection is safest". Matches newspaper-simple brand
- Dedicated page: /safety page with comprehensive guidance. Inline tips link to it with "Learn more"
- No tracking of dismissed tips -- no localStorage state management

**Trust messaging:**

- Positioning strategy: Three angles combined across different pages:
  - Anti-dealer (browse pages): "No dealers. No middlemen. Real people selling real things."
  - Simplicity (homepage hero): "Honest ads. Fair prices. No clutter."
  - Community (about page): "Your local noticeboard, online." Irish identity angle.
- Homepage: Woven into existing hero subtitle/description -- no new section added, just better copy
- Post form: Brief private-seller note at top of form ("Fogr.ai is for private sellers only") + private-seller confirmation checkbox at submission step (enforceable)
- About page: New /about page with mission, values, Irish-language brand story ("Fograi" meaning), who made it, why it exists, private-seller-only policy
- Footer: Trust points already in footer area -- update copy to align with positioning

### Claude's Discretion

- Exact safety tip wording and bullet points
- /safety page content structure and comprehensiveness
- /about page copywriting and layout
- Reseller detection heuristic thresholds and keyword lists
- Mobile audit fix prioritisation
- Seed script technical implementation (batch insert vs individual)
- Seed listing content (titles, descriptions, prices) within the tone guidelines
- Hero copy updates -- specific wording within "simplicity and honesty" angle

### Deferred Ideas (OUT OF SCOPE)

- UK DUA Act 2025 complaints handling procedure -- noted in Phase 3 context, not addressed in this phase
- Supabase Pro upgrade ($25/mo) -- documented as pre-launch gate in STATE.md, operator action not code change
- Google Search Console submission -- post-launch action, not this phase
- User banning/suspension system -- not needed for v1, reseller detection flags for review only
  </user_constraints>

## Standard Stack

### Core (already installed -- no new dependencies)

| Library     | Version | Purpose                                             | Why Standard                        |
| ----------- | ------- | --------------------------------------------------- | ----------------------------------- |
| SvelteKit   | 2.50.2  | Framework -- all routes, server load, form handling | Already in use                      |
| Supabase JS | 2.95.3  | DB client for seed script and new-account queries   | Already in use                      |
| Svelte      | 5.50.0  | Components -- safety accordion, trust messaging     | Already in use                      |
| slugify     | 1.6.6   | Slug generation for seed listings                   | Already in use via `generateAdSlug` |
| nanoid      | 5.1.6   | Short ID generation for seed listings               | Already in use via `customAlphabet` |

### Supporting (already installed -- no new dependencies)

| Library       | Version | Purpose                                               | When to Use               |
| ------------- | ------- | ----------------------------------------------------- | ------------------------- |
| Playwright    | 1.58.2  | Mobile viewport testing at 375px                      | Mobile audit verification |
| lucide-svelte | 0.563.0 | Icons for safety section (ShieldCheck, AlertTriangle) | Safety guidance UI        |

### No New Dependencies Required

This phase requires zero new npm packages. All work uses existing libraries, Supabase REST API (via fetch in seed script, matching cron-worker pattern), and built-in HTML elements (`<details>/<summary>` for accordions).

## Architecture Patterns

### Recommended Project Structure (new files only)

```
src/
├── lib/
│   ├── server/
│   │   └── reseller-detection.ts    # Heuristic functions, exported for testing
│   └── safety-tips.ts               # Safety tip content as typed constants
├── routes/
│   ├── (public)/
│   │   ├── about/
│   │   │   └── +page.svelte         # EXISTS -- rewrite with trust messaging
│   │   └── safety/
│   │       └── +page.svelte         # NEW -- comprehensive safety page
│   └── +page.svelte                 # MODIFY -- hero copy update
│   └── +layout.svelte               # MODIFY -- footer trust copy + safety link
scripts/
└── seed-listings.ts                 # Standalone seed script (runs once)
supabase/
└── migrations/
    └── 20260313_000022_*.sql        # Only if schema changes needed
```

### Pattern 1: New-Account Detection via Count Query

**What:** Check account age and approved-ad count at ad submission time to determine if the user is "new"
**When to use:** In the ad POST handler, after auth but before moderation
**Example:**

```typescript
// In src/routes/api/ads/+server.ts POST handler
// After: const user = ... (auth check)
// Before: existing moderation flow

async function isNewAccount(supabase: SupabaseClient, userId: string): Promise<boolean> {
	// Check 1: account age < 7 days
	const { data: userData } = await supabase.auth.admin.getUserById(userId);
	if (userData?.user?.created_at) {
		const accountAge = Date.now() - new Date(userData.user.created_at).getTime();
		const sevenDays = 7 * 24 * 60 * 60 * 1000;
		if (accountAge < sevenDays) return true;
	}

	// Check 2: fewer than 3 approved ads
	const { count } = await supabase
		.from('ads')
		.select('id', { count: 'exact', head: true })
		.eq('user_id', userId)
		.eq('status', 'active');

	return (count ?? 0) < 3;
}
```

**IMPORTANT:** The CONTEXT.md says "Instant AI moderation stays -- no behaviour change from current flow for new accounts." This means the new-account check does NOT change moderation behaviour. The current flow already sends text-only ads through synchronous OpenAI moderation and image ads through the pending cron queue. The success criteria says ads from new accounts must be "held in a pending state" -- but this is already the case for image ads (they go to pending). For text-only ads from new accounts, the existing synchronous check auto-approves clean text. The user explicitly decided this is sufficient. No additional hold queue is needed.

The "new account" tracking (fewer than 3 approved ads OR < 7 days) should still be implemented for the `noindex` meta tag requirement -- new-account ads that pass moderation should carry `noindex` until the account is established. This is the actual deliverable.

### Pattern 2: Reseller Detection Heuristics

**What:** Rule-based checks in the ad POST handler to flag commercial patterns
**When to use:** After validation, before the insert
**Example:**

```typescript
// src/lib/server/reseller-detection.ts
export type ResellerSignal = {
	signal: string;
	weight: number;
	matched: string;
};

const DEALER_PATTERNS = [
	/\bcall\s+for\s+price\b/i,
	/\bstock\s*#?\s*\d/i,
	/\bRRP\b/i,
	/\btrade\s*-?\s*in/i,
	/\bfinance\s+available\b/i,
	/\bshowroom\b/i,
	/\bwarranty\s+included\b/i,
	/\bwww\.\w+\.\w+/i,
	/https?:\/\/\S+/i,
	/\b\d{2,3}\s*[-.]?\s*\d{6,8}\b/ // phone number pattern
];

export function detectResellerSignals(title: string, description: string): ResellerSignal[] {
	const text = `${title} ${description}`;
	const signals: ResellerSignal[] = [];

	for (const pattern of DEALER_PATTERNS) {
		const match = text.match(pattern);
		if (match) {
			signals.push({
				signal: pattern.source,
				weight: 1,
				matched: match[0]
			});
		}
	}

	return signals;
}
```

### Pattern 3: Seed Script via Supabase REST (matching cron-worker pattern)

**What:** Standalone script using service role key and direct REST calls
**When to use:** One-time execution to populate initial listings
**Example:**

```typescript
// scripts/seed-listings.ts
// Uses same supabaseHeaders pattern as cron-worker.ts
import { createClient } from '@supabase/supabase-js';
import { generateAdSlug } from '../src/lib/server/slugs';
import { buildLocationProfileData } from '../src/lib/location-hierarchy';

const supabase = createClient(
	process.env.PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
	{ auth: { persistSession: false, autoRefreshToken: false } }
);

// Batch insert via Supabase JS client (not individual inserts)
const { error } = await supabase.from('ads').insert(listings); // array of listing objects
```

### Pattern 4: Safety Accordion with native HTML details

**What:** Collapsible "Stay Safe" section using `<details>/<summary>` -- zero JS, matches newspaper simplicity
**When to use:** Ad view page, below description
**Example:**

```svelte
<!-- In ad/[slug]/+page.svelte, after MessageComposer, before similar listings -->
<details class="safety-accordion">
	<summary>Stay Safe</summary>
	<ul class="safety-tips">
		<li>Meet in a public place during daylight</li>
		<li>Cash on collection is safest</li>
		<li>Never send money in advance</li>
		<li>Trust your instincts -- if it seems too good to be true, it probably is</li>
	</ul>
	<a href="/safety" class="safety-link">Full safety guide</a>
</details>
```

### Pattern 5: Private-Seller Checkbox (enforceable)

**What:** Boolean checkbox in preview modal, sent as form field, validated server-side
**When to use:** Post form review step (preview modal)
**Example:**

```typescript
// Server-side in POST handler:
const privateSeller = form.get('private_seller')?.toString() === '1';
if (!privateSeller) {
	return errorResponse('You must confirm this is a private sale.', 400, requestId);
}
```

### Anti-Patterns to Avoid

- **Don't create a new admin UI for reseller review:** Use existing reports/moderation panel. Flagged ads go to `pending` status -- same review flow as AI-flagged content.
- **Don't use localStorage for safety tip dismissal:** CONTEXT.md explicitly says no localStorage state management for tips.
- **Don't create separate moderation queue tables:** The existing `ads.status = 'pending'` flow is sufficient. No new tables for new-account holds.
- **Don't use JavaScript-based accordions:** Native `<details>/<summary>` works on all modern browsers, is accessible by default, and matches the project's minimal-JS philosophy.
- **Don't import seed listing content from external files:** The seed script should contain the listing data inline or in a companion data file within the `scripts/` directory. Keep it self-contained.

## Don't Hand-Roll

| Problem                   | Don't Build                 | Use Instead                                                                 | Why                                                               |
| ------------------------- | --------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Accordion/collapsible UI  | Custom JS toggle component  | Native `<details>/<summary>` HTML                                           | Accessible, zero JS, works offline, browser-native                |
| Slug generation for seeds | Manual string concatenation | `generateAdSlug()` from `src/lib/server/slugs.ts`                           | Already handles stop words, truncation, short ID append           |
| Location JSONB for seeds  | Manual JSONB construction   | `buildLocationProfileData()` from `src/lib/location-hierarchy.ts`           | Handles province lookup, island, primary selection, locality      |
| Category JSONB for seeds  | Manual JSONB construction   | Match schema from `category-profiles.ts` BikesProfileData                   | Version field, subtype, bikeType required for query compatibility |
| Phone number detection    | Custom regex from scratch   | Established pattern: `/\b\d{2,3}\s*[-.]?\s*\d{6,8}\b/` for Irish/UK numbers | Covers 08x, 01, +353, etc.                                        |
| Ad expiry for seeds       | Custom expiry logic         | Existing `expires_at` column with 14-day offset                             | Cron worker already handles expired->expired status transition    |

**Key insight:** Every major subsystem this phase touches already exists. The work is integration and content, not infrastructure.

## Common Pitfalls

### Pitfall 1: Seed Script Location Profile Data Construction

**What goes wrong:** Seed listings inserted with malformed `location_profile_data` JSONB that doesn't match the schema expected by filters and SEO pages.
**Why it happens:** The JSONB structure is complex (version, level, primary, selected, selectedNodeIds, island, province, county, locality fields). Manual construction will miss fields.
**How to avoid:** Use `buildLocationProfileData([countyId], localityId)` which handles all field construction. The seed script imports this function directly.
**Warning signs:** Seed listings don't appear in county-filtered browse pages. SEO county pages don't include seeds.

### Pitfall 2: Seed Script Short ID Collisions

**What goes wrong:** Batch insert of 192 listings hits unique constraint violations on `short_id` or `slug`.
**Why it happens:** `generateAdSlug()` uses `nanoid(8)` which has collision probability at scale. 192 inserts is small but Murphy's law applies.
**How to avoid:** Use retry logic (same pattern as ad POST handler: max 3 attempts on code 23505). Or generate all slugs upfront and deduplicate before insert.
**Warning signs:** Insert errors with code `23505` in seed script output.

### Pitfall 3: Category Profile Data Version Mismatch

**What goes wrong:** Seed listings for bikes have `category_profile_data` that doesn't match what the filter UI expects.
**Why it happens:** The bikes profile uses `version: 1`, `profile: 'bikes'`, and specific keys (`subtype`, `bikeType`, `condition`, `sizePreset`). Missing any field means filters won't match.
**How to avoid:** Match the exact schema from `buildBikeProfileCandidate()` in the post form. Required fields: `version`, `profile`, `subtype`, `bikeType`.
**Warning signs:** Bike filter pills show no results even though seed listings exist for that subtype/type combination.

### Pitfall 4: Reseller Detection False Positives

**What goes wrong:** Legitimate private sellers get flagged for mentioning a phone number in description or including "warranty" (e.g., "still under manufacturer warranty").
**Why it happens:** Overly aggressive pattern matching with no context awareness.
**How to avoid:** Use a scoring system with a threshold rather than any-match flagging. A single phone number or warranty mention should score low. Multiple signals (phone + URL + "stock #" + "call for price") should score high. Threshold should require 2+ signals or 1 high-weight signal.
**Warning signs:** Test with real-world private seller descriptions from DoneDeal/Adverts.ie to validate thresholds.

### Pitfall 5: Mobile Audit at Wrong Viewport

**What goes wrong:** Testing at 640px (the existing breakpoint) instead of 375px (the actual target).
**Why it happens:** The codebase uses `@media (max-width: 640px)` breakpoints, so developers test there. But 375px is iPhone SE/12 Mini width -- the actual mobile target.
**How to avoid:** Test explicitly at 375px width in Playwright. The existing 640px breakpoint handles the basic responsive layout; 375px testing catches spacing/overflow issues that only appear on narrow phones.
**Warning signs:** UI looks fine at 640px but has horizontal overflow, truncated buttons, or unreadable text at 375px.

### Pitfall 6: About Page Already Exists

**What goes wrong:** Creating /about as a new route when it already exists with content.
**Why it happens:** CONTEXT.md says "New /about page with mission, values..." but the route already exists at `src/routes/(public)/about/+page.svelte`.
**How to avoid:** This is a rewrite of the existing about page, not a creation of a new route. Read the existing content first, then rewrite with trust messaging while preserving the route structure.
**Warning signs:** Attempting to create a route that already exists.

### Pitfall 7: New Account Auth Admin API Access

**What goes wrong:** Using `supabase.auth.admin.getUserById()` from the client-side Supabase instance (which uses anon key) instead of the service role client.
**Why it happens:** The ad POST handler uses `locals.supabase` (anon-key client) for most operations but needs service role for auth admin API.
**How to avoid:** The handler already creates a `limiterClient` with service role key (lines 437-443 of +server.ts). Use the same pattern to get user creation date. Or query `created_at` from the `auth.users` table via the service role client.
**Warning signs:** 401/403 errors when checking account age.

## Code Examples

### Seed Listing Data Structure

```typescript
// Each seed listing needs this shape for insert
const listing = {
	user_id: SYSTEM_ACCOUNT_ID, // 'fogr.ai' system user UUID
	title: 'Mountain bike -- perfect for the Comeragh Mountains',
	description: 'Built for Waterford trails. Well-maintained, hydraulic disc brakes...',
	category: 'Bikes',
	price: 350,
	currency: 'EUR',
	status: 'active', // Pre-approved, bypasses moderation
	image_keys: [], // No images for seed listings (or stock photo keys)
	firm_price: false,
	email: 'eolas@fogr.ai',
	slug: generateAdSlug('Mountain bike -- perfect for the Comeragh Mountains', 'Waterford', 'Bikes'),
	short_id: slug.slice(-8), // Extract from generated slug
	category_profile_data: {
		version: 1,
		profile: 'bikes',
		subtype: 'adult',
		bikeType: 'mountain',
		condition: 'used_good',
		sizePreset: 'M'
	},
	location_profile_data: buildLocationProfileData(
		['ie/munster/waterford'],
		'ie/munster/waterford/dungarvan' // specific locality
	),
	expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
};
```

### Reseller Detection Integration Point

```typescript
// In src/routes/api/ads/+server.ts POST handler
// After local moderation (profanity/obscenity), before OpenAI moderation:

import { detectResellerSignals } from '$lib/server/reseller-detection';

const signals = detectResellerSignals(title, description);
const resellerScore = signals.reduce((sum, s) => sum + s.weight, 0);
const RESELLER_THRESHOLD = 2; // require 2+ signals

if (resellerScore >= RESELLER_THRESHOLD) {
	// Force pending status regardless of moderation result
	// Don't tell the user -- silent flag
	log('info', 'ads_post_reseller_flagged', {
		userId: user.id,
		signals: signals.map((s) => s.signal),
		score: resellerScore
	});
	// Set status to pending -- existing cron will NOT auto-approve
	// (because reseller-flagged ads should stay pending for manual review)
	// This requires a way to distinguish "pending due to moderation unavailable"
	// from "pending due to reseller flag"
	// Option: add a moderation_hold_reason column or use existing ad_moderation_actions
}
```

### Safety Accordion Placement in Ad View Page

```svelte
<!-- In src/routes/(public)/ad/[slug]/+page.svelte -->
<!-- After the MessageComposer block, before similar listings section -->

{#if !data.isOwner && !data.isExpired}
	<details class="safety-accordion">
		<summary class="safety-summary">Stay Safe</summary>
		<div class="safety-content">
			<ul>
				<li>Meet in a busy, public place</li>
				<li>Cash on collection is safest -- avoid bank transfers to strangers</li>
				<li>Never pay in advance for items you haven't seen</li>
				<li>If a deal seems too good to be true, it probably is</li>
			</ul>
			<a href="/safety">Read our full safety guide</a>
		</div>
	</details>
{/if}
```

### Homepage Hero Copy Update

```svelte
<!-- Current: -->
<h1>Buy. Sell. Done.</h1>
<p class="sub">Local deals, made simple.</p>

<!-- Updated with trust messaging (simplicity angle): -->
<h1>Buy. Sell. Done.</h1>
<p class="sub">Honest ads. Fair prices. No clutter.</p>
```

### Private-Seller Checkbox in Preview Modal

```svelte
<!-- In the preview modal, after age confirmation checkbox -->
<label class="checkbox">
	<input type="checkbox" bind:checked={privateSeller} disabled={loading} />
	<span>This is a private sale -- I am not a trade or commercial seller.</span>
</label>
```

## State of the Art

| Old Approach                    | Current Approach               | When Changed                                | Impact                                           |
| ------------------------------- | ------------------------------ | ------------------------------------------- | ------------------------------------------------ |
| JavaScript accordions           | Native `<details>/<summary>`   | Widespread 2020+                            | Zero JS, accessible by default                   |
| Separate moderation queue table | Status field on existing table | Already established in project              | No schema changes for hold queue                 |
| Complex anti-spam ML            | Rule-based heuristic scoring   | Appropriate for launch volume               | No training data needed, tuneable thresholds     |
| Image-based CAPTCHAs for spam   | AI moderation + rate limiting  | Already in project (OpenAI omni-moderation) | Better UX, catches content quality not just bots |

**Deprecated/outdated:**

- Svelte `on:click` syntax: The project mixes Svelte 4 (`on:click`) and Svelte 5 (`onclick`) event handlers. New code should use Svelte 4 `on:` syntax to match existing components (PostFields.svelte, ad/[slug]/+page.svelte use `on:click`). The homepage (+page.svelte) uses Svelte 5 `onclick`/`$props()` syntax. Match the file you're editing.
- `$:` reactive statements: PostFields.svelte and post/+page.svelte use Svelte 4 `$:` syntax. Homepage uses Svelte 5 `$derived`. Match the file.

## Open Questions

1. **System account UUID for seed listings**
   - What we know: CONTEXT.md says "Single 'fogr.ai' system account posts all seeds"
   - What's unclear: Does this account already exist in Supabase Auth? Need to create it first, or use a hardcoded UUID?
   - Recommendation: Seed script should check if the account exists and create it if needed via the admin API, or accept the UUID as an environment variable

2. **Reseller-flagged ads vs moderation-pending ads**
   - What we know: Both use `status: 'pending'`. The cron worker auto-approves pending ads that pass AI moderation.
   - What's unclear: How to prevent cron from auto-approving reseller-flagged ads (they need manual review, not AI re-check)
   - Recommendation: Either (a) add a `hold_reason` column to distinguish, or (b) insert a moderation_action record that prevents cron processing, or (c) use a different status value. Option (a) is simplest -- add `moderation_hold_reason TEXT NULL` column, cron skips ads with non-null hold_reason.

3. **Stock photos for seed listings**
   - What we know: CONTEXT.md says "Royalty-free stock photos from Unsplash/Pexels only. No AI-generated images"
   - What's unclear: Whether to include images at all in seed listings. If yes, need to download, upload to R2, and set image_keys
   - Recommendation: Start seeds without images (image_keys: []) to keep the script simple. The listings are informative/demonstrative content and bikes category allows 0 images. If images are desired, that becomes a separate effort of curating and uploading stock photos.

4. **New-account noindex enforcement**
   - What we know: Success criteria says new-account ads must carry `noindex` and not appear in search results until moderation clears
   - What's unclear: Since the user decided AI moderation stays unchanged (no extra hold), how to apply `noindex` to clean text-only ads from new accounts that auto-approve instantly
   - Recommendation: For the `noindex` requirement, the ad view page server load function can check if the seller is a "new account" and set `robots: 'noindex'` in the SEO data. This is independent of the moderation flow -- it's a display-time check. Once the account has 3+ approved ads and is 7+ days old, the noindex is removed on next page load.

## Sources

### Primary (HIGH confidence)

- **Codebase inspection:** `src/routes/api/ads/+server.ts` (703 lines) -- full ad POST handler with moderation, validation, rate limiting
- **Codebase inspection:** `src/cron-worker.ts` (611 lines) -- pending ad moderation pipeline, expiry, search digests
- **Codebase inspection:** `src/lib/location-hierarchy.ts` -- buildLocationProfileData function and LocationProfileData type
- **Codebase inspection:** `src/lib/category-profiles.ts` -- BikesProfileData schema, BIKE_TYPES, BIKE_SUBTYPES
- **Codebase inspection:** `src/lib/server/slugs.ts` -- generateAdSlug with nanoid short IDs
- **Codebase inspection:** `src/routes/(public)/ad/[slug]/+page.svelte` -- ad view page layout for safety accordion placement
- **Codebase inspection:** `src/routes/(app)/post/+page.svelte` -- 3-step post form with preview modal for safety checklist and private-seller checkbox
- **Codebase inspection:** `src/routes/(public)/about/+page.svelte` -- existing about page to rewrite
- **Codebase inspection:** `src/routes/+layout.svelte` -- footer with link groups for safety link addition
- **Codebase inspection:** `src/routes/+page.svelte` -- homepage hero with current copy
- **Codebase inspection:** `src/app.css` -- responsive breakpoints (640px mobile, 768px tablet)
- **Codebase inspection:** `package.json` -- all dependencies confirmed, no new packages needed
- **Codebase inspection:** All 32 county IDs confirmed from ireland_counties.json

### Secondary (MEDIUM confidence)

- **CONTEXT.md:** All user decisions for implementation approach
- **STATE.md:** Project history, velocity metrics, accumulated decisions
- **REQUIREMENTS.md:** TRST-04, TRST-06, TRST-07, LNCH-01, LNCH-02, LNCH-03, LNCH-04 requirement definitions

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - no new dependencies, all tools already in project
- Architecture: HIGH - all integration points inspected in source code, patterns match existing codebase conventions
- Pitfalls: HIGH - based on actual code inspection of ad POST handler, cron worker, and form components
- Seed script: MEDIUM - buildLocationProfileData import from lib may need path adjustment for standalone script
- Reseller detection: MEDIUM - heuristic thresholds need empirical tuning with real-world classified ad text

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable -- no external API changes expected)
