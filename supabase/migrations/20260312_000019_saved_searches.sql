-- saved_searches: infrastructure for Phase 4 UI + Phase 3 email delivery
-- Daily digest cron sends one email per saved search per day with new matches

CREATE TABLE IF NOT EXISTS public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  category text,
  county text,
  locality text,
  query text,
  notify boolean NOT NULL DEFAULT true,
  last_notified_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User lookup
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
