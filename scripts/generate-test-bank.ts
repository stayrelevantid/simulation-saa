// Generates a deterministic question bank for E2E testing.
// The test suite needs at least 65 questions so mock exams can start;
// production intentionally starts empty (see src/lib/db/bootstrap.ts).
import { writeFileSync } from 'node:fs';

const COUNT = 55;
const domains = [
	'secure_architecture',
	'resilient_architecture',
	'high_performance',
	'cost_optimization'
];
const difficulties = ['easy', 'medium', 'hard'];
const services = ['Amazon S3', 'Amazon EC2', 'Amazon VPC', 'AWS Lambda', 'Amazon RDS', 'AWS IAM'];

const questions = Array.from({ length: COUNT }, (_, i) => {
	const domain = domains[i % domains.length];
	const difficulty = difficulties[i % difficulties.length];
	const service = services[i % services.length];
	const questionType = i % 5 === 0 ? 'multiple' : 'single';
	const correctIndices = questionType === 'multiple' ? [i % 4, ((i % 4) + 2) % 4] : [i % 4];

	const options = ['A', 'B', 'C', 'D'].map((key, idx) => ({
		key,
		text: `Test option ${key} for ${service} (scenario ${i + 1})`,
		correct: correctIndices.includes(idx),
		explanation: correctIndices.includes(idx)
			? `Option ${key} meets the requirements of test scenario ${i + 1}.`
			: `Option ${key} does not meet the requirements of test scenario ${i + 1}.`
	}));

	return {
		questionText: `A company operates an AWS workload for test scenario ${i + 1} involving ${service}. The solution must meet reliability, security, and cost requirements. Which solution should the solutions architect recommend?`,
		questionType,
		difficulty,
		domain,
		subcategory: 'test-bank',
		services: [service],
		options,
		explanation: `The correct approach for ${service} in scenario ${i + 1} meets all stated requirements.`,
		keyConcept: `${service} design`,
		reference: 'AWS documentation'
	};
});

writeFileSync('questions/test-bank.json', JSON.stringify(questions, null, 2));
console.log(`Generated ${questions.length} test questions -> questions/test-bank.json`);
