# SAA-C03 Practice Lab

A local-first web app for preparing for the **AWS Certified Solutions Architect – Associate (SAA-C03)** exam. It combines a question bank, timed mock exams, targeted practice, performance analytics, and an AI-assisted question generator.

All questions are original practice material. The app does not include dumps or reconstructions of official AWS exam questions.

## Features

- **Practice mode** — pick question count (1–100), domain, difficulty, question type, and AWS services. Explanations are shown after each answer.
- **Wrong-answer practice** — drill the questions you have missed, ordered by mistake frequency.
- **Full mock exam** — 65 questions, 130-minute server-side timer, flagging, scoring on the 100–1000 scale with a 720 passing score, plus a detailed review.
- **Question bank** — browse, filter, inspect, and import questions from JSON.
- **Bookmarks** — save questions for later review.
- **Statistics** — accuracy, score trend, domain breakdown, and weak-domain analysis.
- **AI Generator** — generate validated scenario questions through an OpenCode Go gateway, with batched progress, autosave, and a review queue.
- **Local-first storage** — everything is stored in a local SQLite database.

## Tech stack

| Layer      | Technology                              |
| ---------- | --------------------------------------- |
| Framework  | SvelteKit 2 / Svelte 5                  |
| Language   | TypeScript                              |
| UI         | Tailwind CSS 4, Flowbite Svelte         |
| Data       | SQLite, Drizzle ORM, better-sqlite3     |
| Validation | Zod                                     |
| Testing    | Vitest (unit), Playwright (end-to-end)  |
| Runtime    | Node adapter (`@sveltejs/adapter-node`) |

## Requirements

- **Node.js 22+** (the container image uses Node 22)
- **npm**
- Optional: Podman or Docker with Compose for containerized runs

## Quick start

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

Open http://localhost:5173.

The question bank starts empty by design. To populate it locally with the sample questions:

```bash
npm run db:seed
```

`db:seed` loads the exam configuration (SAA-C03 profile and domains) and imports `questions/seed.json`. It is disabled when `NODE_ENV=production`; use the AI Generator or the import CLI instead.

## Environment variables

| Variable            | Default                       | Description                                                |
| ------------------- | ----------------------------- | ---------------------------------------------------------- |
| `DATABASE_URL`      | `file:./data/saa-practice.db` | SQLite database location.                                  |
| `OPENCODE_BASE_URL` | `http://localhost:20128`      | Base URL of the OpenCode Go gateway used by the generator. |
| `OPENCODE_API_KEY`  | _(empty)_                     | Optional bearer token for the gateway.                     |

The `data/` directory and all `*.db*` files are gitignored.

## AI Generator

The generator talks to an **OpenCode Go** gateway that exposes an OpenAI-compatible API:

- `GET /v1/models` lists available models.
- `POST /v1/chat/completions` generates questions.

Set `OPENCODE_BASE_URL` (and `OPENCODE_API_KEY` if the gateway requires auth), then open `/ai-generator`. Generation runs in batches with live progress. Valid questions are imported automatically; questionable ones are placed in a review queue before being saved. Generation history is persisted in the database.

## Importing questions

Use the import page at `/questions/import`, or the CLI:

```bash
npm run questions:import -- path/to/questions.json
```

The file can be a single object or an array. Each question must match:

```json
{
	"questionText": "A company needs ... Which solution should the architect recommend?",
	"questionType": "single",
	"difficulty": "medium",
	"domain": "resilient_architecture",
	"subcategory": "storage",
	"services": ["Amazon S3"],
	"options": [
		{ "key": "A", "text": "Option A", "correct": false, "explanation": "Why A is wrong" },
		{ "key": "B", "text": "Option B", "correct": true, "explanation": "Why B is right" },
		{ "key": "C", "text": "Option C", "correct": false, "explanation": "Why C is wrong" },
		{ "key": "D", "text": "Option D", "correct": false, "explanation": "Why D is wrong" }
	],
	"explanation": "Overall explanation.",
	"keyConcept": "S3 lifecycle transitions",
	"reference": "Amazon S3 User Guide"
}
```

Rules:

- `questionType` is `single` (exactly one correct answer) or `multiple` (at least two correct answers).
- `difficulty` is `easy`, `medium`, or `hard`.
- `domain` uses the slug form: `secure_architecture`, `resilient_architecture`, `high_performance`, or `cost_optimization`.
- Each question needs 4–5 options with unique keys.
- Duplicate question text (normalized) is skipped.

## Scripts

| Command                              | Description                                   |
| ------------------------------------ | --------------------------------------------- |
| `npm run dev`                        | Start the development server.                 |
| `npm run build`                      | Build for production.                         |
| `npm run preview`                    | Preview the production build.                 |
| `npm run check`                      | Run `svelte-check` type checking.             |
| `npm run lint`                       | Check formatting and lint rules.              |
| `npm run format:fix`                 | Format the codebase with Prettier.            |
| `npm run test`                       | Run unit tests with Vitest.                   |
| `npm run test:e2e`                   | Run Playwright end-to-end tests.              |
| `npm run db:generate`                | Generate a Drizzle migration from the schema. |
| `npm run db:migrate`                 | Apply pending migrations.                     |
| `npm run db:seed`                    | Seed exam config and sample questions.        |
| `npm run questions:import -- <file>` | Import questions from JSON.                   |

## Running with containers

The project includes a `Containerfile` and `compose.yaml`:

```bash
podman compose up -d --build
```

The app is available at http://localhost:3000. The entrypoint applies migrations and bootstraps the exam configuration, but does **not** seed questions.

Useful commands:

```bash
podman compose logs -f     # follow logs
podman compose down        # stop (the data volume is preserved)
```

To reset the question bank:

```bash
podman compose down
podman volume rm simulation-saa_saa-data
podman compose up -d --build
```

The named volume `simulation-saa_saa-data` stores `/app/data/saa-practice.db`.

## Testing

```bash
npm run test       # unit tests
npm run test:e2e   # Playwright; seeds a generated test bank automatically
```

The Playwright config migrates the database, generates a test bank via `scripts/generate-test-bank.ts`, and imports it before starting the preview server.

## Project structure

```
src/
  lib/
    ai/            # Generation pipeline: provider, parser, validator, batching
    components/    # Svelte UI components (exam, practice, question, statistics)
    db/            # Drizzle schema, client, bootstrap, seed, validation
    repositories/  # Data access
    services/      # Practice, exam, scoring, and statistics logic
    types/         # Shared domain types
  routes/          # SvelteKit pages and API endpoints
drizzle/           # SQL migrations
questions/         # Sample and generated question banks
scripts/           # Import and test-bank utilities
tests/e2e/         # Playwright specs
```

## Exam configuration

Exam parameters are stored in the database rather than hard-coded in the UI:

- **Questions:** 65
- **Time limit:** 130 minutes
- **Score range:** 100–1000
- **Passing score:** 720
- **Domains:** Secure Architecture (30%), Resilient Architecture (26%), High Performance (24%), Cost Optimization (20%)

Update the profile, domains, and blueprints through the seed/bootstrap logic to adjust the blueprint without changing UI code.
