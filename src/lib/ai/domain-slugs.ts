export const VALID_DOMAINS = [
	'secure_architecture',
	'resilient_architecture',
	'high_performance',
	'cost_optimization'
];

export function domainSlug(domain: string): string {
	return domain.toLowerCase().replace(/[^a-z]+/g, '_');
}

function domainKey(domain: string): string {
	return domain.toLowerCase().replace(/[^a-z]+/g, '');
}

const VALID_DOMAIN_KEYS = VALID_DOMAINS.map(domainKey);

/**
 * Fuzzy-resolves a model-provided domain label (e.g. "Resilient Architectures" or
 * "resilient-architectures") to one of the canonical SAA-C03 domain slugs.
 */
export function resolveDomainSlug(value: string): string | null {
	const candidate = domainKey(value);
	for (let i = 0; i < VALID_DOMAINS.length; i++) {
		const key = VALID_DOMAIN_KEYS[i];
		if (key === candidate || key.includes(candidate) || candidate.includes(key)) {
			return VALID_DOMAINS[i];
		}
	}
	return null;
}
