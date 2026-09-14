import { expect, test } from '@playwright/test';

test.describe('Scenario 1 — Practice flow', () => {
	test('open app, start practice, answer, submit, see explanation', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('heading', { name: 'SAA-C03 Practice Lab' })).toBeVisible();

		await page.goto('/practice');
		await expect(page.getByRole('heading', { name: 'Start Practice' })).toBeVisible();

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
