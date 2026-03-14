import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatRelativeTime, formatFullDate } from './relative-time';

// All tests pin the system clock so formatRelativeTime is deterministic.
// Reference now: 2026-03-14T12:00:00.000Z
const NOW = new Date('2026-03-14T12:00:00.000Z').getTime();

describe('formatRelativeTime', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns "just now" for a date less than 1 minute ago', () => {
		const thirtySecondsAgo = new Date(NOW - 30_000).toISOString();
		expect(formatRelativeTime(thirtySecondsAgo)).toBe('just now');
	});

	it('returns "just now" for a date exactly at the current moment', () => {
		const now = new Date(NOW).toISOString();
		expect(formatRelativeTime(now)).toBe('just now');
	});

	it('returns a minutes-ago string for a date 5 minutes ago', () => {
		const fiveMinutesAgo = new Date(NOW - 5 * 60_000).toISOString();
		const result = formatRelativeTime(fiveMinutesAgo);
		// Intl.RelativeTimeFormat narrow style produces "5m ago"
		expect(result).toContain('5');
		expect(result).toContain('ago');
		expect(result).toMatch(/\dm/);
	});

	it('returns an hours-ago string for a date 3 hours ago', () => {
		const threeHoursAgo = new Date(NOW - 3 * 60 * 60_000).toISOString();
		const result = formatRelativeTime(threeHoursAgo);
		// Intl.RelativeTimeFormat narrow style produces "3h ago"
		expect(result).toContain('3');
		expect(result).toContain('ago');
		expect(result).toMatch(/\dh/);
	});

	it('returns a days-ago string for a date 2 days ago', () => {
		const twoDaysAgo = new Date(NOW - 2 * 24 * 60 * 60_000).toISOString();
		const result = formatRelativeTime(twoDaysAgo);
		// Intl.RelativeTimeFormat narrow style produces "2d ago"
		expect(result).toContain('2');
		expect(result).toContain('ago');
		expect(result).toMatch(/\dd/);
	});

	it('returns a weeks-ago string for a date 2 weeks ago', () => {
		const twoWeeksAgo = new Date(NOW - 14 * 24 * 60 * 60_000).toISOString();
		const result = formatRelativeTime(twoWeeksAgo);
		// Intl.RelativeTimeFormat narrow style produces "2w ago"
		expect(result).toContain('2');
		expect(result).toContain('ago');
		expect(result).toMatch(/\dw/);
	});

	it('returns a months-ago string for a date 2 months ago', () => {
		const twoMonthsAgo = new Date(NOW - 60 * 24 * 60 * 60_000).toISOString();
		const result = formatRelativeTime(twoMonthsAgo);
		// Intl.RelativeTimeFormat narrow style produces "2mo ago"
		expect(result).toContain('2');
		expect(result).toContain('ago');
		expect(result).toMatch(/mo/);
	});

	it('returns a years-ago string for a date 2 years ago', () => {
		const twoYearsAgo = new Date(NOW - 2 * 365 * 24 * 60 * 60_000).toISOString();
		const result = formatRelativeTime(twoYearsAgo);
		// Intl.RelativeTimeFormat narrow style produces "2y ago"
		expect(result).toContain('2');
		expect(result).toContain('ago');
		expect(result).toMatch(/\dy/);
	});

	it('always contains "ago" in the result for past dates', () => {
		const oneDayAgo = new Date(NOW - 24 * 60 * 60_000).toISOString();
		expect(formatRelativeTime(oneDayAgo)).toContain('ago');
	});
});

describe('formatFullDate', () => {
	it('formats an ISO date as a readable full date string', () => {
		// Use midday UTC to avoid timezone boundary shifting the day
		const result = formatFullDate('2026-03-12T12:00:00Z');
		expect(result).toContain('March');
		expect(result).toContain('2026');
		expect(result).toContain('12');
	});

	it('formats a date in a different month correctly', () => {
		const result = formatFullDate('2026-07-15T12:00:00Z');
		expect(result).toContain('July');
		expect(result).toContain('15');
		expect(result).toContain('2026');
	});

	it('does not include time in the formatted output', () => {
		const result = formatFullDate('2026-03-14T15:30:00Z');
		// Full date format should not contain colons (time separator)
		expect(result).not.toContain(':');
	});
});
