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

test('home page category filter refines home results instead of navigating', async ({ page }) => {
	await page.goto('/');
	await page.selectOption('#search-category', 'Electronics');
	await page.getByRole('button', { name: 'Search' }).click();
	await expect(page).toHaveURL(/category=Electronics/);
	expect(page.url()).not.toContain('/category/');
});

test('home page search bar keeps query and scope filters in one form', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('#search-category')).toBeVisible();
	await expect(page.locator('#search-county')).toBeVisible();
	await expect(page.locator('#search-locality')).toBeDisabled();

	await page.fill('#search-q', 'bike');
	await page.selectOption('#search-category', 'Bikes');
	await page.getByRole('button', { name: 'Search' }).click();
	await expect(page).toHaveURL(/q=bike/);
	await expect(page).toHaveURL(/category=Bikes/);

	await page.getByRole('link', { name: 'Clear filters' }).click();
	await expect(page).not.toHaveURL(/q=/);
	await expect(page).not.toHaveURL(/category=/);
});

test('home page county selection progressively enables locality', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('#search-locality')).toBeDisabled();

	await page.selectOption('#search-county', 'ie/leinster/dublin');
	await expect(page).toHaveURL(/county_id=ie%2Fleinster%2Fdublin/);
	await expect(page.locator('#search-locality')).toBeEnabled();

	await page.selectOption('#search-locality', 'ie/leinster/dublin/ard-na-greine');
	await page.getByRole('button', { name: 'Search' }).click();
	await expect(page).toHaveURL(/locality_id=ie%2Fleinster%2Fdublin%2Fard-na-greine/);
});

test('bikes category page supports sorting, range, and bike filters', async ({ page }) => {
	await page.goto('/category/bikes');
	await expect(page.getByRole('heading', { name: 'Bikes' })).toBeVisible();
	await expect(page.locator('#cat-sort')).toBeVisible();

	await page.selectOption('#cat-sort', 'price_high');
	await expect(page).toHaveURL(/sort=price_high/);

	await page.locator('.bike-pills .pill', { hasText: 'Adult bike' }).click();
	await expect(page).toHaveURL(/bike_subtype=adult/);

	await page.fill('#cat-min-price', '50');
	await page.fill('#cat-max-price', '120');
	await page.getByRole('button', { name: 'Apply' }).click();
	await expect(page).toHaveURL(/min_price=50/);
	await expect(page).toHaveURL(/max_price=120/);
});

test('category page renders removable applied filter chips', async ({ page }) => {
	await page.goto('/category/bikes?bike_subtype=adult&min_price=50&max_price=120');

	const subtypeChip = page.getByRole('link', { name: 'Remove Bike type: Adult bike' });
	const priceChip = page.getByRole('link', { name: 'Remove Price: EUR 50-120' });

	await expect(subtypeChip).toBeVisible();
	await expect(priceChip).toBeVisible();

	await subtypeChip.click();
	await expect(page).not.toHaveURL(/bike_subtype=adult/);
	await expect(page).toHaveURL(/min_price=50/);
	await expect(page).toHaveURL(/max_price=120/);

	await page.getByRole('link', { name: 'Clear all' }).click();
	await expect(page).not.toHaveURL(/min_price=50/);
	await expect(page).not.toHaveURL(/max_price=120/);
});

test('non-bike category page does not render bike-only filters', async ({ page }) => {
	await page.goto('/category/electronics');
	await expect(page.getByRole('heading', { name: 'Electronics' })).toBeVisible();
	await expect(page.locator('#cat-bike-type')).toHaveCount(0);
});
