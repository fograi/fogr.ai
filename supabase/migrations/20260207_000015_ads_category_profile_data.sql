-- Adds category-specific structured profile payload storage.

ALTER TABLE public.ads
	ADD COLUMN IF NOT EXISTS category_profile_data jsonb;

CREATE INDEX IF NOT EXISTS ads_category_profile_data_gin_idx
	ON public.ads
	USING gin (category_profile_data);
