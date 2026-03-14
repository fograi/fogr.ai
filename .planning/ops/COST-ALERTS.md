# Cost Alerts and Monitoring Setup

Cost alert configuration and uptime monitoring setup for fogr.ai.

## Budget Overview

| Metric                          | Value                         |
| ------------------------------- | ----------------------------- |
| **Hard monthly budget ceiling** | $75 total across all services |
| **Current estimated spend**     | ~$38-43/month                 |
| **Headroom**                    | ~$32-37/month before ceiling  |

**Spend breakdown:**

| Service            | Monthly Cost | Notes                                           |
| ------------------ | ------------ | ----------------------------------------------- |
| Supabase Pro       | $25          | Fixed (required for automated backups)          |
| Domain (.ai)       | ~$12.50      | ~$150/year amortised monthly                    |
| OpenAI             | ~$1-5        | Content moderation API, variable with ad volume |
| Cloudflare Workers | $0           | Within free tier limits                         |
| Cloudflare R2      | $0           | Within free tier limits                         |
| Resend             | $0           | Free tier (3,000 emails/month)                  |

## Service-by-Service Alert Setup

### Supabase ($25/month Pro)

**IMPORTANT:** Supabase does NOT support custom spending threshold email alerts. The spend cap is binary (on/off). There is no "alert at 75%" feature.

**Setup:**

1. Go to Supabase Dashboard > Project Settings > Billing.
2. Toggle **Spend Cap** to **ON**.
3. This prevents any overage charges entirely -- services degrade when quota is reached rather than billing more.

**Manual monitoring:**

- Periodically review Dashboard > Project Settings > Usage to monitor:
  - Database size
  - API requests
  - Auth usage (monthly active users)
  - Realtime connections

### Cloudflare (Free/Workers Tier)

**Setup:**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) > Notifications > Create Notification.
2. Select notification type: **Usage-Based Billing**.
3. Configure to alert when Workers usage, R2 storage, or R2 operations approach paid thresholds.
4. Set alert contacts to the operator email.

**Current status:** Usage is well within free tier limits. The free tier includes:

- Workers: 100,000 requests/day
- R2: 10 GB storage, 10 million Class A operations/month, 1 million Class B operations/month
- KV: 100,000 reads/day, 1,000 writes/day

### OpenAI (~$1-5/month)

**Setup:**

1. Go to [platform.openai.com](https://platform.openai.com) > Settings > Organization > Limits.
2. Set **hard spending limit** to **$10/month** at the organization level (not just project level).
3. Hard limit actually stops API calls; soft limit only sends an email.

**What happens when the limit is reached:**

- The moderation API returns errors.
- Ads queue as `pending` status instead of being auto-approved.
- This is graceful degradation already handled in the codebase -- see [DEGRADATION.md](./DEGRADATION.md).
- When the limit resets next month (or is raised), the cron worker automatically processes the backlog.

### Resend (Free Tier, 3,000 Emails/Month)

**Built-in alerts:**

- Resend automatically sends quota alert emails at 80% usage (2,400 emails).

**Setup:**

1. Go to [resend.com](https://resend.com) > Account Settings.
2. Verify the alert email is configured to the operator's email address.

**Mental alert threshold:** 2,000 emails/month (2/3 of limit).

**If approaching limit:**

- Reduce saved search digest frequency (currently daily at 08:00 UTC).
- Batch more aggressively (process fewer saved searches per cron tick).
- Consider upgrading to Resend Pro ($20/month for 50,000 emails) only if organically needed.

### Domain (~$150/year, Renews July)

The .ai domain costs approximately $150/year, transferred to Cloudflare Registrar with auto-renewal.

**Setup:**

1. Go to Cloudflare Dashboard > Registrar > fogr.ai.
2. Verify **auto-renewal is enabled**.
3. Ensure the payment method on file is valid before the July renewal date.

**Calendar reminder:** Set a reminder for June to verify renewal status and payment method.

## Monitoring Setup (UptimeRobot)

### Account Setup

1. Go to [uptimerobot.com](https://uptimerobot.com) and create a free account.
2. Add the operator email as the primary alert contact.

### Monitor 1: Homepage

| Setting             | Value             |
| ------------------- | ----------------- |
| Type                | HTTP(s)           |
| URL                 | `https://fogr.ai` |
| Monitoring interval | 5 minutes         |
| Alert contacts      | Operator email    |
| Expected status     | 200               |

### Monitor 2: Health Check

| Setting             | Value                                           |
| ------------------- | ----------------------------------------------- |
| Type                | HTTP(s)                                         |
| URL                 | `https://fogr.ai/api/health`                    |
| Monitoring interval | 5 minutes                                       |
| Alert contacts      | Operator email                                  |
| Expected status     | 200 (will alert on 503 when health check fails) |

### Note on Commercial Use

UptimeRobot free tier may restrict "commercial use" in their terms. fogr.ai is pre-revenue and has no paying customers. If restricted later, migrate to [BetterStack](https://betterstack.com) free tier:

- 5 monitors
- 30-second interval
- No commercial restriction

## Monthly Review Checklist

Perform this review on the 1st of each month:

- [ ] Check Supabase Usage dashboard -- verify database size and API requests are within expected ranges
- [ ] Check OpenAI usage page -- verify monthly spend is under $10
- [ ] Check Resend email count -- verify under 2,000 threshold
- [ ] Check Cloudflare Workers analytics -- verify within free tier limits
- [ ] Verify UptimeRobot shows both monitors green
- [ ] Verify domain renewal status (especially before July)
- [ ] Calculate total monthly spend and compare against $75 ceiling

---

_Document: COST-ALERTS.md_
_Last updated: 2026-03-14_
_Covers: INFR-03 (Cost Guardrails), INFR-02 (Monitoring)_
