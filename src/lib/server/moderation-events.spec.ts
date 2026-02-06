import { describe, expect, it, vi } from 'vitest';
import { recordModerationEvent } from './moderation-events';

describe('recordModerationEvent', () => {
	it('inserts with defaults', async () => {
		const insert = vi.fn().mockResolvedValue({ error: null });
		const from = vi.fn().mockReturnValue({ insert });
		const admin = { from } as any;

		await recordModerationEvent(admin, {
			contentId: 'ad-123',
			eventType: 'report_received'
		});

		expect(from).toHaveBeenCalledWith('moderation_events');
		expect(insert).toHaveBeenCalledWith({
			content_id: 'ad-123',
			content_type: 'ad',
			report_id: null,
			user_id: null,
			event_type: 'report_received',
			decision: null,
			legal_basis: null,
			automated_flag: false
		});
	});

	it('passes optional values', async () => {
		const insert = vi.fn().mockResolvedValue({ error: null });
		const from = vi.fn().mockReturnValue({ insert });
		const admin = { from } as any;

		await recordModerationEvent(admin, {
			contentId: 'ad-456',
			reportId: 'report-1',
			userId: 'user-1',
			eventType: 'decision_made',
			decision: 'reject',
			legalBasis: 'Terms 4.3',
			automatedFlag: true
		});

		expect(insert).toHaveBeenCalledWith({
			content_id: 'ad-456',
			content_type: 'ad',
			report_id: 'report-1',
			user_id: 'user-1',
			event_type: 'decision_made',
			decision: 'reject',
			legal_basis: 'Terms 4.3',
			automated_flag: true
		});
	});
});
