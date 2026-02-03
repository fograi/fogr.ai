import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'svelte-kit sync && npm run build && wrangler dev --var E2E_MOCK:1 --port 8787',
		port: 8787
	},
	testDir: 'e2e'
});
