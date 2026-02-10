import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command:
			'npm run prepare && npm run build && npx wrangler dev --var E2E_MOCK:1 --port 8787',
		port: 8787,
		timeout: 120_000,
		reuseExistingServer: true
	},
	testDir: 'e2e'
});
