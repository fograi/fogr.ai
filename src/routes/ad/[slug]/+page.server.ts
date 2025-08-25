import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export interface AdCard {
  title: string;
  price: number;
  img: string;
  description: string;
  category: string;
  currency?: string;
  locale?: string;
  email?: string;
}

type ApiAdRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string | null;
  image_urls: string[] | null;
  created_at: string;
  updated_at: string | null;
};

export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
  const res = await fetch(`/api/ads/${params.slug}`);

  if (res.status === 404) throw error(404, 'Ad not found');
  if (!res.ok) throw error(500, 'Failed to load ad');

  const { ad } = (await res.json()) as { ad: ApiAdRow };

  const mapped: AdCard = {
    title: ad.title,
    price: ad.price,
    img: ad.image_urls?.[0] ?? '',
    description: ad.description,
    category: ad.category,
    currency: ad.currency ?? undefined
  };

  setHeaders({ 'Cache-Control': 'public, max-age=60' });
  return { ad: mapped };
};
