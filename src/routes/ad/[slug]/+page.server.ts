import { mockClassifieds } from '../../../data/mock-ads';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const adId = params.slug;
	const ad = mockClassifieds.find((ad) => ad.id === parseInt(adId)) ?? null;

	return { ad };
};
