export function modelProvider(id: string): string {
	const parts = id.split('/');
	if (parts.length === 1) return 'gateway';
	return parts[0];
}

export function modelName(id: string): string {
	const parts = id.split('/');
	return parts.slice(1).join('/') || id;
}

export function filterModels(
	models: string[],
	query: string,
	provider?: string
): { id: string; provider: string; name: string }[] {
	const q = query.trim().toLowerCase();

	return [...new Set(models)]
		.sort()
		.filter((id) => {
			if (!id.toLowerCase().includes(q)) return false;
			if (provider) return modelProvider(id) === provider;
			return true;
		})
		.map((id) => ({ id, provider: modelProvider(id), name: modelName(id) }));
}

export function groupModels(
	models: { id: string }[]
): { id: string; name: string; count: number }[] {
	const counts = new Map<string, number>();
	for (const m of models) {
		const p = modelProvider(m.id);
		counts.set(p, (counts.get(p) ?? 0) + 1);
	}
	return [...counts.entries()]
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
		.map(([id, count]) => ({ id, name: id, count }));
}

export const RECOMMENDED_MODELS = [
	'deepseek-v4-flash',
	'deepseek-v4-pro',
	'glm-5.3',
	'kimi-k3',
	'opencode-go/deepseek-v4-flash',
	'auto/best-reasoning',
	'auto/best-fast'
];

export function pickDefaultModel(
	models: string[],
	preferred: string[] = RECOMMENDED_MODELS
): string {
	for (const id of preferred) {
		if (models.includes(id)) return id;
	}
	return models[0] ?? '';
}
