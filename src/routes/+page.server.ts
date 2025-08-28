import type { PageServerLoad } from './$types';
import type { AdCard, ApiAdRow } from '../types/ad-types';

export const load: PageServerLoad = async ({ fetch }) => {
	const res = await fetch('/api/ads');
	if (!res.ok) return { ads: [] };

	const { ads } = (await res.json()) as { ads: ApiAdRow[] };

	const mapped: AdCard[] = ads.map((ad) => ({
		id: ad.id,
		title: ad.title,
		price: Number(ad.price ?? -1),
		img: ad.image_keys?.[0] ?? '',
		description: ad.description ?? '',
		category: ad.category ?? '',
		currency: ad.currency ?? undefined
	}));

	return { ads: mapped };
};
