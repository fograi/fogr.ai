/**
 * Generate OG fallback placeholder images (1200x630px) for each category.
 * Uses sharp to convert SVG to PNG. Run once, delete or keep for regeneration.
 *
 * Usage: npx tsx scripts/generate-og-placeholders.ts
 */
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const OUTPUT_DIR = join(import.meta.dirname!, '..', 'static', 'og-fallback');
const WIDTH = 1200;
const HEIGHT = 630;

const categories = [
	{ slug: 'home-garden', label: 'Home & Garden', color: '#5A9C3E' },
	{ slug: 'electronics', label: 'Electronics', color: '#117AB5' },
	{ slug: 'baby-kids', label: 'Baby & Kids', color: '#5DA9E9' },
	{ slug: 'bikes', label: 'Bikes', color: '#2A9D4B' },
	{ slug: 'clothing-accessories', label: 'Clothing & Accessories', color: '#D64B8A' },
	{ slug: 'services-gigs', label: 'Services & Gigs', color: '#7A5AF8' },
	{ slug: 'lessons-tutoring', label: 'Lessons & Tutoring', color: '#CD5C5C' },
	{ slug: 'lost-found', label: 'Lost and Found', color: '#EE6600' },
	{ slug: 'free-giveaway', label: 'Free / Giveaway', color: '#1EAD7B' }
] as const;

function escapeXml(str: string): string {
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildSvg(label: string, color: string): string {
	const escapedLabel = escapeXml(label);
	return `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a1a2e;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />
  <text x="${WIDTH / 2}" y="${HEIGHT / 2 - 30}" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="64" font-weight="800" fill="#ffffff"
    letter-spacing="0.02em">${escapedLabel}</text>
  <text x="${WIDTH / 2}" y="${HEIGHT / 2 + 50}" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="36" font-weight="600" fill="rgba(255,255,255,0.75)"
    letter-spacing="0.04em">fógr.aí</text>
</svg>`;
}

async function main() {
	await mkdir(OUTPUT_DIR, { recursive: true });

	for (const cat of categories) {
		const svg = buildSvg(cat.label, cat.color);
		const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
		const outPath = join(OUTPUT_DIR, `${cat.slug}.png`);
		await writeFile(outPath, pngBuffer);
		console.log(`Created: ${outPath} (${pngBuffer.length} bytes)`);
	}

	console.log(`\nDone: ${categories.length} images generated.`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
