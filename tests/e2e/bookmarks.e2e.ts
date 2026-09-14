import { expect, test } from '@playwright/test';

/**
 * Click a "☆ Bookmark" button and wait until it becomes "★ Bookmarked".
 * Retries in case the click lands before Svelte hydration attaches handlers.
 */
async function addBookmarkSettle(page: import('@playwright/test').Page) {
	await page.waitForLoadState('networkidle').catch(() => {});
	await expect(async () => {
		const button = page.getByRole('button', { name: '☆ Bookmark' }).first();
		if (await button.isVisible()) {
			await button.click();
		}
		await expect(page.getByRole('button', { name: '★ Bookmarked' }).first()).toBeVisible({
			timeout: 5000
		});
	}).toPass({ timeout: 20_000 });
}

/**
 * Click a "★ Bookmarked" button to remove it, then wait until the list has
 * no bookmarked buttons OR the empty state appears (single bookmark case).
 */
async function removeBookmarkSettle(page: import('@playwright/test').Page) {
	await expect(async () => {
		const button = page.getByRole('button', { name: '★ Bookmarked' }).first();
		if (await button.isVisible()) {
			await button.click();
		}
		const count = await page.getByRole('button', { name: '★ Bookmarked' }).count();
		const empty = await page
			.getByText('No bookmarks yet')
			.isVisible()
			.catch(() => false);
		expect(count === 0 || empty).toBe(true);
	}).toPass({ timeout: 15_000 });
}

test.describe('Bookmarks page', () => {
	test('bookmark then remove a bookmark interactively', async ({ page }) => {
		// Bookmark the first question from the Question Bank
		await page.goto('/questions');
		await expect(page.getByRole('heading', { name: 'Question Bank' })).toBeVisible();

		const errors: string[] = [];
		page.on('pageerror', (err) => errors.push(err.message));
		await addBookmarkSettle(page);

		// Bookmarks page now lists it
		await page.goto('/bookmarks');
		await expect(page.getByRole('heading', { name: 'My Bookmarks' })).toBeVisible();
		await expect(page.getByRole('button', { name: '★ Bookmarked' }).first()).toBeVisible({
			timeout: 10_000
		});

		// Remove via the interactive button -> card disappears without a full reload
		await removeBookmarkSettle(page);
		await expect(page.getByRole('button', { name: '★ Bookmarked' })).toHaveCount(0, {
			timeout: 10_000
		});

		expect(errors).toEqual([]);
	});

	test('shows empty state when there are no bookmarks', async ({ page }) => {
		await page.goto('/bookmarks');
		await expect(page.getByRole('heading', { name: 'My Bookmarks' })).toBeVisible();

		// Remove any existing bookmarks so the empty state appears
		while (await page.getByRole('button', { name: '★ Bookmarked' }).first().isVisible()) {
			await removeBookmarkSettle(page);
		}

		await expect(page.getByText('No bookmarks yet')).toBeVisible();
	});
});
