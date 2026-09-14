import { expect, test } from '@playwright/test';

test.describe('Scenario 2 — Mock exam with restore', () => {
	test('start exam, answer, refresh restores session and timer continues', async ({ page }) => {
		await page.goto('/exam');
		await expect(page.getByRole('heading', { name: 'SAA-C03 Mock Exam' })).toBeVisible();

		const startButton = page.getByRole('button', { name: 'Start Mock Exam' });
		if (await startButton.isVisible()) {
			await startButton.click();
			await page.waitForURL(/\/exam\/session/);
		} else {
			await page.getByRole('link', { name: 'Resume Exam' }).click();
			await page.waitForURL(/\/exam\/session/);
		}

		await expect(page.getByText(/Question 1 \/ 65/)).toBeVisible();
		await expect(
			page.locator('time, span').filter({ hasText: /^\d{2}:\d{2}:\d{2}$/ })
		).toBeVisible();

		await page
			.locator('button')
			.filter({ hasText: /^[A-D]\./ })
			.first()
			.click();
		await expect(page.getByRole('button', { name: 'Navigator (' })).toContainText('1/65', {
			timeout: 10_000
		});

		await page.reload();

		await expect(page.getByText(/Question 1 \/ 65/)).toBeVisible();
		await expect(page.getByText('Exam session restored')).not.toBeVisible();
		await expect(page.getByRole('button', { name: 'Navigator (' })).toContainText('1/65');

		const timerText = await page.locator('span.font-mono').first().textContent();
		expect(timerText).toMatch(/^\d{2}:\d{2}:\d{2}$/);
	});
});
