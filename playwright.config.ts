import { defineConfig } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 4173);

export default defineConfig({
	webServer: {
		command: `npm run db:migrate && npm run db:seed && npm run preview -- --port ${PORT} --strictPort`,
		port: PORT,
		reuseExistingServer: !process.env.E2E_PORT,
		timeout: 120_000
	},
	testMatch: '**/*.e2e.{ts,js}',
	use: { baseURL: `http://localhost:${PORT}` }
});
