export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	// Allows to automatically instantiate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: '13.0.4';
	};
	public: {
		Tables: {
			ad_reports: {
				Row: {
					ad_id: string;
					created_at: string;
					good_faith: boolean;
					id: string;
					location_url: string;
					reason_category: string;
					reason_details: string;
					reporter_email: string;
					reporter_ip: string | null;
					reporter_name: string;
					reporter_user_agent: string | null;
					reporter_user_id: string | null;
					status: string;
				};
				Insert: {
					ad_id: string;
					created_at?: string;
					good_faith?: boolean;
					id?: string;
					location_url: string;
					reason_category: string;
					reason_details: string;
					reporter_email: string;
					reporter_ip?: string | null;
					reporter_name: string;
					reporter_user_agent?: string | null;
					reporter_user_id?: string | null;
					status?: string;
				};
				Update: {
					ad_id?: string;
					created_at?: string;
					good_faith?: boolean;
					id?: string;
					location_url?: string;
					reason_category?: string;
					reason_details?: string;
					reporter_email?: string;
					reporter_ip?: string | null;
					reporter_name?: string;
					reporter_user_agent?: string | null;
					reporter_user_id?: string | null;
					status?: string;
				};
				Relationships: [];
			};
			ad_moderation_actions: {
				Row: {
					action_type: string;
					ad_id: string;
					actor_email: string | null;
					actor_user_id: string | null;
					automated: boolean;
					created_at: string;
					id: string;
					legal_basis: string | null;
					reason_category: string;
					reason_details: string;
					report_id: string | null;
				};
				Insert: {
					action_type: string;
					ad_id: string;
					actor_email?: string | null;
					actor_user_id?: string | null;
					automated?: boolean;
					created_at?: string;
					id?: string;
					legal_basis?: string | null;
					reason_category: string;
					reason_details: string;
					report_id?: string | null;
				};
				Update: {
					action_type?: string;
					ad_id?: string;
					actor_email?: string | null;
					actor_user_id?: string | null;
					automated?: boolean;
					created_at?: string;
					id?: string;
					legal_basis?: string | null;
					reason_category?: string;
					reason_details?: string;
					report_id?: string | null;
				};
				Relationships: [];
			};
			ad_moderation_appeals: {
				Row: {
					action_id: string | null;
					ad_id: string;
					appellant_user_id: string;
					created_at: string;
					id: string;
					reason_details: string;
					status: string;
				};
				Insert: {
					action_id?: string | null;
					ad_id: string;
					appellant_user_id: string;
					created_at?: string;
					id?: string;
					reason_details: string;
					status?: string;
				};
				Update: {
					action_id?: string | null;
					ad_id?: string;
					appellant_user_id?: string;
					created_at?: string;
					id?: string;
					reason_details?: string;
					status?: string;
				};
				Relationships: [];
			};
			ads: {
				Row: {
					category: string;
					cover_url: string | null;
					created_at: string;
					currency: string;
					description: string;
					email: string | null;
					expires_at: string;
					firm_price: boolean;
					direct_contact_enabled: boolean;
					id: string;
					image_keys: string[];
					images_count: number | null;
					min_offer: number | null;
					auto_decline_message: string | null;
					price: number | null;
					status: string;
					title: string;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					category: string;
					cover_url?: string | null;
					created_at?: string;
					currency?: string;
					description: string;
					email?: string | null;
					expires_at?: string;
					firm_price?: boolean;
					direct_contact_enabled?: boolean;
					id?: string;
					image_keys?: string[];
					images_count?: number | null;
					min_offer?: number | null;
					auto_decline_message?: string | null;
					price?: number | null;
					status?: string;
					title: string;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					category?: string;
					cover_url?: string | null;
					created_at?: string;
					currency?: string;
					description?: string;
					email?: string | null;
					expires_at?: string;
					firm_price?: boolean;
					direct_contact_enabled?: boolean;
					id?: string;
					image_keys?: string[];
					images_count?: number | null;
					min_offer?: number | null;
					auto_decline_message?: string | null;
					price?: number | null;
					status?: string;
					title?: string;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [];
			};
			conversations: {
				Row: {
					id: string;
					ad_id: string;
					buyer_id: string;
					seller_id: string;
					buyer_last_read_at: string | null;
					seller_last_read_at: string | null;
					created_at: string;
					updated_at: string;
					last_message_at: string;
				};
				Insert: {
					id?: string;
					ad_id: string;
					buyer_id: string;
					seller_id: string;
					buyer_last_read_at?: string | null;
					seller_last_read_at?: string | null;
					created_at?: string;
					updated_at?: string;
					last_message_at?: string;
				};
				Update: {
					id?: string;
					ad_id?: string;
					buyer_id?: string;
					seller_id?: string;
					buyer_last_read_at?: string | null;
					seller_last_read_at?: string | null;
					created_at?: string;
					updated_at?: string;
					last_message_at?: string;
				};
				Relationships: [];
			};
			messages: {
				Row: {
					id: string;
					conversation_id: string;
					sender_id: string;
					kind: string;
					body: string;
					offer_amount: number | null;
					delivery_method: string | null;
					timing: string | null;
					auto_declined: boolean;
					scam_warning: boolean;
					scam_reason: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					conversation_id: string;
					sender_id: string;
					kind: string;
					body: string;
					offer_amount?: number | null;
					delivery_method?: string | null;
					timing?: string | null;
					auto_declined?: boolean;
					scam_warning?: boolean;
					scam_reason?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					conversation_id?: string;
					sender_id?: string;
					kind?: string;
					body?: string;
					offer_amount?: number | null;
					delivery_method?: string | null;
					timing?: string | null;
					auto_declined?: boolean;
					scam_warning?: boolean;
					scam_reason?: string | null;
					created_at?: string;
				};
				Relationships: [];
			};
			event_metrics: {
				Row: {
					id: string;
					event_name: string;
					user_id: string | null;
					ad_id: string | null;
					conversation_id: string | null;
					properties: Json | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					event_name: string;
					user_id?: string | null;
					ad_id?: string | null;
					conversation_id?: string | null;
					properties?: Json | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					event_name?: string;
					user_id?: string | null;
					ad_id?: string | null;
					conversation_id?: string | null;
					properties?: Json | null;
					created_at?: string;
				};
				Relationships: [];
			};
			user_age_confirmations: {
				Row: {
					age_confirmed_at: string;
					age_confirmed_ip: string | null;
					age_confirmed_user_agent: string | null;
					terms_version: string | null;
					user_id: string;
				};
				Insert: {
					age_confirmed_at?: string;
					age_confirmed_ip?: string | null;
					age_confirmed_user_agent?: string | null;
					terms_version?: string | null;
					user_id: string;
				};
				Update: {
					age_confirmed_at?: string;
					age_confirmed_ip?: string | null;
					age_confirmed_user_agent?: string | null;
					terms_version?: string | null;
					user_id?: string;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema['Enums']
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never = never
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema['CompositeTypes']
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never = never
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
		? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	public: {
		Enums: {}
	}
} as const;
