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
  
  export type ApiAdRow = {
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