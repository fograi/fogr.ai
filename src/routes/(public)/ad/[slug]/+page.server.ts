import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import type { ApiAdRow, AdCard, ModerationAction } from '../../../../types/ad-types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const res = await fetch(`/api/ads/${params.slug}`);

	if (res.status === 404) throw error(404, 'Ad not found');
	if (!res.ok) throw error(500, 'Could not load listing.');

	const { ad, moderation } = (await res.json()) as {
		ad: ApiAdRow;
		moderation?: ModerationAction | null;
	};

	const mapped: AdCard = {
		id: ad.id,
		title: ad.title,
		price: ad.price,
		img: ad.image_keys?.[0] ?? '',
		description: ad.description,
		category: ad.category,
		currency: ad.currency ?? undefined,
		status: ad.status,
		expiresAt: ad.expires_at ?? undefined
	};

	return { ad: mapped, moderation: moderation ?? null };
};
