import { seedProfile, importQuestions } from '../src/lib/db/seed';
import { readFileSync } from 'node:fs';

if (process.env.NODE_ENV === 'production') {
	console.error(
		'Importing seed questions is not allowed in production. Use the AI Generator instead.'
	);
	process.exit(1);
}

const file = process.argv[2];
if (!file) {
	console.error('Usage: npm run questions:import -- <questions.json>');
	process.exit(1);
}

const raw = JSON.parse(readFileSync(file, 'utf-8')) as unknown[];
const items = Array.isArray(raw) ? raw : [raw];

const { profile, domains } = await seedProfile();
const result = await importQuestions(items, profile.id, domains);

console.log(`Detected:   ${items.length} questions`);
console.log(`Imported:   ${result.valid}`);
console.log(`Duplicates: ${result.duplicates}`);
console.log(`Invalid:    ${result.invalid}`);
if (result.errors.length > 0) {
	for (const e of result.errors) console.error(`  ${e}`);
	process.exit(1);
}
