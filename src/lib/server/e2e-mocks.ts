import type { ApiAdRow } from '../../types/ad-types';

export const E2E_MOCK_AD: ApiAdRow = {
	id: 'e2e-ad-1',
	user_id: '00000000-0000-0000-0000-000000000000',
	title: 'E2E Test Ad',
	description:
		'Reason for selling: Upgrading bike\\nHow it has been used: Weekend rides\\nKnown issues or maintenance needed: No known issues',
	category: 'Bikes',
	category_profile_data: {
		version: 1,
		profile: 'bikes',
		subtype: 'adult',
		bikeType: 'road',
		condition: 'used_good',
		sizePreset: 'M',
		reasonForSelling: 'Upgrading bike',
		usageSummary: 'Weekend rides',
		knownIssues: 'No known issues'
	},
	price: 12,
	currency: 'EUR',
	image_keys: [],
	firm_price: false,
	min_offer: 10,
	auto_decline_message: 'Thanks — minimum offer is €10.',
	status: 'active',
	created_at: new Date().toISOString(),
	updated_at: null
};

export const E2E_MOCK_USER = {
	id: '00000000-0000-0000-0000-000000000000',
	email: 'e2e@example.com'
};

export const E2E_MOCK_CONVERSATION = {
	id: 'e2e-convo-1',
	ad_id: E2E_MOCK_AD.id,
	buyer_id: '11111111-1111-1111-1111-111111111111',
	seller_id: E2E_MOCK_AD.user_id,
	last_message_at: new Date().toISOString(),
	buyer_last_read_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
	seller_last_read_at: new Date(Date.now() - 1000 * 60 * 10).toISOString()
};

export const E2E_MOCK_MESSAGES = [
	{
		id: 'e2e-msg-1',
		sender_id: E2E_MOCK_CONVERSATION.buyer_id,
		kind: 'availability',
		body: 'Is this still available?',
		offer_amount: null,
		delivery_method: null,
		timing: null,
		auto_declined: false,
		created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString()
	},
	{
		id: 'e2e-msg-2',
		sender_id: E2E_MOCK_CONVERSATION.seller_id,
		kind: 'question',
		body: 'Yes, it is.',
		offer_amount: null,
		delivery_method: null,
		timing: null,
		auto_declined: false,
		created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString()
	},
	{
		id: 'e2e-msg-3',
		sender_id: E2E_MOCK_CONVERSATION.buyer_id,
		kind: 'offer',
		body: 'I can offer €5.',
		offer_amount: 5,
		delivery_method: 'pickup',
		timing: null,
		auto_declined: true,
		created_at: new Date(Date.now() - 1000 * 60).toISOString()
	}
];

export function isE2eMock(platform?: App.Platform): boolean {
	const envRecord = platform?.env as unknown as Record<string, unknown> | undefined;
	const platformFlag = envRecord ? envRecord.E2E_MOCK === '1' : false;
	const processFlag = typeof process !== 'undefined' && process.env?.E2E_MOCK === '1';
	return platformFlag || processFlag;
}
