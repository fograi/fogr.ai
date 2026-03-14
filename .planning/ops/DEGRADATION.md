# Graceful Degradation and Risk Acceptance

This document verifies and records the platform's existing graceful degradation behavior and risk acceptance decisions.

**Purpose:** Per the Phase 6 CONTEXT.md decision: "Verify and document these existing degradation paths rather than building new ones."

## OpenAI Moderation Unavailable (INFR-04)

When OpenAI's moderation API is unreachable or returns errors, the platform degrades gracefully by queuing ads as `pending` instead of rejecting them.

### Ad Creation (POST /api/ads)

**File:** `src/routes/api/ads/+server.ts`

At line 519, a `moderationUnavailable` flag is initialized. When any moderation call (`moderateText`, `moderateTextAndImage`, `moderateSingleImage`) catches an error, it returns `'unavailable'` and the flag is set to `true` (lines 525, 530, 541, 549).

At line 557, the ad status is determined:

```typescript
const status =
	moderationUnavailable || isResellerFlagged || isNewAccountUser ? 'pending' : PUBLIC_AD_STATUS;
```

**Result:** The ad is saved to the database with `pending` status. Images go to the pending R2 bucket (`fograi-pending`). The user sees "Ad submitted and pending review." -- no error is surfaced.

### Cron Worker (Batch Moderation)

**File:** `src/cron-worker.ts`

When `moderateText()`, `moderateTextAndImage()`, or `moderateSingleImage()` returns `'unavailable'`, the worker logs `cron_moderation_unavailable` (line 520) and `continue`s to the next ad (line 521). The ad stays in `pending` state and will be retried on the next 15-minute cron tick.

### User Impact

- Ads still submit successfully.
- They stay in "pending review" state until OpenAI becomes available again.
- No ads are rejected due to API unavailability.
- Users see a normal submission confirmation -- they do not know moderation is temporarily skipped.

### Triggers

- OpenAI API key hits hard spending limit ($10/month as configured in [COST-ALERTS.md](./COST-ALERTS.md)).
- Network errors between Cloudflare Workers and OpenAI.
- OpenAI service outage.

### Recovery

**Automatic.** Once OpenAI responds again, the next cron tick (every 15 minutes) processes the backlog of pending ads. No manual intervention required.

## Email Service Unavailable (INFR-04)

When Resend is unreachable or returns errors, the platform continues operating without email notifications.

### Email Sending

**File:** `src/lib/server/email/send.ts`

The `sendEmail()` function (line 21) uses a fire-and-forget pattern with a try/catch that logs and swallows errors. The function never throws -- it returns `null` on failure. Resend handles delivery retries natively on their infrastructure.

### Ad Approval/Rejection Emails (Cron Worker)

**File:** `src/cron-worker.ts`

Email sends happen AFTER status updates. This is a Phase 3 decision (03-03): if email fails, the ad is still approved/rejected correctly. The user just does not get notified by email.

### Message Notification Emails (API)

**File:** `src/routes/api/messages/+server.ts`

Message notification emails are sent via `platform.ctx.waitUntil()` -- non-blocking. If the email fails, the message is still delivered in-app.

### User Impact

- Core platform functions (posting, browsing, messaging) continue working.
- Users may not receive email notifications until Resend recovers.
- Users can still check the platform directly for updates.

### Recovery

**Automatic.** Resend retries failed deliveries internally. No manual intervention required.

## Database Unavailable

The platform does NOT have explicit graceful degradation for Supabase outages. If the database is unreachable, all data-dependent operations fail.

**This is acceptable for v1:** Supabase Pro has a 99.9% uptime SLA. A Supabase outage would be a total platform outage, which is expected behavior for a database-dependent application at this scale.

**Detection:** The `/api/health` endpoint will return `{ status: 'down' }` with a 503 status code, triggering UptimeRobot alerts (see [COST-ALERTS.md](./COST-ALERTS.md)).

### Recovery

**Wait for Supabase SLA.** If a Supabase outage exceeds expectations, check [status.supabase.com](https://status.supabase.com) for updates. If data corruption occurs, follow the restore procedure in [RESTORE.md](./RESTORE.md).

## R2 Storage Unavailable

### Upload Failures

**File:** `src/routes/api/ads/+server.ts`

Image uploads will fail with a 503 "Storage temporarily unavailable" message (line 308 in the POST handler for binding checks, line 649 for upload failures).

### Existing Images

Existing ads with already-uploaded images will still display correctly. Images are served via the CDN (cdn.fogr.ai), which has edge caching. Cached images continue to serve even during an R2 outage.

### Detection

The `/api/health` endpoint will detect R2 unavailability and return `{ status: 'down' }` with a 503 status code.

### Recovery

**Wait for Cloudflare SLA.** R2 outages are extremely rare. Check [cloudflarestatus.com](https://www.cloudflarestatus.com) for updates.

## R2 Image Redundancy -- Risk Acceptance (INFR-05)

Per Phase 6 CONTEXT.md decision: "Documented risk acceptance -- R2's 11-nines durability is sufficient for v1."

### Decision

R2 images are NOT backed up. This is a deliberate risk acceptance, not an oversight.

### Rationale

- Cloudflare R2 provides **99.999999999% (11 nines) data durability**.
- At this durability level, backup/replication adds cost and complexity for negligible risk reduction.
- The probability of data loss at 11-nines durability is effectively zero for any reasonable dataset size.

### If Catastrophic R2 Failure Occurs (Extraordinarily Unlikely)

- Ad metadata is preserved in Supabase database backups.
- Ads with lost images will show broken image placeholders.
- Sellers can re-post affected ads with new images.
- This is a classifieds platform, not a photo archive -- images are transient by nature. Ads expire after 30 days regardless.

### Monitoring

- R2 accessibility is monitored via the `/api/health` endpoint to catch binding misconfigurations or temporary outages early.

### Review Trigger

This risk acceptance will be revisited if:

- The platform scales to a point where image loss would affect a significant number of users.
- Cloudflare changes R2's durability guarantees.
- The cost of R2 backup becomes trivially low (e.g., cross-region replication at no additional cost).

## Summary Table

| Service  | Failure Mode              | Platform Behavior                      | User Impact                   | Recovery     |
| -------- | ------------------------- | -------------------------------------- | ----------------------------- | ------------ |
| OpenAI   | API errors/spending limit | Ads queue as `pending`                 | Delayed moderation, no errors | Automatic    |
| Resend   | API errors/outage         | Emails silently skipped                | No email notifications        | Automatic    |
| Supabase | Database outage           | All data operations fail               | Full outage                   | Wait for SLA |
| R2       | Storage outage            | New uploads fail, existing images work | Cannot post new images        | Wait for SLA |
| R2       | Catastrophic data loss    | Images permanently lost                | Sellers re-post affected ads  | Manual       |

---

_Document: DEGRADATION.md_
_Last updated: 2026-03-14_
_Covers: INFR-04 (Graceful Degradation), INFR-05 (R2 Redundancy Risk Acceptance)_
