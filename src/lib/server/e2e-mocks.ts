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
	status: 'active',
	created_at: new Date().toISOString(),
	updated_at: null
};

export function isE2eMock(platform?: App.Platform): boolean {
	if (!platform?.env) return false;
	const env = platform.env as Record<string, unknown>;
	return env.E2E_MOCK === '1';
}
