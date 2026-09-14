import { expect, test } from '@playwright/test';

const MOCK_AI_PORT = 20199;

const RUN_ID = Date.now();
const QUESTION_TEXT = `A media company is designing a video archive ${RUN_ID} on AWS containing hundreds of terabytes of content accessed rarely throughout each year. Which storage solution should the solutions architect recommend to minimize costs while keeping retrieval times under one hour?`;

let mockServer: ReturnType<typeof import('node:http').createServer>;

test.describe('Scenario 3 — AI generate → validate → import', () => {
	test.beforeAll(async () => {
		const http = await import('node:http');
		const good = {
			question: QUESTION_TEXT,
			type: 'single',
			difficulty: 'medium',
			domain: 'Cost Optimization',
			services: ['Amazon S3'],
			options: [
				{
					key: 'A',
					text: 'S3 Glacier Flexible Retrieval',
					correct: true,
					explanation: 'Meets the sub-hour retrieval requirement at low cost.'
				},
				{
					key: 'B',
					text: 'S3 Standard',
					correct: false,
					explanation: 'Highest cost tier for rarely accessed archives.'
				},
				{
					key: 'C',
					text: 'S3 Glacier Deep Archive',
					correct: false,
					explanation: 'Retrieval takes 12+ hours.'
				},
				{
					key: 'D',
					text: 'S3 Standard-IA',
					correct: false,
					explanation: 'Higher storage cost than Glacier.'
				}
			],
			explanation: 'Glacier Flexible Retrieval balances cost with the required retrieval window.',
			keyConcept: 'Archival storage classes',
			reference: 'AWS docs'
		};

		mockServer = http.createServer((req, res) => {
			if (req.url === '/v1/models') {
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ data: [{ id: 'mock/model-e2e' }] }));
				return;
			}
			if (req.url === '/v1/chat/completions') {
				let body = '';
				req.on('data', (c: string) => (body += c));
				req.on('end', () => {
					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end(
						JSON.stringify({
							choices: [{ message: { content: '```json\n' + JSON.stringify([good]) + '\n```' } }]
						})
					);
				});
				return;
			}
			res.writeHead(404);
			res.end();
		});

		await new Promise<void>((resolve) => mockServer.listen(MOCK_AI_PORT, resolve));
	});

	test.afterAll(async () => {
		await new Promise<void>((resolve) => mockServer.close(() => resolve()));
	});

	test('generate, preview, import, and see question in bank', async ({ page }) => {
		await page.goto('/ai-generator');
		await expect(page.getByRole('heading', { name: 'AI Question Generator' })).toBeVisible();

		// The mock returns a single model; ModelPicker auto-selects it as default
		await expect(page.getByText('Recommended:')).toBeVisible({ timeout: 10_000 });
		await expect(page.getByRole('button', { name: 'Generate Questions' })).toBeEnabled({
			timeout: 10_000
		});

		await page.locator('input[type="number"]').fill('1');
		await page.getByRole('checkbox', { name: 'Cost Optimization' }).check();

		await page.getByRole('button', { name: 'Generate Questions' }).click();

		await expect(page.getByText('1 Questions Generated')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByText('✓ 1 Valid')).toBeVisible();

		await page.getByRole('button', { name: /Import 1 Valid Questions/ }).click();

		await expect(page.getByText(/Import complete/)).toBeVisible({ timeout: 15_000 });
		await page.getByRole('link', { name: 'View Question Bank' }).click();

		await page.waitForURL(/\/questions/);
		await page.getByPlaceholder('Search questions...').fill(String(RUN_ID));
		await page.keyboard.press('Enter');
		await page.waitForURL(/search=/);

		await expect(page.getByText(/video archive/).first()).toBeVisible();
	});
});
