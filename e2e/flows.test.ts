import { expect, test } from '@playwright/test';

test('login page loads the email form', async ({ page }) => {
	await page.goto('/login');
	await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
	await expect(page.getByLabel('Email')).toBeVisible();
	await expect(page.getByRole('button', { name: /send link/i })).toBeVisible();
});

test('post page allows submitting a listing with mocked API', async ({ page }) => {
	await page.goto('/post');

	await page.selectOption('#category', 'Services & Gigs');
	await page.fill('#title', 'E2E Listing Title');
	await page.fill('#description', 'E2E listing description that is long enough to pass validation.');
	await page.fill('#price', '10');
	await page.getByLabel('I am 18 or older.').check();

	await page.route('**/api/ads', async (route) => {
		if (route.request().method() !== 'POST') return route.continue();
		return route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				success: true,
				id: 'e2e-ad-1',
				message: 'Ad submitted successfully!'
			})
		});
	});

	await page.getByRole('button', { name: 'Post ad' }).click();
	await expect(page).toHaveURL(/\/ad\/e2e-ad-1/);
	await expect(page.getByRole('heading', { name: 'E2E Test Ad' })).toBeVisible();
});

test('navbar shows Post ad and Logout when signed in (mocked)', async ({ page }) => {
	await page.goto('/post');
	await expect(page.getByRole('link', { name: 'Post ad' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
});

test('ad detail page renders with mocked data', async ({ page }) => {
	await page.goto('/ad/e2e-ad-1');
	await expect(page.getByRole('heading', { name: 'E2E Test Ad' })).toBeVisible();
});
