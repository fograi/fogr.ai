import { describe, expect, it } from 'vitest';
import { tagToAvatar } from './tag-to-avatar';

function makeTag(index: number): string {
	return index.toString(32).padStart(12, '0').slice(-12).toUpperCase();
}

describe('tagToAvatar', () => {
	it('returns deterministic SVG output for the same tag and options', () => {
		const tag = '6JN3V2CD6XQQ';
		const first = tagToAvatar(tag, { format: 'svg', size: 72, label: 'Chat Avatar' });
		const second = tagToAvatar(tag, { format: 'svg', size: 72, label: 'Chat Avatar' });

		expect(first.format).toBe('svg');
		expect(second.format).toBe('svg');
		expect(first.value).toBe(second.value);
		expect(first.svg).toContain('<svg');
		expect(first.svg).toContain('aria-label="Chat Avatar"');
		expect(first.emoji.length).toBeGreaterThan(0);
	});

	it('returns deterministic emoji output for the same tag', () => {
		const tag = '6JN3V2CD6XQQ';
		const first = tagToAvatar(tag, { format: 'emoji' });
		const second = tagToAvatar(tag, { format: 'emoji' });

		expect(first.format).toBe('emoji');
		expect(second.format).toBe('emoji');
		expect(first.value).toBe(second.value);
		expect(first.emoji).toBe(second.emoji);
		expect(first.svg).toBe('');
	});

	it('falls back to emoji when SVG size is invalid', () => {
		const tag = '6JN3V2CD6XQQ';
		const avatar = tagToAvatar(tag, { format: 'svg', size: Number.NaN });

		expect(avatar.format).toBe('emoji');
		expect(avatar.value).toBe(avatar.emoji);
		expect(avatar.svg).toBe('');
	});

	it('throws for empty tags', () => {
		expect(() => tagToAvatar('   ')).toThrow(TypeError);
	});

	it('shows lower collision rate for SVG than emoji in a fixed sample', () => {
		const tags = Array.from({ length: 256 }, (_, index) => makeTag(index));

		const svgValues = tags.map((tag) => tagToAvatar(tag, { format: 'svg', size: 64 }).value);
		const emojiValues = tags.map((tag) => tagToAvatar(tag, { format: 'emoji' }).value);
		const svgUnique = new Set(svgValues).size;
		const emojiUnique = new Set(emojiValues).size;

		expect(svgUnique).toBeGreaterThan(240);
		expect(emojiUnique).toBeLessThan(tags.length);
		expect(svgUnique).toBeGreaterThan(emojiUnique);
	});
});
