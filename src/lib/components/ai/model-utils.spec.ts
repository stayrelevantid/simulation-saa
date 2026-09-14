import { describe, expect, it } from 'vitest';
import {
	modelProvider,
	modelName,
	filterModels,
	groupModels,
	RECOMMENDED_MODELS,
	pickDefaultModel
} from './model-utils';

const PREFIXED = [
	'opencode-go/deepseek-v4-flash',
	'opencode-go/gpt-5.6-luna',
	'auto/best-fast',
	'auto/best-reasoning',
	'opencode-zen/gpt-5.4',
	'ddgw/gpt-5.4-mini'
];

const GATEWAY_FLAT = [
	'deepseek-v4-flash',
	'deepseek-v4-pro',
	'gpt-5.6-luna',
	'qwen3.8-max',
	'glm-5.3',
	'kimi-k3'
];

describe('modelProvider / modelName', () => {
	it('splits provider and name', () => {
		expect(modelProvider('opencode-go/deepseek-v4-flash')).toBe('opencode-go');
		expect(modelName('opencode-go/deepseek-v4-flash')).toBe('deepseek-v4-flash');
	});

	it('groups flat gateway ids under "gateway"', () => {
		expect(modelProvider('deepseek-v4-flash')).toBe('gateway');
		expect(modelName('deepseek-v4-flash')).toBe('deepseek-v4-flash');
	});
});

describe('filterModels', () => {
	it('filters by substring case-insensitively', () => {
		const result = filterModels(PREFIXED, 'DEEPSEEK');
		expect(result.map((m) => m.id)).toEqual(['opencode-go/deepseek-v4-flash']);
	});

	it('filters a flat gateway id by its group', () => {
		const result = filterModels(GATEWAY_FLAT, '', 'gateway');
		expect(result.map((m) => m.id)).toEqual(GATEWAY_FLAT.slice().sort());
	});

	it('filters by provider group', () => {
		const result = filterModels(PREFIXED, '', 'auto');
		expect(result.map((m) => m.id)).toEqual(['auto/best-fast', 'auto/best-reasoning']);
	});

	it('combines query and provider', () => {
		const result = filterModels(PREFIXED, 'best', 'auto');
		expect(result).toHaveLength(2);
	});

	it('deduplicates', () => {
		expect(filterModels([...PREFIXED, PREFIXED[0]], '')).toHaveLength(PREFIXED.length);
	});

	it('returns all when query empty and no provider', () => {
		expect(filterModels(PREFIXED, '')).toHaveLength(PREFIXED.length);
	});
});

describe('groupModels', () => {
	it('aggregates providers including flat gateway ids', () => {
		const groups = groupModels([...PREFIXED, ...GATEWAY_FLAT].map((id) => ({ id })));
		const opencodeGo = groups.find((g) => g.id === 'opencode-go');
		expect(opencodeGo?.count).toBe(2);
		const gateway = groups.find((g) => g.id === 'gateway');
		expect(gateway?.count).toBe(GATEWAY_FLAT.length);
	});
});

describe('pickDefaultModel', () => {
	it('prefers the flat gateway id when available', () => {
		expect(pickDefaultModel(GATEWAY_FLAT)).toBe('deepseek-v4-flash');
	});

	it('matches the provider-prefixed variant on OmniRoute-style lists', () => {
		const withoutFlat = PREFIXED.filter((m) => m !== RECOMMENDED_MODELS[0]);
		// preferred[1] === 'opencode-go/deepseek-v4-flash'
		expect(pickDefaultModel(withoutFlat)).toBe('opencode-go/deepseek-v4-flash');
	});

	it('falls back to the first model when no preferred id exists', () => {
		expect(pickDefaultModel(['grok-4.5', 'hy3'])).toBe('grok-4.5');
	});

	it('returns empty string for empty list', () => {
		expect(pickDefaultModel([])).toBe('');
	});
});
