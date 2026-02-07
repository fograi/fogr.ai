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

	await page.getByRole('button', { name: 'Preview' }).click();
	await page.getByLabel('I am 18 or older.').check();
	await page.getByRole('button', { name: 'Post ad' }).click();
	await expect(page).toHaveURL(/\/ad\/e2e-ad-1/);
	await expect(page.getByRole('heading', { name: 'E2E Test Ad' })).toBeVisible();
});

test('bike subtype resets when bike type changes to a different branch', async ({ page }) => {
	await page.goto('/post');

	await page.selectOption('#category', 'Bikes');
	await page.getByRole('button', { name: 'Kids bike' }).click();
	await page.getByRole('button', { name: 'Balance' }).click();
	await page.getByRole('button', { name: 'Used - good' }).click();
	await page.getByRole('button', { name: '6-8', exact: true }).click();

	// Switch to a different bike type; previously chosen kids-only subtype must not carry over.
	await page.getByRole('button', { name: 'Adult bike' }).click();

	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page.getByText('Bike subtype is required.')).toBeVisible();
	await expect(page.getByText('Choose a bike subtype.')).toBeVisible();
});

test('bike subtype options are scoped to selected bike type', async ({ page }) => {
	await page.goto('/post');

	await page.selectOption('#category', 'Bikes');
	await page.getByRole('button', { name: 'Kids bike' }).click();
	await expect(page.getByRole('button', { name: 'Balance' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Road' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Commuter' })).toHaveCount(0);

	await page.getByRole('button', { name: 'Adult bike' }).click();
	await expect(page.getByRole('button', { name: 'Road' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Balance' })).toHaveCount(0);

	await page.getByRole('button', { name: 'Electric bike' }).click();
	await expect(page.getByRole('button', { name: 'Commuter' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Road' })).toHaveCount(0);
});

test('kids bike requires age-range size before continuing', async ({ page }) => {
	await page.goto('/post');

	await page.selectOption('#category', 'Bikes');
	await page.getByRole('button', { name: 'Kids bike' }).click();
	await page.getByRole('button', { name: 'Balance' }).click();
	await page.getByRole('button', { name: 'Used - good' }).click();
	await page.fill('#title', 'Kids balance bike');
	await page.fill(
		'#description',
		'Reason for selling: outgrown. How it has been used: light school runs. Known issues: none.'
	);

	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page.getByText('Kids bikes must include an age range.')).toBeVisible();
	await expect(page.getByText('Add a size.')).toBeVisible();
});

test('adult bike with subtype, condition, and size can continue to price step', async ({ page }) => {
	await page.goto('/post');

	await page.selectOption('#category', 'Bikes');
	await page.getByRole('button', { name: 'Adult bike' }).click();
	await page.getByRole('button', { name: 'Road' }).click();
	await page.getByRole('button', { name: 'Used - good' }).click();
	await page.getByRole('button', { name: 'M', exact: true }).click();
	await page.fill('#title', 'Road bike - size M');
	await page.fill(
		'#description',
		'Reason for selling: upgrading. How it has been used: weekend rides. Known issues: light cosmetic marks.'
	);

	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page.getByLabel('Price type')).toBeVisible();
});

test('electric bike with subtype, condition, and size can continue to price step', async ({ page }) => {
	await page.goto('/post');

	await page.selectOption('#category', 'Bikes');
	await page.getByRole('button', { name: 'Electric bike' }).click();
	await page.getByRole('button', { name: 'Commuter' }).click();
	await page.getByRole('button', { name: 'Like new' }).click();
	await page.getByRole('button', { name: 'L', exact: true }).click();
	await page.fill('#title', 'Electric commuter bike - size L');
	await page.fill(
		'#description',
		'Reason for selling: moving away. How it has been used: city commuting. Known issues: battery replaced last year.'
	);

	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page.getByLabel('Price type')).toBeVisible();
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

	await page.getByRole('button', { name: 'Preview' }).click();
	await page.getByLabel('I am 18 or older.').check();
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
