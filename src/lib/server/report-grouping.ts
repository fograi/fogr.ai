export type ReportLike = {
	ad_id: string;
	created_at: string;
};

export type ReportGroup<T extends ReportLike> = {
	adId: string;
	reports: T[];
	latest: T;
	reportCount: number;
};

export const groupReportsByAd = <T extends ReportLike>(reports: T[]): ReportGroup<T>[] => {
	const groups = new Map<string, ReportGroup<T>>();

	for (const report of reports) {
		const adId = report.ad_id;
		const existing = groups.get(adId);
		if (!existing) {
			groups.set(adId, {
				adId,
				reports: [report],
				latest: report,
				reportCount: 1
			});
			continue;
		}

		existing.reports.push(report);
		existing.reportCount += 1;
		if (new Date(report.created_at).getTime() > new Date(existing.latest.created_at).getTime()) {
			existing.latest = report;
		}
	}

	return Array.from(groups.values());
};
