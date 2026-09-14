import { describe, expect, it } from 'vitest';
import { EXAM_SERVICES, filterExamServices } from './aws-services';

describe('EXAM_SERVICES', () => {
	it('is not empty and contains core SAA-C03 services', () => {
		expect(EXAM_SERVICES.length).toBeGreaterThan(20);
		expect(EXAM_SERVICES).toContain('Amazon EC2');
		expect(EXAM_SERVICES).toContain('Amazon S3');
		expect(EXAM_SERVICES).toContain('Amazon VPC');
		expect(EXAM_SERVICES).toContain('AWS IAM');
	});

	it('has unique entries', () => {
		expect(new Set(EXAM_SERVICES).size).toBe(EXAM_SERVICES.length);
	});
});

describe('filterExamServices', () => {
	it('returns all services for an empty query', () => {
		expect(filterExamServices('')).toHaveLength(EXAM_SERVICES.length);
	});

	it('filters case-insensitively by substring', () => {
		const result = filterExamServices('s3');
		expect(result).toContain('Amazon S3');
		expect(result).toContain('Amazon S3 Glacier');
	});

	it('matches provider-prefixed queries', () => {
		expect(filterExamServices('AWS')).toContain('AWS Lambda');
	});

	it('returns an empty array when nothing matches', () => {
		expect(filterExamServices('zzz-not-a-service')).toEqual([]);
	});
});
