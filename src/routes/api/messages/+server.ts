import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { isSameOrigin } from '$lib/server/csrf';
import { detectScamPatterns } from '$lib/server/scam-patterns';
import { E2E_MOCK_MESSAGES, isE2eMock } from '$lib/server/e2e-mocks';
import { recordMetric } from '$lib/server/metrics';
import { hasPaidPrice } from '$lib/utils/price';

const ALLOWED_KINDS = new Set(['availability', 'offer', 'pickup', 'question']);

const formatMoney = (value: number, currency = 'EUR') =>
	new Intl.NumberFormat('en-IE', {
		style: 'currency',
		currency,
		maximumFractionDigits: 0
	}).format(value);

const errorResponse = (message: string, status = 400) =>
	json({ success: false, message }, { status });

export const POST: RequestHandler = async ({ request, locals, url, platform }) => {
	if (!isSameOrigin(request, url)) return errorResponse('Forbidden', 403);

	let body: {
		adId?: string;
		conversationId?: string;
		kind?: string;
		body?: string;
		offerAmount?: number | null;
		deliveryMethod?: string | null;
		timing?: string | null;
	} = {};
	try {
		body = (await request.json()) as typeof body;
	} catch {
		return errorResponse('Invalid request.', 400);
	}

	const adId = body.adId?.trim() ?? '';
	const conversationId = body.conversationId?.trim() ?? '';
	const kind = body.kind?.trim().toLowerCase() ?? '';
	const messageBody = body.body?.trim() ?? '';
	const offerAmount = body.offerAmount ?? null;
	const deliveryMethodRaw = body.deliveryMethod?.trim() ?? null;
	const timingRaw = body.timing?.trim() ?? null;

	if (!adId && !conversationId) return errorResponse('Missing ad id.', 400);
	if (!ALLOWED_KINDS.has(kind)) return errorResponse('Invalid message type.', 400);
	if (!messageBody) return errorResponse('Message is required.', 400);

	if (isE2eMock(platform)) {
		const scam = detectScamPatterns(messageBody);
		const autoDeclined = kind === 'offer' && typeof offerAmount === 'number' && offerAmount < 10;
		return json(
			{
				success: true,
				autoDeclined,
				autoDeclineMessage: autoDeclined ? 'Thanks — minimum offer is €10.' : '',
				scamWarning: scam.warning,
				scamReason: scam.reason ?? null
			},
			{ status: 200 }
		);
	}

	const {
		data: { user }
	} = await locals.supabase.auth.getUser();
	if (!user) return errorResponse('Auth required.', 401);

	let conversation = null as {
		id: string;
		ad_id: string;
		buyer_id: string;
		seller_id: string;
	} | null;
	if (conversationId) {
		const { data: convo, error: convoError } = await locals.supabase
			.from('conversations')
			.select('id, ad_id, buyer_id, seller_id')
			.eq('id', conversationId)
			.maybeSingle();
		if (convoError) return errorResponse('Could not load conversation.', 500);
		if (!convo) return errorResponse('Conversation not found.', 404);
		conversation = convo;
		if (user.id !== convo.buyer_id && user.id !== convo.seller_id) {
			return errorResponse('Not allowed.', 403);
		}
	}

	const lookupAdId = conversation ? conversation.ad_id : adId;
	const { data: ad, error: adError } = await locals.supabase
		.from('ads')
		.select(
			'id, user_id, status, expires_at, category, category_profile_data, firm_price, min_offer, auto_decline_message, price, currency'
		)
		.eq('id', lookupAdId)
		.maybeSingle();

	if (adError) return errorResponse('Could not load listing.', 500);
	if (!ad) return errorResponse('Listing not found.', 404);
	const isSeller = ad.user_id === user.id;
	if (!conversation && isSeller) return errorResponse('Cannot message your own listing.', 400);
	if (ad.status !== 'active') return errorResponse('Listing is not active.', 400);
	if (ad.expires_at && ad.expires_at <= new Date().toISOString())
		return errorResponse('Listing has expired.', 400);

	const paidPrice = hasPaidPrice(ad.price ?? null);

	if (kind === 'offer') {
		if (isSeller) return errorResponse('Sellers cannot make offers.', 400);
		const amount = Number(offerAmount);
		if (!Number.isFinite(amount) || amount <= 0)
			return errorResponse('Offer amount must be greater than 0.', 400);
	}
	if (kind === 'pickup' && (!timingRaw || timingRaw.trim() === '')) {
		return errorResponse('Pickup time is required.', 400);
	}

	let activeConversationId = conversation?.id ?? null;
	let isFirstMessage = false;
	if (!activeConversationId) {
		const { data: existing } = await locals.supabase
			.from('conversations')
			.select('id')
			.eq('ad_id', ad.id)
			.eq('buyer_id', user.id)
			.eq('seller_id', ad.user_id)
			.maybeSingle();
		activeConversationId = existing?.id ?? null;
		if (!activeConversationId) {
			const { data: inserted, error: insErr } = await locals.supabase
				.from('conversations')
				.insert({
					ad_id: ad.id,
					buyer_id: user.id,
					seller_id: ad.user_id
				})
				.select('id')
				.single();
			if (insErr || !inserted) return errorResponse('Could not start conversation.', 500);
			activeConversationId = inserted.id;
			isFirstMessage = true;
		}
	}

	let autoDeclined = false;
	if (kind === 'offer') {
		if (paidPrice && ad.firm_price) autoDeclined = true;
		else if (paidPrice && ad.min_offer && Number(offerAmount) < ad.min_offer) autoDeclined = true;
	}

	const scam = detectScamPatterns(messageBody);
	const deliveryMethod =
		kind === 'offer' && deliveryMethodRaw === 'shipping'
			? 'shipping'
			: kind === 'offer'
				? 'pickup'
				: null;
	const timing = kind === 'pickup' ? timingRaw : null;

	const { error: msgErr } = await locals.supabase.from('messages').insert({
		conversation_id: activeConversationId,
		sender_id: user.id,
		kind,
		body: messageBody,
		offer_amount: kind === 'offer' ? Number(offerAmount) : null,
		delivery_method: deliveryMethod,
		timing,
		auto_declined: autoDeclined,
		scam_warning: scam.warning,
		scam_reason: scam.reason ?? null
	});

	if (msgErr) return errorResponse('Could not send message.', 500);

	await locals.supabase
		.from('conversations')
		.update({ last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() })
		.eq('id', activeConversationId);

	if (isFirstMessage) {
		await recordMetric(locals.supabase, {
			eventName: 'conversation_started',
			userId: user.id,
			adId: ad.id,
			conversationId: activeConversationId,
			properties: { kind }
		});
	}
	await recordMetric(locals.supabase, {
		eventName: 'message_sent',
		userId: user.id,
		adId: ad.id,
		conversationId: activeConversationId,
		properties: {
			kind,
			autoDeclined,
			scamWarning: scam.warning,
			offerAmount: kind === 'offer' ? Number(offerAmount) : null
		}
	});
	if (autoDeclined) {
		await recordMetric(locals.supabase, {
			eventName: 'offer_auto_declined',
			userId: user.id,
			adId: ad.id,
			conversationId: activeConversationId,
			properties: {
				category: ad.category ?? null,
				categoryProfileUsed: !!ad.category_profile_data,
				reason:
					paidPrice && ad.firm_price
						? 'firm_price'
						: paidPrice && ad.min_offer
							? 'below_min'
							: 'unknown'
			}
		});
	}

	const autoDeclineMessage =
		ad.auto_decline_message ||
		(paidPrice && ad.firm_price
			? 'Thanks — the price is firm.'
			: paidPrice && ad.min_offer
				? `Thanks — minimum offer is ${formatMoney(ad.min_offer, ad.currency ?? 'EUR')}.`
				: '');

	return json(
		{
			success: true,
			autoDeclined,
			autoDeclineMessage,
			scamWarning: scam.warning,
			scamReason: scam.reason ?? null
		},
		{ status: 200 }
	);
};

export const GET: RequestHandler = async ({ locals, url, platform }) => {
	if (isE2eMock(platform)) {
		return json(
			{
				success: true,
				viewerRole: 'buyer',
				messages: E2E_MOCK_MESSAGES
			},
			{ status: 200 }
		);
	}
	const adId = url.searchParams.get('adId')?.trim() ?? '';
	if (!adId) return errorResponse('Missing ad id.', 400);

	const {
		data: { user }
	} = await locals.supabase.auth.getUser();
	if (!user) return errorResponse('Auth required.', 401);

	const { data: convo, error: convoError } = await locals.supabase
		.from('conversations')
		.select('id, buyer_id, seller_id')
		.eq('ad_id', adId)
		.or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
		.maybeSingle();

	if (convoError) return errorResponse('Could not load conversation.', 500);
	if (!convo) return json({ success: true, messages: [] }, { status: 200 });

	const { data: messages, error: msgError } = await locals.supabase
		.from('messages')
		.select(
			'id, sender_id, kind, body, offer_amount, delivery_method, timing, auto_declined, created_at'
		)
		.eq('conversation_id', convo.id)
		.order('created_at', { ascending: true });

	if (msgError) return errorResponse('Could not load messages.', 500);

	return json(
		{
			success: true,
			viewerRole: user.id === convo.seller_id ? 'seller' : 'buyer',
			messages: messages ?? []
		},
		{ status: 200 }
	);
};
