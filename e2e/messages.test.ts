import { expect, test } from '@playwright/test';

test('ad page auto-declines low offer', async ({ page }) => {
	await page.goto('/ad/e2e-ad-1');
	await page.getByRole('button', { name: 'Make an offer' }).click();
	await page.fill('#offer-amount', '5');
	await page.getByRole('button', { name: 'Send message' }).click();
	await expect(page.getByText(/Offer auto-declined/i)).toBeVisible();
});

test('ad page keeps contact details private', async ({ page }) => {
	await page.goto('/ad/e2e-ad-1');
	await page.getByRole('button', { name: 'Send message' }).click();
	await expect(page.getByRole('button', { name: 'Reveal email' })).toHaveCount(0);
	await expect(page.getByRole('link', { name: 'e2e@example.com' })).toHaveCount(0);
});

test('messages inbox renders a thread', async ({ page }) => {
	await page.goto('/messages');
	await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();
	await expect(page.getByRole('link', { name: /E2E Test Ad/i })).toBeVisible();
});

test('thread view can send a message', async ({ page }) => {
	await page.goto('/messages/e2e-convo-1');
	await expect(page.getByText(/Offer auto-declined/i)).toBeVisible();
	await page.fill('#reply', 'Thanks, got it.');
	await page.getByRole('button', { name: 'Send' }).click();
	await expect(page.getByText('Message sent.')).toBeVisible();
});
