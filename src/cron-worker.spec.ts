/**
 * INFR-02: Cron worker writes heartbeat KV entry after each tick.
 *
 * Requirement (06-01-PLAN.md): "Cron worker writes a heartbeat timestamp to KV after each tick"
 * Implementation: env.RATE_LIMIT.put('cron:heartbeat', new Date().toISOString(), { expirationTtl: 3600 })
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import the default export (the worker object with scheduled())
import cronWorker from './cron-worker';

// ---------------------------------------------------------------------------
// Minimal mock helpers
// ---------------------------------------------------------------------------

function makeKV() {
	return {
		put: vi.fn().mockResolvedValue(undefined),
		get: vi.fn().mockResolvedValue(null),
		delete: vi.fn().mockResolvedValue(undefined)
	};
}

/**
 * Build a minimal Env that satisfies the cron worker's guard checks.
 * retryPendingAds requires: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   OPENAI_API_KEY, ADS_BUCKET, ADS_PENDING_BUCKET.
 * We stub those bindings and mock global fetch so no real HTTP calls are made.
 */
function makeEnv(rateLimitKV = makeKV()) {
	const r2Stub = {
		get: vi.fn().mockResolvedValue(null),
		put: vi.fn().mockResolvedValue(undefined),
		head: vi.fn().mockResolvedValue(null),
		delete: vi.fn().mockResolvedValue(undefined)
	};

	return {
		PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
		SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
		OPENAI_API_KEY: 'test-openai-key',
		RESEND_API_KEY: undefined, // skip email paths
		UNSUBSCRIBE_SECRET: undefined,
		ADS_BUCKET: r2Stub,
		ADS_PENDING_BUCKET: r2Stub,
		RATE_LIMIT: rateLimitKV
	};
}

/**
 * Build a ScheduledController-compatible object.
 * Schedule it to a time that is NOT in a daily/weekly/digest window,
 * so we avoid triggering Supabase RPC calls (metrics rollup, digest).
 * Tuesday 12:00 UTC is well outside all three windows.
 */
function makeController(scheduledTime = new Date('2026-01-06T12:00:00Z').getTime()) {
	return { scheduledTime, cron: '*/15 * * * *' };
}

/**
 * Build an ExecutionContext stub that captures the promise passed to waitUntil.
 * The test awaits that promise so assertions run after all async work completes.
 */
function makeCtx() {
	let capturedPromise: Promise<unknown> | null = null;
	const ctx = {
		waitUntil: vi.fn((p: Promise<unknown>) => {
			capturedPromise = p;
		}),
		passThroughOnException: vi.fn()
	};
	return {
		ctx,
		waitForScheduled: () => {
			if (!capturedPromise) throw new Error('waitUntil was never called');
			return capturedPromise;
		}
	};
}

// ---------------------------------------------------------------------------
// Mock global fetch so retryPendingAds / expireActiveAds don't make real calls
// ---------------------------------------------------------------------------
//
// expireActiveAds: GET /rest/v1/ads → return empty array (nothing to expire)
// retryPendingAds: GET /rest/v1/ads → return empty array (no pending ads)
// Any other call: return empty 200 response to be safe.

function makeFetchMock() {
	// Each call must get a FRESH Response — Response body can only be consumed once.
	return vi.fn().mockImplementation(() =>
		Promise.resolve(
			new Response(JSON.stringify([]), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})
		)
	);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('cron worker heartbeat write (INFR-02)', () => {
	let originalFetch: typeof globalThis.fetch;

	beforeEach(() => {
		originalFetch = globalThis.fetch;
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.restoreAllMocks();
	});

	it('cron worker writes cron:heartbeat to RATE_LIMIT KV after a successful tick', async () => {
		// Arrange
		const rateLimitKV = makeKV();
		const env = makeEnv(rateLimitKV);
		const controller = makeController();
		const { ctx, waitForScheduled } = makeCtx();
		globalThis.fetch = makeFetchMock();

		// Act
		cronWorker.scheduled(controller as never, env as never, ctx as never);
		await waitForScheduled();

		// Assert: RATE_LIMIT.put was called with the heartbeat key
		expect(rateLimitKV.put).toHaveBeenCalledWith(
			'cron:heartbeat',
			expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/), // ISO timestamp
			expect.objectContaining({ expirationTtl: 3600 })
		);
	});

	it('cron worker writes a valid ISO timestamp as the heartbeat value', async () => {
		// Arrange
		const rateLimitKV = makeKV();
		const env = makeEnv(rateLimitKV);
		const controller = makeController();
		const { ctx, waitForScheduled } = makeCtx();
		globalThis.fetch = makeFetchMock();

		// Act
		cronWorker.scheduled(controller as never, env as never, ctx as never);
		await waitForScheduled();

		// Assert: the written value parses as a valid Date (not NaN)
		const writtenValue = rateLimitKV.put.mock.calls[0][1] as string;
		expect(isNaN(new Date(writtenValue).getTime())).toBe(false);
	});

	it('cron worker sets expirationTtl of 3600 seconds on the heartbeat entry', async () => {
		// Arrange
		const rateLimitKV = makeKV();
		const env = makeEnv(rateLimitKV);
		const controller = makeController();
		const { ctx, waitForScheduled } = makeCtx();
		globalThis.fetch = makeFetchMock();

		// Act
		cronWorker.scheduled(controller as never, env as never, ctx as never);
		await waitForScheduled();

		// Assert: expirationTtl is exactly 3600 (1 hour safety net)
		const options = rateLimitKV.put.mock.calls[0][2] as { expirationTtl: number };
		expect(options.expirationTtl).toBe(3600);
	});

	it('cron worker skips heartbeat write when RATE_LIMIT binding is absent', async () => {
		// Arrange: no RATE_LIMIT binding (simulates un-deployed config)
		const env = makeEnv(undefined as never);
		(env as Record<string, unknown>).RATE_LIMIT = undefined;
		const controller = makeController();
		const { ctx, waitForScheduled } = makeCtx();
		globalThis.fetch = makeFetchMock();

		// Act — must not throw even without the KV binding
		cronWorker.scheduled(controller as never, env as never, ctx as never);
		await expect(waitForScheduled()).resolves.not.toThrow();
	});
});
