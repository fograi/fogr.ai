import { expect, test } from '@playwright/test';

test('thread view shows sending state during delayed message request', async ({ page }) => {
	await page.route('**/api/messages', async (route) => {
		const req = route.request();
		if (req.method() !== 'POST') {
			await route.continue();
			return;
		}
		await page.waitForTimeout(450);
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ success: true })
		});
	});

	await page.goto('/messages/e2e-convo-1');
	await page.fill('#reply', 'Testing delayed send.');
	await page.getByRole('button', { name: 'Send' }).click();

	await expect(page.getByText('Sending...')).toBeVisible();
	await expect(page.getByText('Message sent.')).toBeVisible();
});

test('account export shows progress during delayed export', async ({ page }) => {
	await page.route('**/api/me/export', async (route) => {
		await page.waitForTimeout(450);
		await route.fulfill({
			status: 200,
			headers: {
				'content-type': 'application/json; charset=utf-8',
				'cache-control': 'no-store'
			},
			body: JSON.stringify({ generated_at: new Date().toISOString(), user: {}, ads: [] })
		});
	});

	await page.goto('/account');
	await page.getByRole('button', { name: 'Download data export' }).click();

	await expect(page.getByText('Collecting your account data.')).toBeVisible();
	await expect(page.getByRole('progressbar', { name: 'Data export progress' })).toBeVisible();
	await expect(page.getByText('Export ready. Your download has started.')).toBeVisible();
});
