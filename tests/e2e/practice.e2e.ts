import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Selects an answer for the current question and submits it.
 * Uses the stable `aria-pressed` attribute so it works for both single
 * choice and multiple response questions, and retries the click in case
 * it lands before Svelte hydration has attached the handlers.
 */
async function answerCurrentQuestion(page: Page) {
	const option = page.locator('button[aria-pressed]').first();
	const submit = page.getByRole('button', { name: 'Submit Answer' });

	await expect(async () => {
		if ((await option.getAttribute('aria-pressed')) !== 'true') {
			await option.click();
		}
		await expect(submit).toBeEnabled({ timeout: 2000 });
	}).toPass({ timeout: 15000 });

	await submit.click();
	await expect(page.getByText(/✓ Correct|✗ Incorrect/)).toBeVisible();
}

test.describe('Scenario 1 — Practice flow', () => {
	test('refresh resumes the first unanswered question and preserves completed summary', async ({
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

		// Summary shows correct label for selected single choice
		await expect(page.getByText('Single Choice', { exact: true })).toBeVisible();
		await expect(page.getByText('Multiple Choice')).toHaveCount(0);

		await page.getByRole('button', { name: 'Start Practice', exact: true }).click();
		await page.waitForURL(/\/practice\/session/);

		await expect(page.getByText(/Question 1 of \d+/)).toBeVisible();

		await answerCurrentQuestion(page);
		await expect(page.getByText('Explanation:', { exact: false })).toBeVisible();

		// Reloading a partially completed practice resumes at question two.
		await page.reload();
		await expect(page.getByText('Question 2 of 10')).toBeVisible();

		// The practice page offers an explicit resume path for the same active session.
		await page.goto('/practice');
		await expect(page.getByRole('heading', { name: 'Practice in progress' })).toBeVisible();
		await page.getByRole('link', { name: 'Resume Practice' }).click();
		await page.waitForURL(/\/practice\/session\?sessionId=/);
		await expect(page.getByText('Question 2 of 10')).toBeVisible();

		// Answer all remaining questions to reach the summary
		while (true) {
			const submitButton = page.getByRole('button', { name: 'Submit Answer' });
			if (await submitButton.isVisible()) {
				await answerCurrentQuestion(page);
			}

			const nextButton = page.getByRole('button', { name: /Finish Practice|Next Question/ });
			if (!(await nextButton.isVisible())) break;

			const isLast = (await nextButton.textContent())?.includes('Finish');
			await nextButton.click();
			if (isLast) break;
		}

		await expect(page.getByText('Practice Complete')).toBeVisible();
		await page.reload();
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
