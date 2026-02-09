-- Adds structured location profile storage and filter indexes.

ALTER TABLE public.ads
	ADD COLUMN IF NOT EXISTS location_profile_data jsonb;

CREATE INDEX IF NOT EXISTS ads_location_profile_data_gin_idx
	ON public.ads
	USING gin (location_profile_data);

CREATE INDEX IF NOT EXISTS ads_location_county_id_idx
	ON public.ads ((location_profile_data->'county'->>'id'));

CREATE INDEX IF NOT EXISTS ads_location_locality_id_idx
	ON public.ads ((location_profile_data->'locality'->>'id'));

CREATE INDEX IF NOT EXISTS ads_status_county_created_idx
	ON public.ads (status, ((location_profile_data->'county'->>'id')), created_at DESC);

CREATE INDEX IF NOT EXISTS ads_status_locality_created_idx
	ON public.ads (status, ((location_profile_data->'locality'->>'id')), created_at DESC);
