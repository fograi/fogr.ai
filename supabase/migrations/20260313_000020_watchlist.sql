-- watchlist: users can save ads for later viewing
-- Phase 4 engagement feature -- save button on ad detail page

CREATE TABLE IF NOT EXISTS public.watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, ad_id)
);

-- User lookup: fetch all saved ads for a user
CREATE INDEX IF NOT EXISTS watchlist_user_id_idx
  ON public.watchlist (user_id);

-- RLS
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own watchlist"
  ON public.watchlist FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
