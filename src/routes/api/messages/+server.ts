import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { isSameOrigin } from '$lib/server/csrf';
import { detectScamPatterns } from '$lib/server/scam-patterns';

const ALLOWED_KINDS = new Set(['availability', 'offer', 'pickup', 'question']);

const formatMoney = (value: number, currency = 'EUR') =>
	new Intl.NumberFormat('en-IE', {
		style: 'currency',
		currency,
		maximumFractionDigits: 0
	}).format(value);

const errorResponse = (message: string, status = 400) =>
	json({ success: false, message }, { status });

export const POST: RequestHandler = async ({ request, locals, url }) => {
	if (!isSameOrigin(request, url)) return errorResponse('Forbidden', 403);

	let body: {
		adId?: string;
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
	const kind = body.kind?.trim().toLowerCase() ?? '';
	const messageBody = body.body?.trim() ?? '';
	const offerAmount = body.offerAmount ?? null;
	const deliveryMethodRaw = body.deliveryMethod?.trim() ?? null;
	const timingRaw = body.timing?.trim() ?? null;

	if (!adId) return errorResponse('Missing ad id.', 400);
	if (!ALLOWED_KINDS.has(kind)) return errorResponse('Invalid message type.', 400);
	if (!messageBody) return errorResponse('Message is required.', 400);

	const {
		data: { user }
	} = await locals.supabase.auth.getUser();
	if (!user) return errorResponse('Auth required.', 401);

	const { data: ad, error: adError } = await locals.supabase
		.from('ads')
		.select(
			'id, user_id, status, expires_at, firm_price, min_offer, auto_decline_message, price, currency'
		)
		.eq('id', adId)
		.maybeSingle();

	if (adError) return errorResponse('Could not load listing.', 500);
	if (!ad) return errorResponse('Listing not found.', 404);
	if (ad.user_id === user.id) return errorResponse('Cannot message your own listing.', 400);
	if (ad.status !== 'active') return errorResponse('Listing is not active.', 400);
	if (ad.expires_at && ad.expires_at <= new Date().toISOString())
		return errorResponse('Listing has expired.', 400);

	if (kind === 'offer') {
		const amount = Number(offerAmount);
		if (!Number.isFinite(amount) || amount <= 0)
			return errorResponse('Offer amount must be greater than 0.', 400);
	}
	if (kind === 'pickup' && (!timingRaw || timingRaw.trim() === '')) {
		return errorResponse('Pickup time is required.', 400);
	}

	const { data: existing } = await locals.supabase
		.from('conversations')
		.select('id')
		.eq('ad_id', adId)
		.eq('buyer_id', user.id)
		.eq('seller_id', ad.user_id)
		.maybeSingle();

	let conversationId = existing?.id;
	if (!conversationId) {
		const { data: inserted, error: insErr } = await locals.supabase
			.from('conversations')
			.insert({
				ad_id: adId,
				buyer_id: user.id,
				seller_id: ad.user_id
			})
			.select('id')
			.single();
		if (insErr || !inserted) return errorResponse('Could not start conversation.', 500);
		conversationId = inserted.id;
	}

	let autoDeclined = false;
	if (kind === 'offer') {
		if (ad.firm_price) autoDeclined = true;
		else if (ad.min_offer && Number(offerAmount) < ad.min_offer) autoDeclined = true;
	}

	const scam = detectScamPatterns(messageBody);
	const deliveryMethod =
		kind === 'offer' && deliveryMethodRaw === 'shipping' ? 'shipping' : kind === 'offer' ? 'pickup' : null;
	const timing = kind === 'pickup' ? timingRaw : null;

	const { error: msgErr } = await locals.supabase.from('messages').insert({
		conversation_id: conversationId,
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
		.eq('id', conversationId);

	const autoDeclineMessage =
		ad.auto_decline_message ||
		(ad.firm_price
			? 'Thanks — the price is firm.'
			: ad.min_offer
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

export const GET: RequestHandler = async ({ locals, url }) => {
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
		.select('id, sender_id, kind, body, offer_amount, delivery_method, timing, auto_declined, created_at')
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
