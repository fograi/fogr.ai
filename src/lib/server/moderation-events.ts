import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase.types';

export type ModerationEventType =
	| 'report_received'
	| 'review_started'
	| 'decision_made'
	| 'statement_sent'
	| 'appeal_opened'
	| 'appeal_resolved'
	| 'appeal_dismissed';

export type ModerationEventInput = {
	contentId: string;
	eventType: ModerationEventType;
	contentType?: 'ad';
	reportId?: string | null;
	userId?: string | null;
	decision?: string | null;
	legalBasis?: string | null;
	automatedFlag?: boolean;
};

export const recordModerationEvent = async (
	admin: SupabaseClient<Database>,
	input: ModerationEventInput
): Promise<void> => {
	const payload = {
		content_id: input.contentId,
		content_type: input.contentType ?? 'ad',
		report_id: input.reportId ?? null,
		user_id: input.userId ?? null,
		event_type: input.eventType,
		decision: input.decision ?? null,
		legal_basis: input.legalBasis ?? null,
		automated_flag: input.automatedFlag ?? false
	};

	const { error } = await admin.from('moderation_events').insert(payload);
	if (error) {
		console.warn('moderation_event_insert_failed', error);
	}
};
