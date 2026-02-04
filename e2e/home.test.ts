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
