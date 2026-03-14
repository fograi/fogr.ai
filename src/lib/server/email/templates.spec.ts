import { describe, it, expect } from 'vitest';
import {
	escapeHtml,
	renderEmail,
	buildAdApprovedEmailHtml,
	buildAdRejectedEmailHtml,
	buildNewMessageEmailHtml,
	buildSearchAlertEmailHtml
} from './templates';

describe('escapeHtml', () => {
	it('escapes ampersands to prevent XSS', () => {
		expect(escapeHtml('foo & bar')).toBe('foo &amp; bar');
	});

	it('escapes less-than and greater-than angle brackets', () => {
		expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
	});

	it('escapes double quotes', () => {
		expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
	});

	it('handles multiple special characters in one string', () => {
		const input = '<b>Bold & "quoted"</b>';
		const result = escapeHtml(input);
		expect(result).toBe('&lt;b&gt;Bold &amp; &quot;quoted&quot;&lt;/b&gt;');
	});

	it('returns plain string unchanged', () => {
		expect(escapeHtml('hello world')).toBe('hello world');
	});
});

describe('renderEmail', () => {
	it('produces a complete HTML document with DOCTYPE', () => {
		const html = renderEmail('Test Subject', '<p>Body content</p>');
		expect(html).toContain('<!DOCTYPE html>');
		expect(html).toContain('<html');
	});

	it('includes the subject in the document title element', () => {
		const html = renderEmail('Listing Approved', '<p>Your ad is live.</p>');
		expect(html).toContain('<title>Listing Approved</title>');
	});

	it('includes the body HTML in the output', () => {
		const html = renderEmail('Subject', '<p>Body content here</p>');
		expect(html).toContain('<p>Body content here</p>');
	});

	it('includes fogr.ai branding logo', () => {
		const html = renderEmail('Subject', '<p>Content</p>');
		expect(html).toContain('fogr-logo-email.png');
	});

	it('includes footer tagline', () => {
		const html = renderEmail('Subject', '<p>Content</p>');
		expect(html).toContain('Buy. Sell. Done.');
	});

	it('includes privacy and terms links in footer', () => {
		const html = renderEmail('Subject', '<p>Content</p>');
		expect(html).toContain('privacy');
		expect(html).toContain('terms');
	});

	it('escapes HTML special characters in subject for title element', () => {
		const html = renderEmail('<Special> & "Subject"', '<p>Content</p>');
		expect(html).not.toContain('<Special>');
		expect(html).toContain('&lt;Special&gt;');
	});

	it('contains no tracking pixel markup', () => {
		const html = renderEmail('Subject', '<p>Content</p>');
		// No img with tracking patterns (width=1 or height=1 hidden pixel)
		expect(html).not.toMatch(/width=["']1["'] height=["']1["']/);
		expect(html).not.toContain('pixel.gif');
		expect(html).not.toContain('track.gif');
	});
});

describe('buildAdApprovedEmailHtml', () => {
	const CTX = {
		adTitle: 'My Vintage Bike',
		adUrl: 'https://fogr.ai/ad/my-vintage-bike',
		unsubscribeUrl: 'https://fogr.ai/unsubscribe?token=abc&type=ad_approved'
	};

	it('includes the ad title in the email body', () => {
		const html = buildAdApprovedEmailHtml(CTX);
		expect(html).toContain('My Vintage Bike');
	});

	it('includes a link to the ad listing', () => {
		const html = buildAdApprovedEmailHtml(CTX);
		expect(html).toContain('https://fogr.ai/ad/my-vintage-bike');
	});

	it('includes an unsubscribe link', () => {
		const html = buildAdApprovedEmailHtml(CTX);
		expect(html).toContain('https://fogr.ai/unsubscribe?token=abc&amp;type=ad_approved');
	});

	it('escapes XSS in ad title', () => {
		const html = buildAdApprovedEmailHtml({ ...CTX, adTitle: '<script>alert(1)</script>' });
		expect(html).not.toContain('<script>');
		expect(html).toContain('&lt;script&gt;');
	});
});

describe('buildAdRejectedEmailHtml', () => {
	const CTX = {
		adTitle: 'Prohibited Item',
		adId: 'ad-456',
		reason: 'Content violates community guidelines.'
	};

	it('includes the ad title in the email body', () => {
		const html = buildAdRejectedEmailHtml(CTX);
		expect(html).toContain('Prohibited Item');
	});

	it('includes the rejection reason', () => {
		const html = buildAdRejectedEmailHtml(CTX);
		expect(html).toContain('Content violates community guidelines.');
	});

	it('does not include an unsubscribe link (DSA moderation email)', () => {
		const html = buildAdRejectedEmailHtml(CTX);
		expect(html).not.toContain('Unsubscribe');
		expect(html).not.toContain('unsubscribe');
	});

	it('includes appeal instructions', () => {
		const html = buildAdRejectedEmailHtml(CTX);
		expect(html).toContain('appeal');
	});

	it('escapes XSS in rejection reason', () => {
		const html = buildAdRejectedEmailHtml({ ...CTX, reason: '<b>bad</b> & "content"' });
		expect(html).not.toContain('<b>bad</b>');
		expect(html).toContain('&lt;b&gt;bad&lt;/b&gt;');
		expect(html).toContain('&amp;');
	});
});

describe('buildNewMessageEmailHtml', () => {
	const CTX = {
		adTitle: 'Red Sofa',
		adUrl: 'https://fogr.ai/ad/red-sofa',
		unsubscribeUrl: 'https://fogr.ai/unsubscribe?token=xyz&type=messages'
	};

	it('includes the ad title in the email body', () => {
		const html = buildNewMessageEmailHtml(CTX);
		expect(html).toContain('Red Sofa');
	});

	it('includes a link to the conversation', () => {
		const html = buildNewMessageEmailHtml(CTX);
		expect(html).toContain('https://fogr.ai/ad/red-sofa');
	});

	it('does not reveal sender identity in the email', () => {
		const html = buildNewMessageEmailHtml(CTX);
		// Should not contain "from" or "sender" suggesting identity disclosure
		expect(html).not.toMatch(/sender.*identity/i);
		expect(html).not.toMatch(/message from/i);
	});

	it('includes an unsubscribe link', () => {
		const html = buildNewMessageEmailHtml(CTX);
		expect(html).toContain('unsubscribe');
	});

	it('escapes XSS in ad title', () => {
		const html = buildNewMessageEmailHtml({ ...CTX, adTitle: '<img src=x onerror=alert(1)>' });
		expect(html).not.toContain('<img src=x');
		expect(html).toContain('&lt;img');
	});
});

describe('buildSearchAlertEmailHtml', () => {
	const CTX = {
		searchName: 'Bikes in Dublin',
		matchCount: 5,
		topListings: [
			{ title: 'Trek Mountain Bike', price: '€350', url: 'https://fogr.ai/ad/trek-bike' },
			{ title: 'Giant Road Bike', price: '€200', url: 'https://fogr.ai/ad/giant-bike' },
			{ title: 'BMX Cruiser', price: '€80', url: 'https://fogr.ai/ad/bmx' }
		],
		viewAllUrl: 'https://fogr.ai/?category=bikes&county=dublin',
		unsubscribeUrl: 'https://fogr.ai/unsubscribe?token=tok&type=search_alerts'
	};

	it('includes match count in the email body', () => {
		const html = buildSearchAlertEmailHtml(CTX);
		expect(html).toContain('5');
	});

	it('includes search name in the email body', () => {
		const html = buildSearchAlertEmailHtml(CTX);
		expect(html).toContain('Bikes in Dublin');
	});

	it('includes all top listing titles with links', () => {
		const html = buildSearchAlertEmailHtml(CTX);
		expect(html).toContain('Trek Mountain Bike');
		expect(html).toContain('Giant Road Bike');
		expect(html).toContain('BMX Cruiser');
		expect(html).toContain('https://fogr.ai/ad/trek-bike');
	});

	it('includes listing prices in the email', () => {
		const html = buildSearchAlertEmailHtml(CTX);
		expect(html).toContain('€350');
		expect(html).toContain('€200');
		expect(html).toContain('€80');
	});

	it('includes a view-all CTA link', () => {
		const html = buildSearchAlertEmailHtml(CTX);
		expect(html).toContain('https://fogr.ai/?category=bikes&amp;county=dublin');
	});

	it('includes an unsubscribe link', () => {
		const html = buildSearchAlertEmailHtml(CTX);
		expect(html).toContain('unsubscribe');
	});

	it('uses singular match wording for a single result', () => {
		const html = buildSearchAlertEmailHtml({
			...CTX,
			matchCount: 1,
			topListings: [CTX.topListings[0]]
		});
		expect(html).toContain('1 new listing');
		// Should not contain "listings" (plural) for count reference
		expect(html).not.toContain('1 new listings');
	});

	it('uses plural match wording for multiple results', () => {
		const html = buildSearchAlertEmailHtml(CTX);
		expect(html).toContain('5 new listings');
	});

	it('escapes XSS in search name', () => {
		const html = buildSearchAlertEmailHtml({ ...CTX, searchName: '<script>alert(1)</script>' });
		expect(html).not.toContain('<script>');
		expect(html).toContain('&lt;script&gt;');
	});

	it('escapes XSS in listing titles', () => {
		const maliciousListings = [
			{ title: '<b>Injected</b>', price: '€100', url: 'https://fogr.ai/ad/x' }
		];
		const html = buildSearchAlertEmailHtml({ ...CTX, topListings: maliciousListings });
		expect(html).not.toContain('<b>Injected</b>');
		expect(html).toContain('&lt;b&gt;Injected&lt;/b&gt;');
	});
});
