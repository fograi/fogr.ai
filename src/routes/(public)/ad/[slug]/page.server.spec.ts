/**
 * SEO-01 redirect behavior tests for the ad page server load function.
 *
 * Tests:
 * 1. UUID URL → 301 redirect to slug URL (gap 01-redirect-uuid)
 * 2. Non-canonical slug URL → 301 redirect to canonical slug URL (gap 01-redirect-canonical)
 */

import { describe, it, expect, vi } from 'vitest';
import { load } from './+page.server';

// SvelteKit's redirect() throws a Redirect object with { status, location }.
// We catch it and inspect the shape.
function isRedirect(err: unknown): err is { status: number; location: string } {
	return (
		typeof err === 'object' &&
		err !== null &&
		'status' in err &&
		'location' in err &&
		typeof (err as Record<string, unknown>).status === 'number' &&
		typeof (err as Record<string, unknown>).location === 'string'
	);
}

/**
 * Build a minimal mock supabase that handles the chain:
 *   .from('ads').select('slug').eq('id', uuid).maybeSingle()
 * and returns either { data: { slug }, error: null } or { data: null, error: null }.
 *
 * Also handles the short_id lookup chain used in the canonical-slug redirect test.
 */
function makeSupabaseMock({
	uuidLookupSlug,
	shortIdLookupAd
}: {
	uuidLookupSlug?: string | null;
	shortIdLookupAd?: {
		id: string;
		user_id: string;
		slug: string;
		title: string;
		description: string;
		category: string;
		category_profile_data: null;
		location_profile_data: null;
		price: number;
		currency: string;
		image_keys: string[];
		status: string;
		created_at: string;
		updated_at: null;
		expires_at: null;
		firm_price: boolean;
		min_offer: null;
		auto_decline_message: null;
		sale_price: null;
	} | null;
} = {}) {
	const authMock = {
		getUser: vi.fn().mockResolvedValue({ data: { user: null } })
	};

	// Track which call we are on for the .from('ads') chain.
	// UUID lookup: .select('slug').eq('id', ...).maybeSingle()
	// Short ID lookup: .select('id, user_id, slug, ...').eq('short_id', ...).maybeSingle()
	let callCount = 0;

	const maybeSingleMock = vi.fn().mockImplementation(() => {
		callCount++;
		if (callCount === 1) {
			// First call = UUID lookup (or slug lookup depending on the test path)
			if (uuidLookupSlug !== undefined) {
				return Promise.resolve({
					data: uuidLookupSlug ? { slug: uuidLookupSlug } : null,
					error: null
				});
			}
			// Short_id lookup path
			return Promise.resolve({ data: shortIdLookupAd ?? null, error: null });
		}
		// Subsequent calls (auth, moderation queries, etc.) return no data
		return Promise.resolve({ data: null, error: null });
	});

	const eqChain = {
		maybeSingle: maybeSingleMock,
		eq: vi.fn().mockReturnThis(),
		order: vi.fn().mockReturnThis(),
		limit: vi.fn().mockReturnThis(),
		not: vi.fn().mockReturnThis(),
		gt: vi.fn().mockReturnThis(),
		filter: vi.fn().mockReturnThis()
	};

	const selectChain = {
		eq: vi.fn().mockReturnValue(eqChain),
		maybeSingle: maybeSingleMock,
		order: vi.fn().mockReturnThis(),
		limit: vi.fn().mockReturnThis()
	};

	return {
		from: vi.fn().mockReturnValue({
			select: vi.fn().mockReturnValue(selectChain)
		}),
		auth: authMock
	};
}

describe('ad page load — UUID redirect (SEO-01 / gap 01-redirect-uuid)', () => {
	it('issues a 301 redirect to the slug URL when the param is a UUID', async () => {
		const uuid = '550e8400-e29b-41d4-a716-446655440000';
		const expectedSlug = 'trek-domane-road-bike-dublin-a1b2c3d4';

		const supabase = makeSupabaseMock({ uuidLookupSlug: expectedSlug });

		let thrown: unknown = null;
		try {
			await load({
				params: { slug: uuid },
				locals: { supabase } as Parameters<typeof load>[0]['locals'],
				url: new URL('https://example.com/ad/' + uuid),
				platform: undefined
			} as Parameters<typeof load>[0]);
		} catch (err) {
			thrown = err;
		}

		expect(thrown).not.toBeNull();
		expect(isRedirect(thrown)).toBe(true);
		if (isRedirect(thrown)) {
			expect(thrown.status).toBe(301);
			expect(thrown.location).toBe('/ad/' + expectedSlug);
		}
	});

	it('throws 404 when UUID has no matching ad', async () => {
		const uuid = '550e8400-e29b-41d4-a716-446655440001';

		const supabase = makeSupabaseMock({ uuidLookupSlug: null });

		let thrown: unknown = null;
		try {
			await load({
				params: { slug: uuid },
				locals: { supabase } as Parameters<typeof load>[0]['locals'],
				url: new URL('https://example.com/ad/' + uuid),
				platform: undefined
			} as Parameters<typeof load>[0]);
		} catch (err) {
			thrown = err;
		}

		// SvelteKit error() throws an object with a .status property
		expect(thrown).not.toBeNull();
		const asObj = thrown as Record<string, unknown>;
		expect(asObj.status).toBe(404);
	});
});

describe('ad page load — canonical slug redirect (SEO-01 / gap 01-redirect-canonical)', () => {
	it('issues a 301 redirect to canonical slug when visited slug is non-canonical', async () => {
		const canonicalSlug = 'trek-domane-road-bike-dublin-a1b2c3d4';
		const nonCanonicalSlug = 'wrong-title-dublin-a1b2c3d4';
		// Both share the same short_id suffix (last 8 chars of nonCanonicalSlug = 'a1b2c3d4')

		const mockAd = {
			id: 'ad-uuid-111',
			user_id: 'user-uuid-222',
			slug: canonicalSlug,
			title: 'Trek Domane Road Bike',
			description: 'Great bike in excellent condition.',
			category: 'Bikes',
			category_profile_data: null,
			location_profile_data: null,
			price: 1200,
			currency: 'EUR',
			image_keys: [],
			status: 'active',
			created_at: new Date().toISOString(),
			updated_at: null,
			expires_at: null,
			firm_price: false,
			min_offer: null,
			auto_decline_message: null,
			sale_price: null
		};

		const supabase = makeSupabaseMock({ shortIdLookupAd: mockAd });

		let thrown: unknown = null;
		try {
			await load({
				params: { slug: nonCanonicalSlug },
				locals: { supabase } as Parameters<typeof load>[0]['locals'],
				url: new URL('https://example.com/ad/' + nonCanonicalSlug),
				platform: undefined
			} as Parameters<typeof load>[0]);
		} catch (err) {
			thrown = err;
		}

		expect(thrown).not.toBeNull();
		expect(isRedirect(thrown)).toBe(true);
		if (isRedirect(thrown)) {
			expect(thrown.status).toBe(301);
			expect(thrown.location).toBe('/ad/' + canonicalSlug);
		}
	});

	it('does not redirect when the visited slug matches the canonical slug', async () => {
		const canonicalSlug = 'trek-domane-road-bike-dublin-a1b2c3d4';

		const mockAd = {
			id: 'ad-uuid-333',
			user_id: 'user-uuid-444',
			slug: canonicalSlug,
			title: 'Trek Domane Road Bike',
			description: 'Great bike in excellent condition.',
			category: 'Bikes',
			category_profile_data: null,
			location_profile_data: null,
			price: 1200,
			currency: 'EUR',
			image_keys: [],
			status: 'active',
			created_at: new Date().toISOString(),
			updated_at: null,
			expires_at: null,
			firm_price: false,
			min_offer: null,
			auto_decline_message: null,
			sale_price: null
		};

		const supabase = makeSupabaseMock({ shortIdLookupAd: mockAd });

		let thrown: unknown = null;
		let result: unknown = null;
		try {
			result = await load({
				params: { slug: canonicalSlug },
				locals: { supabase } as Parameters<typeof load>[0]['locals'],
				url: new URL('https://example.com/ad/' + canonicalSlug),
				platform: undefined
			} as Parameters<typeof load>[0]);
		} catch (err) {
			thrown = err;
		}

		// Should not redirect — either returns data or throws a non-redirect error
		if (thrown !== null) {
			// If something was thrown, it must NOT be a 301 redirect
			expect(isRedirect(thrown) && (thrown as { status: number }).status === 301).toBe(false);
		} else {
			// Result should be a plain object with an 'ad' key
			expect(result).not.toBeNull();
			expect(typeof result).toBe('object');
		}
	});
});
