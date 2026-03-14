# Backup and Restore Procedure

This document covers the Supabase database backup configuration, verification, and restore procedure for fogr.ai.

## Prerequisites

- **Supabase Pro tier ($25/month) is required.** The free tier does NOT include automated backups.
- See [Supabase pricing](https://supabase.com/pricing) for tier details.
- The operator must have admin access to the Supabase Dashboard for the fogr.ai project.

## What Is Backed Up

**Included in Supabase automated backups:**

- All database tables (ads, profiles, saved_searches, messages, event_metrics, etc.)
- Database functions (rollup_event_metrics_daily, purge_event_metrics)
- Triggers
- Row Level Security (RLS) policies
- Auth users and sessions

**NOT included in Supabase backups:**

| Data                                     | Location                                              | Backup Strategy                                                                                   |
| ---------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| R2 images (ad photos)                    | Cloudflare R2 (`fograi` and `fograi-pending` buckets) | Not backed up -- see [DEGRADATION.md](./DEGRADATION.md) for risk acceptance (11-nines durability) |
| Cloudflare KV data (rate limit counters) | Cloudflare KV namespace                               | Ephemeral by design -- counters regenerate naturally via TTL-based entries                        |
| Cloudflare Workers code                  | Git repository                                        | Version-controlled in this repo -- redeploy from git                                              |
| DNS and domain configuration             | Cloudflare Dashboard                                  | Manual configuration -- documented in [SECRETS.md](./SECRETS.md)                                  |

## Backup Schedule

- Supabase runs **daily automated backups** on the Pro tier.
- Retention period: **7 days** (7 daily snapshots available at any time).
- **PITR (Point-in-Time Recovery)** is available as a paid add-on but is NOT needed for v1. Daily snapshots are sufficient for a classifieds platform where data changes are low-frequency.

## How to Verify Backups Are Enabled

1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Select the fogr.ai project.
3. Navigate to **Project Settings > Database > Backups**.
4. Confirm daily backups are listed with timestamps.
5. Verify the most recent backup is within the last 24 hours.

If no backups are listed, the project may be on the free tier. Upgrade to Pro ($25/month) to enable automated backups.

## Restore Procedure

> **WARNING: Restore is destructive.** It overwrites the current database state with the backup snapshot. There is no undo.

### Step-by-Step

1. **Assess the situation.** Determine what data was lost or corrupted and which backup point to restore to. Remember backups are daily -- any data created after the backup point will be lost.

2. **Navigate to backups.**
   - Supabase Dashboard > Project Settings > Database > Backups

3. **Select the backup point.**
   - Choose the most appropriate daily snapshot (closest to before the incident).

4. **Initiate restore.**
   - Click **"Restore"** next to the selected backup.
   - Confirm the destructive action when prompted.
   - Wait for the restore to complete (may take several minutes depending on database size).

5. **Verify the restore.**
   - Check ads table has data:
     ```sql
     SELECT count(*) FROM ads;
     ```
   - Check auth users exist:
     ```sql
     SELECT count(*) FROM auth.users;
     ```
   - Check RLS policies are intact:
     ```sql
     SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
     ```
   - Check database functions exist:
     ```sql
     SELECT routine_name FROM information_schema.routines
     WHERE routine_schema = 'public'
     AND routine_type = 'FUNCTION';
     ```

6. **Redeploy workers.**
   - Redeploy cron worker to ensure it reconnects cleanly:
     ```bash
     npx wrangler deploy --config wrangler.cron.jsonc
     ```
   - Redeploy main worker:
     ```bash
     npm run deploy
     ```

7. **Smoke test the platform.**
   - Visit `https://fogr.ai` and confirm the homepage loads with ads.
   - Try browsing a category page.
   - Try logging in with an existing account.
   - Check that images load (R2 is independent of database restore).

## What Is NOT Recoverable

- **R2 images** are not backed up. If the database is restored to a point where ads reference images that were later deleted from R2, those ads will show broken images. See [DEGRADATION.md](./DEGRADATION.md) for the R2 risk acceptance rationale.
- **Data created after the backup point** is lost. For a classifieds platform, this means any ads posted, messages sent, or accounts created after the backup timestamp.

## Testing the Restore

Test the restore procedure once manually to build confidence:

1. Create a separate Supabase project on the free tier (for testing only).
2. Export the production schema from the fogr.ai project.
3. Import the schema into the test project.
4. Insert a few test rows.
5. Verify the data is accessible.
6. Record the test date and result below.

### Restore Test Log

| Date             | Tested By | Result | Notes |
| ---------------- | --------- | ------ | ----- |
| _Not yet tested_ | --        | --     | --    |

---

_Document: RESTORE.md_
_Last updated: 2026-03-14_
_Covers: INFR-01 (Backup/Restore)_
