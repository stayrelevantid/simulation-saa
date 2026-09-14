export type BarColor = 'teal' | 'yellow' | 'red' | 'gray';

export interface BarItem {
	label: string;
	value: number;
	attempts?: number;
	color: BarColor;
}

export function accuracyBarColor(accuracy: number): BarColor {
	if (accuracy >= 0.8) return 'teal';
	if (accuracy >= 0.6) return 'yellow';
	return 'red';
}

export function toBarItems(
	items: { value: number; attempts?: number }[],
	labelFn: (item: unknown, index: number) => string
): BarItem[] {
	return items.map((item, index) => ({
		label: labelFn(item, index),
		value: item.value,
		attempts: item.attempts,
		color:
			item.attempts !== undefined && item.attempts === 0 ? 'gray' : accuracyBarColor(item.value)
	}));
}

export function topByAccuracy<T extends { accuracy: number; attempted: number }, K extends keyof T>(
	items: T[],
	labelKey: K,
	limit: number
): { label: string; value: number; attempts: number }[] {
	return items
		.filter((item) => item.attempted > 0)
		.sort((a, b) => b.accuracy - a.accuracy)
		.slice(0, limit)
		.map((item) => ({
			label: String(item[labelKey]),
			value: item.accuracy,
			attempts: item.attempted
		}));
}

export function pct(value: number): string {
	return `${Math.round(value * 100)}%`;
}

export function shortDate(iso: string): string {
	return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
