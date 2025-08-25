// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { SupabaseClient, Session } from '@supabase/supabase-js';
declare global {
	namespace App {
		interface Platform {
			env: Env;
			cf: CfProperties;
			ctx: ExecutionContext;
		}
		interface Locals {
			supabase: SupabaseClient;
			getSession: () => Promise<Session | null>;
		}
		interface PageData {
			session: Session | null;
		}
	}
}

export {};
