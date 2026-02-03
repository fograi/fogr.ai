/// <reference types="svelte" />
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase.types';

declare global {
	namespace App {
		interface Platform {
			env: Env;
			cf: CfProperties;
			ctx: ExecutionContext;
		}
		interface Locals {
			supabase: SupabaseClient<Database>;
            getUser: () => Promise<User | null>;
            getSessionMeta?: () => Promise<{ expires_at: number | null } | null>;
		}
		interface PageData {
			user?: { id: string; email?: string | null } | null;
		}
	}
}

export {};
