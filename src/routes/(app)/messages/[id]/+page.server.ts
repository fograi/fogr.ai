import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { E2E_MOCK_AD, E2E_MOCK_CONVERSATION, E2E_MOCK_MESSAGES, isE2eMock } from '$lib/server/e2e-mocks';

type MessageView = {
	id: string;
	body: string;
	createdAt: string;
	isMine: boolean;
	kind: string;
};

export const load: PageServerLoad = async ({ params, locals, url, platform }) => {
	if (isE2eMock(platform)) {
		return {
			conversation: {
				id: E2E_MOCK_CONVERSATION.id,
				adId: E2E_MOCK_AD.id,
				adTitle: E2E_MOCK_AD.title
			},
			messages: E2E_MOCK_MESSAGES.map((m) => ({
				id: m.id,
				body: m.body,
				createdAt: m.created_at,
				isMine: m.sender_id === E2E_MOCK_CONVERSATION.buyer_id,
				kind: m.kind
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

	const { data: ad } = await locals.supabase
		.from('ads')
		.select('id, title')
		.eq('id', convo.ad_id)
		.maybeSingle();

	const { data: messages, error: msgError } = await locals.supabase
		.from('messages')
		.select('id, sender_id, body, kind, created_at')
		.eq('conversation_id', convo.id)
		.order('created_at', { ascending: true });

	if (msgError) throw error(500, 'Could not load messages.');

	return {
		conversation: {
			id: convo.id,
			adId: convo.ad_id,
			adTitle: ad?.title ?? 'Listing'
		},
		messages: (messages ?? []).map((m) => ({
			id: m.id,
			body: m.body,
			createdAt: m.created_at,
			isMine: m.sender_id === user.id,
			kind: m.kind
		})) satisfies MessageView[]
	};
};
