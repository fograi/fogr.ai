# Codebase Concerns

**Analysis Date:** 2026-02-11

## Tech Debt

### Module-Level State in Request Handlers

**Area:** Rate limiting state management

**Issue:** The `warnedMissingRateLimit` variable is declared at module scope in `src/routes/api/ads/+server.ts` (line 59) and `src/routes/api/ads/[id]/+server.ts` (line 36). This warning flag persists across requests and only logs once globally.

**Files:**

- `src/routes/api/ads/+server.ts` (lines 59, 293-295)
- `src/routes/api/ads/[id]/+server.ts` (line 36)

**Impact:** In production, if RATE_LIMIT KV binding is missing, only the first request logs a warning. Subsequent requests silently fail rate limiting without notification. Also makes testing state management harder and can cause issues during hot module reloads.

**Fix approach:** Replace module-level boolean flag with either (1) logging directly each time without guard, (2) using a Cloudflare namespace to track warnings, or (3) checking environment at startup and failing fast if bindings are missing.

### Duplicate Moderation Logic

**Area:** Text and image moderation

**Issue:** The `shouldFlag()` function with identical moderation thresholds and logic is duplicated across two files. Makes maintenance harder when scores need tuning.

**Files:**

- `src/routes/api/ads/+server.ts` (lines 136-159)
- `src/cron-worker.ts` (lines 58-81)

**Impact:** If moderation thresholds need adjustment (e.g., changing sexual/minors threshold from 0.005 to 0.01), both files must be updated consistently or scoring diverges between endpoints.

**Fix approach:** Extract `shouldFlag()` and moderation constants to a shared module like `src/lib/server/moderation-scoring.ts` imported by both files.

### Base64 Encoding Duplication

**Area:** Image processing

**Issue:** `arrayBufferToBase64()` function implemented identically in three places.

**Files:**

- `src/routes/api/ads/+server.ts` (lines 99-107)
- `src/routes/api/ads/[id]/+server.ts` (lines 62-78, with additional Buffer fallback logic)
- `src/cron-worker.ts` (lines 41-49)

**Impact:** The version in `[id]/+server.ts` includes Node.js Buffer fallback, but other versions don't. Increases maintenance surface and risks inconsistent encoding.

**Fix approach:** Create shared utility `src/lib/server/base64.ts` with platform-aware encoding that handles both browser and Node.js environments.

### Generated Type Definitions Committed

**Area:** Source control hygiene

**Issue:** `src/worker-configuration.d.ts` is an 8,348-line auto-generated file from `wrangler types` command committed to git.

**Files:** `src/worker-configuration.d.ts`

**Impact:** Clutters diffs (large commits for type generation), causes unnecessary merge conflicts, may drift from actual Cloudflare runtime if not regenerated regularly.

**Fix approach:** Add to `.gitignore`, regenerate in CI/build scripts, document regeneration in README.

## Known Bugs

### Potential Data Loss on Concurrent Image Uploads

**Area:** Ad image upload error handling

**Issue:** In `src/routes/api/ads/+server.ts` (lines 610-631), images are uploaded in parallel with `Promise.allSettled()`. If some uploads succeed and others fail, the code deletes only the successful keys. However, the ad row was already inserted without image_keys (line 550: `image_keys: []`).

**Symptoms:** If 5 images start uploading and 3 succeed before timeout: ad is created with `image_keys: []`, then 3 images are deleted on failure cleanup. The 3 images remain orphaned in R2 forever. Users see "Image upload failed" but can't retry.

**Files:** `src/routes/api/ads/+server.ts` (lines 574-632)

**Trigger:** Concurrent upload of multiple images where some complete before overall timeout, or partial failure in Promise.allSettled().

**Workaround:** None currently. Users must delete and recreate the ad to upload images.

**Fix approach:** (1) Insert ad with status='draft', (2) upload all images, (3) only mark status='active'/'pending' after successful validation. Alternatively, use transactional semantics with immediate rollback on any upload failure.

### IP Address Parsing Without Validation

**Area:** Rate limiting and logging

**Issue:** `x-forwarded-for` header is split without bounds checking and invalid IPs are used as rate-limit keys.

**Files:**

- `src/routes/api/ads/+server.ts` (line 224)
- `src/routes/api/ads/[id]/report/+server.ts` (line 85)
- `src/routes/api/auth/magic-link/+server.ts` (line 61)
- `src/routes/api/reports/status/+server.ts` (line 72)

**Symptoms:** Malformed `x-forwarded-for` header like `",,,"` or `"::invalid::"` gets split and trimmed, creating rate-limit keys like `ip::invalid::`. Rate limiting still functions but matches wrong users when headers are inconsistent.

**Trigger:** Proxy chains with empty values or malicious proxies injecting invalid header values.

**Workaround:** Rate limits still function with invalid keys, just less reliable.

**Fix approach:** Add regex validation: `if (!/^[0-9a-f.]+$|^[0-9.]+$/.test(ip.trim()))` after split, fallback to empty string if invalid.

### Missing Null Check on offer_amount Conversion

**Area:** Message offer validation

**Issue:** In `src/routes/api/messages/+server.ts` (line 150), when checking if offer is below minimum, `Number(offerAmount)` is called but `offerAmount` could still be `null`.

**Symptoms:** `Number(null)` returns 0, so offers of exactly 0 would pass initial validation (line 113 checks `isFinite(amount) || amount <= 0`) but then get inserted as `offer_amount: 0` which is semantically invalid for price offers.

**Files:** `src/routes/api/messages/+server.ts` (lines 43, 150, 167, 200)

**Trigger:** Client sends `offerAmount: null` with kind='offer'.

**Workaround:** Frontend validation prevents this in practice.

**Fix approach:** Add explicit null check before line 150: `if (kind === 'offer' && offerAmount === null) return errorResponse('Offer amount required', 400)`

## Security Considerations

### Rate Limit KV Namespace Not Enforced as Critical

**Area:** Brute force protection

**Risk:** If `RATE_LIMIT` KV binding is not configured, rate limiting silently degrades to per-request checks only. An attacker can spam ad posts (5 per 10m → unlimited), file reports (5 per 10m → unlimited), or send magic links.

**Files:**

- `src/routes/api/ads/+server.ts` (lines 268-296)
- `src/routes/api/ads/[id]/report/+server.ts` (lines 96-120)
- `src/routes/api/auth/magic-link/+server.ts` (similar pattern)

**Current mitigation:** Logs one warning per module per deployment if KV is missing. No actual rate limiting if binding is unavailable.

**Recommendations:**

1. Fail deployment if `RATE_LIMIT` is not present in production (add pre-flight check in CI)
2. Return 503 instead of silently proceeding without rate limiting
3. Add health check endpoint that verifies KV binding is accessible

### Email Hash Collision in Report Rate Limiting

**Area:** Report spam protection

**Risk:** Email addresses are hashed with SHA-256, but collision handling is not explicit. If two users' emails hash to the same value (vanishingly unlikely but theoretically possible), they could share rate limit buckets.

**Files:** `src/routes/api/ads/[id]/report/+server.ts` (lines 39-50, 98)

**Current mitigation:** None, relies on cryptographic hash strength.

**Recommendations:**

1. Add collision detection test with sample email lists
2. Use IP-based rate limiting as primary, email hash as secondary (currently does both independently)
3. Document assumption that SHA-256 collisions are acceptable in this threat model

### OpenAI API Key Validation Missing

**Risk:** `OPENAI_API_KEY` is loaded from `platform.env` without validation that it's set or valid in production.

**Files:**

- `src/routes/api/ads/+server.ts` (lines 250, 298)
- `src/cron-worker.ts` (line 211)

**Current mitigation:** Throws error if missing in non-dev mode at line 298, but only at request time.

**Recommendations:**

1. Validate keys exist at Wrangler deployment validation time, not request time
2. Add health check endpoint that verifies API connectivity without incurring quota
3. Implement circuit breaker pattern for OpenAI failures to prevent cascade

### Supabase Service Role Key Exposure Risk

**Area:** Database access

**Risk:** Service role key is stored in `platform.env` and used in ad creation (line 439) and cron worker (line 225). If compromised, full database access is possible including reading all user data.

**Files:**

- `src/routes/api/ads/+server.ts` (lines 436-442)
- `src/cron-worker.ts` (lines 210, 316-322)

**Current mitigation:** Only used server-side, never sent to client.

**Recommendations:**

1. Rotate service role key quarterly (document in ops playbook)
2. Prefer row-level security (RLS) policies over service role for ad queries
3. Add audit logging for service role usage patterns
4. Consider using Supabase's URL + JWT token approach for limited-scope access

## Performance Bottlenecks

### N+1 Query on Conversation List Page Load

**Area:** Message page load performance

**Issue:** `src/routes/(app)/messages/+page.server.ts` (lines 145-170) loads conversations list, then executes separate unread count queries for each conversation using `Promise.all()`.

**Files:** `src/routes/(app)/messages/+page.server.ts` (lines 148-170)

**Cause:** Fetching all conversation metadata first, then querying unread message counts per conversation in parallel.

**Improvement path:**

1. Use Supabase aggregation with `count` option: `select('..., messages(count)')`
2. Or load conversation + count in single query with subquery or join
3. Add query test to verify single query, not N+1 pattern

### Cloudflare Cache Key Regeneration

**Area:** Ad listing GET handler performance

**Issue:** Cache key is created on every request (lines 788-790 in `src/routes/api/ads/+server.ts`):

```typescript
const cacheKey = cfCache
  ? new Request(new URL(url.pathname + url.search, url.origin), { method: 'GET' })
  : undefined;
```

**Files:** `src/routes/api/ads/+server.ts` (lines 788-790, 792-795, 865)

**Cause:** Constructing a full Request object on every hit even if cache doesn't need it.

**Improvement path:**

1. Check if cache exists and needs key before constructing Request
2. Or use simpler string key based on query parameters: `${url.pathname}${url.search}`
3. Benchmark Request construction cost before/after optimization

### Synchronous String Validation in Hot Path

**Area:** Ad creation filters block event loop

**Issue:** `filter.check()` and `obscenity.hasMatch()` run synchronously on combined title+description string (lines 472-475), potentially blocking event loop for large descriptions.

**Files:** `src/routes/api/ads/+server.ts` (lines 471-475)

**Cause:** Leo-profanity and obscenity libraries have no async mode.

**Improvement path:**

1. Move profanity check to Cloudflare Worker or Web Worker
2. Add description length limit to prevent extremely long inputs (MAX_DESC_LENGTH = 5000 chars already enforced)
3. Profile actual blocking time with larger descriptions
4. If significant, batch filter compilation at startup instead of per-request

### Image Encoding in Main Thread

**Area:** Image moderation performance

**Issue:** `fileToDataUrl()` calls `arrayBufferToBase64()` synchronously in a loop for multiple images (lines 510-520).

**Files:** `src/routes/api/ads/+server.ts` (lines 109-112, 510-520)

**Cause:** No Worker or streaming approach; blocks until all images encoded.

**Improvement path:**

1. Benchmark base64 encoding time for 5 images at 2MB each
2. Consider pre-encoding images on client before upload
3. If server-side needed, batch encode in background after returning response
4. Use streaming multipart form to avoid loading all images in memory

## Fragile Areas

### Edit Ad Backoff State Not Persisted on Server

**Component/Module:** Ad editing rate limit

**Files:** `src/routes/api/ads/[id]/+server.ts` (lines 57-60, 257-300+)

**Why fragile:** Edit backoff state is stored in browser localStorage (EditBackoffState) without server-side validation. A user can open dev tools and delete the stored state, bypassing the 35-day edit cooldown.

**Safe modification:** Add server-side backoff tracking in Supabase or KV, check on every PATCH request. Store `last_edited_at` timestamp on the ad row, enforce server-side that edits are rejected if `now() - last_edited_at < 35 days`.

**Test coverage:** No E2E test verifying backoff persistence across page reloads or after localStorage clear.

### Bike Profile Data Type Safety

**Component/Module:** Category-specific ad validation

**Files:**

- `src/routes/api/ads/+server.ts` (lines 373-386)
- `src/routes/api/ads/[id]/+server.ts` (similar pattern)

**Why fragile:** `categoryProfilePayload` is parsed JSON but typed as `unknown`, then passed to `validateAndNormalizeBikesProfileData()`. If the validation function has a bug or partial type coverage, invalid bike profiles could be stored and cause downstream rendering errors.

**Safe modification:**

1. Add comprehensive test suite in `src/lib/server/ads-validation.spec.ts` covering all bike subtypes, conditions, and size presets
2. Use TypeScript's `satisfies` operator to validate parsed JSON shape before passing to validator
3. Add database constraints or trigger to reject invalid JSON shapes at storage layer

**Test coverage:** `src/lib/server/ads-validation.spec.ts` exists (434 lines) but focuses on price validation; category profile validation coverage unclear.

### Location Profile Data Not Validated Server-Side

**Component/Module:** Location hierarchy validation

**Files:**

- `src/routes/api/ads/+server.ts` (lines 387-399)
- `src/routes/api/ads/[id]/+server.ts` (similar pattern)

**Why fragile:** Location profile is parsed JSON with minimal validation. No checks that county/locality IDs actually exist in hierarchy.

**Safe modification:**

1. Add location hierarchy validation test
2. Validate against known county/locality options from `src/lib/location-hierarchy.ts`
3. Consider caching location hierarchy to reduce repeated lookups

**Test coverage:** No dedicated test for location profile data validation.

### E2E Mock Data Hardcoded Across Multiple Files

**Component/Module:** Testing infrastructure

**Files:**

- `src/routes/api/ads/+server.ts` (lines 711-783)
- `src/routes/api/messages/+server.ts` (lines 51-63)
- `src/routes/(app)/messages/+page.server.ts` (lines 27-100+)

**Why fragile:** E2E tests depend on mock data being consistent across multiple route files. If one mock data object is updated and others aren't, tests break unpredictably.

**Safe modification:**

1. Create single `src/lib/server/e2e-mock-data.ts` that exports all mock objects
2. Import in all route handlers
3. Document mock data schema in comments
4. Add test that validates mock data consistency

**Test coverage:** E2E tests exist but don't validate mock data consistency across routes.

## Scaling Limits

### Single-File OpenAI Rate Limit

**Resource:** OpenAI API quota

**Current capacity:** No client-side rate limiting on moderation calls; relies on OpenAI plan limits.

**Limit:** OpenAI free tier allows ~3500 requests/minute. With 5 moderation calls per ad (text, up to 3 images, combined) and 12 ads/day per user, system can handle ~70 concurrent users posting simultaneously before hitting quota.

**Scaling path:**

1. Implement request queuing for moderation (batch multiple ads per minute)
2. Switch to batch moderation API when available
3. Cache common profanity results (e.g., same title text)
4. Set up different OpenAI org keys for different regions/customers
5. Consider fallback to local-only moderation if OpenAI quota exhausted

### R2 Bucket I/O Concurrency

**Resource:** R2 storage operations

**Current capacity:** `Promise.allSettled()` uploads all images concurrently per ad (max 12). With 12 ads/day per user × 1000 users, max concurrent R2 operations = ~50/second.

**Limit:** Cloudflare R2 has soft limits around 100 requests/second per bucket before throttling.

**Scaling path:**

1. Implement sequential upload with rate limiting (max 5 parallel uploads per ad)
2. Use R2's multipart upload for large images
3. Split images across multiple R2 buckets by geography or user segment
4. Monitor R2 request metrics and scale bucket limits if needed

### Supabase Connection Pool

**Resource:** Database connections

**Current capacity:** Platform bindings in wrangler config don't specify connection pool size. Defaults to shared Cloudflare pool.

**Limit:** Supabase free tier allows ~20 concurrent connections.

**Scaling path:**

1. Upgrade to Supabase paid plan with higher connection limits
2. Implement connection pooling with pgBouncer
3. Move high-frequency queries to read replicas
4. Cache frequently accessed data (categories, location hierarchy) in KV

## Dependencies at Risk

### OpenAI SDK Major Upgrade Path Unclear

**Package:** `openai@^6.18.0`

**Risk:** OpenAI SDK has frequent breaking changes between major versions. Current version is 6.x, version 7 may have different moderation API response schema or model names.

**Impact:** If OpenAI SDK updates to v7, moderation model name `'omni-moderation-latest'` or response schema could break. Also uses undocumented `_request_id` field on response (line 138 in ads/+server.ts).

**Migration plan:**

1. Add integration tests that validate OpenAI moderation response schema
2. Pin to `openai@6.18.0` exactly until v7 migration plan is ready
3. Check OpenAI changelog before accepting SDK updates
4. Use TypeScript strict mode to catch response shape changes

### Leo-Profanity Deprecated Library

**Package:** `leo-profanity@^1.9.0`

**Risk:** Library hasn't been updated since 2022. If new slurs or offensive terms emerge, library won't detect them. Only complement to OpenAI moderation.

**Impact:** Profanity filtering degrades over time relative to OpenAI's moderation API.

**Migration plan:**

1. Use OpenAI moderation as source of truth; leo-profanity as optional secondary gate
2. Consider replacing with maintained alternative like `bad-words` with custom dictionaries
3. Set reminder to audit library status quarterly

### Obscenity Library Performance Unknown

**Package:** `obscenity@^0.4.6`

**Risk:** Library builds large regex patterns at runtime (`englishDataset.build()` at module load). No lazy loading or code splitting. Pattern compilation time not profiled.

**Impact:** Startup time for ad creation handler may be increased by regex compilation. Unclear if blocking.

**Migration plan:**

1. Profile regex compilation time in production environment
2. Consider pre-compiling regex during build step if time is significant
3. If performance issue found, consider simpler regex-based alternative

## Test Coverage Gaps

### API Rate Limiting Not Tested End-to-End

**Untested area:** Rate limiting across 10m and daily windows in API endpoints.

**Files:**

- `src/routes/api/ads/+server.ts` (lines 268-296)
- `src/routes/api/ads/[id]/report/+server.ts` (lines 96-120)
- No dedicated E2E test found

**What's missing:** Tests that verify (1) 5 requests in 10m are allowed, 6th returns 429, (2) daily limit resets at UTC midnight, (3) IP-based vs user-based rate limiting works correctly, (4) missing KV binding degrades gracefully.

**Risk:** Rate limiting silently degrades if KV binding is misconfigured, discovered only in production.

**Priority:** HIGH - blocking abuse prevention

### Image Upload Failure Scenarios

**Untested area:** Partial image upload failures, R2 bucket unavailability, edge cases in Promise.allSettled().

**Files:**

- `src/routes/api/ads/+server.ts` (lines 574-632)
- No unit test found

**What's missing:** Tests for (1) 5 images upload, 3 succeed, 2 fail → verify cleanup only deletes 3, (2) R2 bucket returns 403 → verify error response, (3) network timeout during upload → verify rollback and cleanup, (4) partial form data loss.

**Risk:** Data loss or orphaned images in production undetected.

**Priority:** HIGH - data integrity critical

### Moderation Score Thresholds Not Validated

**Untested area:** OpenAI moderation scoring and `shouldFlag()` decision logic.

**Files:**

- `src/routes/api/ads/+server.ts` (lines 136-159)
- `src/cron-worker.ts` (lines 58-81)
- Test: `src/lib/server/ads-validation.spec.ts` (tests price validation only)

**What's missing:** Unit tests with sample moderation responses. No test of edge cases like `sexual/minors` score of exactly 0.005 (should flag) vs 0.004 (shouldn't).

**Risk:** Incorrect flagging rates silently off by 1 basis point, or thresholds changed without noticing impact.

**Priority:** MEDIUM - impacts user experience but doesn't break functionality

### Conversation Authorization Not E2E Tested

**Untested area:** Message sending authorization and conversation access control.

**Files:**

- `src/routes/api/messages/+server.ts` (lines 77-88, 102-103, 125-128)
- E2E test exists but doesn't test authorization edge cases

**What's missing:** Tests for (1) send message to convo where user is not a party → 403, (2) send message with invalid conversationId → 404, (3) send first message to own listing → 400, (4) message races during conversation creation.

**Risk:** Unauthorized message access on competitor's conversations not caught by tests.

**Priority:** HIGH - security relevant

---

*Concerns audit: 2026-02-11*
