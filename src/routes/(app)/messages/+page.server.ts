import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { E2E_MOCK_AD, E2E_MOCK_CONVERSATION, E2E_MOCK_MESSAGES, isE2eMock } from '$lib/server/e2e-mocks';

type ConversationView = {
	id: string;
	adId: string;
	adTitle: string;
	adPrice: number | null;
	adCurrency: string | null;
	role: 'buyer' | 'seller';
	lastMessageAt: string;
	preview: string;
	unread: boolean;
	unreadCount: number;
};

const buildE2eConversations = () =>
	[
		{
			id: E2E_MOCK_CONVERSATION.id,
			adId: E2E_MOCK_AD.id,
			adTitle: E2E_MOCK_AD.title,
			adPrice: E2E_MOCK_AD.price,
			adCurrency: E2E_MOCK_AD.currency,
			role: 'buyer',
			lastMessageAt: E2E_MOCK_CONVERSATION.last_message_at,
			preview: E2E_MOCK_MESSAGES[E2E_MOCK_MESSAGES.length - 1]?.body ?? '',
			unread: true,
			unreadCount: 2
		}
	] satisfies ConversationView[];

async function loadConversations(locals: App.Locals, userId: string): Promise<ConversationView[]> {
	const { data: conversations, error: convoError } = await locals.supabase
		.from('conversations')
		.select('id, ad_id, buyer_id, seller_id, last_message_at, buyer_last_read_at, seller_last_read_at')
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
				ads.map((ad) => [ad.id, { title: ad.title, price: ad.price ?? null, currency: ad.currency ?? null }])
			);
		}
	}

	const convoList = conversations ?? [];
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
		const lastReadAt = isSeller ? c.seller_last_read_at : c.buyer_last_read_at;
		const unreadCount = unreadCounts[idx] ?? 0;
		const unread = unreadCount > 0 || (!lastReadAt || c.last_message_at > lastReadAt);
		return {
			id: c.id,
			adId: c.ad_id,
			adTitle: ad?.title ?? 'Listing',
			adPrice: ad?.price ?? null,
			adCurrency: ad?.currency ?? null,
			role: isSeller ? 'seller' : 'buyer',
			lastMessageAt: c.last_message_at,
			preview: '',
			unread,
			unreadCount
		} satisfies ConversationView;
	});
}

export const load: PageServerLoad = async ({ locals, url, platform }) => {
	if (isE2eMock(platform)) {
		return {
			streamed: {
				conversations: Promise.resolve(buildE2eConversations())
			}
		};
	}

	const user = await locals.getUser();
	if (!user) {
		throw redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
	}

	return {
		streamed: {
			conversations: loadConversations(locals, user.id)
		}
	};
};
