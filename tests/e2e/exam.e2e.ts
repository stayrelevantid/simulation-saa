import { expect, test } from '@playwright/test';

test.describe('Exam session', () => {
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

		const option = page.locator('button[aria-pressed]').first();
		await expect(async () => {
			if ((await option.getAttribute('aria-pressed')) !== 'true') await option.click();
			await expect(option).toHaveAttribute('aria-pressed', 'true', { timeout: 2000 });
		}).toPass({ timeout: 15_000 });
		await expect(page.getByRole('button', { name: 'Navigator (' })).toContainText('1/65', {
			timeout: 10_000
		});

		// The leave guard now triggers a beforeunload dialog on refresh;
		// accept it (that's the "leave" confirmation) so the reload proceeds.
		let sawUnloadDialog = false;
		page.on('dialog', (dialog) => {
			if (dialog.type() === 'beforeunload') sawUnloadDialog = true;
			dialog.accept();
		});
		await page.reload();

		expect(sawUnloadDialog).toBe(true);
		await expect(page.getByText(/Question 1 \/ 65/)).toBeVisible();
		await expect(page.getByText('Exam session restored')).not.toBeVisible();
		await expect(page.getByRole('button', { name: 'Navigator (' })).toContainText('1/65');

		const timerText = await page.locator('span.font-mono').first().textContent();
		expect(timerText).toMatch(/^\d{2}:\d{2}:\d{2}$/);
	});

	test('warns before leaving via an in-app link and stays when canceled', async ({ page }) => {
		// /exam/session auto-creates or resumes an active exam
		await page.goto('/exam/session');
		await expect(page.getByText(/Question 1 \/ 65/)).toBeVisible();

		// Clicking an internal link is intercepted by the guard
		await page.getByRole('link', { name: 'Question Bank' }).first().click();
		await expect(page.getByText('Leave exam?', { exact: false })).toBeVisible();
		await page.waitForTimeout(300);
		expect(new URL(page.url()).pathname).toBe('/exam/session');

		// Staying keeps the exam open
		await page.getByRole('button', { name: 'Stay in Exam' }).click();
		await expect(page.getByText('Leave exam?', { exact: false })).not.toBeVisible();
		expect(new URL(page.url()).pathname).toBe('/exam/session');
		await expect(page.getByText(/Question 1 \/ 65/)).toBeVisible();
	});

	test('leaving navigates to the requested page after confirmation', async ({ page }) => {
		await page.goto('/exam/session');
		await expect(page.getByText(/Question 1 \/ 65/)).toBeVisible();

		await page.getByRole('link', { name: 'Question Bank' }).first().click();
		await expect(page.getByText('Leave exam?', { exact: false })).toBeVisible();

		await page.getByRole('button', { name: 'Leave Exam' }).click();
		await page.waitForURL(/\/questions/);
		await expect(page.getByRole('heading', { name: 'Question Bank' })).toBeVisible();
	});

	test('beforeunload fires on refresh (native confirmation)', async ({ page }) => {
		await page.goto('/exam/session');
		await expect(page.getByText(/Question 1 \/ 65/)).toBeVisible();

		// Dismissing the beforeunload dialog keeps the user on the exam
		let sawBeforeUnload = false;
		page.on('dialog', (dialog) => {
			if (dialog.type() === 'beforeunload') {
				sawBeforeUnload = true;
				dialog.dismiss();
			}
		});
		// Trigger a reload without awaiting navigation (dismissing cancels the unload)
		await page.evaluate(() => window.location.reload()).catch(() => {});
		await page.waitForTimeout(800);

		expect(sawBeforeUnload).toBe(true);
		expect(new URL(page.url()).pathname).toBe('/exam/session');
	});
});
