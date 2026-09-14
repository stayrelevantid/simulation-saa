import { expect, test } from '@playwright/test';

test.describe('Statistics page', () => {
	test('renders heading and metric cards', async ({ page }) => {
		await page.goto('/statistics');
		await expect(page.getByRole('heading', { name: 'Statistics' })).toBeVisible();

		for (const label of ['Attempted', 'Correct', 'Incorrect', 'Accuracy']) {
			await expect(page.getByText(label, { exact: true })).toBeVisible();
		}
	});

	test('renders without runtime errors regardless of data state', async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', (err) => errors.push(err.message));
		page.on('console', (msg) => {
			if (msg.type() === 'error') errors.push(msg.text());
		});

		await page.goto('/statistics');
		await expect(page.getByRole('heading', { name: 'Statistics' })).toBeVisible();

		// Give any hydration-triggered effects a chance to surface
		await page.waitForTimeout(500);

		const relevant = errors.filter((e) => /Svelte|each_key|hydration|chart/i.test(e));
		expect(relevant).toEqual([]);
	});
});
