import { expect, test } from '@playwright/test';

test('home page renders the main nav', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('link', { name: 'fogr.ai' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Ads' })).toBeVisible();
});
