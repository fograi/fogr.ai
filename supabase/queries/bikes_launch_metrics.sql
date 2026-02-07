-- Bikes launch KPI query pack
-- Scope: category = 'Bikes'
-- Date filters are optional; uncomment and adjust as needed.

-- 1) % listings completed using presets only
WITH bikes_created AS (
	SELECT
		(created_at AT TIME ZONE 'UTC')::date AS day,
		(properties ->> 'usedPresetOnly')::boolean AS used_preset_only
	FROM public.event_metrics
	WHERE event_name = 'ad_created'
		AND properties ->> 'category' = 'Bikes'
		-- AND created_at >= now() - interval '30 days'
)
SELECT
	day,
	COUNT(*) AS bikes_listings_created,
	COUNT(*) FILTER (WHERE used_preset_only) AS bikes_preset_only_count,
	ROUND(
		100.0 * COUNT(*) FILTER (WHERE used_preset_only) / NULLIF(COUNT(*), 0),
		2
	) AS bikes_preset_only_pct
FROM bikes_created
GROUP BY day
ORDER BY day DESC;

-- 2) % listings with condition + size set
WITH bikes_created AS (
	SELECT
		(created_at AT TIME ZONE 'UTC')::date AS day,
		(properties ->> 'bikeConditionSet')::boolean AS bike_condition_set,
		(properties ->> 'bikeSizeSet')::boolean AS bike_size_set
	FROM public.event_metrics
	WHERE event_name = 'ad_created'
		AND properties ->> 'category' = 'Bikes'
		-- AND created_at >= now() - interval '30 days'
)
SELECT
	day,
	COUNT(*) AS bikes_listings_created,
	COUNT(*) FILTER (WHERE bike_condition_set AND bike_size_set) AS bikes_complete_profile_count,
	ROUND(
		100.0 * COUNT(*) FILTER (WHERE bike_condition_set AND bike_size_set) / NULLIF(COUNT(*), 0),
		2
	) AS bikes_complete_profile_pct
FROM bikes_created
GROUP BY day
ORDER BY day DESC;

-- 3) % offers auto-declined by minimum price
-- Numerator: bikes offer_auto_declined events where reason = below_min
-- Denominator: all bikes offer message_sent events
WITH bikes_offers AS (
	SELECT
		(created_at AT TIME ZONE 'UTC')::date AS day,
		event_name,
		properties,
		ad_id
	FROM public.event_metrics
	WHERE event_name IN ('message_sent', 'offer_auto_declined')
		-- AND created_at >= now() - interval '30 days'
),
joined AS (
	SELECT bo.day, bo.event_name, bo.properties
	FROM bikes_offers bo
	JOIN public.ads a ON a.id = bo.ad_id
	WHERE a.category = 'Bikes'
)
SELECT
	day,
	COUNT(*) FILTER (
		WHERE event_name = 'message_sent'
			AND properties ->> 'kind' = 'offer'
	) AS bikes_offer_messages,
	COUNT(*) FILTER (
		WHERE event_name = 'offer_auto_declined'
			AND properties ->> 'reason' = 'below_min'
	) AS bikes_offer_auto_declined_below_min,
	ROUND(
		100.0 * COUNT(*) FILTER (
			WHERE event_name = 'offer_auto_declined'
				AND properties ->> 'reason' = 'below_min'
		) / NULLIF(COUNT(*) FILTER (
			WHERE event_name = 'message_sent'
				AND properties ->> 'kind' = 'offer'
		), 0),
		2
	) AS bikes_offer_auto_declined_below_min_pct
FROM joined
GROUP BY day
ORDER BY day DESC;

-- 4) Time to first serious message
-- "Serious" = first buyer offer in a conversation for a bikes listing.
WITH bikes_ads AS (
	SELECT id, created_at
	FROM public.ads
	WHERE category = 'Bikes'
		-- AND created_at >= now() - interval '30 days'
),
first_offer_per_ad AS (
	SELECT
		a.id AS ad_id,
		MIN(m.created_at) AS first_offer_at,
		MIN(a.created_at) AS ad_created_at
	FROM bikes_ads a
	JOIN public.conversations c ON c.ad_id = a.id
	JOIN public.messages m ON m.conversation_id = c.id
	WHERE m.kind = 'offer'
	GROUP BY a.id
)
SELECT
	COUNT(*) AS bikes_with_offer_count,
	ROUND(
		AVG(EXTRACT(EPOCH FROM (first_offer_at - ad_created_at))) / 60.0,
		2
	) AS avg_minutes_to_first_offer,
	PERCENTILE_CONT(0.5) WITHIN GROUP (
		ORDER BY EXTRACT(EPOCH FROM (first_offer_at - ad_created_at))
	) / 60.0 AS p50_minutes_to_first_offer
FROM first_offer_per_ad;

-- 5) Report rate per listing
WITH bikes_ads AS (
	SELECT id
	FROM public.ads
	WHERE category = 'Bikes'
		-- AND created_at >= now() - interval '30 days'
),
reports_per_ad AS (
	SELECT
		a.id AS ad_id,
		COUNT(r.id) AS report_count
	FROM bikes_ads a
	LEFT JOIN public.ad_reports r ON r.ad_id = a.id
	GROUP BY a.id
)
SELECT
	COUNT(*) AS bikes_total_listings,
	COUNT(*) FILTER (WHERE report_count > 0) AS bikes_reported_listings,
	SUM(report_count) AS bikes_total_reports,
	ROUND(
		100.0 * COUNT(*) FILTER (WHERE report_count > 0) / NULLIF(COUNT(*), 0),
		2
	) AS bikes_reported_listing_rate_pct,
	ROUND(
		100.0 * SUM(report_count) / NULLIF(COUNT(*), 0),
		2
	) AS bikes_reports_per_100_listings
FROM reports_per_ad;
