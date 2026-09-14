import { expect, test } from '@playwright/test';

test.describe('Scenario 1 — Practice flow', () => {
	test('open app, start practice with defaults, answer, submit, see explanation', async ({
		page
	}) => {
		await page.goto('/');
		await expect(page.getByRole('heading', { name: 'SAA-C03 Practice Lab' })).toBeVisible();

		await page.goto('/practice');
		await expect(page.getByRole('heading', { name: 'Start Practice' })).toBeVisible();

		// Verify defaults: Easy checked, both types checked, All Domains, count 10
		await expect(page.getByRole('checkbox', { name: 'Easy' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Medium' })).not.toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Hard' })).not.toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Single Choice' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Multiple Response' })).toBeChecked();

		await page.getByRole('button', { name: 'Start Practice', exact: true }).click();
		await page.waitForURL(/\/practice\/session/);

		await expect(page.getByText(/Question 1 of \d+/)).toBeVisible();

		await page
			.getByRole('button', { name: /^[A-D]\. / })
			.first()
			.click();
		await page.getByRole('button', { name: 'Submit Answer' }).click();

		await expect(page.getByText(/✓ Correct|✗ Incorrect/)).toBeVisible();
		await expect(page.getByText('Explanation:', { exact: false })).toBeVisible();

		// Answer all remaining questions to reach the summary
		while (true) {
			const nextButton = page.getByRole('button', { name: /Finish Practice|Next Question/ });
			const visible = await nextButton.isVisible();
			if (!visible) break;

			const isLast = (await nextButton.textContent())?.includes('Finish');
			if (isLast) {
				await nextButton.click();
				break;
			}
			await nextButton.click();

			await page
				.getByRole('button', { name: /^[A-D]\. / })
				.first()
				.click();
			await page.getByRole('button', { name: 'Submit Answer' }).click();
			await expect(page.getByText(/✓ Correct|✗ Incorrect/)).toBeVisible();
		}

		await expect(page.getByText('Practice Complete')).toBeVisible();
	});
});

test.describe('Practice configuration validation', () => {
	test('blocks submit when no difficulty selected', async ({ page }) => {
		await page.goto('/practice');

		await page.getByRole('checkbox', { name: 'Easy' }).uncheck();

		await expect(page.getByRole('button', { name: 'Start Practice', exact: true })).toBeDisabled();
		await expect(page.getByText('Select at least one difficulty level.')).toBeVisible();
		await expect(page).not.toHaveURL(/\/practice\/session/);
	});

	test('blocks submit when no question type selected', async ({ page }) => {
		await page.goto('/practice');

		await page.getByRole('checkbox', { name: 'Single Choice' }).uncheck();
		await page.getByRole('checkbox', { name: 'Multiple Response' }).uncheck();

		await expect(page.getByRole('button', { name: 'Start Practice', exact: true })).toBeDisabled();
		await expect(page.getByText('Select at least one question type.')).toBeVisible();
		await expect(page).not.toHaveURL(/\/practice\/session/);
	});

	test('blocks submit when custom count is invalid', async ({ page }) => {
		await page.goto('/practice');

		await page.getByPlaceholder('Custom').fill('500');

		await expect(page.getByRole('button', { name: 'Start Practice', exact: true })).toBeDisabled();
		await expect(
			page.getByText('Custom count must be a whole number between 1 and 100.')
		).toBeVisible();
		await expect(page).not.toHaveURL(/\/practice\/session/);
	});

	test('shows server availability error when requested exceeds matching questions', async ({
		page
	}) => {
		await page.goto('/practice');

		// Narrow filter: easy only, but request 50 (fewer than 50 easy questions exist)
		await page.getByRole('checkbox', { name: 'Medium' }).uncheck();
		await page.getByRole('checkbox', { name: 'Multiple Response' }).uncheck();
		await page.getByRole('button', { name: '50' }).click();
		await page.getByRole('button', { name: 'Start Practice', exact: true }).click();

		await expect(page.getByText(/Only \d+ questions? match your selected filters/)).toBeVisible();
		await expect(page).not.toHaveURL(/\/practice\/session/);
	});

	test('multi-select difficulty works: easy + medium', async ({ page }) => {
		await page.goto('/practice');

		await page.getByRole('checkbox', { name: 'Medium' }).check();
		await page.getByRole('checkbox', { name: 'Multiple Response' }).uncheck();

		await page.getByRole('button', { name: 'Start Practice', exact: true }).click();
		await page.waitForURL(/\/practice\/session/);

		await expect(page.getByText(/Question 1 of \d+/)).toBeVisible();
	});
});
