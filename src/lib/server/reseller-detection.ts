export type ResellerSignal = {
	signal: string;
	weight: number;
	matched: string;
};

type DealerPattern = {
	pattern: RegExp;
	signal: string;
	weight: number;
};

const DEALER_PATTERNS: DealerPattern[] = [
	{ pattern: /\bcall\s+for\s+price\b/i, signal: 'call_for_price', weight: 2 },
	{ pattern: /\bstock\s*#?\s*\d/i, signal: 'stock_number', weight: 2 },
	{ pattern: /\bRRP\b/i, signal: 'rrp_mention', weight: 1 },
	{ pattern: /\btrade[\s-]*in/i, signal: 'trade_in', weight: 1 },
	{ pattern: /\bfinance\s+available\b/i, signal: 'finance_available', weight: 2 },
	{ pattern: /\bshowroom\b/i, signal: 'showroom', weight: 2 },
	{ pattern: /\bwarranty\s+included\b/i, signal: 'warranty_included', weight: 1 },
	{ pattern: /www\.\w+\.\w+/i, signal: 'website_url', weight: 1 },
	{ pattern: /https?:\/\/\S+/i, signal: 'http_url', weight: 1 },
	{
		pattern: /\b(?:0\d{1,2}[\s.-]?\d{6,8}|\+\d{1,3}[\s.-]?\d{6,12})\b/,
		signal: 'phone_number',
		weight: 1
	},
	{ pattern: /\bprice\s+list\b/i, signal: 'price_list', weight: 2 },
	{ pattern: /\binstallment/i, signal: 'installment', weight: 1 },
	{ pattern: /\bdelivery\s+available\b/i, signal: 'delivery_available', weight: 1 }
];

/** Minimum total signal weight to flag an ad as potential reseller. */
export const RESELLER_THRESHOLD = 2;

/**
 * Scan title + description for commercial reseller patterns.
 * Returns an array of matched signals with weights.
 */
export function detectResellerSignals(title: string, description: string): ResellerSignal[] {
	const text = `${title} ${description}`;
	const signals: ResellerSignal[] = [];

	for (const { pattern, signal, weight } of DEALER_PATTERNS) {
		const match = text.match(pattern);
		if (match) {
			signals.push({ signal, weight, matched: match[0] });
		}
	}

	return signals;
}
