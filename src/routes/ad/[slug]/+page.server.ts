import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import type { ApiAdRow, AdCard } from '../../../types/ad-types';

export const load: PageServerLoad = async ({ params, fetch, }) => {
	const res = await fetch(`/api/ads/${params.slug}`);

	if (res.status === 404) throw error(404, 'Ad not found');
	if (!res.ok) throw error(500, 'Failed to load ad');

	const { ad } = (await res.json()) as { ad: ApiAdRow };

	const mapped: AdCard = {
		id: ad.id,
		title: ad.title,
		price: ad.price,
		img: ad.image_keys?.[0] ?? '',
		description: ad.description,
		category: ad.category,
		currency: ad.currency ?? undefined
	};

	return { ad: mapped };
};
