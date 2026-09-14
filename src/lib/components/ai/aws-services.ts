// AWS services that are commonly tested on the SAA-C03 exam.
export const EXAM_SERVICES: string[] = [
	'Amazon API Gateway',
	'Amazon Athena',
	'Amazon Aurora',
	'Amazon CloudFront',
	'Amazon CloudWatch',
	'Amazon DynamoDB',
	'Amazon EBS',
	'Amazon EC2',
	'Amazon ECS',
	'Amazon EFS',
	'Amazon EKS',
	'Amazon ElastiCache',
	'Amazon EventBridge',
	'Amazon GuardDuty',
	'Amazon Kinesis',
	'Amazon RDS',
	'Amazon Redshift',
	'Amazon Route 53',
	'Amazon S3',
	'Amazon S3 Glacier',
	'Amazon SNS',
	'Amazon SQS',
	'Amazon VPC',
	'AWS Auto Scaling',
	'AWS CloudTrail',
	'AWS Config',
	'AWS Database Migration Service',
	'AWS Direct Connect',
	'AWS Fargate',
	'AWS Global Accelerator',
	'AWS IAM',
	'AWS KMS',
	'AWS Lambda',
	'AWS Organizations',
	'AWS Secrets Manager',
	'AWS Shield',
	'AWS Site-to-Site VPN',
	'AWS Snow Family',
	'AWS Step Functions',
	'AWS Storage Gateway',
	'AWS Transit Gateway',
	'AWS WAF',
	'Elastic Load Balancing (ALB/NLB)'
];

export function filterExamServices(query: string): string[] {
	const q = query.trim().toLowerCase();
	if (!q) return EXAM_SERVICES;
	return EXAM_SERVICES.filter((service) => service.toLowerCase().includes(q));
}
