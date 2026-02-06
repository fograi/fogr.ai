export interface AdCard {
	id: string;
	title: string;
	price: number | null;
	img: string;
	description: string;
	category: string;
	currency?: string;
	locale?: string;
	status?: string;
	expiresAt?: string;
	firmPrice?: boolean;
	minOffer?: number | null;
}

export type ModerationAction = {
	action_type: string;
	reason_category: string;
	reason_details: string;
	legal_basis: string | null;
	automated: boolean;
	created_at: string;
	report_id?: string | null;
};

export type ApiAdRow = {
	id: string;
	user_id: string;
	title: string;
	description: string;
	category: string;
	price: number | null;
	firm_price?: boolean | null;
	min_offer?: number | null;
	auto_decline_message?: string | null;
	direct_contact_enabled?: boolean | null;
	currency: string | null;
	image_keys: string[] | null;
	status: string;
	created_at: string;
	expires_at?: string;
	updated_at: string | null;
};
