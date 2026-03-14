import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from './+server';

function mockKV(heartbeat: string | null) {
	return { get: vi.fn().mockResolvedValue(heartbeat) };
}

function mockR2(throws = false) {
	return {
		head: throws
			? vi.fn().mockRejectedValue(new Error('unreachable'))
			: vi.fn().mockResolvedValue(null)
	};
}

function mockSupabase(ok = true) {
	return {
		from: () => ({
			select: () => ({
				limit: () => Promise.resolve({ error: ok ? null : new Error('db down') })
			})
		})
	};
}

function makeEvent({
	dbOk = true,
	heartbeat = new Date().toISOString(),
	r2Throws = false
}: {
	dbOk?: boolean;
	heartbeat?: string | null;
	r2Throws?: boolean;
} = {}) {
	return {
		locals: { supabase: mockSupabase(dbOk) },
		platform: {
			env: {
				RATE_LIMIT: mockKV(heartbeat),
				ADS_BUCKET: mockR2(r2Throws)
			}
		}
	} as Parameters<typeof GET>[0];
}

describe('GET /api/health', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
	});

	it('returns ok/200 when all checks pass', async () => {
		const res = await GET(makeEvent());
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.status).toBe('ok');
		expect(body.checks.database.ok).toBe(true);
		expect(body.checks.cron.ok).toBe(true);
		expect(body.checks.r2.ok).toBe(true);
		expect(body.timestamp).toBeDefined();
	});

	it('returns down/503 when database is unreachable', async () => {
		const res = await GET(makeEvent({ dbOk: false }));
		expect(res.status).toBe(503);

		const body = await res.json();
		expect(body.status).toBe('down');
		expect(body.checks.database.ok).toBe(false);
	});

	it('returns down/503 when R2 is unreachable', async () => {
		const res = await GET(makeEvent({ r2Throws: true }));
		expect(res.status).toBe(503);

		const body = await res.json();
		expect(body.status).toBe('down');
		expect(body.checks.r2.ok).toBe(false);
	});

	it('returns degraded/503 when cron heartbeat is stale (>30 min)', async () => {
		const stale = new Date(Date.now() - 45 * 60_000).toISOString();
		const res = await GET(makeEvent({ heartbeat: stale }));
		expect(res.status).toBe(503);

		const body = await res.json();
		expect(body.status).toBe('degraded');
		expect(body.checks.cron.ok).toBe(false);
		expect(body.checks.cron.age_minutes).toBe(45);
	});

	it('returns degraded when cron heartbeat is missing (null)', async () => {
		const res = await GET(makeEvent({ heartbeat: null }));
		expect(res.status).toBe(503);

		const body = await res.json();
		expect(body.status).toBe('degraded');
		expect(body.checks.cron.ok).toBe(false);
	});

	it('returns down when both DB and cron fail (DB takes precedence)', async () => {
		const res = await GET(makeEvent({ dbOk: false, heartbeat: null }));
		expect(res.status).toBe(503);

		const body = await res.json();
		expect(body.status).toBe('down');
	});

	it('sets cache-control: no-store header', async () => {
		const res = await GET(makeEvent());
		expect(res.headers.get('cache-control')).toContain('no-store');
	});

	it('includes latency_ms for database check', async () => {
		const res = await GET(makeEvent());
		const body = await res.json();
		expect(typeof body.checks.database.latency_ms).toBe('number');
	});
});
