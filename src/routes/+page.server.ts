import type { PageServerLoad } from './$types';
import type { AdCard, ApiAdRow } from '../types/ad-types';
import { getPagination } from '$lib/server/pagination';

const DEFAULT_LIMIT = 24;

export const load: PageServerLoad = async ({ fetch, url }) => {
	const { page, limit } = getPagination(url.searchParams, DEFAULT_LIMIT, 100);
	const q = (url.searchParams.get('q') ?? '').trim();
	const category = (url.searchParams.get('category') ?? '').trim();
	const params = new URLSearchParams({
		page: String(page),
		limit: String(limit)
	});
	if (q) params.set('q', q);
	if (category) params.set('category', category);

	const res = await fetch(`/api/ads?${params.toString()}`);
	if (!res.ok) {
		let message = 'Failed to load ads';
		let requestId: string | undefined;
		try {
			const body = (await res.json()) as { message?: string; requestId?: string };
			message = body?.message || message;
			requestId = body?.requestId;
		} catch {
			/* noop */
		}
		return { ads: [], page, q, category, error: { message, requestId } };
	}

	const { ads, nextPage, requestId } = (await res.json()) as {
		ads: ApiAdRow[];
		nextPage?: number | null;
		requestId?: string;
	};

	const mapped: AdCard[] = ads.map((ad) => ({
		id: ad.id,
		title: ad.title,
		price: Number(ad.price ?? -1),
		img: ad.image_keys?.[0] ?? '',
		description: ad.description ?? '',
		category: ad.category ?? '',
		currency: ad.currency ?? undefined
	}));

	return { ads: mapped, page, nextPage: nextPage ?? null, requestId, q, category };
};
