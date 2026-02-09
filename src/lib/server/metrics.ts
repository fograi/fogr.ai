import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '$lib/supabase.types';

type MetricEvent = {
	eventName: string;
	userId: string;
	adId?: string | null;
	conversationId?: string | null;
	properties?: Json;
};

export async function recordMetric(
	client: SupabaseClient<Database>,
	{ eventName, userId, adId = null, conversationId = null, properties }: MetricEvent
) {
	try {
		await client.from('event_metrics').insert({
			event_name: eventName,
			user_id: userId,
			ad_id: adId,
			conversation_id: conversationId,
			properties: properties ?? null
		});
	} catch (err) {
		console.warn('metrics_insert_failed', err);
	}
}
