import type { GeneratedQuestion } from '$lib/ai/provider';
import { normalizeQuestionText } from '$lib/db/validation';
import { db } from '$lib/db/client';
import { questions, examDomains, examProfiles } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export interface ValidationIssue {
	questionIndex: number;
	message: string;
}

export interface ValidationResult {
	valid: GeneratedQuestion[];
	needReview: { question: GeneratedQuestion; issues: string[] }[];
	allIssues: ValidationIssue[];
}

const VALID_DOMAINS = [
	'secure_architecture',
	'resilient_architecture',
	'high_performance',
	'cost_optimization'
];

function domainSlug(domain: string): string {
	return domain.toLowerCase().replace(/[^a-z]+/g, '_');
}

function validateQuality(q: GeneratedQuestion): string[] {
	const issues: string[] = [];

	if (q.question.trim().length < 40) {
		issues.push('Question text is too short to be scenario-based (min 40 chars).');
	}

	if (
		!q.question.includes('?') &&
		!q.question.toLowerCase().includes('which ') &&
		!q.question.toLowerCase().includes('what ')
	) {
		issues.push('Question does not end with a question or prompt.');
	}

	if (!VALID_DOMAINS.includes(domainSlug(q.domain))) {
		issues.push(`Unknown domain "${q.domain}".`);
	}

	if (q.services.length === 0) {
		issues.push('No AWS services identified for the question.');
	}

	if (q.options.length < 4 || q.options.length > 5) {
		issues.push('Options must be 4-5.');
	}

	const correctCount = q.options.filter((o) => o.correct).length;
	if (q.type === 'single' && correctCount !== 1) {
		issues.push('Single choice must have exactly 1 correct answer.');
	}
	if (q.type === 'multiple' && correctCount < 2) {
		issues.push('Multiple response must have at least 2 correct answers.');
	}

	if (q.explanation.trim().length < 20) {
		issues.push('Explanation is too short.');
	}

	const unexplained = q.options.filter((o) => o.explanation.trim().length < 10);
	if (unexplained.length > 0) {
		issues.push(
			`Options missing detailed explanation: ${unexplained.map((o) => o.key).join(', ')}.`
		);
	}

	if (q.options.some((o) => o.text.trim().length < 3)) {
		issues.push('One or more options have too-short text.');
	}

	return issues;
}

export async function loadExistingQuestionTexts(): Promise<Set<string>> {
	const [profile] = await db.select().from(examProfiles).where(eq(examProfiles.code, 'SAA-C03'));
	if (!profile) return new Set();

	const rows = await db
		.select({ questionText: questions.questionText })
		.from(questions)
		.where(eq(questions.examProfileId, profile.id));

	return new Set(rows.map((row) => normalizeQuestionText(row.questionText)));
}

export function findDuplicates(
	candidates: GeneratedQuestion[],
	existingTexts: Set<string>
): Map<number, string> {
	const duplicates = new Map<number, string>();
	const batchTexts = new Map<string, number>();

	for (let i = 0; i < candidates.length; i++) {
		const normalized = normalizeQuestionText(candidates[i].question);

		if (existingTexts.has(normalized)) {
			duplicates.set(i, 'Matches an existing question in the bank.');
			continue;
		}

		const batchOriginal = batchTexts.get(normalized);
		if (batchOriginal !== undefined) {
			duplicates.set(i, `Duplicate of generated question #${batchOriginal + 1}.`);
			continue;
		}

		batchTexts.set(normalized, i);
	}

	return duplicates;
}

export async function validateGeneratedQuestions(
	candidates: GeneratedQuestion[]
): Promise<ValidationResult> {
	const existingTexts = await loadExistingQuestionTexts();
	const duplicates = findDuplicates(candidates, existingTexts);

	const valid: GeneratedQuestion[] = [];
	const needReview: ValidationResult['needReview'] = [];
	const allIssues: ValidationIssue[] = [];

	for (let i = 0; i < candidates.length; i++) {
		const issues = validateQuality(candidates[i]);
		const duplicateIssue = duplicates.get(i);
		if (duplicateIssue) issues.push(duplicateIssue);

		if (issues.length === 0) {
			valid.push(candidates[i]);
		} else {
			needReview.push({ question: candidates[i], issues });
			for (const issue of issues) {
				allIssues.push({ questionIndex: i, message: issue });
			}
		}
	}

	return { valid, needReview, allIssues };
}

export async function getDomainIdBySlug(slug: string): Promise<number | null> {
	const [profile] = await db.select().from(examProfiles).where(eq(examProfiles.code, 'SAA-C03'));
	if (!profile) return null;

	const domains = await db
		.select()
		.from(examDomains)
		.where(eq(examDomains.examProfileId, profile.id));
	const normalizedSlug = domainSlug(slug);
	const match = domains.find((d) => domainSlug(d.name) === normalizedSlug);
	return match?.id ?? null;
}
