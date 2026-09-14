# PRD — SAA-C03 Practice Exam Lab

- **Version:** 1.0
- **Status:** Ready for Implementation
- **Project Type:** Local-first Web Application
- **Primary Goal:** AWS Certified Solutions Architect – Associate (SAA-C03) Practice & Mock Exam

---

## 1. Product Vision

SAA-C03 Practice Exam Lab adalah aplikasi web lokal untuk membantu pengguna mempersiapkan AWS Certified Solutions Architect – Associate (SAA-C03) melalui:

- Question Bank
- AI-generated Question Bank
- Practice Mode
- Full Mock Exam
- Timer
- Exam Review
- Detailed Explanation
- Weak-topic analysis
- Bookmark
- Wrong-answer practice
- Statistics

Aplikasi harus terasa seperti learning platform, bukan sekadar kumpulan soal.

> Semua soal yang dibuat aplikasi harus merupakan original practice questions, bukan salinan, dump, atau rekonstruksi soal ujian AWS resmi.

## 2. Target Exam Profile

Aplikasi MVP berfokus pada:

| Atribut        | Nilai                                         |
| -------------- | --------------------------------------------- |
| Exam           | AWS Certified Solutions Architect – Associate |
| Exam Code      | SAA-C03                                       |
| Release Date   | August 2022                                   |
| Prerequisites  | None                                          |
| Questions      | 65                                            |
| Score Range    | 100–1000                                      |
| Passing Score  | 720                                           |
| Time Limit     | 130 minutes                                   |
| Format         | Scenario-based                                |
| Question Types | Multiple Choice / Multiple Response           |

> Parameter exam harus disimpan sebagai database configuration, bukan hard-coded di UI.
>
> Tujuannya agar blueprint dapat diperbarui tanpa mengubah source code.

## 3. Important Exam Rules

Generator dan exam engine harus mengikuti prinsip berikut.

### Question Format

Mendukung:

- **Multiple Choice** — satu jawaban benar
- **Multiple Response** — dua atau lebih jawaban benar sesuai konfigurasi soal; jumlah jawaban yang harus dipilih harus dijelaskan pada question text

Contoh:

> Which TWO solutions should the solutions architect recommend?

## 4. Scenario-Based Requirement

Semua soal SAA harus berorientasi pada scenario dan architectural decision.

Tidak diperbolehkan sebagai default:

> Which AWS service provides object storage?

Format yang diharapkan:

> A company is migrating an application to AWS. The application stores millions of user-generated images and requires highly durable storage with minimal operational overhead. Most objects become infrequently accessed after 30 days. The solutions architect must minimize storage costs while maintaining immediate access...

Kemudian:

> Which solution should the solutions architect recommend?

Soal harus menguji kemampuan:

- memilih architecture
- memilih AWS service
- memahami trade-off
- reliability
- security
- performance
- scalability
- cost optimization
- operational overhead

## 5. Technology Stack

### Frontend

- SvelteKit
- TypeScript
- Tailwind CSS
- Flowbite Svelte

### Backend

Gunakan SvelteKit server routes/server modules. Tidak perlu backend terpisah untuk MVP.

### Database

- SQLite

### ORM

- Drizzle ORM

### Runtime

- Node.js

### Container

- Podman
- Podman Compose

### Testing

- Vitest
- Playwright

### Code Quality

- TypeScript strict
- ESLint
- Prettier

## 6. Architecture

```
                     Browser
                        │
                        ▼
              ┌───────────────────┐
              │     SvelteKit     │
              │                   │
              │  Svelte           │
              │  Flowbite Svelte  │
              │  Tailwind         │
              └─────────┬─────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
         ▼              ▼              ▼
   Practice Engine  Exam Engine   AI Generator
         │              │              │
         │              │              ▼
         │              │        OpenCode Go
         │              │              │
         │              │         Selected Model
         │              │
         └──────────────┼──────────────┘
                        │
                        ▼
                   Service Layer
                        │
                        ▼
                    Drizzle ORM
                        │
                        ▼
                      SQLite
```

## 7. Local Runtime

Aplikasi harus dapat dijalankan sepenuhnya secara lokal.

Command utama:

```sh
podman compose up -d
```

Aplikasi tersedia pada:

```
http://localhost:3000
```

Stop:

```sh
podman compose down
```

Data SQLite harus persistent menggunakan Podman volume.

## 8. Directory Structure

Target struktur:

```
saa-practice-lab/
│
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── exam/
│   │   │   ├── question/
│   │   │   ├── statistics/
│   │   │   └── ai/
│   │   │
│   │   ├── db/
│   │   │   ├── schema.ts
│   │   │   ├── client.ts
│   │   │   └── seed.ts
│   │   │
│   │   ├── repositories/
│   │   │   ├── question.repository.ts
│   │   │   ├── exam.repository.ts
│   │   │   ├── answer.repository.ts
│   │   │   └── statistics.repository.ts
│   │   │
│   │   ├── services/
│   │   │   ├── exam.service.ts
│   │   │   ├── scoring.service.ts
│   │   │   ├── question.service.ts
│   │   │   └── statistics.service.ts
│   │   │
│   │   ├── ai/
│   │   │   ├── provider.ts
│   │   │   ├── opencode.ts
│   │   │   ├── generator.ts
│   │   │   ├── validator.ts
│   │   │   └── prompts/
│   │   │
│   │   └── types/
│   │
│   └── routes/
│       ├── +page.svelte
│       ├── practice/
│       ├── exam/
│       ├── results/
│       ├── questions/
│       ├── bookmarks/
│       ├── statistics/
│       ├── ai-generator/
│       └── admin/
│
├── drizzle/
├── questions/
│   └── seed.json
├── tests/
│   ├── unit/
│   └── e2e/
│
├── data/
├── Containerfile
├── compose.yaml
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── eslint.config.js
├── prettier.config.js
└── README.md
```

## 9. Core Modules

Aplikasi terdiri dari:

1. Dashboard
2. Question Bank
3. Practice Mode
4. Mock Exam
5. Exam Result
6. Question Review
7. Wrong Answers
8. Bookmarks
9. Statistics
10. AI Question Generator
11. Question Management
12. Settings

## 10. Dashboard

Dashboard menampilkan:

```
SAA-C03 Practice Lab

Questions              250

Questions Attempted    187

Accuracy               81%

Mock Exams             12

Average Score          812

Weak Domains
Networking             68%
Storage                74%
Database               79%
Security               86%
Compute                91%

Quick Actions
[ Start Practice ]  [ Mock Exam ]
[ AI Question Generator ]  [ Wrong Answers ]
```

## 11. Question Bank

Question Bank menampilkan semua soal.

**Filter:**

- Domain
- Difficulty
- Question Type
- AWS Service
- Tag
- Status

**Search:**

```
Search questions...
```

**Question card:**

```
Question #102

Medium
Resilient Architecture

A company needs...

Services:
S3 · CloudFront · Route 53

[ Practice ]  [ Bookmark ]
```

## 12. Question Data Model

Setiap question minimal mempunyai:

- `id`
- `question_text`
- `question_type`
- `difficulty`
- `domain`
- `subcategory`
- `explanation`
- `key_concept`
- `reference`
- `created_at`
- `updated_at`
- `source`

Nilai `source`:

- `manual`
- `ai`
- `import`

## 13. Question Options

Tabel `question_options`:

- `id`
- `question_id`
- `option_key`
- `option_text`
- `is_correct`
- `explanation`

Contoh (single choice):

```
A → incorrect
B → correct
C → incorrect
D → incorrect
```

Untuk multiple response:

```
A → correct
B → incorrect
C → correct
D → incorrect
```

## 14. Explanation Requirement

Setiap soal wajib mempunyai pembahasan.

**Minimal:**

- `explanation`
- `key_concept`

**Ideal:**

- `why_correct`
- `why_incorrect`

Contoh:

```
Correct Answer

Amazon S3 is the best choice because...

Why A is incorrect:
...

Why C is incorrect:
...

Why D is incorrect:
...

Key Concept:
Object storage vs block storage
```

## 15. Practice Mode

User dapat memilih:

**Question Count:**

- 10
- 20
- 30
- 50
- Custom

**Filter:**

- Domain
- Difficulty
- AWS Service

**Question type:**

- Single Choice
- Multiple Response
- Both

## 16. Learning Mode

Learning Mode memberikan feedback setelah menjawab.

**Flow:**

```
Question
   ↓
Answer
   ↓
Submit Answer
   ↓
Correct / Incorrect
   ↓
Explanation
   ↓
Next Question
```

Contoh:

```
✓ Correct

Your Answer:
B. Amazon S3

Explanation:
...
```

## 17. Mock Exam Mode

Full Mock Exam default:

- 65 Questions
- 130 Minutes

Selama exam:

- timer aktif
- tidak ada explanation
- tidak ada correct/incorrect feedback
- dapat flag
- dapat kembali ke soal sebelumnya
- dapat melihat question navigator
- autosave answer

## 18. Exam Navigator

```
01 ✓   02 ✓   03 ⚑   04 ✓
05 -   06 -   07 ⚑
...
65 -
```

Legend:

- `✓` Answered
- `⚑` Flagged
- `-` Unanswered

## 19. Timer

Timer harus menggunakan waktu server/session sebagai source of truth.

Contoh:

```
02:07:34
```

Jika browser refresh:

```
Exam session restored
```

Timer tidak boleh reset.

Jika timer mencapai:

```
00:00:00
```

exam otomatis submit.

## 20. Exam Submission

Sebelum submit:

```
Submit Exam?

Answered:   57 / 65
Unanswered: 8
Flagged:    4

[ Cancel ]  [ Submit Exam ]
```

## 21. Result Page

Setelah exam:

```
SAA-C03 Mock Exam

Estimated Score

780 / 1000

PASS

Correct:   52 / 65
Incorrect: 13 / 65

Time Used: 107 minutes
```

> **Important:** Score harus disebut **Estimated / Simulated Score**, bukan official AWS score.
>
> Aplikasi tidak boleh mengklaim dapat menghitung scaled score AWS secara resmi.

## 22. Passing Logic

Untuk simulasi:

```
estimated_score >= 720  →  PASS
estimated_score <  720  →  NOT YET
```

Score calculation harus berada di service terpisah agar algoritmanya mudah diubah.

## 23. Exam Review

Ini mandatory feature.

Setelah submit, user harus dapat melihat semua soal.

**Filter:**

- `[ All ]`
- `[ Correct ]`
- `[ Incorrect ]`
- `[ Flagged ]`

Contoh:

```
Question 17

✗ Incorrect

Your Answer:
C. Amazon EBS

Correct Answer:
A. Amazon S3
```

Kemudian:

**Explanation**

> Amazon S3 is an object storage service...

dan:

**Why C is incorrect**

> Amazon EBS provides block storage for Amazon EC2 workloads...

## 24. Multiple Response Review

Contoh:

```
Your Answers:

☑ A
☑ C
☐ D

Correct Answers:

☑ A
☑ B

Status:

✗ Incorrect
```

Kemudian explanation.

Untuk MVP, scoring multiple response menggunakan **all-or-nothing** agar konsisten dan sederhana.

## 25. Wrong Answer Practice

Semua soal yang pernah dijawab salah masuk:

```
My Mistakes

14 Wrong Questions

[ Practice All ]
```

Practice dapat difilter:

- Recent Mistakes
- Most Frequent Mistakes
- By Domain

## 26. Bookmark

User dapat:

```
☆ Bookmark
```

Kemudian:

```
My Bookmarks
```

## 27. Statistics

Dashboard statistik:

| Stat                | Nilai |
| ------------------- | ----- |
| Questions Attempted | 187   |
| Correct             | 152   |
| Incorrect           | 35    |
| Accuracy            | 81.3% |

Per domain:

| Domain                 | Accuracy |
| ---------------------- | -------- |
| Secure Architecture    | 88%      |
| Resilient Architecture | 76%      |
| High Performance       | 82%      |
| Cost Optimization      | 71%      |

Per AWS service:

| Service | Accuracy |
| ------- | -------- |
| EC2     | 91%      |
| S3      | 88%      |
| VPC     | 68%      |
| RDS     | 79%      |
| IAM     | 85%      |
| Lambda  | 72%      |

## 28. AI Question Generator

Ini salah satu fitur utama.

**Route:**

```
/ai-generator
```

**UI:**

```
AI Question Generator

Exam Profile      [ SAA-C03 ]

AI Model          [ Select Model ]

Question Count    [ 20 ]

Question Type
☑ Multiple Choice
☑ Multiple Response

Difficulty
☑ Medium
☑ Hard

Domain
☑ Secure Architecture
☑ Resilient Architecture
☐ High Performance
☐ Cost Optimization

AWS Services      [ Auto ]

[ Generate Questions ]
```

## 29. OpenCode Go Integration

AI integration harus menggunakan abstraction layer.

```
AIProvider
   │
   └── OpenCodeProvider
```

Interface konseptual:

```ts
interface AIProvider {
	listModels(): Promise<Model[]>;
	generateQuestions(config: QuestionGenerationConfig): Promise<GeneratedQuestion[]>;
}
```

Aplikasi tidak boleh meng-hard-code model tertentu.

## 30. Model Selection

User harus dapat memilih model.

Contoh:

```
AI Model

[ opencode-go/gpt-5.6-luna ▼ ]
```

Model tersedia harus diperoleh dari OpenCode Go/API configuration bila endpoint yang digunakan mendukung model listing.

Jangan membuat:

```ts
const models = ['gpt-5.6-luna'];
```

sebagai satu-satunya sumber model.

## 31. OpenCode Configuration

Environment variables:

```sh
OPENCODE_BASE_URL=http://localhost:20128
OPENCODE_API_KEY=your-key
```

API key tidak boleh dikirim ke browser.

Semua request AI dilakukan server-side:

```
Browser
   ↓
SvelteKit Server
   ↓
OpenCode Go
   ↓
Selected Model
```

## 32. AI Generation Configuration

AI generator menerima:

- `examProfile`
- `domain`
- `subcategory`
- `difficulty`
- `questionType`
- `questionCount`
- `awsServices`
- `scenarioStyle`

Contoh:

```json
{
	"examProfile": "SAA-C03",
	"questionCount": 20,
	"difficulty": ["medium", "hard"],
	"questionTypes": ["single", "multiple"],
	"domains": ["resilient_architecture"]
}
```

## 33. AI Prompt Rules

System prompt AI harus menginstruksikan:

1. Generate original questions.
2. Follow SAA-C03 objectives.
3. Scenario-based.
4. Test architecture decision-making.
5. Avoid trivia unless relevant to architecture.
6. Include realistic business requirements.
7. Include constraints.
8. Include distractors that are technically plausible.
9. Explain why correct answer is correct.
10. Explain why incorrect answers are incorrect.
11. Never claim generated questions are actual AWS exam questions.
12. Never reproduce recalled/dumped AWS questions.
13. Output strict JSON.
14. Follow requested question type.
15. Follow requested number of correct answers.

## 34. AI Output Schema

AI harus menghasilkan structured JSON.

Contoh:

```json
{
	"question": "A company is migrating...",
	"type": "single",
	"difficulty": "medium",
	"domain": "resilient_architecture",
	"subcategory": "storage",
	"services": ["Amazon S3", "Amazon EBS"],
	"options": [
		{
			"key": "A",
			"text": "Use Amazon S3...",
			"correct": true,
			"explanation": "..."
		},
		{
			"key": "B",
			"text": "Use Amazon EBS...",
			"correct": false,
			"explanation": "..."
		}
	],
	"explanation": "Amazon S3 is appropriate because...",
	"keyConcept": "Object storage",
	"reference": "AWS documentation"
}
```

## 35. AI Validation

AI output tidak boleh langsung dimasukkan ke database.

**Flow:**

```
AI
 ↓
JSON Parse
 ↓
Schema Validation
 ↓
Question Quality Validation
 ↓
Duplicate Detection
 ↓
Preview
 ↓
User Approval
 ↓
SQLite
```

## 36. Validation Rules

**Single choice:**

- Options: 4–5
- Correct answers: exactly 1

**Multiple response:**

- Options: 4–5
- Correct answers: >= 2

**All questions:**

- `question` != empty
- `explanation` != empty
- domain valid
- difficulty valid
- question type valid
- correct answer exists

## 37. Duplicate Detection

Generated questions dibandingkan dengan existing question bank.

**Minimal:**

```
Normalize question text
        ↓
Text similarity
        ↓
Duplicate threshold
```

Jika terlalu mirip:

```
⚠ Similar question detected
```

Question tidak langsung di-import.

## 38. AI Generation Preview

Setelah generate:

```
20 Questions Generated

✓ 18 Valid
⚠ 2 Need Review
```

User dapat melihat:

```
Question 1
Question 2
Question 3
...
```

Action:

- `[ Regenerate Invalid ]`
- `[ Import Valid Questions ]`
- `[ Cancel ]`

## 39. AI Generation History

Database menyimpan tabel `ai_generations`:

- `id`
- `model`
- `base_url`
- `exam_profile`
- `question_count`
- `domain`
- `difficulty`
- `status`
- `created_at`

Jangan menyimpan API key.

Prompt dapat disimpan bila diperlukan untuk audit/debug, tetapi harus configurable.

## 40. Question Import

Selain AI, user dapat memasukkan question bank melalui JSON.

Contoh:

```sh
npm run questions:import -- questions.json
```

Juga tersedia UI:

```
Import Question Bank

[ Upload JSON ]

Detected: 250 questions

Valid:   243
Invalid:   7

[ Import Valid Questions ]
```

## 41. Seed Data

Project harus memiliki sample question bank.

Misalnya:

```
questions/seed.json
```

Minimal cukup untuk testing:

- 20–30 original practice questions

Tidak menggunakan AWS exam dumps.

## 42. Database Schema

Minimal:

### `exam_profiles`

- `id`
- `code`
- `name`
- `release_date`
- `question_count`
- `duration_minutes`
- `passing_score`
- `score_min`
- `score_max`

### `exam_domains`

- `id`
- `exam_profile_id`
- `name`
- `description`
- `weight`

### `questions`

- `id`
- `exam_profile_id`
- `question_text`
- `question_type`
- `difficulty`
- `domain_id`
- `subcategory`
- `explanation`
- `key_concept`
- `reference`
- `source`
- `created_at`
- `updated_at`

### `question_options`

- `id`
- `question_id`
- `option_key`
- `option_text`
- `is_correct`
- `explanation`

### `question_services`

- `id`
- `question_id`
- `service_name`

### `exam_sessions`

- `id`
- `exam_profile_id`
- `mode`
- `started_at`
- `completed_at`
- `time_limit_seconds`
- `score`
- `correct_count`
- `incorrect_count`
- `status`

### `exam_answers`

- `id`
- `exam_session_id`
- `question_id`
- `selected_answers`
- `is_correct`
- `answered_at`

### `bookmarks`

- `id`
- `question_id`
- `created_at`

### `ai_generations`

- `id`
- `model`
- `exam_profile_id`
- `question_count`
- `configuration`
- `status`
- `created_at`

## 43. No Authentication for MVP

MVP tidak membutuhkan login.

User dianggap sebagai:

```
Local User
```

Semua data disimpan dalam SQLite lokal.

Authentication dapat menjadi Phase 2.

## 44. Data Persistence

SQLite harus berada di persistent volume:

```
/app/data/saa-practice.db
```

Podman:

```yaml
volumes:
  saa-data:
```

Tujuan:

```
Container recreated
       ↓
Database remains
```

## 45. UI Design

Gunakan Flowbite Svelte secara konsisten.

Komponen utama:

- Navbar
- Sidebar
- Card
- Badge
- Button
- Modal
- Alert
- Progress
- Radio
- Checkbox
- Tabs
- Dropdown
- Toast
- Tooltip

Design harus:

- clean
- professional
- modern
- responsive
- learning-focused

## 46. Dark Mode

Support:

- Light
- Dark
- System

Gunakan mekanisme dark mode Tailwind/Flowbite Svelte.

## 47. Responsive

Wajib support:

- Desktop
- Tablet
- Mobile

Pada mobile question navigator dapat menjadi drawer/modal.

## 48. Accessibility

Minimum:

- semantic HTML
- keyboard navigation
- accessible form controls
- visible focus state
- screen-reader labels
- sufficient contrast

## 49. Error Handling

**AI error:**

```
Unable to connect to OpenCode Go.

Check:
- OpenCode Go is running
- Base URL
- API key
- selected model
```

**Database error:**

```
Unable to save your answer.
Please try again.
```

Exam session harus meminimalkan kehilangan data.

## 50. Testing Strategy

### Unit Test — Vitest

Wajib menguji:

**Scoring**

- correct answers
- incorrect answers
- multiple response
- empty answers

**Question selection**

- random
- domain
- difficulty
- wrong questions

**Exam timer**

- start
- resume
- expiration

**AI validation**

- valid JSON
- invalid JSON
- missing answer
- wrong answer count
- missing explanation

**Duplicate detection**

- same question
- similar question
- unique question

## 51. E2E Test — Playwright

Minimal:

**Scenario 1**

```
Open application
   ↓
Start practice
   ↓
Answer questions
   ↓
Submit
   ↓
Result shown
   ↓
Explanation shown
```

**Scenario 2**

```
Start mock exam
   ↓
Answer question
   ↓
Refresh browser
   ↓
Exam restored
   ↓
Timer continues
```

**Scenario 3**

```
Generate AI questions
   ↓
Preview
   ↓
Validate
   ↓
Import
   ↓
Question appears in Question Bank
```

## 52. Code Quality Pipeline

Setiap perubahan harus dapat menjalankan:

```sh
npm run lint
npm run check
npm run test
npm run test:e2e
npm run build
```

Ideal CI pipeline:

```
Lint
 ↓
Type Check
 ↓
Unit Test
 ↓
Build
 ↓
E2E
```

## 53. Package Scripts

Target:

```json
{
	"scripts": {
		"dev": "vite dev",
		"build": "vite build",
		"preview": "vite preview",
		"check": "svelte-kit sync && svelte-check",
		"lint": "eslint .",
		"format": "prettier --check .",
		"format:fix": "prettier --write .",
		"test": "vitest run",
		"test:watch": "vitest",
		"test:e2e": "playwright test",
		"db:generate": "drizzle-kit generate",
		"db:migrate": "drizzle-kit migrate",
		"db:seed": "tsx src/lib/db/seed.ts",
		"questions:import": "tsx scripts/import-questions.ts"
	}
}
```

## 54. Podman

Containerfile harus:

- menggunakan Node LTS
- install dependencies
- build SvelteKit
- run production server
- expose port 3000

`compose.yaml`:

```yaml
services:
  saa-practice:
    build:
      context: .
      dockerfile: Containerfile
    ports:
      - '3000:3000'
    env_file:
      - .env
    volumes:
      - saa-data:/app/data

volumes:
  saa-data:
```

## 55. Environment

`.env.example`:

```sh
DATABASE_URL=file:./data/saa-practice.db

OPENCODE_BASE_URL=http://localhost:20128
OPENCODE_API_KEY=
```

API key harus server-side only.

Jangan menggunakan:

```
PUBLIC_OPENCODE_API_KEY
```

## 56. Security Requirements

- API key tidak boleh masuk client bundle.
- API key tidak boleh disimpan di SQLite.
- Jangan log API key.
- Jangan expose OpenCode credentials melalui API.
- Validate semua AI output.
- Validate imported JSON.
- Sanitize rendered content.
- Jangan gunakan arbitrary HTML dari AI tanpa sanitization.

## 57. Exam Blueprint

Blueprint harus configurable.

Contoh:

```
exam_profiles
      │
      ▼
exam_domains
      │
      ▼
question_blueprints
```

Question blueprint dapat menentukan:

- domain
- difficulty distribution
- question type distribution
- AWS service focus

Sehingga perubahan exam blueprint di masa depan tidak membutuhkan perubahan besar pada application logic.

## 58. Exam Generation

Ketika user memilih:

```
Start Mock Exam
```

engine:

```
Load SAA-C03 profile
       ↓
Load blueprint
       ↓
Select questions
       ↓
Check question diversity
       ↓
Create exam session
       ↓
Start timer
```

Question tidak boleh duplicate dalam satu exam session.

## 59. Question Diversity

Mock exam sebaiknya tidak menghasilkan:

> 10 soal S3 berturut-turut

Question selection harus mempertimbangkan:

- domain distribution
- service diversity
- difficulty
- question type
- previously seen questions

## 60. Exam History

User dapat melihat:

```
Exam History

SAA-C03 Mock #12
Score: 812
Result: PASS
Date: ...
```

Klik:

```
[ Review ]
```

untuk melihat kembali hasil exam dan explanation.

## 61. Learning Loop

Core learning loop:

```
Practice
   ↓
Mistakes
   ↓
Explanation
   ↓
Practice Mistakes
   ↓
Statistics
   ↓
Weak Domain
   ↓
Targeted Practice
   ↓
Mock Exam
```

Ini menjadi tujuan utama UX aplikasi.

## 62. AI Question Quality

AI generation dianggap berhasil hanya jika:

- ✓ Scenario-based
- ✓ SAA-C03 relevant
- ✓ Architecturally meaningful
- ✓ Plausible distractors
- ✓ Correct answer defensible
- ✓ Explanation available
- ✓ Incorrect options explained
- ✓ Correct answer count valid
- ✓ No obvious duplicate
- ✓ Structured JSON valid

## 63. Definition of Done

MVP dianggap selesai jika:

### Application

- [ ] SvelteKit berjalan.
- [ ] Flowbite Svelte digunakan.
- [ ] Responsive.
- [ ] Dark mode.
- [ ] SQLite berjalan.
- [ ] Drizzle migration berjalan.
- [ ] Podman berjalan.

### Question Bank

- [ ] CRUD question.
- [ ] Single choice.
- [ ] Multiple response.
- [ ] Difficulty.
- [ ] Domain.
- [ ] AWS service.
- [ ] Explanation.
- [ ] Bookmark.
- [ ] Import JSON.

### Practice

- [ ] Random practice.
- [ ] Domain filter.
- [ ] Difficulty filter.
- [ ] Immediate explanation.
- [ ] Score.
- [ ] Wrong answer tracking.

### Mock Exam

- [ ] 65 questions.
- [ ] 130-minute timer.
- [ ] Navigator.
- [ ] Flag.
- [ ] Autosave.
- [ ] Resume.
- [ ] Auto-submit.
- [ ] Result.
- [ ] Estimated score.
- [ ] PASS/NOT YET.

### Review

- [ ] All questions.
- [ ] Correct questions.
- [ ] Incorrect questions.
- [ ] User answer.
- [ ] Correct answer.
- [ ] Explanation.
- [ ] Why incorrect.
- [ ] Key concept.

### AI

- [ ] OpenCode Go integration.
- [ ] Model discovery/selection.
- [ ] Model configurable.
- [ ] SAA-C03 prompt.
- [ ] Scenario-based generation.
- [ ] Structured output.
- [ ] Validation.
- [ ] Duplicate detection.
- [ ] Preview.
- [ ] Regeneration.
- [ ] Import.
- [ ] Generation history.

### Quality

- [ ] ESLint.
- [ ] Prettier.
- [ ] TypeScript strict.
- [ ] Unit tests.
- [ ] E2E tests.
- [ ] Production build.
- [ ] Podman build.

## 64. Phase 2 — Future

Tidak perlu diimplementasikan sekarang, tetapi architecture harus memungkinkan:

- Authentication
- Cloudflare D1
- Cloudflare Workers
- User accounts
- Cloud sync
- Multiple exam certifications
  - AWS SAA-C04
  - SAP-C02
  - DVA-C02
  - DOP-C02
- AI adaptive learning
  - Embeddings
  - Semantic duplicate detection
  - Spaced repetition

## 65. Prinsip Implementasi untuk OpenCode Go

OpenCode Go harus mengimplementasikan project bertahap, bukan membuat seluruh aplikasi dalam satu giant implementation.

**Urutan:**

```
Phase 1   Project setup
   ↓
Phase 2   SQLite + Drizzle
   ↓
Phase 3   Question Bank
   ↓
Phase 4   Practice Engine
   ↓
Phase 5   Exam Engine
   ↓
Phase 6   Result + Explanation
   ↓
Phase 7   Statistics
   ↓
Phase 8   OpenCode Go AI Integration
   ↓
Phase 9   AI Validation + Import
   ↓
Phase 10  Testing + Podman
   ↓
Final QA
```

Setiap phase harus bisa di-build dan dites sebelum lanjut ke phase berikutnya.

---

## Final Architecture Decision

Untuk versi 1.0, keputusan teknologinya dikunci sebagai berikut:

| Area      | Keputusan                             |
| --------- | ------------------------------------- |
| Frontend  | SvelteKit + TypeScript                |
| UI        | Flowbite Svelte + Tailwind CSS        |
| Backend   | SvelteKit Server                      |
| Database  | SQLite                                |
| ORM       | Drizzle                               |
| AI        | OpenCode Go                           |
| AI Model  | User selectable                       |
| Container | Podman                                |
| Testing   | Vitest + Playwright                   |
| Quality   | ESLint + Prettier + TypeScript strict |

Dan yang paling penting, SAA-C03 bukan sekadar label di aplikasi. Seluruh AI generation, question schema, question selection, mock exam, dan review harus dibangun dengan SAA-C03 exam profile/blueprint sebagai sumber aturan. AI boleh berganti-ganti model, tetapi aturan soal tetap dikontrol oleh aplikasi, sehingga mengganti `opencode-go/gpt-5.6-luna` ke model lain tidak mengubah standar soal yang dihasilkan.
