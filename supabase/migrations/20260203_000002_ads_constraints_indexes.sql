-- Enforce valid status values and speed up listing queries.

-- Preflight: fail if there are unexpected status values
DO $$
DECLARE
	invalid_count integer;
BEGIN
	SELECT COUNT(*) INTO invalid_count
	FROM public.ads
	WHERE status NOT IN ('active', 'pending', 'rejected');

	IF invalid_count > 0 THEN
		RAISE EXCEPTION 'ads.status has % invalid rows; fix before adding constraint', invalid_count;
	END IF;
END $$;

-- Add status check constraint (idempotent)
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'ads_status_check'
			AND conrelid = 'public.ads'::regclass
	) THEN
		ALTER TABLE public.ads
			ADD CONSTRAINT ads_status_check
			CHECK (status IN ('active', 'pending', 'rejected'));
	END IF;
END $$;

-- Composite index supports public listings and pending retries
CREATE INDEX IF NOT EXISTS ads_status_created_at_idx
	ON public.ads (status, created_at DESC);
