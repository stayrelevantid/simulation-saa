import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const examProfiles = sqliteTable('exam_profiles', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	code: text('code').notNull().unique(),
	name: text('name').notNull(),
	releaseDate: text('release_date'),
	questionCount: integer('question_count').notNull(),
	durationMinutes: integer('duration_minutes').notNull(),
	passingScore: integer('passing_score').notNull(),
	scoreMin: integer('score_min').notNull(),
	scoreMax: integer('score_max').notNull()
});

export const examDomains = sqliteTable('exam_domains', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	examProfileId: integer('exam_profile_id')
		.notNull()
		.references(() => examProfiles.id),
	name: text('name').notNull(),
	description: text('description'),
	weight: real('weight').notNull()
});

export const questions = sqliteTable('questions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	examProfileId: integer('exam_profile_id')
		.notNull()
		.references(() => examProfiles.id),
	questionText: text('question_text').notNull(),
	questionType: text('question_type').notNull(),
	difficulty: text('difficulty').notNull(),
	domainId: integer('domain_id')
		.notNull()
		.references(() => examDomains.id),
	subcategory: text('subcategory'),
	explanation: text('explanation').notNull(),
	keyConcept: text('key_concept'),
	reference: text('reference'),
	source: text('source').notNull().default('manual'),
	createdAt: text('created_at').notNull(),
	updatedAt: text('updated_at').notNull()
});

export const questionOptions = sqliteTable('question_options', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	questionId: integer('question_id')
		.notNull()
		.references(() => questions.id),
	optionKey: text('option_key').notNull(),
	optionText: text('option_text').notNull(),
	isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),
	explanation: text('explanation')
});

export const questionServices = sqliteTable('question_services', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	questionId: integer('question_id')
		.notNull()
		.references(() => questions.id),
	serviceName: text('service_name').notNull()
});

export const examSessions = sqliteTable('exam_sessions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	examProfileId: integer('exam_profile_id')
		.notNull()
		.references(() => examProfiles.id),
	mode: text('mode').notNull(),
	startedAt: text('started_at').notNull(),
	completedAt: text('completed_at'),
	timeLimitSeconds: integer('time_limit_seconds'),
	score: integer('score'),
	correctCount: integer('correct_count'),
	incorrectCount: integer('incorrect_count'),
	status: text('status').notNull().default('active')
});

export const examAnswers = sqliteTable('exam_answers', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	examSessionId: integer('exam_session_id')
		.notNull()
		.references(() => examSessions.id),
	questionId: integer('question_id')
		.notNull()
		.references(() => questions.id),
	selectedAnswers: text('selected_answers').notNull(),
	isCorrect: integer('is_correct', { mode: 'boolean' }),
	flagged: integer('flagged', { mode: 'boolean' }).notNull().default(false),
	answeredAt: text('answered_at').notNull()
});

export const bookmarks = sqliteTable('bookmarks', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	questionId: integer('question_id')
		.notNull()
		.references(() => questions.id)
		.unique(),
	createdAt: text('created_at').notNull()
});

export const aiGenerations = sqliteTable('ai_generations', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	model: text('model').notNull(),
	baseUrl: text('base_url'),
	examProfileId: integer('exam_profile_id').references(() => examProfiles.id),
	questionCount: integer('question_count').notNull(),
	configuration: text('configuration'),
	status: text('status').notNull(),
	createdAt: text('created_at').notNull()
});

export const questionBlueprints = sqliteTable('question_blueprints', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	examProfileId: integer('exam_profile_id')
		.notNull()
		.references(() => examProfiles.id),
	domainId: integer('domain_id')
		.notNull()
		.references(() => examDomains.id),
	difficultyDistribution: text('difficulty_distribution'),
	questionTypeDistribution: text('question_type_distribution'),
	serviceFocus: text('service_focus')
});
