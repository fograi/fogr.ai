# Phase 3: Email Infrastructure - Research

**Researched:** 2026-03-12
**Domain:** Transactional email delivery (Resend), HMAC-based unsubscribe, Cloudflare Workers integration
**Confidence:** HIGH

## Summary

Phase 3 integrates Resend transactional email into the existing fogr.ai SvelteKit + Cloudflare Workers stack. The project already has email template builders (`moderation-emails.ts`) producing plain text -- these need migrating to minimal branded HTML. The cron worker (`cron-worker.ts`) already handles moderation decisions and expiry; email sending hooks directly into the approve/reject flow. The messages API route (`api/messages/+server.ts`) already records new messages and tracks conversations; it needs a fire-and-forget email notification call added.

The user has explicitly decided against React Email, against a retry queue table, and against the Resend SDK's React rendering. Emails use pure TypeScript string templates with a shared `renderEmail(subject, bodyHtml)` wrapper. The Resend REST API is called directly via `fetch()` -- no SDK needed given the project's existing pattern of raw `fetch()` calls to Supabase REST endpoints from the cron worker. However, the Resend Node.js SDK (v6.9.3) does work in Cloudflare Workers and provides a cleaner DX with TypeScript types; the planner should evaluate whether installing `resend` (7kB gzipped) or using raw fetch is cleaner given the project's minimalist dependency philosophy.

**Primary recommendation:** Use Resend REST API via `fetch()` (matching the cron worker's existing Supabase pattern), with HMAC-SHA256 unsubscribe tokens via Web Crypto API, and a new `email_preferences` + `saved_searches` Supabase migration.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- Minimal branded HTML -- logo, clean typography, single accent color. Not plain text, not heavy React Email
- Pure TypeScript string templates with a shared `renderEmail(subject, bodyHtml)` wrapper function -- no templating library, no JSX
- Migrate existing moderation email templates (takedown, statement of reasons, appeal outcome) from plain text to the new HTML style -- one consistent look across all emails
- Sender identity: `fogr.ai <eolas@fogr.ai>` for all email types
- Send from wherever the trigger happens: cron worker for moderation decisions, API routes for message notifications
- Fire and forget -- call Resend, log failures, move on. Resend handles its own retries. No queue table
- RESEND_API_KEY added as Cloudflare Worker secret, same pattern as OPENAI_API_KEY. Update Env type in cron-worker.ts
- Look up user email from Supabase auth as needed -- no denormalization. Volume is low
- Signed HMAC token in URL: `/unsubscribe?token=xxx&type=messages` -- one click, no login, immediate suppression
- Suppressible types: message notifications, search alerts, ad approved. NOT suppressible: moderation/DSA emails (takedown, statement of reasons, appeal outcome)
- New `email_preferences` table: user_id, email_type, suppressed boolean. Checked before every non-legal send
- Confirmation page after unsubscribe: "You've been unsubscribed from [type] emails" with re-subscribe link
- Infrastructure only in this phase: `saved_searches` table + cron email delivery. "Save this search" UI deferred to Phase 4
- Daily digest cron -- one email per saved search per day with new matches since last run
- Email content: count + top 3 listings (title, price, link) + "View all" link to search page
- No tracking pixels, no open tracking, no click tracking
- List-Unsubscribe + List-Unsubscribe-Post headers (RFC 8058) on every non-transactional email
- DSA Article 17 Statement of Reasons -- moderation emails cannot be suppressed by unsubscribe
- DKIM + SPF + DMARC -- verify fogr.ai domain in Resend dashboard

### Claude's Discretion

- HTML template design details (colors, spacing, logo placement)
- HMAC signing implementation for unsubscribe tokens
- saved_searches table schema design
- Cron scheduling approach for daily digest (new cron trigger or extend existing)
- Error logging approach for failed sends

### Deferred Ideas (OUT OF SCOPE)

- "Save this search" UI button on browse/category pages -- Phase 4 (Engagement and Retention)
- Email analytics/open tracking -- explicitly not implementing (also avoids CNIL dual-consent requirement)
- Marketing/bulk email -- out of scope
- Complaints handling procedure -- UK DUA Act 2025 requirement, defer to Phase 5 (Launch Hardening)
  </user_constraints>

## Standard Stack

### Core

| Library                 | Version  | Purpose                                   | Why Standard                                                                       |
| ----------------------- | -------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| Resend REST API         | v1       | Send transactional email                  | User decision; REST endpoint at `https://api.resend.com/emails` called via fetch() |
| Web Crypto API          | Built-in | HMAC-SHA256 token signing for unsubscribe | Built into Cloudflare Workers runtime; no dependency needed                        |
| Supabase Auth Admin API | REST     | Look up user email by user_id             | Existing pattern; `GET /auth/v1/admin/users/{user_id}` with service role key       |

### Supporting

| Library      | Version | Purpose                                 | When to Use                                                                |
| ------------ | ------- | --------------------------------------- | -------------------------------------------------------------------------- |
| `resend` npm | 6.9.3   | TypeScript SDK alternative to raw fetch | Only if planner decides SDK DX justifies adding a dependency; NOT required |

### Alternatives Considered

| Instead of          | Could Use        | Tradeoff                                                                                                                  |
| ------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Raw fetch to Resend | `resend` npm SDK | SDK adds types + error handling but is an extra dependency; project uses raw fetch for Supabase already                   |
| Web Crypto HMAC     | node:crypto      | Web Crypto is native to CF Workers; node:crypto requires nodejs_compat (already enabled) but Web Crypto is more idiomatic |
| String templates    | React Email      | User explicitly decided against React Email; string templates are simpler and avoid JSX in a Svelte project               |

**Installation:**

```bash
# If using SDK approach (optional):
npm install resend

# If using raw fetch approach (recommended -- zero dependencies):
# No installation needed. API key added as CF Worker secret:
wrangler secret put RESEND_API_KEY
```

## Architecture Patterns

### Recommended Project Structure

```
src/
  lib/
    server/
      email/
        send.ts              # sendEmail() wrapper -- calls Resend REST API
        templates.ts          # renderEmail() wrapper + all email template functions
        unsubscribe.ts        # HMAC token generation + verification
        preferences.ts        # check/update email_preferences table
      moderation-emails.ts    # EXISTING -- migrate to import from email/templates.ts
      moderation-emails.spec.ts # EXISTING -- update for HTML output
  routes/
    (public)/
      unsubscribe/
        +page.server.ts       # GET: verify token, show confirmation; POST: process RFC 8058 one-click
        +page.svelte          # Confirmation UI with re-subscribe link
    api/
      unsubscribe/
        +server.ts            # POST endpoint for RFC 8058 List-Unsubscribe-Post (returns 200, no HTML)
  cron-worker.ts              # EXISTING -- add email sending after moderation decisions + daily digest
supabase/
  migrations/
    YYYYMMDD_000018_email_preferences.sql
    YYYYMMDD_000019_saved_searches.sql
```

### Pattern 1: Fire-and-Forget Email via Resend REST API

**What:** Call Resend POST endpoint, log result, never block the calling flow.
**When to use:** Every email send in the application.
**Example:**

```typescript
// Source: Resend API docs (https://resend.com/docs/api-reference/emails/send-email)
type SendEmailParams = {
	to: string;
	subject: string;
	html: string;
	text?: string;
	headers?: Record<string, string>;
};

async function sendEmail(env: Env, params: SendEmailParams): Promise<string | null> {
	try {
		const res = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${env.RESEND_API_KEY}`
			},
			body: JSON.stringify({
				from: 'fogr.ai <eolas@fogr.ai>',
				to: [params.to],
				subject: params.subject,
				html: params.html,
				text: params.text, // Resend auto-generates from HTML if omitted
				headers: params.headers
			})
		});
		if (!res.ok) {
			console.error('email_send_failed', { status: res.status, body: await res.text() });
			return null;
		}
		const data = (await res.json()) as { id: string };
		console.log('email_sent', { id: data.id, to: params.to });
		return data.id;
	} catch (err) {
		console.error('email_send_error', { error: String(err), to: params.to });
		return null;
	}
}
```

### Pattern 2: HMAC-SHA256 Unsubscribe Token via Web Crypto API

**What:** Generate a signed token encoding user_id + email_type, verify on unsubscribe endpoint.
**When to use:** Every non-DSA email includes an unsubscribe URL with this token.
**Example:**

```typescript
// Source: Cloudflare Workers Web Crypto docs
// (https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)
// and signing-requests example
// (https://developers.cloudflare.com/workers/examples/signing-requests/)

const ALGORITHM = { name: 'HMAC', hash: 'SHA-256' };

async function importKey(secret: string): Promise<CryptoKey> {
	const encoder = new TextEncoder();
	return crypto.subtle.importKey('raw', encoder.encode(secret), ALGORITHM, false, [
		'sign',
		'verify'
	]);
}

function bufferToBase64url(buf: ArrayBuffer): string {
	const bytes = new Uint8Array(buf);
	let binary = '';
	for (const b of bytes) binary += String.fromCharCode(b);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToBuffer(str: string): ArrayBuffer {
	const padded = str.replace(/-/g, '+').replace(/_/g, '/');
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes.buffer;
}

async function generateUnsubscribeToken(
	secret: string,
	userId: string,
	emailType: string
): Promise<string> {
	const key = await importKey(secret);
	const payload = `${userId}:${emailType}`;
	const encoder = new TextEncoder();
	const signature = await crypto.subtle.sign(ALGORITHM, key, encoder.encode(payload));
	return `${bufferToBase64url(signature)}.${btoa(payload).replace(/=+$/, '')}`;
}

async function verifyUnsubscribeToken(
	secret: string,
	token: string
): Promise<{ userId: string; emailType: string } | null> {
	const [sig, payloadB64] = token.split('.');
	if (!sig || !payloadB64) return null;

	const payload = atob(payloadB64);
	const [userId, emailType] = payload.split(':');
	if (!userId || !emailType) return null;

	const key = await importKey(secret);
	const encoder = new TextEncoder();
	const valid = await crypto.subtle.verify(
		ALGORITHM,
		key,
		base64urlToBuffer(sig),
		encoder.encode(payload)
	);

	return valid ? { userId, emailType } : null;
}
```

### Pattern 3: List-Unsubscribe Headers (RFC 8058)

**What:** Add List-Unsubscribe and List-Unsubscribe-Post headers for Gmail/Yahoo/Outlook one-click unsubscribe.
**When to use:** Every suppressible email (message notifications, search alerts, ad approved). NOT on DSA/moderation emails.
**Example:**

```typescript
// Source: Resend docs (https://resend.com/docs/dashboard/emails/add-unsubscribe-to-transactional-emails)
// RFC 8058 (https://datatracker.ietf.org/doc/html/rfc8058)

function buildUnsubscribeHeaders(unsubscribeUrl: string): Record<string, string> {
	return {
		'List-Unsubscribe': `<${unsubscribeUrl}>`,
		'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
	};
}

// Usage in sendEmail:
const token = await generateUnsubscribeToken(env.UNSUBSCRIBE_SECRET, userId, 'messages');
const unsubUrl = `https://fogr.ai/api/unsubscribe?token=${token}&type=messages`;
await sendEmail(env, {
	to: userEmail,
	subject: 'New message on fogr.ai',
	html: renderNewMessageEmail({
		/* ... */
	}),
	headers: buildUnsubscribeHeaders(unsubUrl)
});
```

### Pattern 4: User Email Lookup from Cron Worker

**What:** Fetch user email from Supabase Auth admin API using service role key.
**When to use:** Before sending any email from the cron worker (which has user_id but not email).
**Example:**

```typescript
// Source: Supabase Auth Admin API
// (https://supabase.com/docs/reference/self-hosting-auth/get-a-user)

async function getUserEmail(env: Env, userId: string): Promise<string | null> {
	const url = new URL(`/auth/v1/admin/users/${userId}`, env.PUBLIC_SUPABASE_URL);
	const res = await fetch(url, {
		headers: {
			apikey: env.SUPABASE_SERVICE_ROLE_KEY as string,
			Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
		}
	});
	if (!res.ok) {
		console.error('auth_user_lookup_failed', { userId, status: res.status });
		return null;
	}
	const user = (await res.json()) as { email?: string };
	return user.email ?? null;
}
```

### Pattern 5: Email Preference Check Before Send

**What:** Query `email_preferences` table before sending suppressible emails.
**When to use:** Before every non-DSA email send.
**Example:**

```typescript
async function isEmailSuppressed(env: Env, userId: string, emailType: string): Promise<boolean> {
	const url = new URL('/rest/v1/email_preferences', env.PUBLIC_SUPABASE_URL);
	url.searchParams.set('user_id', `eq.${userId}`);
	url.searchParams.set('email_type', `eq.${emailType}`);
	url.searchParams.set('suppressed', 'eq.true');
	url.searchParams.set('select', 'id');
	url.searchParams.set('limit', '1');

	const res = await fetch(url, { headers: supabaseHeaders(env) });
	if (!res.ok) return false; // fail open -- send email if unsure
	const rows = (await res.json()) as Array<{ id: string }>;
	return rows.length > 0;
}
```

### Anti-Patterns to Avoid

- **Building a retry queue table:** User explicitly decided against this. Resend handles its own retries. Log failures and move on.
- **Using React Email / JSX templates:** User explicitly decided on pure TS string templates. Do not add react-email or any JSX rendering.
- **Blocking the ad posting/message flow on email failure:** Email must be fire-and-forget. Wrap in try/catch, never re-throw.
- **Denormalizing user email into the ads table:** User decided to look up from auth as needed. Volume is low.
- **Adding tracking pixels or open/click tracking:** Explicitly forbidden. Avoids CNIL 2025 dual-consent and UK DUA Act 2025 issues.

## Don't Hand-Roll

| Problem                              | Don't Build                     | Use Instead                                                         | Why                                                                                    |
| ------------------------------------ | ------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Email delivery + DKIM/SPF            | Custom SMTP integration         | Resend REST API                                                     | DKIM signing, SPF records, bounce handling, deliverability -- all handled by Resend    |
| Token signing for unsubscribe        | Custom crypto implementation    | Web Crypto `subtle.sign/verify` with HMAC-SHA256                    | Timing-safe verification, standard algorithm, zero dependencies, built into CF Workers |
| Auto-generating plain text from HTML | Custom HTML-to-text stripping   | Resend's automatic plain text generation                            | Pass `html` only; Resend auto-generates `text` version. Opt out by setting `text: ''`  |
| RFC 8058 one-click unsubscribe       | Complex protocol implementation | Pass `List-Unsubscribe` + `List-Unsubscribe-Post` headers to Resend | Just two HTTP headers; Resend ensures they are covered by the DKIM signature           |
| Idempotent email sending             | Custom deduplication logic      | Resend `Idempotency-Key` header                                     | Pass a unique key per send; Resend deduplicates within 24 hours                        |

**Key insight:** Resend handles the hard parts of email delivery (DKIM, SPF, bounces, retries, plain text generation, DKIM-signed headers). The application only needs to compose HTML and call a single REST endpoint.

## Common Pitfalls

### Pitfall 1: Sending DSA Emails with Unsubscribe Headers

**What goes wrong:** Adding List-Unsubscribe to moderation/DSA emails (takedown, statement of reasons, appeal outcome) allows users to suppress legally required notifications.
**Why it happens:** Treating all emails uniformly in the send function.
**How to avoid:** The `sendEmail` function must accept a `legal: boolean` flag. When `legal === true`, do NOT add List-Unsubscribe headers and do NOT check email_preferences. Only suppressible email types get unsubscribe headers.
**Warning signs:** An unsubscribe link appearing in a takedown or statement-of-reasons email.

### Pitfall 2: RFC 8058 POST Endpoint Must Return 200, Not Redirect

**What goes wrong:** Gmail/Yahoo/Outlook send a POST to the List-Unsubscribe URL. If it returns a redirect (302) or HTML page, the one-click unsubscribe fails silently.
**Why it happens:** Using the same SvelteKit page route for both browser GET (confirmation page) and machine POST (RFC 8058).
**How to avoid:** Create a separate API route (`/api/unsubscribe`) that handles POST and returns 200 with empty body. The browser-facing page (`(public)/unsubscribe`) handles GET for the confirmation UI. The List-Unsubscribe header URL must point to the API route, not the page route.
**Warning signs:** Gmail not showing the "Unsubscribe" button in the email header.

### Pitfall 3: HMAC Secret Not Available in Both Runtimes

**What goes wrong:** The unsubscribe token is generated in the cron worker (CF Worker scheduled handler) but verified in a SvelteKit server route. Both need access to the same HMAC secret.
**Why it happens:** Forgetting that the cron worker and the SvelteKit app share the same Cloudflare Worker deployment and the same `Env` bindings.
**How to avoid:** Add `UNSUBSCRIBE_SECRET` as a Cloudflare Worker secret (same as `RESEND_API_KEY`). It is available in both `cron-worker.ts` via `env.UNSUBSCRIBE_SECRET` and in SvelteKit routes via `platform.env.UNSUBSCRIBE_SECRET`.
**Warning signs:** Token verification failing in the unsubscribe endpoint.

### Pitfall 4: Supabase Auth Admin API Path Prefix

**What goes wrong:** Calling `/admin/users/{id}` instead of `/auth/v1/admin/users/{id}` on the Supabase REST API.
**Why it happens:** Documentation sometimes omits the `/auth/v1` prefix.
**How to avoid:** The full path is `GET {SUPABASE_URL}/auth/v1/admin/users/{user_id}`. Use the service role key in both `apikey` header and `Authorization: Bearer` header, matching the existing `supabaseHeaders()` pattern in cron-worker.ts.
**Warning signs:** 404 or 401 responses when looking up user email.

### Pitfall 5: Cron Worker Timeout with Too Many Emails

**What goes wrong:** If many ads are approved/rejected in a single cron tick, sending emails for each one sequentially could exceed the Cloudflare Workers CPU time limit (30s for scheduled handlers on paid plan, 10ms on free).
**Why it happens:** The cron worker already processes up to BATCH_LIMIT (25) ads per tick.
**How to avoid:** Resend API calls are fast (network I/O, not CPU). The cron worker runs on a paid plan with 30-second limits. 25 sequential email sends at ~200ms each = ~5 seconds total, well within limits. If volume grows, batch with `Promise.allSettled` for parallel sends.
**Warning signs:** Cron worker logs showing timeout errors.

### Pitfall 6: Email Preferences Table Missing RLS Policies

**What goes wrong:** Users can read/modify other users' email preferences if RLS is not configured.
**Why it happens:** Forgetting RLS on a new table.
**How to avoid:** The `email_preferences` table needs RLS enabled with policies: users can read/update their own preferences, service role can read all (for cron worker checks). The cron worker uses the service role key, so it bypasses RLS automatically. The unsubscribe endpoint also uses service role to write preferences (since the user is not authenticated -- they clicked a link in email).
**Warning signs:** Privacy violation; users seeing or changing each others' email preferences.

### Pitfall 7: Saved Searches Cron Running on Every Tick

**What goes wrong:** The saved search digest runs every 5 minutes instead of once daily, sending duplicate digest emails.
**Why it happens:** Not gating the saved search email dispatch behind a time window check like the existing metrics rollup.
**How to avoid:** The existing cron worker already has time-window checks (`isDailyWindow` at 00:15 UTC). Add saved search digest to a similar daily window (e.g., 08:00 UTC = 08:00 IST, a reasonable morning delivery time for Ireland).
**Warning signs:** Users receiving the same digest email multiple times per day.

## Code Examples

### Shared HTML Email Wrapper

```typescript
// renderEmail() -- shared wrapper for all email templates
const BRAND_COLOR = '#1a73e8'; // or whatever accent color is chosen

function renderEmail(subject: string, bodyHtml: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(subject)}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; background: #f5f5f5; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; }
    .header { padding: 24px 32px 16px; border-bottom: 2px solid ${BRAND_COLOR}; }
    .header img { height: 28px; }
    .body { padding: 24px 32px; line-height: 1.6; font-size: 15px; }
    .footer { padding: 16px 32px; font-size: 12px; color: #666; border-top: 1px solid #e5e5e5; }
    .footer a { color: #666; }
    a { color: ${BRAND_COLOR}; }
    .btn { display: inline-block; padding: 10px 20px; background: ${BRAND_COLOR}; color: #fff !important; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <strong style="font-size: 18px; color: ${BRAND_COLOR};">fogr.ai</strong>
    </div>
    <div class="body">
      ${bodyHtml}
    </div>
    <div class="footer">
      <p>fogr.ai -- Classified ads for Ireland</p>
      <p><a href="https://fogr.ai/privacy">Privacy</a> | <a href="https://fogr.ai/terms">Terms</a></p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
```

### Ad Approved Email Template

```typescript
function buildAdApprovedEmailHtml(ctx: {
	adTitle: string;
	adUrl: string;
	unsubscribeUrl: string;
}): string {
	return renderEmail(
		'Your listing is live on fogr.ai',
		`
    <p>Good news! Your listing has been approved and is now live.</p>
    <p><strong>${escapeHtml(ctx.adTitle)}</strong></p>
    <p><a href="${ctx.adUrl}" class="btn">View your listing</a></p>
    <p style="margin-top: 24px; font-size: 13px; color: #666;">
      <a href="${ctx.unsubscribeUrl}">Unsubscribe</a> from listing approval emails.
    </p>
  `
	);
}
```

### New Message Notification Email Template

```typescript
function buildNewMessageEmailHtml(ctx: {
	adTitle: string;
	adUrl: string;
	unsubscribeUrl: string;
}): string {
	// NOTE: Does NOT reveal sender identity per success criteria #3
	return renderEmail(
		'You have a new message on fogr.ai',
		`
    <p>Someone sent you a message about your listing:</p>
    <p><strong>${escapeHtml(ctx.adTitle)}</strong></p>
    <p><a href="${ctx.adUrl}" class="btn">View conversation</a></p>
    <p style="font-size: 13px; color: #666;">
      Sign in to fogr.ai to read and reply to the message.
    </p>
    <p style="margin-top: 24px; font-size: 13px; color: #666;">
      <a href="${ctx.unsubscribeUrl}">Unsubscribe</a> from message notification emails.
    </p>
  `
	);
}
```

### Database Migration: email_preferences

```sql
-- email_preferences: per-user email type suppression
CREATE TABLE IF NOT EXISTS public.email_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type text NOT NULL,  -- 'messages', 'search_alerts', 'ad_approved'
  suppressed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One row per user per email type
CREATE UNIQUE INDEX IF NOT EXISTS email_preferences_user_type_idx
  ON public.email_preferences (user_id, email_type);

-- RLS
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read their own preferences
CREATE POLICY "Users read own email preferences"
  ON public.email_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users update own email preferences"
  ON public.email_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Service role (cron worker, unsubscribe endpoint) bypasses RLS automatically
```

### Database Migration: saved_searches

```sql
-- saved_searches: infrastructure for Phase 4 UI + Phase 3 email delivery
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,  -- optional user-given name
  category text,  -- filter: category slug (nullable = any)
  county text,  -- filter: county slug (nullable = any)
  locality text,  -- filter: locality slug (nullable = any)
  query text,  -- filter: keyword search (nullable = none)
  notify boolean NOT NULL DEFAULT true,
  last_notified_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS saved_searches_user_id_idx
  ON public.saved_searches (user_id);

-- For cron worker: find all searches needing notification
CREATE INDEX IF NOT EXISTS saved_searches_notify_idx
  ON public.saved_searches (notify) WHERE notify = true;

-- For matching new ads efficiently
CREATE INDEX IF NOT EXISTS saved_searches_category_county_idx
  ON public.saved_searches (category, county);

-- RLS
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved searches"
  ON public.saved_searches FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## State of the Art

| Old Approach            | Current Approach                                                                  | When Changed                                  | Impact                                                                  |
| ----------------------- | --------------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| SMTP from Workers       | HTTP API email services (Resend, SES)                                             | Always (Workers have no TCP sockets for SMTP) | Must use HTTP-based email APIs                                          |
| React Email SSR         | Resend accepts plain `html` string parameter                                      | Always supported                              | No need for React rendering; string templates work fine                 |
| Manual List-Unsubscribe | RFC 8058 one-click (required by Gmail Jun 2024, Yahoo Jun 2024, Outlook May 2025) | Jun 2024                                      | Must include `List-Unsubscribe-Post: List-Unsubscribe=One-Click` header |
| Resend SDK required     | REST API works equally well via fetch()                                           | Always                                        | SDK is convenience, not requirement                                     |

**Deprecated/outdated:**

- MailChannels free tier via Cloudflare Workers was discontinued in 2024. Do not use.
- Cloudflare Email Service (launched Oct 2025) is a new option but Resend is the user's decision.

## Open Questions

1. **Resend SDK vs raw fetch()**
   - What we know: Both work. SDK (v6.9.3) adds TypeScript types. Raw fetch matches the cron worker's existing pattern for Supabase calls.
   - What's unclear: Whether the SDK adds meaningful value over a simple typed wrapper.
   - Recommendation: Use raw fetch() with a typed `sendEmail()` wrapper. Matches existing codebase patterns. The planner should decide.

2. **UNSUBSCRIBE_SECRET storage**
   - What we know: Must be a Cloudflare Worker secret shared between cron worker and SvelteKit routes.
   - What's unclear: Whether to use a separate secret or derive from existing SUPABASE_SERVICE_ROLE_KEY.
   - Recommendation: Use a separate dedicated secret (`UNSUBSCRIBE_SECRET`). Deriving from another secret is fragile; if the service role key rotates, all unsubscribe tokens break.

3. **Daily digest scheduling**
   - What we know: The existing cron worker runs every 5 minutes with time-window checks. There is `isDailyWindow` at 00:15 UTC and `isWeeklyWindow` at Sunday 00:30 UTC.
   - What's unclear: Best time for the daily digest delivery in Irish timezone (IST = UTC+0 in winter, UTC+1 in summer).
   - Recommendation: Run digest at 08:00 UTC (08:00-09:00 local Irish time depending on DST). Add a new time window check: `const isDigestWindow = utcHour === 8 && utcMinute === 0;`

4. **Fogr.ai domain verification in Resend**
   - What we know: DKIM, SPF, and DMARC records are required for deliverability and RFC 8058 compliance. Resend handles DKIM signing once the domain is verified.
   - What's unclear: Whether fogr.ai DNS is already configured for email, or if new records need adding.
   - Recommendation: This is a manual dashboard step. The plan should include a verification checklist as the first task.

## Sources

### Primary (HIGH confidence)

- [Resend API Reference - Send Email](https://resend.com/docs/api-reference/emails/send-email) - Endpoint, parameters, response format
- [Resend - Send with Cloudflare Workers](https://resend.com/docs/send-with-cloudflare-workers) - CF Workers integration pattern
- [Resend - Add Unsubscribe to Transactional Emails](https://resend.com/docs/dashboard/emails/add-unsubscribe-to-transactional-emails) - List-Unsubscribe header via `headers` parameter
- [Cloudflare Workers - Web Crypto API](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/) - HMAC-SHA256 support confirmation
- [Cloudflare Workers - Signing Requests](https://developers.cloudflare.com/workers/examples/signing-requests/) - HMAC signing pattern for Workers
- [Supabase Auth Admin - Get User by ID](https://supabase.com/docs/reference/self-hosting-auth/get-a-user) - REST endpoint `GET /auth/v1/admin/users/{user_id}`, returns `email` field
- [RFC 8058 - One-Click Unsubscribe](https://datatracker.ietf.org/doc/html/rfc8058) - Protocol specification

### Secondary (MEDIUM confidence)

- [Resend Pricing](https://resend.com/pricing) - Free tier: 3,000 emails/month, sufficient for early-stage classifieds
- [Cloudflare Workers Node.js Compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/) - nodejs_compat flag enables crypto module; project already has `nodejs_compat` in wrangler.jsonc

### Tertiary (LOW confidence)

- npm view resend version = 6.9.3 (checked 2026-03-12, may change)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Resend REST API is well-documented, Cloudflare Workers compatibility verified, Web Crypto API is built-in
- Architecture: HIGH - Existing codebase patterns (cron worker, Supabase REST, email templates) are clear; integration points are well-defined
- Pitfalls: HIGH - RFC 8058 requirements are well-documented; DSA/legal email distinction is explicitly covered in CONTEXT.md
- Email templates: MEDIUM - HTML template design is Claude's discretion; the renderEmail wrapper pattern is straightforward but specific CSS choices may need iteration
- Saved searches schema: MEDIUM - Schema design is Claude's discretion; the index strategy needs validation under real query patterns

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (30 days -- Resend API is stable; RFC 8058 is a published standard)
