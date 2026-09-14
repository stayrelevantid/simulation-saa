import { db } from './client';
import {
	examProfiles,
	examDomains,
	questions,
	questionOptions,
	questionServices,
	questionBlueprints
} from './schema';
import {
	importQuestionSchema,
	validateQuestion,
	normalizeQuestionText,
	type ImportQuestion
} from './validation';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'node:fs';

const now = () => new Date().toISOString();

const domainDefs = [
	{
		name: 'Secure Architecture',
		description: 'Design secure architectures',
		weight: 0.3,
		slug: 'secure_architecture'
	},
	{
		name: 'Resilient Architecture',
		description: 'Design resilient architectures',
		weight: 0.26,
		slug: 'resilient_architecture'
	},
	{
		name: 'High Performance',
		description: 'Design high-performing architectures',
		weight: 0.24,
		slug: 'high_performance'
	},
	{
		name: 'Cost Optimization',
		description: 'Design cost-optimized architectures',
		weight: 0.2,
		slug: 'cost_optimization'
	}
];

export async function seedProfile() {
	const existing = await db.select().from(examProfiles).where(eq(examProfiles.code, 'SAA-C03'));
	if (existing.length > 0) {
		const domains = await db
			.select()
			.from(examDomains)
			.where(eq(examDomains.examProfileId, existing[0].id));
		const domainMap: Record<string, number> = {};
		for (const d of domainDefs) {
			const found = domains.find((row) => row.name === d.name);
			if (found) domainMap[d.slug] = found.id;
		}
		return { profile: existing[0], domains: domainMap };
	}

	const [profile] = await db
		.insert(examProfiles)
		.values({
			code: 'SAA-C03',
			name: 'AWS Certified Solutions Architect – Associate',
			releaseDate: '2022-08-30',
			questionCount: 65,
			durationMinutes: 130,
			passingScore: 720,
			scoreMin: 100,
			scoreMax: 1000
		})
		.returning();

	const domains: Record<string, number> = {};
	for (const d of domainDefs) {
		const [row] = await db
			.insert(examDomains)
			.values({
				examProfileId: profile.id,
				name: d.name,
				description: d.description,
				weight: d.weight
			})
			.returning();
		domains[d.slug] = row.id;

		await db.insert(questionBlueprints).values({
			examProfileId: profile.id,
			domainId: row.id,
			difficultyDistribution: JSON.stringify({ easy: 0.3, medium: 0.5, hard: 0.2 }),
			questionTypeDistribution: JSON.stringify({ single: 0.85, multiple: 0.15 })
		});
	}

	return { profile, domains };
}

export { normalizeQuestionText };

export async function importQuestions(
	items: unknown[],
	profileId: number,
	domainMap: Record<string, number>
) {
	const results = { valid: 0, invalid: 0, duplicates: 0, errors: [] as string[] };

	const existing = await db
		.select({ questionText: questions.questionText })
		.from(questions)
		.where(eq(questions.examProfileId, profileId));
	const existingSet = new Set(existing.map((row) => normalizeQuestionText(row.questionText)));

	for (let i = 0; i < items.length; i++) {
		const parsed = importQuestionSchema.safeParse(items[i]);
		if (!parsed.success) {
			results.invalid++;
			results.errors.push(
				`Question ${i + 1}: ${parsed.error.issues.map((e) => e.message).join(', ')}`
			);
			continue;
		}

		const q = parsed.data as ImportQuestion;
		const validationErrors = validateQuestion(q);
		if (validationErrors.length > 0) {
			results.invalid++;
			results.errors.push(`Question ${i + 1}: ${validationErrors.join('; ')}`);
			continue;
		}

		const domainId = domainMap[q.domain];
		if (!domainId) {
			results.invalid++;
			results.errors.push(`Question ${i + 1}: unknown domain "${q.domain}"`);
			continue;
		}

		const normalized = normalizeQuestionText(q.questionText);
		if (existingSet.has(normalized)) {
			results.duplicates++;
			continue;
		}
		existingSet.add(normalized);

		await db.transaction((tx) => {
			const inserted = tx
				.insert(questions)
				.values({
					examProfileId: profileId,
					questionText: q.questionText,
					questionType: q.questionType,
					difficulty: q.difficulty,
					domainId,
					subcategory: q.subcategory ?? null,
					explanation: q.explanation,
					keyConcept: q.keyConcept ?? null,
					reference: q.reference ?? null,
					source: 'import',
					createdAt: now(),
					updatedAt: now()
				})
				.returning()
				.get();

			tx.insert(questionOptions)
				.values(
					q.options.map((o) => ({
						questionId: inserted.id,
						optionKey: o.key,
						optionText: o.text,
						isCorrect: o.correct,
						explanation: o.explanation ?? null
					}))
				)
				.run();

			if (q.services.length > 0) {
				tx.insert(questionServices)
					.values(
						q.services.map((s) => ({
							questionId: inserted.id,
							serviceName: s
						}))
					)
					.run();
			}
		});

		results.valid++;
	}

	return results;
}

async function main() {
	if (process.env.NODE_ENV === 'production') {
		console.error('Seeding questions is not allowed in production. Use the AI Generator instead.');
		process.exit(1);
	}
	const { profile, domains } = await seedProfile();
	const existing = await db
		.select({ id: questions.id })
		.from(questions)
		.where(eq(questions.examProfileId, profile.id));
	if (existing.length > 0) {
		console.log(`Seed skipped: ${existing.length} questions already exist for ${profile.code}`);
		return;
	}
	const raw = JSON.parse(readFileSync('questions/seed.json', 'utf-8')) as unknown[];
	const result = await importQuestions(raw, profile.id, domains);
	console.log(
		`Seed complete: ${result.valid} imported, ${result.duplicates} duplicates, ${result.invalid} invalid`
	);
	if (result.errors.length > 0) {
		for (const e of result.errors) console.error(`  ${e}`);
	}
}

if (process.argv[1] && process.argv[1].includes('seed')) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
