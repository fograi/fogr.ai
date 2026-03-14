#!/usr/bin/env -S npx tsx
/**
 * Seed listings script for populating the Bikes category.
 *
 * Inserts ~192 bicycle listings across all 32 Irish counties using the
 * Supabase service role key. Each listing has valid slug, JSONB profile
 * data, and a 14-day expiry.
 *
 * Usage:
 *   PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-listings.ts
 *
 * Or with .env file containing those variables:
 *   npx tsx scripts/seed-listings.ts
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { generateAdSlug } from '../src/lib/server/slugs.js';
import { buildLocationProfileData } from '../src/lib/location-hierarchy.js';
import { generateAllListings } from './seed-data.js';

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

// Load .env file if present (no dotenv dependency)
try {
	const scriptDir = dirname(fileURLToPath(import.meta.url));
	const envPath = resolve(scriptDir, '..', '.env');
	const envContent = readFileSync(envPath, 'utf-8');
	for (const line of envContent.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const eqIdx = trimmed.indexOf('=');
		if (eqIdx < 0) continue;
		const key = trimmed.slice(0, eqIdx).trim();
		const value = trimmed.slice(eqIdx + 1).trim();
		if (!process.env[key]) {
			process.env[key] = value;
		}
	}
} catch {
	// No .env file -- rely on environment variables
}

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
	console.error(
		'Missing environment variables. Required: PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.'
	);
	console.error(
		'Usage: PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-listings.ts'
	);
	process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
	auth: { persistSession: false, autoRefreshToken: false }
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SYSTEM_EMAIL = 'eolas@fogr.ai';
const BATCH_SIZE = 50;
const MAX_RETRIES = 3;
const EXPIRY_DAYS = 14;

// ---------------------------------------------------------------------------
// System account
// ---------------------------------------------------------------------------

async function getOrCreateSystemUser(): Promise<string> {
	// Check for SEED_USER_ID override
	if (process.env.SEED_USER_ID) {
		console.log(`Using provided SEED_USER_ID: ${process.env.SEED_USER_ID}`);
		return process.env.SEED_USER_ID;
	}

	// Look up existing user by email
	const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
		perPage: 1000
	});

	if (listError) {
		console.error('Failed to list users:', listError.message);
		process.exit(1);
	}

	const existingUser = listData.users.find((u) => u.email === SYSTEM_EMAIL);
	if (existingUser) {
		console.log(`Found existing system account: ${existingUser.id}`);
		return existingUser.id;
	}

	// Create new system account
	const { data: createData, error: createError } = await supabase.auth.admin.createUser({
		email: SYSTEM_EMAIL,
		email_confirm: true
	});

	if (createError) {
		console.error('Failed to create system account:', createError.message);
		process.exit(1);
	}

	console.log(`Created system account: ${createData.user.id}`);
	return createData.user.id;
}

// ---------------------------------------------------------------------------
// Idempotency check
// ---------------------------------------------------------------------------

async function checkExistingSeeds(userId: string): Promise<number> {
	const { count, error } = await supabase
		.from('ads')
		.select('id', { count: 'exact', head: true })
		.eq('user_id', userId)
		.eq('status', 'active');

	if (error) {
		console.error('Failed to check existing seeds:', error.message);
		process.exit(1);
	}

	return count ?? 0;
}

// ---------------------------------------------------------------------------
// Slug generation with deduplication
// ---------------------------------------------------------------------------

type InsertRow = {
	user_id: string;
	title: string;
	description: string;
	category: string;
	price: number;
	currency: string;
	status: string;
	image_keys: string[];
	firm_price: boolean;
	email: string;
	slug: string;
	short_id: string;
	category_profile_data: Record<string, unknown>;
	location_profile_data: Record<string, unknown>;
	expires_at: string;
};

function buildInsertRows(systemUserId: string): InsertRow[] {
	const listings = generateAllListings();
	const slugSet = new Set<string>();
	const rows: InsertRow[] = [];
	const expiresAt = new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

	for (const listing of listings) {
		let slug = generateAdSlug(listing.title, listing.countyName, 'Bikes');

		// Deduplicate slugs
		let attempts = 0;
		while (slugSet.has(slug) && attempts < MAX_RETRIES) {
			slug = generateAdSlug(listing.title, listing.countyName, 'Bikes');
			attempts++;
		}

		if (slugSet.has(slug)) {
			// Add counter suffix as last resort
			slug = slug + '-' + rows.length;
		}

		slugSet.add(slug);
		const shortId = slug.slice(-8);

		const locationData = buildLocationProfileData([listing.countyId]);
		if (!locationData) {
			console.error(`Failed to build location data for county: ${listing.countyId}`);
			continue;
		}

		rows.push({
			user_id: systemUserId,
			title: listing.title,
			description: listing.description,
			category: 'Bikes',
			price: listing.price,
			currency: listing.currency,
			status: 'active',
			image_keys: [],
			firm_price: false,
			email: SYSTEM_EMAIL,
			slug,
			short_id: shortId,
			category_profile_data: {
				version: 1,
				profile: 'bikes',
				subtype: listing.subtype,
				bikeType: listing.bikeType,
				condition: listing.condition,
				sizePreset: listing.sizePreset
			},
			location_profile_data: locationData,
			expires_at: expiresAt
		});
	}

	return rows;
}

// ---------------------------------------------------------------------------
// Batch insert with retry
// ---------------------------------------------------------------------------

async function insertBatch(
	batch: InsertRow[],
	batchNum: number,
	totalBatches: number
): Promise<{ inserted: number; failed: number }> {
	const { error } = await supabase.from('ads').insert(batch);

	if (!error) {
		console.log(`Inserted batch ${batchNum}/${totalBatches} (${batch.length} listings)`);
		return { inserted: batch.length, failed: 0 };
	}

	// If unique constraint violation, fall back to individual inserts
	if (error.code === '23505') {
		console.warn(
			`Batch ${batchNum} had constraint collision, falling back to individual inserts...`
		);
		return insertIndividually(batch, batchNum, totalBatches);
	}

	console.error(`Batch ${batchNum} failed:`, error.message);
	// Fall back to individual inserts for any batch-level error
	return insertIndividually(batch, batchNum, totalBatches);
}

async function insertIndividually(
	rows: InsertRow[],
	batchNum: number,
	totalBatches: number
): Promise<{ inserted: number; failed: number }> {
	let inserted = 0;
	let failed = 0;

	for (const row of rows) {
		let success = false;
		let currentRow = { ...row };

		for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
			const { error } = await supabase.from('ads').insert(currentRow);

			if (!error) {
				success = true;
				break;
			}

			if (error.code === '23505') {
				// Regenerate slug and retry
				const newSlug = generateAdSlug(currentRow.title, '', 'Bikes');
				currentRow = {
					...currentRow,
					slug: newSlug,
					short_id: newSlug.slice(-8)
				};
				console.warn(`Collision on "${currentRow.title}", retry ${attempt + 1}/${MAX_RETRIES}`);
				continue;
			}

			// Non-collision error
			console.error(`Failed to insert "${currentRow.title}":`, error.message);
			break;
		}

		if (success) {
			inserted++;
		} else {
			failed++;
			console.error(`Skipping listing after ${MAX_RETRIES} failures: "${row.title}"`);
		}
	}

	console.log(
		`Batch ${batchNum}/${totalBatches} individual: ${inserted} inserted, ${failed} failed`
	);
	return { inserted, failed };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
	console.log('');
	console.log('fogr.ai Seed Listings Script');
	console.log('============================');
	console.log('');

	// 1. Get or create system account
	const systemUserId = await getOrCreateSystemUser();

	// 2. Idempotency check
	const existingCount = await checkExistingSeeds(systemUserId);
	if (existingCount > 100) {
		console.log('');
		console.warn(
			`Seed listings already present (${existingCount} found). Delete existing seeds before re-running.`
		);
		console.log('To remove existing seeds, run:');
		console.log(`  DELETE FROM ads WHERE user_id = '${systemUserId}' AND status = 'active';`);
		console.log('');
		process.exit(0);
	}

	// 3. Build insert rows
	console.log('Generating listings...');
	const rows = buildInsertRows(systemUserId);
	console.log(`Generated ${rows.length} listings.`);
	console.log('');

	// 4. Batch insert
	const batches: InsertRow[][] = [];
	for (let i = 0; i < rows.length; i += BATCH_SIZE) {
		batches.push(rows.slice(i, i + BATCH_SIZE));
	}

	let totalInserted = 0;
	let totalFailed = 0;

	for (let i = 0; i < batches.length; i++) {
		const { inserted, failed } = await insertBatch(batches[i], i + 1, batches.length);
		totalInserted += inserted;
		totalFailed += failed;
	}

	// 5. Summary
	console.log('');
	console.log('============================');
	console.log(`Seeded ${totalInserted} listings across 32 counties.`);
	if (totalFailed > 0) {
		console.warn(`${totalFailed} listings failed to insert.`);
	}
	console.log(`System account: ${systemUserId} (${SYSTEM_EMAIL})`);
	console.log(`Expiry: ${EXPIRY_DAYS} days from now`);
	console.log('');
}

main().catch((err) => {
	console.error('seed_fatal', err);
	process.exit(1);
});
