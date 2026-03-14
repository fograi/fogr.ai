ALTER TABLE ads ADD COLUMN IF NOT EXISTS moderation_hold_reason TEXT NULL;
COMMENT ON COLUMN ads.moderation_hold_reason IS 'If set, cron worker skips auto-approve. Values: reseller_flagged';
