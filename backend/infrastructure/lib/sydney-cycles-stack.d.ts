import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
/**
 * Sydney Cycles Main Infrastructure Stack - Phase 1.1
 *
 * This stack orchestrates all foundational infrastructure components for the
 * Sydney Cycling Platform v1 backend, implementing the canonical specifications.
 *
 * Components:
 * - Cognito User Pool for authentication
 * - DynamoDB table for data storage
 * - API Gateway for HTTP API layer
 * - CloudWatch for monitoring and logging
 *
 * Compliance:
 * - Canonical Domain Model: .kiro/specs/domain.v1.md
 * - AWS Architecture: .kiro/specs/architecture.aws.v1.md
 * - Implementation Plan: .kiro/specs/implementation.v1.md (Phase 1.1)
 */
export declare class SydneyCyclesStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
    /**
     * Add API Gateway routes for route management services (Phase 2.4)
     */
    private addRouteManagementRoutes;
}
