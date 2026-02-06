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
	await page.fill(
		'#description',
		'E2E listing description that is long enough to pass validation.'
	);
	await page.getByRole('button', { name: 'Continue' }).click();

	await page.fill('#price', '10');
	await page.getByRole('button', { name: 'Continue' }).click();

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

	await page.getByLabel('I am 18 or older.').check();
	await page.getByRole('button', { name: 'Preview' }).click();
	await page.getByRole('button', { name: 'Post ad' }).click();
	await expect(page).toHaveURL(/\/ad\/e2e-ad-1/);
	await expect(page.getByRole('heading', { name: 'E2E Test Ad' })).toBeVisible();
});

test('navbar shows Post ad and Logout when signed in (mocked)', async ({ page }) => {
	await page.goto('/post');
	await expect(page.getByRole('link', { name: 'Post ad' })).toBeVisible();
	await page.getByRole('button', { name: 'Toggle navigation' }).click();
	await expect(page.getByRole('link', { name: 'My ads' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
});

test('my ads page renders with mocked data', async ({ page }) => {
	await page.goto('/ads');
	await expect(page.getByRole('heading', { name: 'My ads' })).toBeVisible();
	await expect(page.getByText(/E2E Test Ad/i)).toBeVisible();
});

test('edit ad page saves updates with mocked API', async ({ page }) => {
	await page.goto('/ads/e2e-ad-1/edit');
	await expect(page.getByRole('heading', { name: 'Edit ad' })).toBeVisible();

	await page.fill('#title', 'E2E Updated Title');
	await page.getByRole('button', { name: 'Continue' }).click();
	await page.getByRole('button', { name: 'Continue' }).click();

	await page.route('**/api/ads/e2e-ad-1', async (route) => {
		if (route.request().method() !== 'PATCH') return route.continue();
		return route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ success: true, id: 'e2e-ad-1', message: 'Saved.' })
		});
	});

	await page.getByLabel('I am 18 or older.').check();
	await page.getByRole('button', { name: 'Preview' }).click();
	await page.getByRole('button', { name: 'Save changes' }).click();
	await expect(page).toHaveURL(/\/ad\/e2e-ad-1/);
});

test('ad detail page renders with mocked data', async ({ page }) => {
	await page.goto('/ad/e2e-ad-1');
	await expect(page.getByRole('heading', { name: 'E2E Test Ad' })).toBeVisible();
});

test('report form submits and shows reference', async ({ page }) => {
	await page.goto('/ad/e2e-ad-1');
	await page.getByRole('button', { name: 'Report' }).click();

	await page.route('**/api/ads/e2e-ad-1/report', async (route) => {
		if (route.request().method() !== 'POST') return route.continue();
		return route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ success: true, reportId: 'rep-123' })
		});
	});

	await page.fill('#report-name', 'E2E Reporter');
	await page.fill('#report-email', 'reporter@example.com');
	await page.selectOption('#report-reason', 'spam');
	await page.fill('#report-details', 'This is a test report with enough detail to pass validation.');
	await page.getByRole('checkbox', { name: /good faith/i }).check();

	await page.getByRole('button', { name: 'Submit report' }).click();
	await expect(page.getByText(/report received/i)).toBeVisible();
	await expect(page.getByRole('button', { name: /copy report id/i })).toBeVisible();
});

test('report status page shows decision (mocked)', async ({ page }) => {
	await page.route('**/api/reports/status', async (route) => {
		if (route.request().method() !== 'POST') return route.continue();
		return route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				success: true,
				report: {
					id: 'rep-123',
					status: 'actioned',
					reason_category: 'spam',
					created_at: new Date().toISOString()
				},
				decision_source: 'User report',
				decision: {
					action_type: 'reject',
					reason_category: 'spam',
					reason_details: 'Test decision details.',
					legal_basis: null,
					automated: false,
					created_at: new Date().toISOString()
				}
			})
		});
	});

	await page.goto('/report-status');
	await page.fill('#report-id', 'rep-123');
	await page.fill('#report-email', 'reporter@example.com');
	await page.getByRole('button', { name: 'Check status' }).click();
	await expect(page.getByRole('heading', { name: 'Decision' })).toBeVisible();
	await expect(page.getByText(/test decision details/i)).toBeVisible();
});

test('account page exports data (mocked)', async ({ page }) => {
	await page.route('**/api/me/export', async (route) => {
		return route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ ok: true })
		});
	});

	await page.goto('/account');
	await expect(page.getByRole('heading', { name: 'Account', exact: true })).toBeVisible();

	const [res] = await Promise.all([
		page.waitForResponse((response) => response.url().includes('/api/me/export')),
		page.getByRole('button', { name: /download data export/i }).click()
	]);

	expect(res.ok()).toBeTruthy();
});

test('account page deletes account (mocked)', async ({ page }) => {
	await page.goto('/account');
	page.once('dialog', (dialog) => dialog.accept());
	await page.getByRole('button', { name: /delete my account/i }).click();
	await expect(page).toHaveURL('/');
});
