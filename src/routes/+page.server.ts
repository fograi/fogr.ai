import type { PageServerLoad } from './$types';
import type { AdCard, ApiAdRow } from '../types/ad-types';

const DEFAULT_LIMIT = 24;

export const load: PageServerLoad = async ({ fetch, url }) => {
	const pageRaw = Number(url.searchParams.get('page') ?? '1');
	const page = Number.isFinite(pageRaw) ? Math.max(Math.floor(pageRaw), 1) : 1;
	const res = await fetch(`/api/ads?page=${page}&limit=${DEFAULT_LIMIT}`);
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

	return { ads: mapped, page };
};
