import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('should render ad titles', async () => {
		render(Page, {
			props: {
				data: {
					ads: [
						{
							id: 'ad-1',
							title: 'Test Ad',
							price: 10,
							img: '',
							description: 'Test description',
							category: 'Electronics',
							currency: 'EUR',
							locale: 'en-IE'
						}
					],
					page: 1,
					nextPage: null,
					requestId: undefined
				}
			}
		});

		const heading = page.getByRole('heading', { level: 3, name: 'Test Ad' });
		await expect.element(heading).toBeInTheDocument();
	});
});
