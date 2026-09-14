import type {
	AIProvider,
	AIModel,
	GenerationRequestConfig,
	AIGenerationResult
} from '$lib/ai/provider';

export class OpenCodeProviderError extends Error {
	constructor(
		message: string,
		public readonly statusCode?: number
	) {
		super(message);
		this.name = 'OpenCodeProviderError';
	}
}

export interface OpenCodeProviderConfig {
	baseUrl: string;
	apiKey?: string;
}

export function normalizeOrigin(baseUrl: string): string {
	const base = baseUrl.trim().replace(/\/+$/, '');
	// If the base URL already includes a trailing /v1 (cloud gateway),
	// strip it so provider paths append a single /v1.
	return base.replace(/\/v1$/, '');
}

export function createOpenCodeProvider(config: OpenCodeProviderConfig): AIProvider {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};
	if (config.apiKey) {
		headers['Authorization'] = `Bearer ${config.apiKey}`;
	}

	const origin = normalizeOrigin(config.baseUrl);

	async function request<T>(path: string, init?: RequestInit): Promise<T> {
		let response: Response;
		try {
			response = await fetch(`${origin}${path}`, {
				...init,
				headers: {
					...headers,
					...init?.headers,
					// The OpenCode Go gateway routes requests per session
					'x-opencode-session': crypto.randomUUID()
				}
			});
		} catch {
			throw new OpenCodeProviderError(
				'Unable to connect to OpenCode Go. Check that it is running and the base URL is correct.'
			);
		}

		if (!response.ok) {
			const detail = await response.text().catch(() => '');
			const snippet = detail.trim().slice(0, 200);
			throw new OpenCodeProviderError(
				snippet
					? `OpenCode Go request failed with status ${response.status}: ${snippet}`
					: `OpenCode Go request failed with status ${response.status}`,
				response.status
			);
		}

		return response.json() as Promise<T>;
	}

	return {
		async listModels(): Promise<AIModel[]> {
			const data = await request<{ data?: { id: string }[]; models?: { id: string }[] }>(
				'/v1/models'
			);
			const raw = data.data ?? data.models ?? [];
			return raw
				.map((m) => ({ id: m.id }))
				.filter((m): m is AIModel => typeof m.id === 'string' && m.id.length > 0);
		},

		async generateQuestions(
			generationConfig: GenerationRequestConfig,
			model: string
		): Promise<AIGenerationResult> {
			const { buildSystemPrompt, buildUserPrompt } = await import('$lib/ai/prompts/saa-c03');
			const { parseQuestionsResponse } = await import('$lib/ai/parser');

			const systemPrompt = buildSystemPrompt(generationConfig);
			const userPrompt = buildUserPrompt(generationConfig);

			const data = await request<{ choices?: { message?: { content?: string } }[] }>(
				'/v1/chat/completions',
				{
					method: 'POST',
					body: JSON.stringify({
						model,
						messages: [
							{ role: 'system', content: systemPrompt },
							{ role: 'user', content: userPrompt }
						],
						temperature: 0.8
					})
				}
			);

			const content = data.choices?.[0]?.message?.content;
			if (!content) {
				throw new OpenCodeProviderError('OpenCode Go returned an empty response.');
			}

			const questions = parseQuestionsResponse(content);
			return { questions, model };
		}
	};
}
