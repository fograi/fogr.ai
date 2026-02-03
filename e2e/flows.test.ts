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

test('ad detail page renders when an ad exists', async ({ page, request }, testInfo) => {
	const res = await request.get('/api/ads?limit=1');
	if (!res.ok) testInfo.skip(true, 'Ads API unavailable');
	const body = (await res.json()) as { ads?: Array<{ id: string; title: string }> };
	const ad = body.ads?.[0];
	if (!ad) testInfo.skip(true, 'No ads available');

	await page.goto(`/ad/${ad.id}`);
	await expect(page.getByRole('heading', { name: ad.title })).toBeVisible();
});
