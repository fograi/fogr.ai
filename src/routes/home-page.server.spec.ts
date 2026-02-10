import { describe, expect, it, vi } from 'vitest';
import { load } from './+page.server';

type MockFetchResponse = {
	ok: boolean;
	status?: number;
	json: () => Promise<unknown>;
};

function makeFetchResponse(response: MockFetchResponse) {
	return response as Response;
}

describe('/+page.server load', () => {
	it('sanitizes invalid category and invalid locality before querying api', async () => {
		const fetch = vi.fn(async (input: RequestInfo | URL) => {
			expect(String(input)).toContain('county_id=ie%2Fleinster%2Fdublin');
			expect(String(input)).not.toContain('category=');
			expect(String(input)).not.toContain('locality_id=');
			return makeFetchResponse({
				ok: true,
				json: async () => ({ ads: [], nextPage: null })
			});
		});
		const url = new URL(
			'https://example.com/?category=not-real&county_id=ie/leinster/dublin&locality_id=ie/munster/cork/ballincollig'
		);

		const result = await load({ fetch, url } as Parameters<typeof load>[0]);

		expect(result.category).toBe('');
		expect(result.countyId).toBe('ie/leinster/dublin');
		expect(result.localityId).toBe('');
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it('keeps valid category and location filters in api query', async () => {
		const fetch = vi.fn(async (input: RequestInfo | URL) => {
			expect(String(input)).toContain('q=bike');
			expect(String(input)).toContain('category=Electronics');
			expect(String(input)).toContain('county_id=ie%2Fleinster%2Fdublin');
			expect(String(input)).toContain('locality_id=ie%2Fleinster%2Fdublin%2Fard-na-greine');
			return makeFetchResponse({
				ok: true,
				json: async () => ({ ads: [], nextPage: null })
			});
		});
		const url = new URL(
			'https://example.com/?q=bike&category=Electronics&county_id=ie/leinster/dublin&locality_id=ie/leinster/dublin/ard-na-greine'
		);

		const result = await load({ fetch, url } as Parameters<typeof load>[0]);

		expect(result.category).toBe('Electronics');
		expect(result.countyId).toBe('ie/leinster/dublin');
		expect(result.localityId).toBe('ie/leinster/dublin/ard-na-greine');
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it('returns stable filter state when ads api fails', async () => {
		const fetch = vi.fn(async () =>
			makeFetchResponse({
				ok: false,
				status: 500,
				json: async () => ({
					message: 'ads api failed',
					requestId: 'req-123'
				})
			})
		);
		const url = new URL('https://example.com/?county_id=ie/leinster/dublin');

		const result = await load({ fetch, url } as Parameters<typeof load>[0]);

		expect(result.error).toEqual({
			message: 'ads api failed',
			requestId: 'req-123'
		});
		expect(result.countyId).toBe('ie/leinster/dublin');
		expect(result.locationOptions.localities.length).toBeGreaterThan(0);
	});
});
