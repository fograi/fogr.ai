-- email_preferences: per-user email type suppression
-- Suppressible types: 'messages', 'search_alerts', 'ad_approved'
-- NOT suppressible: moderation/DSA emails (takedown, statement of reasons, appeal outcome)

CREATE TABLE IF NOT EXISTS public.email_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type text NOT NULL,
  suppressed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One row per user per email type
CREATE UNIQUE INDEX IF NOT EXISTS email_preferences_user_type_idx
  ON public.email_preferences (user_id, email_type);

-- RLS
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read their own preferences
CREATE POLICY "Users read own email preferences"
  ON public.email_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users update own email preferences"
  ON public.email_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Service role (cron worker, unsubscribe endpoint) bypasses RLS automatically
