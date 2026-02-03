import type { KVNamespace } from '@cloudflare/workers-types';

type RateLimitState = {
	count: number;
	reset: number;
};

export type RateLimitResult = {
	allowed: boolean;
	retryAfter?: number;
};

export async function checkRateLimit(
	kv: KVNamespace | undefined,
	key: string,
	limit: number,
	windowSeconds: number
): Promise<RateLimitResult> {
	if (!kv) return { allowed: true };

	try {
		const now = Date.now();
		const existing = await kv.get<RateLimitState>(key, { type: 'json' });

		if (existing && existing.reset > now) {
			if (existing.count >= limit) {
				return { allowed: false, retryAfter: Math.ceil((existing.reset - now) / 1000) };
			}

			const ttl = Math.max(1, Math.ceil((existing.reset - now) / 1000));
			const next: RateLimitState = { count: existing.count + 1, reset: existing.reset };
			await kv.put(key, JSON.stringify(next), { expirationTtl: ttl });
			return { allowed: true };
		}

		const reset = now + windowSeconds * 1000;
		const initial: RateLimitState = { count: 1, reset };
		await kv.put(key, JSON.stringify(initial), { expirationTtl: windowSeconds });
		return { allowed: true };
	} catch (err) {
		console.warn('Rate limit KV error', err);
		return { allowed: true };
	}
}
