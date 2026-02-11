import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

function buildPageData(overrides: Record<string, unknown> = {}) {
	return {
		user: null,
		isAdmin: false,
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
		requestId: undefined,
		q: '',
		category: '',
		priceState: '',
		countyId: '',
		localityId: '',
		locationOptions: {
			counties: [],
			localities: []
		},
		...overrides
	};
}

describe('/+page.svelte', () => {
	it('should render ad titles', async () => {
		render(Page, {
			props: {
				data: buildPageData()
			}
		});

		const heading = page.getByRole('heading', { level: 3, name: 'Test Ad' });
		await expect.element(heading).toBeInTheDocument();
	});

	it('renders unified discovery controls with current filter state', async () => {
		render(Page, {
			props: {
				data: buildPageData({
					q: 'bike',
					category: 'Electronics',
					countyId: 'ie/leinster/dublin',
					localityId: 'ie/leinster/dublin/ard-na-greine',
					locationOptions: {
						counties: [{ id: 'ie/leinster/dublin', name: 'Dublin' }],
						localities: [{ id: 'ie/leinster/dublin/ard-na-greine', name: 'Ard Na Gréine' }]
					}
				})
			}
		});

		await expect.element(page.getByRole('searchbox', { name: 'Search' })).toHaveValue('bike');
		await expect.element(page.getByLabelText('Category')).toHaveValue('Electronics');
		await expect.element(page.getByLabelText('County')).toHaveValue('ie/leinster/dublin');
		await expect
			.element(page.getByLabelText('Locality'))
			.toHaveValue('ie/leinster/dublin/ard-na-greine');
		await expect.element(page.getByRole('button', { name: 'Search listings' })).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'Clear filters' })).toBeInTheDocument();
	});

	it('keeps locality disabled when no county is selected', async () => {
		render(Page, {
			props: {
				data: buildPageData({
					locationOptions: {
						counties: [{ id: 'ie/leinster/dublin', name: 'Dublin' }],
						localities: []
					}
				})
			}
		});

		await expect.element(page.getByLabelText('Locality')).toBeDisabled();
		await expect.element(page.getByRole('button', { name: 'Search listings' })).toBeInTheDocument();
	});
});
