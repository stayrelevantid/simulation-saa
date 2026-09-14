import { defineConfig } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 4173);

export default defineConfig({
	webServer: {
		command: `npm run db:migrate && npm run db:seed && npx tsx scripts/generate-test-bank.ts && npm run questions:import -- questions/test-bank.json && npm run preview -- --port ${PORT} --strictPort`,
		port: PORT,
		reuseExistingServer: !process.env.E2E_PORT,
		timeout: 120_000
	},
	testMatch: '**/*.e2e.{ts,js}',
	use: { baseURL: `http://localhost:${PORT}` }
});
