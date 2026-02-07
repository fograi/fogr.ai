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

test('home page filters auto-apply on select', async ({ page }) => {
	await page.goto('/');
	await page.selectOption('#search-category', 'Bikes');
	await expect(page).toHaveURL(/category=Bikes/);
	await page.selectOption('#search-price-state', 'free');
	await expect(page).toHaveURL(/price_state=free/);
});

test('home page search keeps selected filters', async ({ page }) => {
	await page.goto('/');
	await page.selectOption('#search-category', 'Electronics');
	await expect(page).toHaveURL(/category=Electronics/);
	await page.selectOption('#search-price-state', 'fixed');
	await expect(page).toHaveURL(/price_state=fixed/);
	await page.fill('#search-q', 'bike');
	await page.getByRole('button', { name: 'Search' }).click();
	await expect(page).toHaveURL(/q=bike/);
	await expect(page).toHaveURL(/category=Electronics/);
	await expect(page).toHaveURL(/price_state=fixed/);
});
