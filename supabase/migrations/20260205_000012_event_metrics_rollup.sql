-- Daily rollups + retention helpers for event metrics

CREATE TABLE IF NOT EXISTS public.event_metrics_daily (
	day date NOT NULL,
	event_name text NOT NULL,
	count bigint NOT NULL,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	PRIMARY KEY (day, event_name)
);

CREATE INDEX IF NOT EXISTS event_metrics_daily_day_idx
	ON public.event_metrics_daily (day DESC);
CREATE INDEX IF NOT EXISTS event_metrics_daily_event_name_idx
	ON public.event_metrics_daily (event_name);

ALTER TABLE public.event_metrics_daily ENABLE ROW LEVEL SECURITY;

-- Roll up a single UTC day (defaults to yesterday)
CREATE OR REPLACE FUNCTION public.rollup_event_metrics_daily(target_day date DEFAULT (current_date - 1))
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
	INSERT INTO public.event_metrics_daily (day, event_name, count, created_at, updated_at)
	SELECT
		target_day AS day,
		event_name,
		COUNT(*)::bigint,
		now(),
		now()
	FROM public.event_metrics
	WHERE (created_at AT TIME ZONE 'UTC')::date = target_day
	GROUP BY event_name
	ON CONFLICT (day, event_name)
	DO UPDATE SET count = EXCLUDED.count, updated_at = now();
END;
$$;

-- Purge raw events older than a given number of days (defaults to 90)
CREATE OR REPLACE FUNCTION public.purge_event_metrics(keep_days int DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	deleted_count integer;
BEGIN
	DELETE FROM public.event_metrics
	WHERE created_at < (now() - make_interval(days => keep_days));
	GET DIAGNOSTICS deleted_count = ROW_COUNT;
	RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.rollup_event_metrics_daily(date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purge_event_metrics(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rollup_event_metrics_daily(date) TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_event_metrics(int) TO service_role;
