export const hasPaidPrice = (price: number | null | undefined) =>
	typeof price === 'number' && price > 0;

export const formatMoney = (
	value: number,
	currency = 'EUR',
	locale = 'en-IE'
) =>
	new Intl.NumberFormat(locale, {
		style: 'currency',
		currency,
		maximumFractionDigits: 0
	}).format(value);

type PriceLabelOptions = {
	price: number | null;
	category?: string | null;
	currency?: string | null;
	locale?: string;
	showRewardWhenMissing?: boolean;
};

export const formatPriceLabel = ({
	price,
	category,
	currency,
	locale,
	showRewardWhenMissing = false
}: PriceLabelOptions) => {
	const normalizedCategory = category?.trim?.() ?? category;
	const safeCurrency = currency ?? 'EUR';
	const safeLocale = locale ?? 'en-IE';
	if (normalizedCategory === 'Lost and Found') {
		if (typeof price === 'number' && price > 0) {
			return `Reward ${formatMoney(price, safeCurrency, safeLocale)}`;
		}
		return showRewardWhenMissing ? 'No reward' : '';
	}
	if (price === null) return 'POA';
	if (price === 0 || normalizedCategory === 'Free / Giveaway') return 'Free';
	return formatMoney(price, safeCurrency, safeLocale);
};
