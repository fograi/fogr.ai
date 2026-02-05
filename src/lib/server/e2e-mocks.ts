import type { ApiAdRow } from '../../types/ad-types';

export const E2E_MOCK_AD: ApiAdRow = {
	id: 'e2e-ad-1',
	user_id: '00000000-0000-0000-0000-000000000000',
	title: 'E2E Test Ad',
	description: 'This is a mocked ad used for end-to-end tests.',
	category: 'Services & Gigs',
	price: 12,
	currency: 'EUR',
	image_keys: [],
	firm_price: false,
	min_offer: null,
	auto_decline_message: null,
	status: 'active',
	created_at: new Date().toISOString(),
	updated_at: null
};

export const E2E_MOCK_USER = {
	id: '00000000-0000-0000-0000-000000000000',
	email: 'e2e@example.com'
};

export function isE2eMock(platform?: App.Platform): boolean {
	const platformFlag = platform?.env
		? (platform.env as Record<string, unknown>).E2E_MOCK === '1'
		: false;
	const processFlag =
		typeof process !== 'undefined' && process.env?.E2E_MOCK === '1';
	return platformFlag || processFlag;
}
