import { describe, it, expect } from 'vitest';
import { safeRedirectPath } from './redirect';

describe('safeRedirectPath', () => {
	it('returns fallback for empty input', () => {
		expect(safeRedirectPath(null, '/')).toBe('/');
		expect(safeRedirectPath(undefined, '/')).toBe('/');
		expect(safeRedirectPath('', '/')).toBe('/');
	});

	it('blocks external or protocol-relative redirects', () => {
		expect(safeRedirectPath('https://evil.com', '/')).toBe('/');
		expect(safeRedirectPath('http://evil.com', '/')).toBe('/');
		expect(safeRedirectPath('javascript:alert(1)', '/')).toBe('/');
		expect(safeRedirectPath('//evil.com', '/')).toBe('/');
		expect(safeRedirectPath('/\\evil', '/')).toBe('/');
	});

	it('allows same-origin relative paths', () => {
		expect(safeRedirectPath('/post?x=1#y', '/')).toBe('/post?x=1#y');
		expect(safeRedirectPath('/login', '/fallback')).toBe('/login');
	});
});
