import type { ExecutionContext, ScheduledController } from '@cloudflare/workers-types';

type Env = {
	SUPABASE_URL?: string;
	SUPABASE_SERVICE_ROLE_KEY?: string;
	OPENAI_API_KEY?: string;
};

async function retryPendingAds(_env: Env): Promise<void> {
	// TODO: Implement retry logic.
	// Suggested approach:
	// 1) Query pending ads from Supabase using service role.
	// 2) Re-run moderation (text + images) if you have stored/accessible images.
	// 3) Promote to `active` and attach images if moderation passes.
	// NOTE: This requires a storage strategy for pending images (e.g., private R2).
}

export default {
	async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
		ctx.waitUntil(
			(async () => {
				try {
					if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
						console.warn('cron_missing_supabase_env');
						return;
					}
					console.log('cron_tick', { scheduledTime: controller.scheduledTime });
					await retryPendingAds(env);
				} catch (err) {
					console.error('cron_error', err);
				}
			})()
		);
	}
};
