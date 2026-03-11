import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import type { AdCard, ModerationAction } from '../../../../types/ad-types';
import { isUuidParam, parseSlugShortId } from '$lib/server/slugs';

export const load: PageServerLoad = async ({ params, locals }) => {
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
			'id, user_id, slug, title, description, category, category_profile_data, location_profile_data, price, currency, image_keys, status, created_at, updated_at, expires_at, firm_price, min_offer, auto_decline_message'
		)
		.eq('short_id', shortId)
		.maybeSingle();

	if (dbError) throw error(500, 'Could not load listing.');
	if (!ad) throw error(404, 'Ad not found');

	// Access check: non-active or expired ads are only visible to the owner
	const nowIso = new Date().toISOString();
	const isExpired = ad.expires_at && ad.expires_at <= nowIso;
	const isNonPublic = ad.status !== 'active' || isExpired;

	let user = null;
	let isOwner = false;

	if (isNonPublic) {
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
		minOffer: ad.min_offer ?? null
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

	return {
		ad: mapped,
		moderation: moderation ?? null,
		isOwner,
		ownerMessages,
		offerRules: {
			firmPrice: ad.firm_price ?? false,
			minOffer: ad.min_offer ?? null,
			autoDeclineMessage: ad.auto_decline_message ?? null
		}
	};
};
