// Relative and full date formatting using native Intl APIs -- zero dependencies

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
	['year', 365 * 24 * 60 * 60 * 1000],
	['month', 30 * 24 * 60 * 60 * 1000],
	['week', 7 * 24 * 60 * 60 * 1000],
	['day', 24 * 60 * 60 * 1000],
	['hour', 60 * 60 * 1000],
	['minute', 60 * 1000]
];

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'always', style: 'narrow' });

/**
 * Format a created_at ISO string as "2d ago", "3h ago", etc.
 * Returns "just now" for less than 1 minute.
 */
export function formatRelativeTime(isoDate: string): string {
	const diff = Date.now() - new Date(isoDate).getTime();
	if (diff < 60_000) return 'just now';

	for (const [unit, ms] of UNITS) {
		if (diff >= ms) {
			const value = Math.floor(diff / ms);
			return rtf.format(-value, unit);
		}
	}
	return 'just now';
}

/**
 * Format a created_at ISO string as full date: "12 March 2026"
 */
export function formatFullDate(isoDate: string): string {
	return new Intl.DateTimeFormat('en-IE', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}).format(new Date(isoDate));
}
