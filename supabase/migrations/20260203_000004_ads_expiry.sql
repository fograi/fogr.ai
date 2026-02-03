-- Add expiry support (default 32 days) + public read policy guard

-- 1) Add expires_at column (idempotent)
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'ads'
			AND column_name = 'expires_at'
	) THEN
		ALTER TABLE public.ads
			ADD COLUMN expires_at timestamptz;
	END IF;
END $$;

-- 2) Backfill + defaults
UPDATE public.ads
SET expires_at = created_at + interval '32 days'
WHERE expires_at IS NULL;

ALTER TABLE public.ads
	ALTER COLUMN expires_at SET DEFAULT (now() + interval '32 days');

ALTER TABLE public.ads
	ALTER COLUMN expires_at SET NOT NULL;

-- 3) Allow new status value
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'ads_status_check'
			AND conrelid = 'public.ads'::regclass
	) THEN
		ALTER TABLE public.ads
			DROP CONSTRAINT ads_status_check;
	END IF;
END $$;

ALTER TABLE public.ads
	ADD CONSTRAINT ads_status_check
	CHECK (status IN ('active', 'pending', 'rejected', 'expired'));

-- 4) Index to speed expiry checks
CREATE INDEX IF NOT EXISTS ads_status_expires_at_idx
	ON public.ads (status, expires_at);

-- 5) Restrict public reads to active + not expired
DROP POLICY IF EXISTS "Public read published ads" ON public.ads;
CREATE POLICY "Public read published ads"
	ON public.ads
	FOR SELECT
	TO anon, authenticated
	USING (status = 'active' AND expires_at > now());
