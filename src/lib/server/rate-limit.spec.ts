import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { KVNamespace } from '@cloudflare/workers-types';
import { checkRateLimit } from './rate-limit';

type Stored = { value: string; expiresAt: number | null };

class MockKV {
	private store = new Map<string, Stored>();

	async get<T = unknown>(key: string, options?: { type?: 'json' | 'text' }) {
		const entry = this.store.get(key);
		if (!entry) return null;
		if (entry.expiresAt && entry.expiresAt <= Date.now()) {
			this.store.delete(key);
			return null;
		}
		if (options?.type === 'json') return JSON.parse(entry.value) as T;
		return entry.value as T;
	}

	async put(key: string, value: string, options?: { expirationTtl?: number }) {
		const expiresAt = options?.expirationTtl
			? Date.now() + options.expirationTtl * 1000
			: null;
		this.store.set(key, { value, expiresAt });
	}
}

describe('checkRateLimit', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('allows when KV is missing', async () => {
		const res = await checkRateLimit(undefined, 'k', 1, 60);
		expect(res.allowed).toBe(true);
	});

	it('enforces limits and resets after window', async () => {
		const kv = new MockKV() as unknown as KVNamespace;

		const first = await checkRateLimit(kv, 'k', 2, 60);
		const second = await checkRateLimit(kv, 'k', 2, 60);
		const third = await checkRateLimit(kv, 'k', 2, 60);

		expect(first.allowed).toBe(true);
		expect(second.allowed).toBe(true);
		expect(third.allowed).toBe(false);
		expect(third.retryAfter).toBe(60);

		vi.advanceTimersByTime(60 * 1000);
		const afterWindow = await checkRateLimit(kv, 'k', 2, 60);
		expect(afterWindow.allowed).toBe(true);
	});
});
