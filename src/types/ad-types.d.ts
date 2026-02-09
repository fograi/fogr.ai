export interface AdCard {
	id: string;
	title: string;
	price: number | null;
	img: string;
	description: string;
	category: string;
	categoryProfileData?: Record<string, unknown> | null;
	locationProfileData?: Record<string, unknown> | null;
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
	category_profile_data?: Record<string, unknown> | null;
	location_profile_data?: Record<string, unknown> | null;
	price: number | null;
	firm_price?: boolean | null;
	min_offer?: number | null;
	auto_decline_message?: string | null;
	currency: string | null;
	image_keys: string[] | null;
	status: string;
	created_at: string;
	expires_at?: string;
	updated_at: string | null;
};
