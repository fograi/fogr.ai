import { describe, expect, it } from 'vitest';
import { detectScamPatterns } from './scam-patterns';

describe('detectScamPatterns', () => {
	it('flags off-platform requests', () => {
		const result = detectScamPatterns('Message me on WhatsApp');
		expect(result.warning).toBe(true);
	});

	it('does not flag normal messages', () => {
		const result = detectScamPatterns('Is this still available?');
		expect(result.warning).toBe(false);
	});
});
