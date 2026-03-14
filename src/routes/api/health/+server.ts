import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

type HealthCheck = {
	status: 'ok' | 'degraded' | 'down';
	checks: {
		database: { ok: boolean; latency_ms?: number };
		cron: { ok: boolean; last_tick?: string; age_minutes?: number };
		r2: { ok: boolean };
	};
	timestamp: string;
};

export const GET: RequestHandler = async ({ locals, platform }) => {
	const penv = platform?.env as { RATE_LIMIT?: KVNamespace; ADS_BUCKET?: R2Bucket } | undefined;

	// --- Database check ---
	let dbOk = false;
	let dbLatency: number | undefined;
	try {
		const start = Date.now();
		const { error } = await locals.supabase.from('ads').select('id').limit(1);
		dbLatency = Date.now() - start;
		dbOk = !error;
	} catch {
		dbOk = false;
	}

	// --- Cron heartbeat check ---
	let cronOk = false;
	let lastTick: string | undefined;
	let ageMinutes: number | undefined;
	try {
		const heartbeat = await penv?.RATE_LIMIT?.get('cron:heartbeat');
		if (heartbeat) {
			lastTick = heartbeat;
			const age = Date.now() - new Date(heartbeat).getTime();
			ageMinutes = Math.round(age / 60_000);
			cronOk = ageMinutes <= 30;
		}
	} catch {
		cronOk = false;
	}

	// --- R2 check ---
	let r2Ok = false;
	try {
		// A null return (key doesn't exist) is SUCCESS -- it proves R2 responded.
		// Only a thrown exception means R2 is unreachable.
		await penv?.ADS_BUCKET?.head('_health-check');
		r2Ok = true;
	} catch {
		r2Ok = false;
	}

	// --- Status logic ---
	let status: HealthCheck['status'];
	if (!dbOk || !r2Ok) {
		status = 'down';
	} else if (!cronOk) {
		status = 'degraded';
	} else {
		status = 'ok';
	}

	const allOk = status === 'ok';

	const body: HealthCheck = {
		status,
		checks: {
			database: { ok: dbOk, ...(dbLatency !== undefined && { latency_ms: dbLatency }) },
			cron: {
				ok: cronOk,
				...(lastTick && { last_tick: lastTick }),
				...(ageMinutes !== undefined && { age_minutes: ageMinutes })
			},
			r2: { ok: r2Ok }
		},
		timestamp: new Date().toISOString()
	};

	return json(body, {
		status: allOk ? 200 : 503,
		headers: { 'cache-control': 'no-store, no-cache, must-revalidate' }
	});
};
