-- Extend ads.status to support sold + archived

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
	CHECK (status IN ('active', 'pending', 'rejected', 'expired', 'sold', 'archived'));
