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
};

export const load: PageServerLoad = async ({ locals, url, platform }) => {
	if (isE2eMock(platform)) {
		return {
			conversations: [
				{
					id: E2E_MOCK_CONVERSATION.id,
					adId: E2E_MOCK_AD.id,
					adTitle: E2E_MOCK_AD.title,
					adPrice: E2E_MOCK_AD.price,
					adCurrency: E2E_MOCK_AD.currency,
					role: 'buyer',
					lastMessageAt: E2E_MOCK_CONVERSATION.last_message_at,
					preview: E2E_MOCK_MESSAGES[E2E_MOCK_MESSAGES.length - 1]?.body ?? ''
				}
			] satisfies ConversationView[]
		};
	}

	const user = await locals.getUser();
	if (!user) {
		throw redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
	}

	const { data: conversations, error: convoError } = await locals.supabase
		.from('conversations')
		.select('id, ad_id, buyer_id, seller_id, last_message_at')
		.or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
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

	return {
		conversations: (conversations ?? []).map((c) => {
			const ad = adMap.get(c.ad_id);
			return {
				id: c.id,
				adId: c.ad_id,
				adTitle: ad?.title ?? 'Listing',
				adPrice: ad?.price ?? null,
				adCurrency: ad?.currency ?? null,
				role: c.seller_id === user.id ? 'seller' : 'buyer',
				lastMessageAt: c.last_message_at,
				preview: ''
			} satisfies ConversationView;
		})
	};
};
