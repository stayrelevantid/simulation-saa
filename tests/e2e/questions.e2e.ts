import { expect, test } from '@playwright/test';

/**
 * Selects a filter value, retrying until the URL actually changes.
 * Guards against clicks landing before Svelte hydration attaches the
 * change handler (which other tests can trigger in parallel).
 */
async function selectFilter(page: import('@playwright/test').Page, label: string, value: string) {
	const select = page.getByLabel(label);
	await expect(async () => {
		await select.selectOption(value);
		await expect(page).toHaveURL(/[?&]service=/, { timeout: 2000 });
	}).toPass({ timeout: 15_000 });
}

test.describe('Question Bank filters', () => {
	test('filter panel shows Search button and active filter chip', async ({ page }) => {
		await page.goto('/questions');
		await expect(page.getByRole('heading', { name: 'Question Bank' })).toBeVisible();

		// Filter card present with an explicit Search control
		await expect(page.getByRole('heading', { name: 'Filters' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();
	});

	test('service filter narrows results via URL', async ({ page }) => {
		await page.goto('/questions');
		await expect(page.getByText(/Showing/)).toBeVisible({ timeout: 10_000 });

		await selectFilter(page, 'AWS Service', 'Amazon CloudFront');

		const text = await page.getByText(/Showing/).textContent();
		expect(text).toMatch(/of \d+ questions/);
	});

	test('reset clears all filters', async ({ page }) => {
		await page.goto('/questions');
		await selectFilter(page, 'AWS Service', 'Amazon CloudFront');

		await page.getByRole('button', { name: 'Reset all' }).click();
		await page.waitForURL((url) => url.pathname === '/questions' && url.search === '');
		await expect(page.getByRole('button', { name: 'Reset all' })).not.toBeVisible();
	});

	test('search with no matches shows empty state', async ({ page }) => {
		await page.goto('/questions');
		await page.getByPlaceholder('Search questions...').fill('zz-no-such-question-xyz');
		await page.waitForURL(/search=/);

		await expect(page.getByText('No questions match your filters')).toBeVisible();
		await expect(page.getByText('Clear Filters')).toBeVisible();
	});
});
