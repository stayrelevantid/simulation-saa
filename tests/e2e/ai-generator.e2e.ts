import { expect, test } from '@playwright/test';

const MOCK_AI_PORT = 20199;

const RUN_ID = Date.now();
const QUESTION_TEXT = `A media company is designing a video archive ${RUN_ID} on AWS containing hundreds of terabytes of content accessed rarely throughout each year. Which storage solution should the solutions architect recommend to minimize costs while keeping retrieval times under one hour?`;

let mockServer: ReturnType<typeof import('node:http').createServer>;
let athenaCalls = 0;

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
				req.on('end', async () => {
					let prompt = '';
					try {
						const parsed = JSON.parse(body) as { messages?: { content?: string }[] };
						prompt = (parsed.messages ?? []).map((m) => m.content ?? '').join(' ');

						// Total failure: the 'Generate 2 original' request fails entirely.
						if (/Generate\s+2\s+original/i.test(prompt)) {
							res.writeHead(500, { 'Content-Type': 'application/json' });
							res.end(JSON.stringify({ error: 'mock provider failure' }));
							return;
						}

						// Partial failure: the 2nd batch focusing on Amazon Athena fails.
						if (/Amazon Athena/.test(prompt)) {
							athenaCalls += 1;
							if (athenaCalls === 2) {
								res.writeHead(500, { 'Content-Type': 'application/json' });
								res.end(JSON.stringify({ error: 'mock provider failure' }));
								return;
							}
						}
					} catch {
						// ignore parse issues and fall through to success
					}

					const countMatch = prompt.match(/Generate\s+(\d+)\s+original/i);
					const count = countMatch ? Number(countMatch[1]) : 1;

					// Keep the job 'running' long enough to exercise reload-resume
					await new Promise((resolve) => setTimeout(resolve, 4000));
					const questions = Array.from({ length: count }, (_, i) => ({
						...good,
						question: good.question.replaceAll(String(RUN_ID), `${RUN_ID}-${Date.now()}-${i}`)
					}));
					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end(
						JSON.stringify({
							choices: [{ message: { content: '```json\n' + JSON.stringify(questions) + '\n```' } }]
						})
					);
				});
				return;
			}
			res.writeHead(404);
			res.end();
		});

		await new Promise<void>((resolve) => mockServer.listen(MOCK_AI_PORT, resolve));
		athenaCalls = 0;
	});

	test.afterAll(async () => {
		await new Promise<void>((resolve) => mockServer.close(() => resolve()));
		// Keep the dev bank clean: remove questions this suite auto-imported
		const { default: Database } = await import('better-sqlite3');
		const db = new Database('data/saa-practice.db');
		db.prepare(
			"DELETE FROM question_options WHERE question_id IN (SELECT id FROM questions WHERE source='ai')"
		).run();
		db.prepare(
			"DELETE FROM question_services WHERE question_id IN (SELECT id FROM questions WHERE source='ai')"
		).run();
		db.prepare(
			"DELETE FROM bookmarks WHERE question_id IN (SELECT id FROM questions WHERE source='ai')"
		).run();
		db.prepare(
			"DELETE FROM exam_answers WHERE question_id IN (SELECT id FROM questions WHERE source='ai')"
		).run();
		db.prepare("DELETE FROM questions WHERE source='ai'").run();
		db.close();
	});

	test('generate (async), auto-save valid questions, and see them in the bank', async ({
		page
	}) => {
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

		// Async job: a progress bar appears, then the result is auto-saved
		await expect(page.getByText('%', { exact: false })).toBeVisible({ timeout: 10_000 });
		await expect(page.getByText('1 Questions Generated')).toBeVisible({ timeout: 20_000 });
		await expect(page.getByText('✓ 1 Valid')).toBeVisible();
		await expect(page.getByText(/Auto-saved\./)).toBeVisible();

		// Generation History refreshes automatically on success (no manual Refresh click)
		await expect(page.getByText('✓ Completed').first()).toBeVisible({ timeout: 10_000 });

		await page.getByRole('link', { name: 'View Question Bank' }).first().click();

		await page.waitForURL(/\/questions/);
		await page.getByPlaceholder('Search questions...').fill(String(RUN_ID));
		await page.keyboard.press('Enter');
		await page.waitForURL(/search=/);

		await expect(page.getByText(/video archive/).first()).toBeVisible();
	});

	test('resumes an in-progress job after a page refresh', async ({ page }) => {
		await page.goto('/ai-generator');
		await expect(page.getByText('Recommended:')).toBeVisible({ timeout: 10_000 });

		await page.locator('input[type="number"]').fill('1');
		await page.getByRole('checkbox', { name: 'Cost Optimization' }).check();
		await page.getByRole('button', { name: 'Generate Questions' }).click();

		// Wait until the job id is persisted so a refresh can resume it; the mock
		// still delays the LLM response for 4s so the job is running at reload time.
		await page.waitForFunction(
			() => window.sessionStorage.getItem('ai-job-id') !== null,
			undefined,
			{ timeout: 10_000 }
		);

		await page.reload();

		// After refresh the page resumes the same job and shows the completed result
		await expect(page.getByText('1 Questions Generated')).toBeVisible({ timeout: 25_000 });
		await expect(page.getByText('✓ 1 Valid')).toBeVisible();
	});

	test('saves partial results when a later batch fails', async ({ page }) => {
		await page.goto('/ai-generator');
		await expect(page.getByText('Recommended:')).toBeVisible({ timeout: 10_000 });

		// 10 questions => 2 batches of 5; the 2nd batch (Amazon Athena) is made to fail
		await page.locator('input[type="number"]').fill('10');
		await page.getByRole('checkbox', { name: 'Cost Optimization' }).check();
		await page.getByRole('checkbox', { name: 'Amazon Athena' }).click();
		await page.getByRole('button', { name: 'Generate Questions' }).click();

		await expect(page.getByText(/Partially saved\./)).toBeVisible({ timeout: 30_000 });
		await expect(page.getByText('✗ 5 Failed')).toBeVisible();
		await expect(page.getByText('✓ 5 Valid')).toBeVisible();

		// History reflects the partial outcome
		await expect(page.getByText('✓ Completed').first()).toBeVisible({ timeout: 10_000 });
		await expect(page.getByText('· 5 failed').first()).toBeVisible();
	});

	test('returns to the generator form and updates history when generation fails', async ({
		page
	}) => {
		await page.goto('/ai-generator');
		await expect(page.getByText('Recommended:')).toBeVisible({ timeout: 10_000 });

		// The mock provider fails when 2 questions are requested
		await page.locator('input[type="number"]').fill('2');
		await page.getByRole('checkbox', { name: 'Cost Optimization' }).check();
		await page.getByRole('button', { name: 'Generate Questions' }).click();

		// Error is surfaced and the generator form is immediately usable again
		await expect(page.getByText(/status 500|failed/i).first()).toBeVisible({ timeout: 20_000 });
		await expect(page.getByRole('button', { name: 'Generate Questions' })).toBeEnabled();

		// History reflects the failure automatically
		await expect(page.getByText('✗ Failed').first()).toBeVisible({ timeout: 10_000 });
	});
});
