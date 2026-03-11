-- Add slug and short_id columns (nullable initially -- backfill needed before NOT NULL)
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS short_id text;

-- Unique indexes for lookup and collision prevention
CREATE UNIQUE INDEX IF NOT EXISTS ads_short_id_unique_idx
  ON public.ads (short_id);

CREATE UNIQUE INDEX IF NOT EXISTS ads_slug_unique_idx
  ON public.ads (slug);
