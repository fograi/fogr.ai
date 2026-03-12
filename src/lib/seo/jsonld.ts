/**
 * JSON-LD structured data builders for SEO.
 *
 * Product schema for ad pages following Google Product Snippet guidelines.
 */

export interface AdSeoData {
	title: string;
	description: string;
	slug: string;
	price: number | null;
	currency: string;
	imageUrl: string | null;
	category: string;
	countyName: string | null;
	isExpired: boolean;
}

export function productJsonLd(
	ad: AdSeoData,
	origin: string
): Record<string, unknown> {
	const jsonLd: Record<string, unknown> = {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: ad.title,
		description: ad.description,
		url: `${origin}/ad/${ad.slug}`,
		category: ad.category,
		offers: {
			'@type': 'Offer',
			priceCurrency: ad.currency || 'EUR',
			availability: ad.isExpired
				? 'https://schema.org/SoldOut'
				: 'https://schema.org/InStock',
			itemCondition: 'https://schema.org/UsedCondition'
		}
	};

	if (ad.imageUrl) {
		jsonLd.image = ad.imageUrl;
	}

	// Only include price if it's a fixed-price listing (not POA / free)
	if (ad.price !== null && ad.price > 0) {
		(jsonLd.offers as Record<string, unknown>).price = ad.price;
	}

	return jsonLd;
}
