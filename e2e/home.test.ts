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

test('bikes category page supports sorting, range, and bike filters', async ({ page }) => {
	await page.goto('/category/bikes');
	await expect(page.getByRole('heading', { name: 'Bikes' })).toBeVisible();
	await page.locator('details.filters-shell > summary').click();
	await page.locator('details.filter-group > summary', { hasText: 'Search & sort' }).click();
	await expect(page.locator('#cat-sort')).toBeVisible();

	await page.selectOption('#cat-sort', 'price_high');
	await expect(page).toHaveURL(/sort=price_high/);

	await page.locator('details.filter-group > summary', { hasText: 'Bike filters' }).click();
	await page.locator('.bike-pills .pill', { hasText: 'Adult bike' }).click();
	await expect(page).toHaveURL(/bike_subtype=adult/);

	await page.locator('details.filter-group > summary', { hasText: 'Price' }).click();
	await page.fill('#cat-min-price', '50');
	await page.fill('#cat-max-price', '120');
	await page.getByRole('button', { name: 'Apply' }).click();
	await expect(page).toHaveURL(/min_price=50/);
	await expect(page).toHaveURL(/max_price=120/);
});

test('non-bike category page does not render bike-only filters', async ({ page }) => {
	await page.goto('/category/electronics');
	await expect(page.getByRole('heading', { name: 'Electronics' })).toBeVisible();
	await expect(page.getByText('Bike filters')).toHaveCount(0);
});
