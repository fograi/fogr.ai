import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	E2E_MOCK_AD,
	E2E_MOCK_CONVERSATION,
	E2E_MOCK_MESSAGES,
	isE2eMock
} from '$lib/server/e2e-mocks';
import { chatIdentityFromUserId } from '$lib/server/chat-display-name';

type ConversationView = {
	id: string;
	adId: string;
	adTitle: string;
	adPrice: number | null;
	adCurrency: string | null;
	counterpartyId: string;
	counterpartyName: string;
	counterpartyTag: string;
	role: 'buyer' | 'seller';
	lastMessageAt: string;
	preview: string;
	unread: boolean;
	unreadCount: number;
};

const buildE2eConversations = (platform?: App.Platform) => {
	const now = Date.now();
	const sellerIdentity = chatIdentityFromUserId(E2E_MOCK_CONVERSATION.seller_id, platform);
	const seller2Identity = chatIdentityFromUserId('22222222-2222-2222-2222-222222222222', platform);
	const seller3Identity = chatIdentityFromUserId('33333333-3333-3333-3333-333333333333', platform);
	const buyerIdentity = chatIdentityFromUserId('44444444-4444-4444-4444-444444444444', platform);
	return [
		{
			id: E2E_MOCK_CONVERSATION.id,
			adId: E2E_MOCK_AD.id,
			adTitle: E2E_MOCK_AD.title,
			adPrice: E2E_MOCK_AD.price,
			adCurrency: E2E_MOCK_AD.currency,
			counterpartyId: E2E_MOCK_CONVERSATION.seller_id,
			counterpartyName: sellerIdentity.displayName,
			counterpartyTag: sellerIdentity.tag,
			role: 'buyer',
			lastMessageAt: E2E_MOCK_CONVERSATION.last_message_at,
			preview: E2E_MOCK_MESSAGES[E2E_MOCK_MESSAGES.length - 1]?.body ?? '',
			unread: true,
			unreadCount: 2
		},
		{
			id: 'e2e-convo-2',
			adId: 'e2e-my-ad-1',
			adTitle: 'E2E Seller Listing',
			adPrice: 220,
			adCurrency: 'EUR',
			counterpartyId: '22222222-2222-2222-2222-222222222222',
			counterpartyName: seller2Identity.displayName,
			counterpartyTag: seller2Identity.tag,
			role: 'seller',
			lastMessageAt: new Date(now - 1000 * 60 * 3).toISOString(),
			preview: 'Could you do a better price if I collect today?',
			unread: true,
			unreadCount: 1
		},
		{
			id: 'e2e-convo-3',
			adId: 'e2e-my-ad-1',
			adTitle: 'E2E Seller Listing',
			adPrice: 220,
			adCurrency: 'EUR',
			counterpartyId: '33333333-3333-3333-3333-333333333333',
			counterpartyName: seller3Identity.displayName,
			counterpartyTag: seller3Identity.tag,
			role: 'seller',
			lastMessageAt: new Date(now - 1000 * 60 * 14).toISOString(),
			preview: 'Thanks, I will confirm pickup tomorrow.',
			unread: false,
			unreadCount: 0
		},
		{
			id: 'e2e-convo-4',
			adId: 'e2e-ad-2',
			adTitle: 'E2E Buyer Listing',
			adPrice: 85,
			adCurrency: 'EUR',
			counterpartyId: '44444444-4444-4444-4444-444444444444',
			counterpartyName: buyerIdentity.displayName,
			counterpartyTag: buyerIdentity.tag,
			role: 'buyer',
			lastMessageAt: new Date(now - 1000 * 60 * 26).toISOString(),
			preview: 'Still available if needed.',
			unread: false,
			unreadCount: 0
		}
	] satisfies ConversationView[];
};

async function loadConversations(
	locals: App.Locals,
	userId: string,
	platform?: App.Platform
): Promise<ConversationView[]> {
	const { data: conversations, error: convoError } = await locals.supabase
		.from('conversations')
		.select(
			'id, ad_id, buyer_id, seller_id, last_message_at, buyer_last_read_at, seller_last_read_at'
		)
		.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
		.order('last_message_at', { ascending: false });

	if (convoError) throw error(500, 'Could not load conversations.');

	const adIds = (conversations ?? []).map((c) => c.ad_id);
	let adMap = new Map<string, { title: string; price: number | null; currency: string | null }>();
	if (adIds.length > 0) {
		const { data: ads } = await locals.supabase
			.from('ads')
			.select('id, title, price, currency')
			.in('id', adIds);
		if (ads) {
			adMap = new Map(
				ads.map((ad) => [
					ad.id,
					{ title: ad.title, price: ad.price ?? null, currency: ad.currency ?? null }
				])
			);
		}
	}

	const convoList = conversations ?? [];
	let previewMap = new Map<string, string>();
	if (convoList.length > 0) {
		const { data: latestMessages } = await locals.supabase
			.from('messages')
			.select('conversation_id, body, created_at')
			.in(
				'conversation_id',
				convoList.map((conversation) => conversation.id)
			)
			.order('created_at', { ascending: false });
		if (latestMessages) {
			for (const message of latestMessages) {
				if (!previewMap.has(message.conversation_id)) {
					previewMap.set(message.conversation_id, message.body);
				}
			}
		}
	}
	const unreadCounts = await Promise.all(
		convoList.map(async (c) => {
			const isSeller = c.seller_id === userId;
			const lastReadAt = isSeller ? c.seller_last_read_at : c.buyer_last_read_at;
			let query = locals.supabase
				.from('messages')
				.select('id', { count: 'exact', head: true })
				.eq('conversation_id', c.id)
				.neq('sender_id', userId);
			if (lastReadAt) query = query.gt('created_at', lastReadAt);
			const { count } = await query;
			return count ?? 0;
		})
	);

	return convoList.map((c, idx) => {
		const ad = adMap.get(c.ad_id);
		const isSeller = c.seller_id === userId;
		const counterpartyId = isSeller ? c.buyer_id : c.seller_id;
		const counterpartyIdentity = chatIdentityFromUserId(counterpartyId, platform);
		const lastReadAt = isSeller ? c.seller_last_read_at : c.buyer_last_read_at;
		const unreadCount = unreadCounts[idx] ?? 0;
		const unread = unreadCount > 0 || !lastReadAt || c.last_message_at > lastReadAt;
		return {
			id: c.id,
			adId: c.ad_id,
			adTitle: ad?.title ?? 'Listing',
			adPrice: ad?.price ?? null,
			adCurrency: ad?.currency ?? null,
			counterpartyId,
			counterpartyName: counterpartyIdentity.displayName,
			counterpartyTag: counterpartyIdentity.tag,
			role: isSeller ? 'seller' : 'buyer',
			lastMessageAt: c.last_message_at,
			preview: previewMap.get(c.id) ?? '',
			unread,
			unreadCount
		} satisfies ConversationView;
	});
}

export const load: PageServerLoad = async ({ locals, url, platform }) => {
	if (isE2eMock(platform)) {
		return {
			streamed: {
				conversations: Promise.resolve(buildE2eConversations(platform))
			}
		};
	}

	const user = await locals.getUser();
	if (!user) {
		throw redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
	}

	return {
		streamed: {
			conversations: loadConversations(locals, user.id, platform)
		}
	};
};
