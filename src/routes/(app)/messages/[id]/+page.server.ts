import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { E2E_MOCK_AD, E2E_MOCK_CONVERSATION, E2E_MOCK_MESSAGES, isE2eMock } from '$lib/server/e2e-mocks';

const formatMoney = (value: number, currency = 'EUR') =>
	new Intl.NumberFormat('en-IE', {
		style: 'currency',
		currency,
		maximumFractionDigits: 0
	}).format(value);

const buildAutoDeclineMessage = (ad: {
	auto_decline_message?: string | null;
	firm_price?: boolean | null;
	min_offer?: number | null;
	currency?: string | null;
}) => {
	const custom = ad.auto_decline_message?.trim();
	if (custom) return custom;
	if (ad.firm_price) return 'Thanks — the price is firm.';
	if (ad.min_offer) return `Thanks — minimum offer is ${formatMoney(ad.min_offer, ad.currency ?? 'EUR')}.`;
	return '';
};

type MessageView = {
	id: string;
	body: string;
	createdAt: string;
	isMine: boolean;
	kind: string;
	autoDeclined: boolean;
};

export const load: PageServerLoad = async ({ params, locals, url, platform }) => {
	if (isE2eMock(platform)) {
		return {
			conversation: {
				id: E2E_MOCK_CONVERSATION.id,
				adId: E2E_MOCK_AD.id,
				adTitle: E2E_MOCK_AD.title,
				adPrice: E2E_MOCK_AD.price ?? null,
				adCurrency: E2E_MOCK_AD.currency ?? null,
				adCategory: E2E_MOCK_AD.category ?? null,
				adStatus: E2E_MOCK_AD.status ?? null
			},
			readMeta: {
				viewerRole: 'buyer',
				otherLastReadAt: E2E_MOCK_CONVERSATION.seller_last_read_at,
				viewerLastReadAt: new Date().toISOString()
			},
			autoDeclineMessage: buildAutoDeclineMessage(E2E_MOCK_AD),
			messages: E2E_MOCK_MESSAGES.map((m) => ({
				id: m.id,
				body: m.body,
				createdAt: m.created_at,
				isMine: m.sender_id === E2E_MOCK_CONVERSATION.buyer_id,
				kind: m.kind,
				autoDeclined: m.auto_declined ?? false
			})) satisfies MessageView[]
		};
	}

	const user = await locals.getUser();
	if (!user) {
		throw redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
	}

	const id = params.id?.trim() ?? '';
	if (!id) throw error(400, 'Missing conversation id.');

	const { data: convo, error: convoError } = await locals.supabase
		.from('conversations')
		.select('id, ad_id, buyer_id, seller_id')
		.eq('id', id)
		.maybeSingle();

	if (convoError) throw error(500, 'Could not load conversation.');
	if (!convo) throw error(404, 'Conversation not found.');
	if (convo.buyer_id !== user.id && convo.seller_id !== user.id) throw error(403, 'Not allowed.');

	const isSeller = convo.seller_id === user.id;
	const nowIso = new Date().toISOString();
	const updateData = isSeller ? { seller_last_read_at: nowIso } : { buyer_last_read_at: nowIso };
	await locals.supabase.from('conversations').update(updateData).eq('id', convo.id);

	const { data: ad } = await locals.supabase
		.from('ads')
		.select('id, title, price, currency, category, status, firm_price, min_offer, auto_decline_message')
		.eq('id', convo.ad_id)
		.maybeSingle();

	const { data: messages, error: msgError } = await locals.supabase
		.from('messages')
		.select('id, sender_id, body, kind, auto_declined, created_at')
		.eq('conversation_id', convo.id)
		.order('created_at', { ascending: true });

	if (msgError) throw error(500, 'Could not load messages.');

	return {
		conversation: {
			id: convo.id,
			adId: convo.ad_id,
			adTitle: ad?.title ?? 'Listing',
			adPrice: ad?.price ?? null,
			adCurrency: ad?.currency ?? null,
			adCategory: ad?.category ?? null,
			adStatus: ad?.status ?? null
		},
		readMeta: {
			viewerRole: isSeller ? 'seller' : 'buyer',
			otherLastReadAt: isSeller ? convo.buyer_last_read_at ?? null : convo.seller_last_read_at ?? null,
			viewerLastReadAt: nowIso
		},
		autoDeclineMessage: ad ? buildAutoDeclineMessage(ad) : '',
		messages: (messages ?? []).map((m) => ({
			id: m.id,
			body: m.body,
			createdAt: m.created_at,
			isMine: m.sender_id === user.id,
			kind: m.kind,
			autoDeclined: m.auto_declined ?? false
		})) satisfies MessageView[]
	};
};
