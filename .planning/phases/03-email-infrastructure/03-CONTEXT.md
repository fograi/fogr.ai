# Phase 3: Email Infrastructure - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Integrate Resend transactional email so the platform can send reliable, GDPR-compliant emails for every lifecycle event. Covers: ad approved, ad rejected, new message notification, saved search alerts, appeal outcomes, and takedown notices. Includes unsubscribe mechanism and email preference storage. Does NOT include saved search save UI (Phase 4).

</domain>

<decisions>
## Implementation Decisions

### Template style

- Minimal branded HTML — logo, clean typography, single accent color. Not plain text, not heavy React Email
- Pure TypeScript string templates with a shared `renderEmail(subject, bodyHtml)` wrapper function — no templating library, no JSX
- Migrate existing moderation email templates (takedown, statement of reasons, appeal outcome) from plain text to the new HTML style — one consistent look across all emails
- Sender identity: `fógr.aí <eolas@fogr.ai>` for all email types

### Delivery & retry

- Send from wherever the trigger happens: cron worker for moderation decisions, API routes for message notifications
- Fire and forget — call Resend, log failures, move on. Resend handles its own retries. No queue table
- RESEND_API_KEY added as Cloudflare Worker secret, same pattern as OPENAI_API_KEY. Update Env type in cron-worker.ts
- Look up user email from Supabase auth as needed — no denormalization. Volume is low

### Unsubscribe flow

- Signed HMAC token in URL: `/unsubscribe?token=xxx&type=messages` — one click, no login, immediate suppression
- Suppressible types: message notifications, search alerts, ad approved. NOT suppressible: moderation/DSA emails (takedown, statement of reasons, appeal outcome)
- New `email_preferences` table: user_id, email_type, suppressed boolean. Checked before every non-legal send
- Confirmation page after unsubscribe: "You've been unsubscribed from [type] emails" with re-subscribe link

### Saved search alerts

- Infrastructure only in this phase: `saved_searches` table + cron email delivery. "Save this search" UI deferred to Phase 4
- Daily digest cron — one email per saved search per day with new matches since last run
- Email content: count + top 3 listings (title, price, link) + "View all" link to search page

### Regulatory compliance

- **No tracking pixels, no open tracking, no click tracking** — eliminates CNIL 2025 dual-consent requirement and UK DUA Act 2025 extended tracking rules entirely
- **List-Unsubscribe + List-Unsubscribe-Post headers** (RFC 8058) on every non-transactional email — required by Gmail (Jun 2024), Yahoo (Jun 2024), Microsoft/Outlook (May 2025). Resend supports this natively when unsubscribe URL is provided. Must be covered by DKIM signature (Resend handles DKIM when domain is verified)
- **DSA Article 17 Statement of Reasons** — moderation emails (takedown, SoR, appeal outcome) are legally required notifications under DSA. Cannot be suppressed by unsubscribe. Must be sent in a language the user understands, on a "durable medium" (email qualifies). Existing template structure already compliant
- **DSA Article 16 Notice acknowledgment** — reporters must be notified that their report was reviewed. Existing report system should confirm receipt (verify in implementation)
- **Unsubscribe processing** — must take effect immediately (our HMAC approach is instant). RFC 8058 requires processing within 48 hours maximum
- **DKIM + SPF + DMARC** — verify fogr.ai domain in Resend dashboard. Required for deliverability and RFC 8058 compliance
- **UK DUA Act 2025** (effective Feb 2026) — requires complaints handling procedure. Not email-specific; note for Phase 5 (Launch Hardening)

### Claude's Discretion

- HTML template design details (colors, spacing, logo placement)
- HMAC signing implementation for unsubscribe tokens
- saved_searches table schema design
- Cron scheduling approach for daily digest (new cron trigger or extend existing)
- Error logging approach for failed sends

</decisions>

<code_context>

## Existing Code Insights

### Reusable Assets

- `src/lib/server/moderation-emails.ts`: Existing email template builders (takedown, statement of reasons, appeal outcome). Currently plain text — will be migrated to HTML. Types and context shapes are reusable
- `src/lib/server/moderation-emails.spec.ts`: Test suite for email templates — update alongside migration
- `src/cron-worker.ts`: Existing cron worker handles moderation + expiry. Email sending hooks into the approve/reject decision flow
- `SUPPORT_EMAIL = 'eolas@fogr.ai'` and `DEFAULT_BASE_URL = 'https://fogr.ai'` already defined in moderation-emails.ts

### Established Patterns

- Worker secrets via `Env` type in cron-worker.ts (OPENAI_API_KEY pattern)
- Supabase service role key for auth queries from cron worker
- Admin panel at `(app)/admin/reports` and `(app)/admin/appeals` consumes email preview templates — needs updating when templates change
- supabaseHeaders() helper for REST API calls from cron worker

### Integration Points

- Cron worker moderation decision flow: after approve/reject → send email
- Messages API route (`api/messages/+server.ts`): after new message → send notification to recipient
- Admin appeals page: after appeal outcome → send email (already has buildAppealOutcomeEmail)
- New unsubscribe route needed: `(public)/unsubscribe/+page.server.ts`
- New email_preferences + saved_searches tables via Supabase migration

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

- "Save this search" UI button on browse/category pages — Phase 4 (Engagement and Retention)
- Email analytics/open tracking — explicitly not implementing (also avoids CNIL dual-consent requirement)
- Marketing/bulk email — out of scope
- Complaints handling procedure — UK DUA Act 2025 requirement, defer to Phase 5 (Launch Hardening)

</deferred>

---

_Phase: 03-email-infrastructure_
_Context gathered: 2026-03-12_
