import { expect, test, type Page } from '@playwright/test';

const WHOLE_EURO_VALIDATION_MESSAGE = 'No cents, no chaos - whole euros only (e.g. 2, not 1.50).';
const MAX_AD_PRICE_VALIDATION_MESSAGE = 'Nice ambition - max allowed is EUR 2147483647.';

async function goToPriceStep(page: Page) {
	await page.goto('/post');
	await page.selectOption('#category', 'Services & Gigs');
	await page.fill('#title', 'E2E Listing Title');
	await page.fill(
		'#description',
		'E2E listing description that is long enough to pass validation.'
	);
	await page.getByRole('button', { name: 'Continue' }).click();
}

test('login page loads the email form', async ({ page }) => {
	await page.goto('/login');
	await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
	await expect(page.getByLabel('Email')).toBeVisible();
	await expect(page.getByRole('button', { name: /send link/i })).toBeVisible();
});

test('post page allows submitting a listing with mocked API', async ({ page }) => {
	await goToPriceStep(page);

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

test('post price step rejects decimal values before preview', async ({ page }) => {
	await goToPriceStep(page);

	await page.fill('#price', '1.5');
	await page.getByRole('button', { name: 'Continue' }).click();

	await expect(page.getByText(WHOLE_EURO_VALIDATION_MESSAGE)).toBeVisible();
	await expect(page.locator('#price')).toBeVisible();
});

test('post price step rejects values above max integer range', async ({ page }) => {
	await goToPriceStep(page);

	await page.fill('#price', '2147483648');
	await page.getByRole('button', { name: 'Continue' }).click();

	await expect(page.getByText(MAX_AD_PRICE_VALIDATION_MESSAGE)).toBeVisible();
	await expect(page.locator('#price')).toBeVisible();
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
	await expect(page.getByRole('button', { name: 'Commuter' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Training wheels' })).toBeVisible();

	await page.getByRole('button', { name: 'Adult bike' }).click();
	await expect(page.getByRole('button', { name: 'Touring' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Folding' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Balance' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Training wheels' })).toHaveCount(0);

	await page.getByRole('button', { name: 'Electric bike' }).click();
	await expect(page.getByRole('button', { name: 'Commuter' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Folding' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Training wheels' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Touring' })).toHaveCount(0);
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

test('adult bike with subtype, condition, and size can continue to price step', async ({
	page
}) => {
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

test('adult manual size is numeric-only and uses inline unit selector', async ({ page }) => {
	await page.goto('/post');

	await page.selectOption('#category', 'Bikes');
	await page.getByRole('button', { name: 'Adult bike' }).click();
	await page.getByRole('button', { name: 'Road' }).click();
	await page.getByRole('button', { name: 'Used - good' }).click();

	const manualSize = page.locator('#bike-size-manual');
	await manualSize.fill('58cm');
	await expect(manualSize).toHaveValue('58');
	await expect(page.locator('#bike-size-manual-unit')).toHaveValue('cm');

	await expect(page.locator('#title')).toHaveValue(/size 58 cm/i);
});

test('electric bike with subtype, condition, and size can continue to price step', async ({
	page
}) => {
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

test('bike min-offer preset submits expected offer rules payload', async ({ page }) => {
	await page.goto('/post');

	await page.selectOption('#category', 'Bikes');
	await page.getByRole('button', { name: 'Adult bike' }).click();
	await page.getByRole('button', { name: 'Road' }).click();
	await page.getByRole('button', { name: 'Used - good' }).click();
	await page.getByRole('button', { name: 'M', exact: true }).click();
	await page.fill('#title', 'Road bike - size M');
	await page.fill(
		'#description',
		'Reason for selling: upgrading. How it has been used: weekly rides. Known issues: none.'
	);
	await page.getByRole('button', { name: 'Continue' }).click();

	await page.fill('#price', '95');
	await expect(page.getByRole('button', { name: '€85' })).toBeVisible();

	await page.getByRole('button', { name: '80%' }).click();
	await expect(page.locator('#min-offer-unit')).toHaveValue('percent');
	await expect(page.locator('#min-offer')).toHaveValue('80');

	await page.selectOption('#min-offer-unit', 'eur');
	await expect(page.locator('#min-offer')).toHaveValue('76');

	await page.getByRole('button', { name: '€85' }).click();
	await expect(page.locator('#min-offer-unit')).toHaveValue('eur');
	await expect(page.locator('#min-offer')).toHaveValue('85');
	await page.fill('#auto-decline', 'Thanks, minimum offer is 85 EUR.');

	let createPayload = '';
	await page.route('**/api/ads', async (route) => {
		if (route.request().method() !== 'POST') return route.continue();
		createPayload = route.request().postData() ?? '';
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

	await page.getByRole('button', { name: 'Continue' }).click();
	await page.getByRole('button', { name: 'Preview' }).click();
	await page.getByLabel('I am 18 or older.').check();
	await page.getByRole('button', { name: 'Post ad' }).click();
	await expect(page).toHaveURL(/\/ad\/e2e-ad-1/);

	expect(createPayload).toContain('name="category"');
	expect(createPayload).toContain('Bikes');
	expect(createPayload).toMatch(/name="min_offer"[\s\S]*\b85\b/);
	expect(createPayload).toMatch(
		/name="auto_decline_message"[\s\S]*Thanks, minimum offer is 85 EUR\./
	);
});

test('bike min-offer percent input submits EUR value', async ({ page }) => {
	await page.goto('/post');

	await page.selectOption('#category', 'Bikes');
	await page.getByRole('button', { name: 'Adult bike' }).click();
	await page.getByRole('button', { name: 'Road' }).click();
	await page.getByRole('button', { name: 'Used - good' }).click();
	await page.getByRole('button', { name: 'M', exact: true }).click();
	await page.fill('#title', 'Road bike - size M');
	await page.fill(
		'#description',
		'Reason for selling: upgrading. How it has been used: weekend rides. Known issues: none.'
	);
	await page.getByRole('button', { name: 'Continue' }).click();

	await page.fill('#price', '99');
	await page.selectOption('#min-offer-unit', 'percent');
	await page.fill('#min-offer', '75');
	await expect(page.locator('#min-offer')).toHaveValue('75');

	await page.selectOption('#min-offer-unit', 'eur');
	await expect(page.locator('#min-offer')).toHaveValue('74');

	let createPayload = '';
	await page.route('**/api/ads', async (route) => {
		if (route.request().method() !== 'POST') return route.continue();
		createPayload = route.request().postData() ?? '';
		return route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				success: true,
				id: 'e2e-ad-2',
				message: 'Ad submitted successfully!'
			})
		});
	});

	await page.getByRole('button', { name: 'Continue' }).click();
	await page.getByRole('button', { name: 'Preview' }).click();
	await page.getByLabel('I am 18 or older.').check();
	await page.getByRole('button', { name: 'Post ad' }).click();
	await expect(page).toHaveURL(/\/ad\/e2e-ad-2/);

	expect(createPayload).toMatch(/name="min_offer"[\s\S]*\b74\b/);
});

test('bike description assist pills populate profile payload', async ({ page }) => {
	await page.goto('/post');

	await page.selectOption('#category', 'Bikes');
	await page.getByRole('button', { name: 'Adult bike' }).click();
	await page.getByRole('button', { name: 'Road' }).click();
	await page.getByRole('button', { name: 'Used - good' }).click();
	await page.getByRole('button', { name: 'M', exact: true }).click();

	await page.getByRole('button', { name: /Reason for selling/i }).click();
	await page.getByRole('button', { name: 'Upgrading bike' }).click();
	await page.getByRole('button', { name: 'Done' }).click();

	await page.getByRole('button', { name: /How it has been used/i }).click();
	await page.getByRole('button', { name: 'Weekend rides' }).click();
	await page.getByRole('button', { name: 'Done' }).click();

	await page.getByRole('button', { name: /Known issues or maintenance needed/i }).click();
	await page.getByRole('button', { name: 'No known issues' }).click();
	await page.getByRole('button', { name: 'Done' }).click();

	const generatedDescription = await page.locator('#description').inputValue();
	expect(generatedDescription).toContain("Selling because I'm upgrading to another bike.");
	expect(generatedDescription).toContain('Used mainly for weekend rides.');
	expect(generatedDescription).toContain('No known issues to note.');

	await page.getByRole('button', { name: 'Continue' }).click();
	await page.fill('#price', '120');

	let createPayload = '';
	await page.route('**/api/ads', async (route) => {
		if (route.request().method() !== 'POST') return route.continue();
		createPayload = route.request().postData() ?? '';
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

	await page.getByRole('button', { name: 'Continue' }).click();
	await page.getByRole('button', { name: 'Preview' }).click();
	await page.getByLabel('I am 18 or older.').check();
	await page.getByRole('button', { name: 'Post ad' }).click();
	await expect(page).toHaveURL(/\/ad\/e2e-ad-1/);

	expect(createPayload).toContain('name="category_profile_data"');
	expect(createPayload).toContain('reasonForSelling');
	expect(createPayload).toContain('Upgrading bike');
	expect(createPayload).toContain('usageSummary');
	expect(createPayload).toContain('Weekend rides');
	expect(createPayload).toContain('knownIssues');
	expect(createPayload).toContain('No known issues');
});

test('bike description stays empty until description assist is used', async ({ page }) => {
	await page.goto('/post');

	await page.selectOption('#category', 'Bikes');
	await page.getByRole('button', { name: 'Adult bike' }).click();
	await page.getByRole('button', { name: 'Road' }).click();
	await page.getByRole('button', { name: 'Used - good' }).click();
	await page.getByRole('button', { name: 'M', exact: true }).click();

	await expect(page.locator('#description')).toHaveValue('');

	await page.getByRole('button', { name: /Reason for selling/i }).click();
	await page.getByRole('button', { name: 'Upgrading bike' }).click();
	await expect(page.locator('#description')).toHaveValue(
		/Selling because I'm upgrading to another bike\./
	);
});

test('bike description assist keeps sub-pill and custom input in sync across prompts', async ({
	page
}) => {
	await page.goto('/post');

	await page.selectOption('#category', 'Bikes');
	await page.getByRole('button', { name: /Reason for selling/i }).click();
	const reasonInput = page.locator('#bike-assist-reasonForSelling');
	await expect(reasonInput).toBeVisible();

	await page.getByRole('button', { name: 'Upgrading bike' }).click();
	await expect(reasonInput).toHaveValue('Upgrading bike');

	await reasonInput.fill('Upgrading bike and moving away');
	await expect(reasonInput).toHaveValue('Upgrading bike and moving away');
	await expect(page.locator('#description')).toHaveValue(
		/Selling because upgrading bike and moving away\./
	);

	await page.getByRole('button', { name: /How it has been used/i }).click();
	const usageInput = page.locator('#bike-assist-usageSummary');
	await expect(usageInput).toBeVisible();
	await expect(usageInput).toHaveValue('');

	await page.getByRole('button', { name: 'Weekend rides' }).click();
	await expect(usageInput).toHaveValue('Weekend rides');

	await page.getByRole('button', { name: /Reason for selling/i }).click();
	await expect(reasonInput).toHaveValue('Upgrading bike and moving away');
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

test('edit ad bike pill changes refresh suggested title', async ({ page }) => {
	await page.goto('/ads/e2e-ad-1/edit');

	const titleInput = page.locator('#title');
	await expect(titleInput).toHaveValue('E2E Test Ad');

	await page.getByRole('button', { name: 'Mountain' }).click();
	await expect(titleInput).toHaveValue('Mountain bike - size M');
});

test('ad detail page renders with mocked data', async ({ page }) => {
	await page.goto('/ad/e2e-ad-1');
	await expect(page.getByRole('heading', { name: 'E2E Test Ad' })).toBeVisible();
	await expect(page.getByText('Adult')).toBeVisible();
	await expect(page.getByText('Road')).toBeVisible();
	await expect(page.getByText('Used - good')).toBeVisible();
	await expect(page.getByText('Size M')).toBeVisible();
	await expect(page.getByText('Reason for selling', { exact: true })).toHaveCount(0);

	const firstBikeChip = page.locator('.bike-chip').first();
	await expect(firstBikeChip).toBeVisible();

	const listingImage = page.locator('.media img').first();
	if ((await listingImage.count()) > 0) {
		await expect(listingImage).toBeVisible();
		const [chipBox, imageBox] = await Promise.all([
			firstBikeChip.boundingBox(),
			listingImage.boundingBox()
		]);
		expect(chipBox).not.toBeNull();
		expect(imageBox).not.toBeNull();
		expect((chipBox?.y ?? 0) + (chipBox?.height ?? 0)).toBeLessThan(imageBox?.y ?? 0);
	}
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
	await page.fill(
		'#report-details',
		'This is a test report with enough detail to pass validation.'
	);
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
