import { expect, test } from '@playwright/test';

test.describe('Statistics page', () => {
	test('renders heading and metric cards', async ({ page }) => {
		await page.goto('/statistics');
		await expect(page.getByRole('heading', { name: 'Statistics' })).toBeVisible();

		for (const label of ['Attempted', 'Correct', 'Incorrect', 'Accuracy']) {
			await expect(page.getByText(label, { exact: true })).toBeVisible();
		}
	});

	test('shows charts when practice data exists or empty state otherwise', async ({ page }) => {
		await page.goto('/statistics');

		const hasData = await page
			.getByText('Overall Accuracy', { exact: true })
			.isVisible()
			.catch(() => false);

		if (hasData) {
			await expect(page.getByText('Accuracy by Domain', { exact: true })).toBeVisible();
			// Donut chart is an svg with an accuracy label
			await expect(page.locator('svg[role="img"]').first()).toBeVisible();
		} else {
			await expect(page.getByText('No data yet')).toBeVisible();
			await expect(page.getByRole('link', { name: 'Start Practice' })).toBeVisible();
		}
	});
});
