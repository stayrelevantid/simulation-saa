CREATE TABLE `ai_generations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`model` text NOT NULL,
	`base_url` text,
	`exam_profile_id` integer,
	`question_count` integer NOT NULL,
	`configuration` text,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`exam_profile_id`) REFERENCES `exam_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bookmarks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_id` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookmarks_question_id_unique` ON `bookmarks` (`question_id`);--> statement-breakpoint
CREATE TABLE `exam_answers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`exam_session_id` integer NOT NULL,
	`question_id` integer NOT NULL,
	`selected_answers` text NOT NULL,
	`is_correct` integer,
	`flagged` integer DEFAULT false NOT NULL,
	`answered_at` text NOT NULL,
	FOREIGN KEY (`exam_session_id`) REFERENCES `exam_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `exam_domains` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`exam_profile_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`weight` real NOT NULL,
	FOREIGN KEY (`exam_profile_id`) REFERENCES `exam_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `exam_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`release_date` text,
	`question_count` integer NOT NULL,
	`duration_minutes` integer NOT NULL,
	`passing_score` integer NOT NULL,
	`score_min` integer NOT NULL,
	`score_max` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exam_profiles_code_unique` ON `exam_profiles` (`code`);--> statement-breakpoint
CREATE TABLE `exam_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`exam_profile_id` integer NOT NULL,
	`mode` text NOT NULL,
	`started_at` text NOT NULL,
	`completed_at` text,
	`time_limit_seconds` integer,
	`score` integer,
	`correct_count` integer,
	`incorrect_count` integer,
	`status` text DEFAULT 'active' NOT NULL,
	FOREIGN KEY (`exam_profile_id`) REFERENCES `exam_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `question_blueprints` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`exam_profile_id` integer NOT NULL,
	`domain_id` integer NOT NULL,
	`difficulty_distribution` text,
	`question_type_distribution` text,
	`service_focus` text,
	FOREIGN KEY (`exam_profile_id`) REFERENCES `exam_profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`domain_id`) REFERENCES `exam_domains`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `question_options` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_id` integer NOT NULL,
	`option_key` text NOT NULL,
	`option_text` text NOT NULL,
	`is_correct` integer NOT NULL,
	`explanation` text,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `question_services` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_id` integer NOT NULL,
	`service_name` text NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`exam_profile_id` integer NOT NULL,
	`question_text` text NOT NULL,
	`question_type` text NOT NULL,
	`difficulty` text NOT NULL,
	`domain_id` integer NOT NULL,
	`subcategory` text,
	`explanation` text NOT NULL,
	`key_concept` text,
	`reference` text,
	`source` text DEFAULT 'manual' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`exam_profile_id`) REFERENCES `exam_profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`domain_id`) REFERENCES `exam_domains`(`id`) ON UPDATE no action ON DELETE no action
);
