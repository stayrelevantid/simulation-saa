import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'npm run db:migrate && npm run db:seed && npm run preview',
		port: 3000,
		reuseExistingServer: true,
		timeout: 120_000
	},
	testMatch: '**/*.e2e.{ts,js}',
	use: { baseURL: 'http://localhost:3000' }
});
