export type TagAvatarFormat = 'svg' | 'emoji';

export type TagToAvatarOptions = {
	format?: TagAvatarFormat | 'auto';
	size?: number;
	label?: string;
};

export type TagAvatarResult = {
	format: TagAvatarFormat;
	value: string;
	svg: string;
	emoji: string;
};

const DEFAULT_AVATAR_SIZE = 64;
const MIN_AVATAR_SIZE = 24;
const MAX_AVATAR_SIZE = 512;
const GRID_SIZE = 5;
const LEFT_GRID_COLUMNS = Math.ceil(GRID_SIZE / 2);
const EMOJI_PRIMARY = [
	'🦊',
	'🦉',
	'🐺',
	'🐻',
	'🦌',
	'🐢',
	'🦭',
	'🦦',
	'🐝',
	'🦋',
	'🐙',
	'🐬',
	'🐸',
	'🦁',
	'🐧',
	'🦄'
] as const;
const EMOJI_SECONDARY = ['✨', '🌙', '🔥', '🌊', '🌿', '⭐', '⚡', '🎯'] as const;

/**
 * Generates a deterministic avatar payload from a stable tag.
 * Returns SVG identicon data by default and falls back to emoji when SVG options are invalid.
 *
 * @param tag Stable avatar seed (for example, the 12-char mythologise tag).
 * @param options Optional format and rendering settings.
 * @param options.format Output mode (`svg`, `emoji`, or `auto`).
 * @param options.size SVG output size in CSS pixels.
 * @param options.label Accessible label for generated SVG.
 * @returns Avatar payload containing SVG and emoji variants with selected `value`.
 */
export function tagToAvatar(tag: string, options: TagToAvatarOptions = {}): TagAvatarResult {
	const normalizedTag = normalizeTag(tag);
	const bytes = deterministicBytes(normalizedTag);
	const emoji = emojiFromBytes(bytes);
	const preferredFormat = options.format ?? 'auto';
	const safeSize = normalizeAvatarSize(options.size);

	if (preferredFormat === 'emoji' || safeSize === null) {
		return {
			format: 'emoji',
			value: emoji,
			svg: '',
			emoji
		};
	}

	const label = options.label?.trim() || `Avatar for ${normalizedTag}`;
	const svg = buildIdenticonSvg(bytes, safeSize, label);

	return {
		format: 'svg',
		value: svg,
		svg,
		emoji
	};
}

function normalizeTag(tag: string): string {
	const normalized = tag.trim();
	if (!normalized) {
		throw new TypeError('tag must be a non-empty string.');
	}
	return normalized.toLocaleUpperCase('en-US');
}

function normalizeAvatarSize(size: number | undefined): number | null {
	if (size === undefined) return DEFAULT_AVATAR_SIZE;
	if (!Number.isFinite(size)) return null;

	const rounded = Math.round(size);
	if (rounded < MIN_AVATAR_SIZE || rounded > MAX_AVATAR_SIZE) return null;
	return rounded;
}

function emojiFromBytes(bytes: Uint8Array): string {
	const first = EMOJI_PRIMARY[(bytes[0] ?? 0) % EMOJI_PRIMARY.length];
	const second = EMOJI_SECONDARY[(bytes[1] ?? 0) % EMOJI_SECONDARY.length];
	return `${first}${second}`;
}

function buildIdenticonSvg(bytes: Uint8Array, size: number, label: string): string {
	const padding = Math.max(2, Math.floor(size * 0.1));
	const drawable = Math.max(1, size - padding * 2);
	const cell = Math.max(1, Math.floor(drawable / GRID_SIZE));
	const iconSize = cell * GRID_SIZE;
	const offset = Math.floor((size - iconSize) / 2);
	const radius = Math.max(1, Math.floor(cell * 0.2));

	const primaryHue = (((bytes[2] ?? 0) << 8) | (bytes[3] ?? 0)) % 360;
	const accentHue = (primaryHue + 70 + ((bytes[4] ?? 0) % 180)) % 360;
	const primary = hslToHex(primaryHue, 62 + ((bytes[5] ?? 0) % 24), 38 + ((bytes[6] ?? 0) % 18));
	const accent = hslToHex(accentHue, 68 + ((bytes[7] ?? 0) % 20), 42 + ((bytes[8] ?? 0) % 18));
	const bgA = hslToHex(
		(primaryHue + 180) % 360,
		30 + ((bytes[9] ?? 0) % 20),
		92 - ((bytes[10] ?? 0) % 8)
	);
	const bgB = hslToHex(
		(accentHue + 180) % 360,
		35 + ((bytes[11] ?? 0) % 18),
		86 - ((bytes[12] ?? 0) % 12)
	);
	const seedHex = bytesToHex(bytes);
	const gradientId = `g-${seedHex.slice(0, 12)}`;

	let rects = '';
	let fillBitIndex = 0;
	for (let row = 0; row < GRID_SIZE; row++) {
		for (let col = 0; col < LEFT_GRID_COLUMNS; col++) {
			const active = getBit(bytes, 16 + fillBitIndex) === 1;
			const useAccent = getBit(bytes, 80 + fillBitIndex) === 1;
			fillBitIndex += 1;
			if (!active) continue;

			const mirrorCol = GRID_SIZE - 1 - col;
			rects += drawCell({
				x: offset + col * cell,
				y: offset + row * cell,
				size: cell,
				radius,
				fill: useAccent ? accent : primary
			});
			if (mirrorCol !== col) {
				rects += drawCell({
					x: offset + mirrorCol * cell,
					y: offset + row * cell,
					size: cell,
					radius,
					fill: useAccent ? accent : primary
				});
			}
		}
	}

	const centerCircle =
		getBit(bytes, 145) === 1
			? `<circle cx="${offset + iconSize / 2}" cy="${offset + iconSize / 2}" r="${Math.max(2, Math.floor(cell * 0.35))}" fill="${accent}" />`
			: '';

	const safeLabel = escapeXml(label);

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${safeLabel}"><defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bgA}" /><stop offset="100%" stop-color="${bgB}" /></linearGradient></defs><rect x="0" y="0" width="${size}" height="${size}" rx="${Math.max(4, Math.floor(size * 0.12))}" fill="url(#${gradientId})" />${rects}${centerCircle}<rect x="${offset}" y="${offset}" width="${iconSize}" height="${iconSize}" rx="${Math.max(2, Math.floor(radius * 1.5))}" fill="none" stroke="${primary}" stroke-opacity="0.28" /></svg>`;
}

function drawCell({
	x,
	y,
	size,
	radius,
	fill
}: {
	x: number;
	y: number;
	size: number;
	radius: number;
	fill: string;
}): string {
	return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" fill="${fill}" />`;
}

function bytesToHex(bytes: Uint8Array): string {
	let out = '';
	for (const value of bytes) {
		out += value.toString(16).padStart(2, '0');
	}
	return out;
}

function getBit(bytes: Uint8Array, bitIndex: number): number {
	const totalBits = bytes.length * 8;
	if (totalBits === 0) return 0;

	const safeBit = ((bitIndex % totalBits) + totalBits) % totalBits;
	const byteIndex = Math.floor(safeBit / 8);
	const bitOffset = safeBit % 8;
	const byte = bytes[byteIndex] ?? 0;
	return (byte >> bitOffset) & 1;
}

function escapeXml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

function hslToHex(h: number, s: number, l: number): string {
	const hue = ((h % 360) + 360) % 360;
	const sat = clamp01(s / 100);
	const light = clamp01(l / 100);

	const chroma = (1 - Math.abs(2 * light - 1)) * sat;
	const hueSegment = hue / 60;
	const x = chroma * (1 - Math.abs((hueSegment % 2) - 1));

	let r = 0;
	let g = 0;
	let b = 0;
	if (hueSegment >= 0 && hueSegment < 1) [r, g, b] = [chroma, x, 0];
	else if (hueSegment < 2) [r, g, b] = [x, chroma, 0];
	else if (hueSegment < 3) [r, g, b] = [0, chroma, x];
	else if (hueSegment < 4) [r, g, b] = [0, x, chroma];
	else if (hueSegment < 5) [r, g, b] = [x, 0, chroma];
	else [r, g, b] = [chroma, 0, x];

	const m = light - chroma / 2;
	const toHex = (value: number) =>
		Math.round((value + m) * 255)
			.toString(16)
			.padStart(2, '0');
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

function deterministicBytes(seed: string): Uint8Array {
	const [a, b, c, d] = cyrb128(seed);
	const next = sfc32(a, b, c, d);
	const out = new Uint8Array(32);
	for (let i = 0; i < out.length; i++) {
		out[i] = Math.floor(next() * 256);
	}
	return out;
}

function cyrb128(value: string): [number, number, number, number] {
	let h1 = 1779033703;
	let h2 = 3144134277;
	let h3 = 1013904242;
	let h4 = 2773480762;

	for (let i = 0; i < value.length; i++) {
		const k = value.charCodeAt(i);
		h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
		h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
		h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
		h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
	}

	h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
	h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
	h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
	h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);

	return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
}

function sfc32(a: number, b: number, c: number, d: number): () => number {
	return () => {
		a >>>= 0;
		b >>>= 0;
		c >>>= 0;
		d >>>= 0;
		const t = (a + b + d) >>> 0;
		d = (d + 1) >>> 0;
		a = b ^ (b >>> 9);
		b = (c + (c << 3)) >>> 0;
		c = ((c << 21) | (c >>> 11)) >>> 0;
		c = (c + t) >>> 0;
		return t / 4294967296;
	};
}
