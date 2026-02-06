import { describe, expect, it } from 'vitest';
import { groupReportsByAd } from './report-grouping';

describe('groupReportsByAd', () => {
	it('groups reports by ad and preserves latest ordering', () => {
		const reports = [
			{ ad_id: 'ad-1', created_at: '2026-02-06T10:00:00.000Z', status: 'open' },
			{ ad_id: 'ad-2', created_at: '2026-02-06T09:00:00.000Z', status: 'open' },
			{ ad_id: 'ad-1', created_at: '2026-02-05T10:00:00.000Z', status: 'dismissed' }
		];

		const groups = groupReportsByAd(reports);

		expect(groups.map((group) => group.adId)).toEqual(['ad-1', 'ad-2']);
		expect(groups[0].reports).toHaveLength(2);
		expect(groups[0].latest.created_at).toBe('2026-02-06T10:00:00.000Z');
		expect(groups[1].reports).toHaveLength(1);
	});
});
