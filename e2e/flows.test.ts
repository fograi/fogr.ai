import { expect, test } from '@playwright/test';

test('login page loads the email form', async ({ page }) => {
	await page.goto('/login');
	await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
	await expect(page.getByLabel('Email')).toBeVisible();
	await expect(page.getByRole('button', { name: /send link/i })).toBeVisible();
});

test('post page redirects to login when signed out', async ({ page }) => {
	await page.goto('/post');
	await expect(page).toHaveURL(/\/login/);
	await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
});

test('ad detail page renders with mocked data', async ({ page }) => {
	await page.goto('/ad/e2e-ad-1');
	await expect(page.getByRole('heading', { name: 'E2E Test Ad' })).toBeVisible();
});
