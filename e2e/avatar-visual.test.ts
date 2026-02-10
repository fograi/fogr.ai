import { expect, test } from '@playwright/test';
import { tagToAvatar } from '../src/lib/utils/tag-to-avatar';

function svgToDataUri(svg: string): string {
	return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

test('avatar rendering is visually consistent for the same normalized tag', async ({
	page
}, testInfo) => {
	const seed = '6JN3V2CD6XQQ';
	const first = tagToAvatar(seed, { format: 'svg', size: 96, label: 'Avatar consistency check' });
	const second = tagToAvatar(`  ${seed.toLowerCase()}  `, {
		format: 'svg',
		size: 96,
		label: 'Avatar consistency check'
	});
	const third = tagToAvatar('QACN46ZB97S1', {
		format: 'svg',
		size: 96,
		label: 'Avatar consistency check'
	});

	expect(first.format).toBe('svg');
	expect(second.format).toBe('svg');
	expect(third.format).toBe('svg');
	expect(first.svg).toBe(second.svg);

	await page.setViewportSize({ width: 520, height: 220 });
	await page.setContent(`
		<style>
			body {
				margin: 0;
				padding: 20px;
				font-family: system-ui, sans-serif;
				background: #f5f7fb;
			}
			.grid {
				display: flex;
				gap: 24px;
				align-items: flex-start;
			}
			.card {
				display: grid;
				gap: 8px;
				justify-items: center;
				color: #1f2937;
				font-size: 12px;
				font-weight: 600;
			}
			img {
				display: block;
				width: 96px;
				height: 96px;
				border-radius: 16px;
				border: 1px solid #d4dae6;
				background: #fff;
			}
		</style>
		<div class="grid" data-testid="avatar-grid">
			<div class="card">
				<img data-testid="avatar-a" src="${svgToDataUri(first.svg)}" alt="Avatar A" />
				<div>Tag A</div>
			</div>
			<div class="card">
				<img data-testid="avatar-b" src="${svgToDataUri(second.svg)}" alt="Avatar B" />
				<div>Tag A (normalized)</div>
			</div>
			<div class="card">
				<img data-testid="avatar-c" src="${svgToDataUri(third.svg)}" alt="Avatar C" />
				<div>Tag C</div>
			</div>
		</div>
	`);

	const avatarA = page.getByTestId('avatar-a');
	const avatarB = page.getByTestId('avatar-b');
	const avatarC = page.getByTestId('avatar-c');

	await expect(avatarA).toBeVisible();
	await expect(avatarB).toBeVisible();
	await expect(avatarC).toBeVisible();

	const comparison = await page.evaluate(async () => {
		const getImage = (id: string) => {
			const image = document.querySelector(`[data-testid="${id}"]`);
			if (!(image instanceof HTMLImageElement)) throw new Error(`Missing image ${id}`);
			return image;
		};

		const images = [getImage('avatar-a'), getImage('avatar-b'), getImage('avatar-c')];
		await Promise.all(
			images.map(async (image) => {
				if ('decode' in image) {
					await image.decode().catch(() => undefined);
				}
			})
		);

		const pixelHash = (image: HTMLImageElement) => {
			const canvas = document.createElement('canvas');
			canvas.width = image.naturalWidth;
			canvas.height = image.naturalHeight;
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error('Could not create 2d context');
			ctx.drawImage(image, 0, 0);
			return canvas.toDataURL('image/png');
		};

		const hashA = pixelHash(images[0]);
		const hashB = pixelHash(images[1]);
		const hashC = pixelHash(images[2]);
		return {
			aEqualsB: hashA === hashB,
			aEqualsC: hashA === hashC
		};
	});

	expect(comparison.aEqualsB).toBe(true);
	expect(comparison.aEqualsC).toBe(false);

	const gridScreenshot = await page.getByTestId('avatar-grid').screenshot();
	await testInfo.attach('avatar-visual-grid', {
		body: gridScreenshot,
		contentType: 'image/png'
	});
});

test('same tag keeps visual identity across avatar sizes', async ({ page }) => {
	const tag = '6JN3V2CD6XQQ';
	const small = tagToAvatar(tag, { format: 'svg', size: 40, label: 'Small avatar' });
	const medium = tagToAvatar(tag, { format: 'svg', size: 72, label: 'Medium avatar' });

	expect(small.format).toBe('svg');
	expect(medium.format).toBe('svg');
	expect(small.emoji).toBe(medium.emoji);

	await page.setViewportSize({ width: 260, height: 150 });
	await page.setContent(`
		<style>
			body {
				margin: 0;
				padding: 20px;
				background: #fff;
				display: flex;
				align-items: center;
				gap: 20px;
			}
			img {
				display: block;
				border-radius: 12px;
				border: 1px solid #dde3ee;
			}
		</style>
		<img data-testid="small" src="${svgToDataUri(small.svg)}" width="40" height="40" alt="Small avatar" />
		<img data-testid="medium" src="${svgToDataUri(medium.svg)}" width="72" height="72" alt="Medium avatar" />
	`);

	const smallCenter = page.getByTestId('small');
	const mediumCenter = page.getByTestId('medium');

	await expect(smallCenter).toBeVisible();
	await expect(mediumCenter).toBeVisible();

	const [smallPng, mediumPng] = await Promise.all([
		smallCenter.screenshot(),
		mediumCenter.screenshot()
	]);

	expect(smallPng.equals(mediumPng)).toBe(false);
});
