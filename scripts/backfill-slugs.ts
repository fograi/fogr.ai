#!/usr/bin/env -S npx tsx
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/backfill-slugs.ts
//
// Populates slug and short_id for all existing ads that do not have them.
// After backfill completes, prints ALTER TABLE statements to add NOT NULL constraints.

import { createClient } from '@supabase/supabase-js';
import { generateAdSlug } from '../src/lib/server/slugs.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
	console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
	console.error(
		'Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/backfill-slugs.ts'
	);
	process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
	auth: { persistSession: false, autoRefreshToken: false }
});

const BATCH_SIZE = 100;
const MAX_RETRIES = 3;
const BATCH_DELAY_MS = 100;

interface AdRow {
	id: string;
	title: string;
	category: string;
	location_profile_data: { county?: { name?: string } } | null;
}

async function backfill(): Promise<void> {
	// Pre-flight: verify the slug column exists in the database
	const { error: preflight } = await supabase.from('ads').select('slug').limit(1);

	if (preflight && preflight.message.includes('does not exist')) {
		console.error('');
		console.error('ERROR: The slug and short_id columns do not exist in the ads table.');
		console.error('');
		console.error('You must apply the migration first. Open the Supabase SQL Editor at:');
		console.error('  https://supabase.com/dashboard → SQL Editor');
		console.error('');
		console.error('Then run the following SQL:');
		console.error('');
		console.error('  ALTER TABLE public.ads');
		console.error('    ADD COLUMN IF NOT EXISTS slug text,');
		console.error('    ADD COLUMN IF NOT EXISTS short_id text;');
		console.error('');
		console.error('  CREATE UNIQUE INDEX IF NOT EXISTS ads_short_id_unique_idx');
		console.error('    ON public.ads (short_id);');
		console.error('');
		console.error('  CREATE UNIQUE INDEX IF NOT EXISTS ads_slug_unique_idx');
		console.error('    ON public.ads (slug);');
		console.error('');
		console.error('After the migration is applied, re-run this script.');
		process.exit(1);
	}

	console.log('Pre-flight check passed: slug column exists.');
	console.log('');

	let processed = 0;
	let batch = 0;

	while (true) {
		batch++;
		const { data: ads, error } = await supabase
			.from('ads')
			.select('id, title, category, location_profile_data')
			.is('slug', null)
			.limit(BATCH_SIZE);

		if (error) {
			console.error('backfill_error', { batch, error: error.message });
			process.exit(1);
		}

		if (!ads || ads.length === 0) {
			break;
		}

		for (const ad of ads as AdRow[]) {
			const countyName = ad.location_profile_data?.county?.name ?? null;
			let success = false;

			for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
				const slug = generateAdSlug(ad.title, countyName, ad.category);
				const shortId = slug.slice(-8);

				const { error: updateError } = await supabase
					.from('ads')
					.update({ slug, short_id: shortId })
					.eq('id', ad.id);

				if (!updateError) {
					success = true;
					break;
				}

				// Unique constraint violation -- retry with a new slug
				if (updateError.code === '23505') {
					console.warn('backfill_collision', { adId: ad.id, attempt, slug });
					continue;
				}

				// Other error -- fail
				console.error('backfill_update_error', {
					adId: ad.id,
					error: updateError.message
				});
				process.exit(1);
			}

			if (!success) {
				console.error('backfill_max_retries', { adId: ad.id });
				process.exit(1);
			}

			processed++;
		}

		console.log('backfill_progress', { processed, batch });
		await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
	}

	console.log('backfill_complete', { totalProcessed: processed });
	console.log('');
	console.log('All existing ads have been backfilled with slugs.');
	console.log('');
	console.log('Run the following SQL to add NOT NULL constraints:');
	console.log('');
	console.log('  ALTER TABLE public.ads ALTER COLUMN slug SET NOT NULL;');
	console.log('  ALTER TABLE public.ads ALTER COLUMN short_id SET NOT NULL;');
}

backfill().catch((err) => {
	console.error('backfill_fatal', err);
	process.exit(1);
});
