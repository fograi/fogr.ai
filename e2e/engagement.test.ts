import { expect, test } from '@playwright/test';

// ─── 1. Browse loads with ads ───────────────────────────────────────────────
test('browse loads with multiple mock ads', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('E2E Test Ad')).toBeVisible();
	await expect(page.getByText('E2E Sold Ad')).toBeVisible();
	await expect(page.getByText('E2E Other User Ad')).toBeVisible();
});

// ─── 2. Relative timestamps on cards ────────────────────────────────────────
test('ad cards show relative timestamps', async ({ page }) => {
	await page.goto('/');
	// The active ad was created "now", so should show a time pattern like "just now" or "Xm ago"
	const locationTexts = page.locator('.card .location');
	await expect(locationTexts.first()).toBeVisible();
	// Should contain a middot separator and a time expression
	const firstText = await locationTexts.first().textContent();
	expect(firstText).toMatch(/·/);
});

// ─── 3. SOLD badge on sold cards ────────────────────────────────────────────
test('sold ad card shows SOLD badge', async ({ page }) => {
	await page.goto('/');
	const soldBadge = page.locator('.badge.sold');
	await expect(soldBadge).toBeVisible();
	await expect(soldBadge).toHaveText('SOLD');
});

// ─── 4. Sold ads visible in browse ──────────────────────────────────────────
test('both active and sold ads appear in browse results', async ({ page }) => {
	await page.goto('/?category=Bikes');
	await expect(page.getByText('E2E Test Ad')).toBeVisible();
	await expect(page.getByText('E2E Sold Ad')).toBeVisible();
});

// ─── 5. Posted date on ad detail ────────────────────────────────────────────
test('ad detail shows posted date', async ({ page }) => {
	await page.goto('/ad/e2e-test-ad-dublin-e2emock1');
	await expect(page.getByRole('heading', { name: 'E2E Test Ad' })).toBeVisible();
	await expect(page.locator('.posted-date')).toBeVisible();
	const postedText = await page.locator('.posted-date').textContent();
	expect(postedText).toMatch(/Posted/);
});

// ─── 6. Sold price on ad detail ─────────────────────────────────────────────
test('sold ad detail shows sale price', async ({ page }) => {
	await page.goto('/ad/e2e-sold-ad-dublin-e2emock2');
	await expect(page.getByRole('heading', { name: 'E2E Sold Ad' })).toBeVisible();
	const salePrice = page.locator('.sale-price');
	await expect(salePrice).toBeVisible();
	const salePriceText = await salePrice.textContent();
	expect(salePriceText).toMatch(/Sold for/);
	expect(salePriceText).toMatch(/180/);
});

// ─── 7. Save/unsave watchlist toggle ────────────────────────────────────────
test('save and unsave watchlist toggle on ad detail', async ({ page }) => {
	await page.goto('/ad/e2e-other-ad-dublin-e2emock3');
	await expect(page.getByRole('heading', { name: 'E2E Other User Ad' })).toBeVisible();

	// Mock watchlist API
	await page.route('**/api/watchlist', async (route) => {
		return route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ success: true })
		});
	});

	// Initially shows "Save"
	const saveBtn = page.getByRole('button', { name: 'Save' });
	await expect(saveBtn).toBeVisible();

	// Click to save → text becomes "Saved"
	await saveBtn.click();
	await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible();

	// Click again to unsave → text becomes "Save"
	await page.getByRole('button', { name: 'Saved' }).click();
	await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
});

// ─── 8. Watchlist page with remove ──────────────────────────────────────────
test('watchlist page shows saved ads and supports remove', async ({ page }) => {
	await page.goto('/watchlist');
	await expect(page.getByRole('heading', { name: 'Watchlist' })).toBeVisible();
	await expect(page.getByText('E2E Test Ad')).toBeVisible();

	// Mock DELETE for remove
	await page.route('**/api/watchlist', async (route) => {
		if (route.request().method() !== 'DELETE') return route.continue();
		return route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ success: true })
		});
	});

	// Click remove
	await page.getByRole('button', { name: 'Remove' }).click();

	// Should show empty state
	await expect(page.getByText('No saved ads yet')).toBeVisible();
});

// ─── 9. Watchlist navbar link ───────────────────────────────────────────────
test('navbar shows Watchlist link when authenticated', async ({ page }) => {
	// Navigate to an authenticated page to ensure auth state is set
	await page.goto('/ads');
	await page.getByRole('button', { name: 'Toggle navigation' }).click();
	await expect(page.getByRole('link', { name: 'Watchlist' })).toBeVisible();
});

// ─── 10. Save this search ───────────────────────────────────────────────────
test('save this search button works', async ({ page }) => {
	await page.goto('/?category=Bikes');

	// Mock saved-searches API
	await page.route('**/api/saved-searches', async (route) => {
		if (route.request().method() !== 'POST') return route.continue();
		return route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ success: true, id: 'e2e-search-new' })
		});
	});

	const saveBtn = page.locator('.save-search__btn');
	await expect(saveBtn).toBeVisible();
	await expect(saveBtn).toHaveText('Save this search');

	await saveBtn.click();
	await expect(saveBtn).toHaveText('Search saved!');
});

// ─── 11. Saved searches management ──────────────────────────────────────────
test('saved searches page supports toggle and delete', async ({ page }) => {
	await page.goto('/saved-searches');
	await expect(page.getByRole('heading', { name: 'Saved searches' })).toBeVisible();
	await expect(page.getByText('Bikes in Dublin')).toBeVisible();
	await expect(page.getByText('Bikes', { exact: true })).toBeVisible();

	// Mock PATCH and DELETE for saved-searches API
	await page.route('**/api/saved-searches/**', async (route) => {
		if (route.request().method() === 'PATCH') {
			return route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ success: true })
			});
		}
		if (route.request().method() === 'DELETE') {
			return route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ success: true })
			});
		}
		return route.continue();
	});

	// Toggle notifications off
	const alertsBtn = page.getByRole('button', { name: 'Alerts on' });
	await expect(alertsBtn).toBeVisible();
	await alertsBtn.click();
	await expect(page.getByRole('button', { name: 'Alerts off' })).toBeVisible();
	await expect(page.getByText('Notifications disabled.')).toBeVisible();

	// Delete the search
	await page.getByRole('button', { name: 'Delete' }).click();
	await expect(page.getByText('Search deleted.')).toBeVisible();
	await expect(page.getByText('No saved searches yet')).toBeVisible();
});

// ─── 12. Saved searches navbar link ─────────────────────────────────────────
test('navbar shows Saved searches link when authenticated', async ({ page }) => {
	await page.goto('/ads');
	await page.getByRole('button', { name: 'Toggle navigation' }).click();
	await expect(page.getByRole('link', { name: 'Saved searches' })).toBeVisible();
});

// ─── 13. Mark sold from My Ads ──────────────────────────────────────────────
test('mark sold from My Ads page', async ({ page }) => {
	await page.goto('/ads');
	await expect(page.getByRole('heading', { name: 'My ads' })).toBeVisible();
	// Both ads should appear
	await expect(page.getByText('E2E Test Ad')).toBeVisible();
	await expect(page.getByText('E2E Sold Ad')).toBeVisible();

	// Mock status API
	await page.route('**/api/ads/*/status', async (route) => {
		if (route.request().method() !== 'POST') return route.continue();
		return route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ success: true })
		});
	});

	// Click "Mark sold" on the active ad
	await page.getByRole('button', { name: 'Mark sold' }).click();

	// Fill sale price
	await page.locator('.sold-input').fill('150');

	// Click confirm
	await page.getByRole('button', { name: 'Confirm sold' }).click();
	await expect(page.getByText('Marked as sold.')).toBeVisible();
});

// ─── 14. Mark sold from ad detail ───────────────────────────────────────────
test('mark sold from ad detail page', async ({ page }) => {
	await page.goto('/ad/e2e-test-ad-dublin-e2emock1');
	await expect(page.getByRole('heading', { name: 'E2E Test Ad' })).toBeVisible();

	// Mock status API (already mocked server-side, but ensure client-side route too)
	await page.route('**/api/ads/*/status', async (route) => {
		if (route.request().method() !== 'POST') return route.continue();
		return route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ success: true })
		});
	});

	// Click "Mark as sold"
	const markSoldBtn = page.getByRole('button', { name: 'Mark as sold' });
	await expect(markSoldBtn).toBeVisible();
	await markSoldBtn.click();

	// Fill sale price
	await page.locator('.sold-input').fill('100');

	// Click confirm — status changes to 'sold', "Mark as sold" section hides, sale price shows
	await page.getByRole('button', { name: 'Confirm sold' }).click();
	await expect(page.locator('.sale-price')).toBeVisible();
	await expect(page.locator('.sale-price')).toContainText('100');
	// The "Mark as sold" button should no longer be visible
	await expect(markSoldBtn).not.toBeVisible();
});

// ─── 15. Currency selector on post form ─────────────────────────────────────
test('currency selector auto-selects based on county', async ({ page }) => {
	await page.goto('/post');

	// Select an NI county with locality
	await page.selectOption('#location-county', 'ie/ulster/antrim');
	await expect(page.locator('#location-locality')).toBeEnabled();
	await page.selectOption('#location-locality', 'ie/ulster/antrim/aghagallon');

	// Use Services & Gigs (simpler form, no bike details needed)
	await page.selectOption('#category', 'Services & Gigs');
	await page.fill('#title', 'Currency test ad');
	await page.fill(
		'#description',
		'E2E listing description that is long enough to pass validation.'
	);
	await page.getByRole('button', { name: 'Continue' }).click();

	// On price step, GBP should be checked for NI county
	const gbpRadio = page.locator('input[type="radio"][value="GBP"]');
	await expect(gbpRadio).toBeChecked();

	// Go back, switch to Dublin → EUR should be checked
	await page.getByRole('button', { name: 'Back' }).click();
	await page.selectOption('#location-county', 'ie/leinster/dublin');
	await expect(page.locator('#location-locality')).toBeEnabled();
	await page.selectOption('#location-locality', 'ie/leinster/dublin/ard-na-greine');
	await page.getByRole('button', { name: 'Continue' }).click();

	const eurRadio = page.locator('input[type="radio"][value="EUR"]');
	await expect(eurRadio).toBeChecked();
});
