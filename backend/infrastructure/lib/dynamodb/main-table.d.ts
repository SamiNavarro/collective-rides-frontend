import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
/**
 * DynamoDB Main Table Configuration
 *
 * Interface for configuring the main table construct based on environment
 * and operational requirements.
 */
export interface MainTableConstructProps {
    environment: string;
    enableBackup?: boolean;
}
/**
 * DynamoDB Main Table Construct - Phase 1.1
 *
 * Creates and configures the primary DynamoDB table for all v1 domain entities
 * using single-table design pattern as specified in the canonical architecture.
 *
 * Features:
 * - Single table design with flexible access patterns
 * - Global Secondary Indexes for efficient queries
 * - Strong consistency for critical operations
 * - On-demand billing for cost optimization
 * - Backup and point-in-time recovery for production
 *
 * Entity Storage Patterns (from canonical domain model):
 * - Users:           PK=USER#{id},           SK=PROFILE
 * - Clubs:           PK=CLUB#{id},           SK=METADATA
 * - Memberships:     PK=CLUB#{id},           SK=MEMBER#{user_id}
 * - Rides:           PK=CLUB#{id},           SK=RIDE#{ride_id}
 * - Participations:  PK=RIDE#{id},           SK=PARTICIPANT#{user_id}
 *
 * Compliance:
 * - AWS Architecture: .kiro/specs/architecture.aws.v1.md
 * - Domain Model: All entities from .kiro/specs/domain.v1.md
 */
export declare class MainTableConstruct extends Construct {
    readonly table: dynamodb.Table;
    constructor(scope: Construct, id: string, props: MainTableConstructProps);
    /**
     * Grant read permissions to a principal
     */
    grantReadData(grantee: cdk.aws_iam.IGrantable): cdk.aws_iam.Grant;
    /**
     * Grant write permissions to a principal
     */
    grantWriteData(grantee: cdk.aws_iam.IGrantable): cdk.aws_iam.Grant;
    /**
     * Grant full access permissions to a principal
     */
    grantFullAccess(grantee: cdk.aws_iam.IGrantable): cdk.aws_iam.Grant;
    /**
     * Grant stream read permissions to a principal
     */
    grantStreamRead(grantee: cdk.aws_iam.IGrantable): cdk.aws_iam.Grant;
}
