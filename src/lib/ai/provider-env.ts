import { env } from '$env/dynamic/private';
import { createOpenCodeProvider } from './opencode';

export function getProviderFromEnv() {
	return createOpenCodeProvider({
		baseUrl: env.OPENCODE_BASE_URL ?? 'http://localhost:20128',
		apiKey: env.OPENCODE_API_KEY
	});
}

export function getOpenCodeBaseUrl(): string {
	return env.OPENCODE_BASE_URL ?? 'http://localhost:20128';
}
