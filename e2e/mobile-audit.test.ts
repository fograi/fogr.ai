import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 375, height: 812 } });

test.describe('Mobile audit at 375px viewport', () => {
	test('homepage has no horizontal overflow at 375px', async ({ page }) => {
		await page.goto('/');

		const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
		expect(scrollWidth).toBeLessThanOrEqual(375);

		await expect(page.locator('h1')).toBeVisible();
		await expect(page.locator('.sub')).toBeVisible();

		await page.screenshot({ path: 'test-results/mobile-homepage.png', fullPage: true });
	});

	test('homepage hero text is visible and not truncated at 375px', async ({ page }) => {
		await page.goto('/');

		const h1 = page.locator('.search__copy h1');
		await expect(h1).toBeVisible();

		const h1Box = await h1.boundingBox();
		expect(h1Box).toBeTruthy();
		if (h1Box) {
			expect(h1Box.width).toBeLessThanOrEqual(375);
			expect(h1Box.x).toBeGreaterThanOrEqual(0);
		}
	});

	test('homepage search form fits within 375px viewport', async ({ page }) => {
		await page.goto('/');

		const searchForm = page.locator('.search__form');
		await expect(searchForm).toBeVisible();

		const formBox = await searchForm.boundingBox();
		expect(formBox).toBeTruthy();
		if (formBox) {
			expect(formBox.x + formBox.width).toBeLessThanOrEqual(380);
		}

		const scopeToggle = page.locator('.search__scope-toggle');
		await expect(scopeToggle).toBeVisible();
	});

	test('homepage browse tagline is visible when ads exist at 375px', async ({ page }) => {
		await page.goto('/');

		const tagline = page.locator('.browse-tagline');
		if ((await tagline.count()) > 0) {
			await expect(tagline).toBeVisible();
			const taglineBox = await tagline.boundingBox();
			expect(taglineBox).toBeTruthy();
			if (taglineBox) {
				expect(taglineBox.x + taglineBox.width).toBeLessThanOrEqual(380);
			}
		}
	});

	test('homepage ad cards render in single column at 375px', async ({ page }) => {
		await page.goto('/');

		const cards = page.locator('.masonry-grid .card');
		const cardCount = await cards.count();
		if (cardCount >= 2) {
			const firstBox = await cards.nth(0).boundingBox();
			const secondBox = await cards.nth(1).boundingBox();
			expect(firstBox).toBeTruthy();
			expect(secondBox).toBeTruthy();
			if (firstBox && secondBox) {
				// In single-column, second card is below first (not side by side)
				expect(secondBox.y).toBeGreaterThan(firstBox.y);
			}
		}
	});

	test('ad view page has no horizontal overflow at 375px', async ({ page }) => {
		await page.goto('/ad/e2e-test-ad-dublin-e2emock1');

		const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
		expect(scrollWidth).toBeLessThanOrEqual(375);

		await expect(page.getByRole('heading', { name: 'E2E Test Ad' })).toBeVisible();
		await expect(page.getByText('Adult')).toBeVisible();

		await page.screenshot({ path: 'test-results/mobile-ad-view.png', fullPage: true });
	});

	test('ad view action buttons do not overflow at 375px', async ({ page }) => {
		await page.goto('/ad/e2e-other-ad-dublin-e2emock3');

		const actionRail = page.locator('.action-rail');
		await expect(actionRail).toBeVisible();

		const railBox = await actionRail.boundingBox();
		expect(railBox).toBeTruthy();
		if (railBox) {
			expect(railBox.x + railBox.width).toBeLessThanOrEqual(380);
		}
	});

	test('ad view safety accordion is present and collapsed at 375px', async ({ page }) => {
		await page.goto('/ad/e2e-other-ad-dublin-e2emock3');

		const accordion = page.locator('.safety-accordion');
		await expect(accordion).toBeVisible();

		const content = page.locator('.safety-content');
		await expect(content).toBeHidden();

		const summary = page.locator('.safety-summary');
		await summary.click();
		await expect(content).toBeVisible();

		const contentBox = await content.boundingBox();
		expect(contentBox).toBeTruthy();
		if (contentBox) {
			expect(contentBox.x + contentBox.width).toBeLessThanOrEqual(380);
		}
	});

	test('post form renders at 375px with no overflow', async ({ page }) => {
		await page.goto('/post');

		// Post page should load (mock user is logged in)
		const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
		expect(scrollWidth).toBeLessThanOrEqual(375);

		// Check that form fields are visible and fit
		const categorySelect = page.locator('#category');
		if ((await categorySelect.count()) > 0) {
			await expect(categorySelect).toBeVisible();
			const selectBox = await categorySelect.boundingBox();
			expect(selectBox).toBeTruthy();
			if (selectBox) {
				expect(selectBox.x + selectBox.width).toBeLessThanOrEqual(380);
			}
		}

		await page.screenshot({ path: 'test-results/mobile-post-form.png', fullPage: true });
	});

	test('safety page renders without overflow at 375px', async ({ page }) => {
		await page.goto('/safety');

		const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
		expect(scrollWidth).toBeLessThanOrEqual(375);

		await expect(page.getByRole('heading', { name: 'Stay Safe on Fogr.ai' })).toBeVisible();

		// Check all safety section cards are visible
		const cards = page.locator('.safety .card');
		const cardCount = await cards.count();
		expect(cardCount).toBeGreaterThan(0);

		for (let i = 0; i < cardCount; i++) {
			const cardBox = await cards.nth(i).boundingBox();
			expect(cardBox).toBeTruthy();
			if (cardBox) {
				expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(380);
			}
		}

		// Check font size is readable (>= 14px)
		const firstLi = cards.first().locator('li').first();
		if ((await firstLi.count()) > 0) {
			const fontSize = await firstLi.evaluate((el) => {
				return parseFloat(window.getComputedStyle(el).fontSize);
			});
			expect(fontSize).toBeGreaterThanOrEqual(14);
		}

		await page.screenshot({ path: 'test-results/mobile-safety.png', fullPage: true });
	});

	test('about page has no horizontal overflow at 375px', async ({ page }) => {
		await page.goto('/about');

		const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
		expect(scrollWidth).toBeLessThanOrEqual(375);

		await expect(
			page.getByRole('heading', { name: 'Your local noticeboard, online.' })
		).toBeVisible();

		await page.screenshot({ path: 'test-results/mobile-about.png', fullPage: true });
	});

	test('about page card grid collapses to single column at 375px', async ({ page }) => {
		await page.goto('/about');

		const cards = page.locator('.about .grid .card');
		const cardCount = await cards.count();
		expect(cardCount).toBeGreaterThan(1);

		// Check first two cards are stacked vertically (single column)
		const firstBox = await cards.nth(0).boundingBox();
		const secondBox = await cards.nth(1).boundingBox();
		expect(firstBox).toBeTruthy();
		expect(secondBox).toBeTruthy();
		if (firstBox && secondBox) {
			// In single-column, second card starts below the end of the first
			expect(secondBox.y).toBeGreaterThanOrEqual(firstBox.y + firstBox.height - 1);
		}
	});

	test('footer links are accessible and not overlapping at 375px', async ({ page }) => {
		await page.goto('/');

		const footer = page.locator('.site-footer');
		await footer.scrollIntoViewIfNeeded();
		await expect(footer).toBeVisible();

		const aboutLink = footer.getByRole('link', { name: 'About' });
		await expect(aboutLink).toBeVisible();

		const safetyLink = footer.getByRole('link', { name: 'Safety tips' });
		await expect(safetyLink).toBeVisible();

		// Check footer does not overflow
		const footerBox = await footer.boundingBox();
		expect(footerBox).toBeTruthy();
		if (footerBox) {
			expect(footerBox.x + footerBox.width).toBeLessThanOrEqual(380);
		}

		// Check the trust line is visible
		const trustLine = footer.locator('.trust-line');
		await expect(trustLine).toBeVisible();

		await page.screenshot({ path: 'test-results/mobile-footer.png', fullPage: true });
	});
});
