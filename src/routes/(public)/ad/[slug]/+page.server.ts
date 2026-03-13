import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import type { AdCard, ModerationAction } from '../../../../types/ad-types';
import { isUuidParam, parseSlugShortId } from '$lib/server/slugs';
import { PUBLIC_R2_BASE } from '$env/static/public';
import { buildAdTitle, buildDescription, buildCanonical } from '$lib/seo/meta';
import { productJsonLd } from '$lib/seo/jsonld';
import { buildAdOg } from '$lib/seo/og';
import { categoryToSlug } from '$lib/category-browse';
import type { Category } from '$lib/constants';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	// Case 1: UUID parameter -- 301 redirect to slug URL
	if (isUuidParam(params.slug)) {
		const { data } = await locals.supabase
			.from('ads')
			.select('slug')
			.eq('id', params.slug)
			.maybeSingle();

		if (!data?.slug) throw error(404, 'Ad not found');
		throw redirect(301, `/ad/${data.slug}`);
	}

	// Case 2: Parse short ID from slug
	const shortId = parseSlugShortId(params.slug);
	if (!shortId) throw error(404, 'Ad not found');

	// Case 3: Lookup by short_id
	const { data: ad, error: dbError } = await locals.supabase
		.from('ads')
		.select(
			'id, user_id, slug, title, description, category, category_profile_data, location_profile_data, price, currency, image_keys, status, created_at, updated_at, expires_at, firm_price, min_offer, auto_decline_message, sale_price'
		)
		.eq('short_id', shortId)
		.maybeSingle();

	if (dbError) throw error(500, 'Could not load listing.');
	if (!ad) throw error(404, 'Ad not found');

	// Access check: expired ads are publicly visible (with noindex for SEO).
	// Non-active ads (moderation-removed, pending) are only visible to the owner.
	const nowIso = new Date().toISOString();
	const isExpired = ad.expires_at && ad.expires_at <= nowIso;

	// 410 Gone: expired more than 90 days ago
	if (isExpired && ad.expires_at) {
		const daysSinceExpiry =
			(Date.now() - new Date(ad.expires_at).getTime()) / (1000 * 60 * 60 * 24);
		if (daysSinceExpiry > 90) {
			throw error(410, 'This ad has been removed');
		}
	}

	// Moderation-removed ads (rejected, removed, pending): owner-only
	const isModRemoved = ad.status !== 'active' && ad.status !== 'expired' && !isExpired;

	let user = null;
	let isOwner = false;

	if (isModRemoved) {
		const {
			data: { user: authUser }
		} = await locals.supabase.auth.getUser();
		user = authUser;
		isOwner = !!user && user.id === ad.user_id;
		if (!isOwner) throw error(404, 'Ad not found');
	}

	// Case 4: Canonical slug check -- redirect to canonical URL
	if (params.slug !== ad.slug) {
		throw redirect(301, `/ad/${ad.slug}`);
	}

	// Case 5: Render the page
	// Get user if not already fetched (for owner check on public active ads)
	if (!user) {
		const {
			data: { user: authUser }
		} = await locals.supabase.auth.getUser();
		user = authUser;
		isOwner = !!user && user.id === ad.user_id;
	}

	let ownerMessages: { count: number } | null = null;

	if (isOwner && user) {
		const { data: conversations, error: convoError } = await locals.supabase
			.from('conversations')
			.select('last_message_at')
			.eq('ad_id', ad.id)
			.eq('seller_id', user.id);

		if (!convoError) {
			ownerMessages = { count: conversations?.length ?? 0 };
		}
	}

	const mapped: AdCard = {
		id: ad.id,
		slug: ad.slug ?? undefined,
		title: ad.title,
		price: ad.price,
		img: ad.image_keys?.[0] ?? '',
		description: ad.description,
		category: ad.category,
		categoryProfileData: (ad.category_profile_data as Record<string, unknown> | null) ?? null,
		locationProfileData: (ad.location_profile_data as Record<string, unknown> | null) ?? null,
		currency: ad.currency ?? undefined,
		status: ad.status,
		expiresAt: ad.expires_at ?? undefined,
		firmPrice: ad.firm_price ?? false,
		minOffer: ad.min_offer ?? null,
		createdAt: ad.created_at ?? undefined,
		salePrice: ad.sale_price ?? null
	};

	let moderation: ModerationAction | null = null;
	if (isOwner && user) {
		const { data: mod } = await locals.supabase
			.from('ad_moderation_actions')
			.select(
				'action_type, reason_category, reason_details, legal_basis, automated, created_at, report_id'
			)
			.eq('ad_id', ad.id)
			.order('created_at', { ascending: false })
			.limit(1)
			.maybeSingle();
		moderation = mod ?? null;
	}

	// Fetch similar active listings when the ad is expired
	let similarAds: AdCard[] = [];
	if (isExpired) {
		const locationData = ad.location_profile_data as Record<string, unknown> | null;
		const countyId = (locationData?.county as Record<string, unknown> | undefined)?.id as
			| string
			| undefined;

		type SimilarRow = {
			id: string;
			slug: string | null;
			title: string;
			price: number | null;
			image_keys: string[] | null;
			description: string | null;
			category: string | null;
			currency: string | null;
			category_profile_data: unknown;
			location_profile_data: unknown;
			firm_price: boolean | null;
			min_offer: number | null;
		};

		let similarRaw: SimilarRow[] = [];

		// Step 1: Try same category + same county (if county is available)
		if (countyId) {
			const { data: countyMatches } = await locals.supabase
				.from('ads')
				.select(
					'id, slug, title, price, image_keys, description, category, currency, category_profile_data, location_profile_data, firm_price, min_offer'
				)
				.eq('status', 'active')
				.gt('expires_at', nowIso)
				.eq('category', ad.category)
				.filter('location_profile_data->county->>id', 'eq', countyId)
				.not('id', 'eq', ad.id)
				.limit(6);

			if (countyMatches && countyMatches.length >= 3) {
				similarRaw = countyMatches as unknown as SimilarRow[];
			}
		}

		// Step 2: Fallback to category-only if county query returned < 3 results (or no county)
		if (similarRaw.length < 3) {
			const { data: categoryMatches } = await locals.supabase
				.from('ads')
				.select(
					'id, slug, title, price, image_keys, description, category, currency, category_profile_data, location_profile_data, firm_price, min_offer'
				)
				.eq('status', 'active')
				.gt('expires_at', nowIso)
				.eq('category', ad.category)
				.not('id', 'eq', ad.id)
				.limit(6);

			similarRaw = (categoryMatches ?? []) as unknown as SimilarRow[];
		}

		// Map to AdCard format
		similarAds = similarRaw.map((s) => ({
			id: s.id,
			slug: s.slug ?? undefined,
			title: s.title,
			price: s.price ?? null,
			img: s.image_keys?.[0] ?? '',
			description: s.description ?? '',
			category: s.category ?? '',
			categoryProfileData: (s.category_profile_data as Record<string, unknown> | null) ?? null,
			locationProfileData: (s.location_profile_data as Record<string, unknown> | null) ?? null,
			currency: s.currency ?? undefined,
			firmPrice: s.firm_price ?? false,
			minOffer: s.min_offer ?? null
		}));
	}

	// Extract county name from location profile data for SEO
	const locationData = ad.location_profile_data as Record<string, unknown> | null;
	const countyObj = locationData?.county as { name?: string } | null | undefined;
	const countyName = countyObj?.name ?? null;

	// Build R2 image URL for the first image (if any)
	const firstImageKey = ad.image_keys?.[0];
	const r2Base = PUBLIC_R2_BASE.replace(/\/+$/, '');
	const imageUrl = firstImageKey ? `${r2Base}/${firstImageKey.replace(/^\/+/, '')}` : null;

	// Get category slug for OG fallback image
	const catSlug = categoryToSlug(ad.category as Category) || 'home-garden';

	return {
		ad: mapped,
		moderation: moderation ?? null,
		isOwner,
		isExpired: !!isExpired,
		similarAds,
		ownerMessages,
		offerRules: {
			firmPrice: ad.firm_price ?? false,
			minOffer: ad.min_offer ?? null,
			autoDeclineMessage: ad.auto_decline_message ?? null
		},
		seo: {
			title: buildAdTitle(ad.title, countyName),
			description: buildDescription(ad.description),
			canonical: buildCanonical(url.origin, `/ad/${ad.slug}`),
			og: buildAdOg(
				{
					title: ad.title,
					description: ad.description,
					slug: ad.slug!,
					imageUrl,
					categorySlug: catSlug,
					countyName
				},
				url.origin
			),
			jsonLd: productJsonLd(
				{
					title: ad.title,
					description: ad.description,
					slug: ad.slug!,
					price: ad.price,
					currency: ad.currency ?? 'EUR',
					imageUrl,
					category: ad.category,
					countyName,
					isExpired: !!isExpired
				},
				url.origin
			),
			robots: isExpired ? 'noindex' : undefined
		}
	};
};
