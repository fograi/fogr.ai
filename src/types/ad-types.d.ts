export interface AdCard {
	id: string;
	title: string;
	price: number;
	img: string;
	description: string;
	category: string;
	currency?: string;
	locale?: string;
	status?: string;
}

export type ApiAdRow = {
	id: string;
	user_id: string;
	title: string;
	description: string;
	category: string;
	price: number;
	currency: string | null;
	image_keys: string[] | null;
	status: string;
	created_at: string;
	updated_at: string | null;
};
