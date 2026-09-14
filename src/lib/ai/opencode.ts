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

export function createOpenCodeProvider(config: OpenCodeProviderConfig): AIProvider {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};
	if (config.apiKey) {
		headers['Authorization'] = `Bearer ${config.apiKey}`;
	}

	async function request<T>(path: string, init?: RequestInit): Promise<T> {
		let response: Response;
		try {
			response = await fetch(`${config.baseUrl}${path}`, { headers, ...init });
		} catch {
			throw new OpenCodeProviderError(
				'Unable to connect to OpenCode Go. Check that it is running and the base URL is correct.'
			);
		}

		if (!response.ok) {
			throw new OpenCodeProviderError(
				`OpenCode Go request failed with status ${response.status}`,
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

export function getProviderFromEnv(): AIProvider {
	const baseUrl = process.env.OPENCODE_BASE_URL ?? 'http://localhost:20128';
	const apiKey = process.env.OPENCODE_API_KEY;
	return createOpenCodeProvider({ baseUrl, apiKey });
}
