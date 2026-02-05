type ScamPattern = {
	id: string;
	regex: RegExp;
	reason: string;
};

const PATTERNS: ScamPattern[] = [
	{
		id: 'off_platform',
		regex: /(whats\s?app|wa\.me|viber|telegram|signal|wechat)/i,
		reason: 'Requests to move chat off-platform can be a scam tactic.'
	},
	{
		id: 'courier',
		regex: /(courier|shipping agent|delivery agent|dhl|fedex|ups)/i,
		reason: 'Third-party courier stories are a common scam pattern.'
	},
	{
		id: 'deposit',
		regex: /(deposit|advance payment|pay in advance|holding fee)/i,
		reason: 'Be cautious of deposit requests before seeing the item.'
	},
	{
		id: 'paypal_ff',
		regex: /(friends\s*and\s*family|f&f|gift payment)/i,
		reason: 'Avoid payment methods without buyer protection.'
	}
];

export function detectScamPatterns(text: string): { warning: boolean; reason?: string } {
	const normalized = text.trim();
	if (!normalized) return { warning: false };
	const hit = PATTERNS.find((p) => p.regex.test(normalized));
	if (!hit) return { warning: false };
	return { warning: true, reason: hit.reason };
}
