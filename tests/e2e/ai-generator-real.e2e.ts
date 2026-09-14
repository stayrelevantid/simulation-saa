import { expect, test } from '@playwright/test';

const enabled = process.env.REAL_AI_E2E === '1';

test.describe('AI generator — real OpenCode Go', () => {
	test.skip(!enabled, 'Set REAL_AI_E2E=1 to run against the real OpenCode Go gateway');

	test('generates real questions and shows validated results', async ({ page }) => {
		test.setTimeout(240_000);

		await page.goto('/ai-generator');
		await expect(page.getByRole('heading', { name: 'AI Question Generator' })).toBeVisible();

		// Models are fetched from the configured gateway; the picker shows a default model
		await expect(page.getByText('Recommended:')).toBeVisible({ timeout: 30_000 });

		// Keep the call small: 2 questions, minimal config stays at defaults otherwise
		await page.locator('input[type="number"]').fill('2');
		await page.getByRole('button', { name: 'Generate Questions' }).click();

		await expect(page.getByText(/2 Questions Generated/)).toBeVisible({ timeout: 120_000 });
		// Either valid or need-review will be shown after validation
		await expect(page.getByText(/Valid|Need Review|⚠/)).toBeVisible({ timeout: 60_000 });

		// No import in E2E to keep the question bank clean
	});
});
