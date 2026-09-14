import { seedProfile } from './seed';

// Production/bootstrap seeding: only the SAA-C03 exam configuration
// (profile, domains, blueprints). No questions are seeded — the bank
// starts empty by design. Import questions later via the UI or the
// `questions:import` CLI.
seedProfile()
	.then(({ profile, domains }) => {
		console.log(
			`Exam config ensured: profile "${profile.code}" with ${Object.keys(domains).length} domains`
		);
	})
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
