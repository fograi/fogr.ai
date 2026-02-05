import { expect, test } from '@playwright/test';

test('home page renders the main nav', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('link', { name: 'fogr.ai' })).toBeVisible();
	await expect(page.locator('header .brand svg')).toBeVisible();

	const footer = page.getByRole('contentinfo');
	await expect(footer.getByRole('link', { name: 'About' })).toBeVisible();
	await expect(footer.getByRole('link', { name: 'Terms' })).toBeVisible();
	await expect(footer.getByRole('link', { name: 'Privacy' })).toBeVisible();
});

test('home page search submits query and category', async ({ page }) => {
	await page.goto('/');
	await page.fill('#search-q', 'bike');
	await page.selectOption('#search-category', 'Sports & Bikes');
	await page.selectOption('#search-price-state', 'free');
	await page.getByRole('button', { name: 'Search' }).click();
	await expect(page).toHaveURL(/category=Sports(?:\+|%20)%26(?:\+|%20)Bikes/);
	await expect(page).toHaveURL(/price_state=free/);
});
