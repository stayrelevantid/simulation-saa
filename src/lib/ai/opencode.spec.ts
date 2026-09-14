import { afterEach, describe, expect, it, vi } from 'vitest';
import { createOpenCodeProvider, normalizeOrigin } from './opencode';
import type { AIModel } from './provider';

describe('normalizeOrigin', () => {
	it('strips a trailing /v1 from cloud gateway base URLs', () => {
		expect(normalizeOrigin('https://opencode.ai/zen/go/v1')).toBe('https://opencode.ai/zen/go');
	});

	it('strips trailing slashes', () => {
		expect(normalizeOrigin('http://localhost:20128/')).toBe('http://localhost:20128');
	});

	it('keeps origins without /v1 unchanged', () => {
		expect(normalizeOrigin('http://localhost:20128')).toBe('http://localhost:20128');
	});
});

describe('createOpenCodeProvider request paths', () => {
	const originalFetch = globalThis.fetch;

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it('builds a single /v1/models URL when the base ends with /v1', async () => {
		const calls: string[] = [];
		const response = new Response(
			JSON.stringify({ data: [{ id: 'opencode-go/deepseek-v4-flash' }] }),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			}
		);
		globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
			calls.push(String(input));
			return response;
		}) as typeof fetch;

		const provider = createOpenCodeProvider({ baseUrl: 'https://opencode.ai/zen/go/v1' });
		await provider.listModels();
		expect(calls[0]).toBe('https://opencode.ai/zen/go/v1/models');
	});

	it('keeps /v1/models for plain local origins', async () => {
		const calls: string[] = [];
		globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
			calls.push(String(input));
			return new Response(JSON.stringify({ data: [] }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}) as typeof fetch;

		const provider = createOpenCodeProvider({ baseUrl: 'http://localhost:20128' });
		await provider.listModels();
		expect(calls[0]).toBe('http://localhost:20128/v1/models');
	});

	it('maps models payload to AIModel ids', async () => {
		const payload = { data: [{ id: 'auto/best-fast' }, { id: 'opencode-go/gpt-5.6-luna' }] };
		globalThis.fetch = vi.fn(
			async () =>
				new Response(JSON.stringify(payload), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
		) as typeof fetch;

		const provider = createOpenCodeProvider({ baseUrl: 'http://localhost:20128' });
		const models: AIModel[] = await provider.listModels();
		expect(models.map((m) => m.id)).toEqual(['auto/best-fast', 'opencode-go/gpt-5.6-luna']);
	});

	it('surfaces the gateway error body in the message', async () => {
		globalThis.fetch = vi.fn(
			async () =>
				new Response(JSON.stringify({ message: 'model not found' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' }
				})
		) as typeof fetch;

		const provider = createOpenCodeProvider({ baseUrl: 'http://localhost:20128' });
		const err = await provider.listModels().catch((e) => e);
		expect(String(err)).toContain('status 400');
		expect(String(err)).toContain('model not found');
	});
});
