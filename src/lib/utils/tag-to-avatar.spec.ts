import { describe, expect, it } from 'vitest';
import { tagToAvatar, type TagToAvatarOptions } from './tag-to-avatar';

function makeTag(index: number): string {
	return index.toString(32).padStart(12, '0').slice(-12).toUpperCase();
}

describe('tagToAvatar', () => {
	it('defaults to SVG output with normalized tag label and default size', () => {
		const avatar = tagToAvatar('  abC123  ');

		expect(avatar.format).toBe('svg');
		expect(avatar.value).toBe(avatar.svg);
		expect(avatar.svg).toContain('width="64"');
		expect(avatar.svg).toContain('height="64"');
		expect(avatar.svg).toContain('aria-label="Avatar for ABC123"');
		expect(avatar.emoji.length).toBeGreaterThan(0);
	});

	it('returns deterministic SVG output for the same tag and options', () => {
		const tag = '6JN3V2CD6XQQ';
		const first = tagToAvatar(tag, { format: 'svg', size: 72, label: 'Chat Avatar' });
		const second = tagToAvatar(tag, { format: 'svg', size: 72, label: 'Chat Avatar' });

		expect(first.format).toBe('svg');
		expect(second.format).toBe('svg');
		expect(first.value).toBe(second.value);
		expect(first.svg).toContain('<svg');
		expect(first.svg).toContain('aria-label="Chat Avatar"');
		expect(first.svg).toContain('class="identicon-grid"');
		expect(first.svg).toContain('class="badge-ring"');
		expect(first.svg).toContain('class="badge-core"');
		expect(first.svg).toContain('class="center-emoji"');
		expect(first.svg).toContain('<feDropShadow');
		expect(first.emoji.length).toBeGreaterThan(0);
	});

	it('returns the same avatar for case and whitespace variants of the same tag', () => {
		const first = tagToAvatar('  6jn3v2cd6xqq  ', { format: 'svg', size: 72 });
		const second = tagToAvatar('6JN3V2CD6XQQ', { format: 'svg', size: 72 });

		expect(first.svg).toBe(second.svg);
		expect(first.emoji).toBe(second.emoji);
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

	it('uses emoji output when emoji format is requested, regardless of size', () => {
		const avatar = tagToAvatar('6JN3V2CD6XQQ', { format: 'emoji', size: 128 });

		expect(avatar.format).toBe('emoji');
		expect(avatar.value).toBe(avatar.emoji);
		expect(avatar.svg).toBe('');
	});

	it('falls back to emoji when SVG size is invalid', () => {
		const tag = '6JN3V2CD6XQQ';
		const avatar = tagToAvatar(tag, { format: 'svg', size: Number.NaN });

		expect(avatar.format).toBe('emoji');
		expect(avatar.value).toBe(avatar.emoji);
		expect(avatar.svg).toBe('');
	});

	it('accepts min and max SVG size boundaries', () => {
		const minAvatar = tagToAvatar('6JN3V2CD6XQQ', { format: 'svg', size: 24 });
		const maxAvatar = tagToAvatar('6JN3V2CD6XQQ', { format: 'svg', size: 512 });

		expect(minAvatar.format).toBe('svg');
		expect(maxAvatar.format).toBe('svg');
		expect(minAvatar.svg).toContain('width="24"');
		expect(maxAvatar.svg).toContain('width="512"');
	});

	it('rounds finite sizes before validating range', () => {
		const roundedUpIntoRange = tagToAvatar('6JN3V2CD6XQQ', { format: 'svg', size: 23.6 });
		const roundedDownOutOfRange = tagToAvatar('6JN3V2CD6XQQ', { format: 'svg', size: 23.4 });
		const roundedDownIntoRange = tagToAvatar('6JN3V2CD6XQQ', { format: 'svg', size: 512.4 });
		const roundedUpOutOfRange = tagToAvatar('6JN3V2CD6XQQ', { format: 'svg', size: 512.5 });

		expect(roundedUpIntoRange.format).toBe('svg');
		expect(roundedUpIntoRange.svg).toContain('width="24"');
		expect(roundedDownOutOfRange.format).toBe('emoji');
		expect(roundedDownIntoRange.format).toBe('svg');
		expect(roundedDownIntoRange.svg).toContain('width="512"');
		expect(roundedUpOutOfRange.format).toBe('emoji');
	});

	it('escapes custom labels and falls back when label is blank', () => {
		const escaped = tagToAvatar('6JN3V2CD6XQQ', {
			format: 'svg',
			label: `A&B <x> "q" 'w'`
		});
		const blank = tagToAvatar('6JN3V2CD6XQQ', { format: 'svg', label: '   ' });

		expect(escaped.svg).toContain('aria-label="A&amp;B &lt;x&gt; &quot;q&quot; &apos;w&apos;"');
		expect(blank.svg).toContain('aria-label="Avatar for 6JN3V2CD6XQQ"');
	});

	it('treats null and non-object options as defaults', () => {
		const fromNull = tagToAvatar('6JN3V2CD6XQQ', null);
		const fromNumber = tagToAvatar('6JN3V2CD6XQQ', 123 as unknown as TagToAvatarOptions);
		const baseline = tagToAvatar('6JN3V2CD6XQQ');

		expect(fromNull).toEqual(baseline);
		expect(fromNumber).toEqual(baseline);
	});

	it('handles invalid option field types without throwing', () => {
		const avatar = tagToAvatar(
			'6JN3V2CD6XQQ',
			{
				format: 'invalid-format',
				size: 'not-a-number',
				label: 123
			} as unknown as TagToAvatarOptions
		);

		expect(avatar.format).toBe('emoji');
		expect(avatar.value).toBe(avatar.emoji);
		expect(avatar.svg).toBe('');
	});

	it('throws for empty tags', () => {
		expect(() => tagToAvatar('   ')).toThrow(TypeError);
	});

	it('throws for non-string tags', () => {
		expect(() => tagToAvatar(42 as unknown as string)).toThrow(TypeError);
	});

	it('treats explicit auto mode the same as default mode', () => {
		const fromDefault = tagToAvatar('6JN3V2CD6XQQ', { size: 72 });
		const fromAuto = tagToAvatar('6JN3V2CD6XQQ', { format: 'auto', size: 72 });

		expect(fromDefault).toEqual(fromAuto);
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
