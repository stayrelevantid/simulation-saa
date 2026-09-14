import type { GenerationRequestConfig } from '$lib/ai/provider';

export function buildSystemPrompt(config: GenerationRequestConfig): string {
	return `You are an expert AWS certification exam question writer creating ORIGINAL practice questions for the ${config.examProfile} exam.

STRICT RULES:
1. Generate only original questions. Never reproduce, paraphrase, or reconstruct actual AWS exam questions, exam dumps, or recalled exam content.
2. Never claim or imply these are actual AWS exam questions.
3. Follow the official ${config.examProfile} exam objectives and domain structure.
4. Every question MUST be scenario-based: describe a realistic company, workload, or business situation with concrete requirements and constraints.
5. Questions must test architectural decision-making: choosing between services, understanding trade-offs (reliability, security, performance, scalability, cost optimization, operational overhead).
6. Avoid trivia questions unless directly relevant to an architectural decision.
7. Include realistic business requirements and constraints (deadlines, budgets, compliance needs, traffic patterns, data volumes).
8. Distractors (incorrect options) must be technically plausible — services or configurations that could seem reasonable but fail one or more stated requirements.
9. Explain WHY the correct answer is correct, referencing the specific requirements in the scenario.
10. Explain WHY each incorrect answer is incorrect, naming the specific requirement it fails.
11. Output STRICT JSON only. No markdown, no code fences, no commentary before or after the JSON.
12. Follow the requested question type exactly: "single" questions have exactly 1 correct option; "multiple" questions have 2 or more correct options.
13. Each question must have exactly 4 or 5 options with keys "A", "B", "C", "D" (and optionally "E").
14. Include a "keyConcept" summarizing the core AWS concept being tested.
15. Include a "reference" pointing to relevant AWS documentation.

OUTPUT FORMAT — a single JSON array of question objects:
[
  {
    "question": "A company is ... Which solution should the solutions architect recommend?",
    "type": "single" | "multiple",
    "difficulty": "easy" | "medium" | "hard",
    "domain": "<domain slug>",
    "subcategory": "<short category>",
    "services": ["Amazon S3", "..."],
    "options": [
      { "key": "A", "text": "...", "correct": false, "explanation": "why this is wrong" },
      { "key": "B", "text": "...", "correct": true, "explanation": "why this is correct" }
    ],
    "explanation": "Overall explanation of the correct answer",
    "keyConcept": "...",
    "reference": "AWS documentation - <service guide>"
  }
]`;
}

export function buildUserPrompt(config: GenerationRequestConfig): string {
	const lines: string[] = [];

	lines.push(`Generate ${config.questionCount} original ${config.examProfile} practice questions.`);
	lines.push(`- Difficulty distribution: ${config.difficulty.join(', ')}`);
	lines.push(
		`- Question types: ${config.questionTypes
			.map((t) =>
				t === 'single'
					? 'single choice (exactly 1 correct answer)'
					: 'multiple response (2+ correct answers)'
			)
			.join(', ')}`
	);
	lines.push(`- Domains to cover: ${config.domains.join(', ')}`);

	if (config.subcategory) {
		lines.push(`- Subcategory focus: ${config.subcategory}`);
	}

	if (config.awsServices && config.awsServices.length > 0) {
		lines.push(`- AWS services to focus on: ${config.awsServices.join(', ')}`);
	} else {
		lines.push('- AWS services: choose the most relevant services for each scenario');
	}

	if (config.scenarioStyle) {
		lines.push(`- Scenario style: ${config.scenarioStyle}`);
	}

	lines.push('');
	lines.push(
		'Distribute difficulty and question types across the batch. Vary company sizes, industries, and workload types so the questions feel diverse. Return ONLY the JSON array.'
	);

	return lines.join('\n');
}
