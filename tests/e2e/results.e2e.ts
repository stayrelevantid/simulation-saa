import { expect, test } from '@playwright/test';
import Database from 'better-sqlite3';

const DB_PATH = 'data/saa-practice.db';

let insertedSessionId = 0;

test.describe('Exam result & review', () => {
	test.beforeAll(() => {
		const db = new Database(DB_PATH);

		const now = new Date().toISOString();
		const startedAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();

		const info = db
			.prepare(
				`INSERT INTO exam_sessions
				 (exam_profile_id, mode, started_at, completed_at, time_limit_seconds, score, correct_count, incorrect_count, status)
				 VALUES (1, 'exam', ?, ?, 7800, 780, 2, 1, 'completed')`
			)
			.run(startedAt, now);
		insertedSessionId = Number(info.lastInsertRowid);

		const answer = db.prepare(
			`INSERT INTO exam_answers
			 (exam_session_id, question_id, selected_answers, is_correct, flagged, answered_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		);

		// Question 1 answered correctly and flagged
		answer.run(insertedSessionId, 1, '["A"]', 1, 1, now);
		// Question 2 answered incorrectly
		answer.run(insertedSessionId, 2, '["B"]', 0, 0, now);
		// Question 3 unanswered
		answer.run(insertedSessionId, 3, '[]', null, 0, now);

		db.close();
	});

	test.afterAll(() => {
		const db = new Database(DB_PATH);
		db.prepare('DELETE FROM exam_answers WHERE exam_session_id = ?').run(insertedSessionId);
		db.prepare('DELETE FROM exam_sessions WHERE id = ?').run(insertedSessionId);
		db.close();
	});

	test('single page shows score summary and full review', async ({ page }) => {
		await page.goto('/results');
		await expect(page.getByRole('heading', { name: 'Exam History' })).toBeVisible();

		// Find the injected exam in history and open it (Review is an <a> link)
		await expect(
			page.getByText(`SAA-C03 Mock #${insertedSessionId}`, { exact: true })
		).toBeVisible();
		const reviewLink = page
			.locator('a')
			.filter({ hasText: 'Review' })
			.and(page.locator(`a[href="/results/${insertedSessionId}"]`));
		await reviewLink.click();
		await page.waitForURL(new RegExp(`/results/${insertedSessionId}$`));

		// Score summary
		await expect(page.getByRole('heading', { name: 'Exam Result' })).toBeVisible();
		await expect(page.getByText('PASS', { exact: true })).toBeVisible();
		await expect(page.getByText('780 / 1000')).toBeVisible();

		// Review filters + at least one question card
		await expect(page.getByRole('button', { name: /All \(\d+\)/ })).toBeVisible();
		await expect(page.getByRole('button', { name: /Flagged \(\d+\)/ })).toBeVisible();
		await expect(page.getByText('Correct Answer', { exact: false }).first()).toBeVisible();
	});

	test('back link returns to exam history', async ({ page }) => {
		await page.goto(`/results/${insertedSessionId}`);
		await expect(page.getByRole('heading', { name: 'Exam Result' })).toBeVisible();

		await page.getByRole('link', { name: 'Back to Exam History' }).click();
		await page.waitForURL(/\/results$/);
		await expect(page.getByRole('heading', { name: 'Exam History' })).toBeVisible();
	});

	test('old review deep link redirects to merged page', async ({ page }) => {
		await page.goto(`/results/${insertedSessionId}/review`);
		await page.waitForURL(new RegExp(`/results/${insertedSessionId}$`));
		await expect(page.getByRole('heading', { name: 'Exam Result' })).toBeVisible();
	});

	test('renders without runtime errors', async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', (err) => errors.push(err.message));

		await page.goto(`/results/${insertedSessionId}`);
		await expect(page.getByRole('heading', { name: 'Exam Result' })).toBeVisible();
		await page.waitForTimeout(500);

		expect(errors).toEqual([]);
	});
});
