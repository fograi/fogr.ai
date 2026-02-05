-- Lightweight event metrics (append-only)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.event_metrics (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	event_name text NOT NULL,
	user_id uuid,
	ad_id uuid,
	conversation_id uuid,
	properties jsonb,
	created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_metrics_created_at_idx
	ON public.event_metrics (created_at DESC);
CREATE INDEX IF NOT EXISTS event_metrics_event_name_idx
	ON public.event_metrics (event_name);
CREATE INDEX IF NOT EXISTS event_metrics_ad_id_idx
	ON public.event_metrics (ad_id);
CREATE INDEX IF NOT EXISTS event_metrics_conversation_id_idx
	ON public.event_metrics (conversation_id);
CREATE INDEX IF NOT EXISTS event_metrics_user_id_idx
	ON public.event_metrics (user_id);

ALTER TABLE public.event_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Event metrics insert by authenticated" ON public.event_metrics;
CREATE POLICY "Event metrics insert by authenticated"
	ON public.event_metrics
	FOR INSERT
	TO authenticated
	WITH CHECK (auth.uid() = user_id);
