import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
/**
 * API Gateway REST API Configuration
 *
 * Interface for configuring the REST API construct based on environment
 * and security requirements.
 */
export interface RestApiConstructProps {
    environment: string;
    userPool: cognito.UserPool;
    enableWaf?: boolean;
}
/**
 * API Gateway REST API Construct - Phase 1.1
 *
 * Creates and configures AWS API Gateway REST API for HTTP API layer
 * according to the canonical AWS architecture specification.
 *
 * Features:
 * - REST API with proper CORS configuration
 * - Health check endpoint for monitoring
 * - JWT authorizer integration (ready for Phase 1.2)
 * - CloudWatch logging and monitoring
 * - Request/response validation
 * - WAF integration for production security
 *
 * Compliance:
 * - AWS Architecture: .kiro/specs/architecture.aws.v1.md
 * - Implementation Plan: .kiro/specs/implementation.v1.md (Phase 1.1)
 */
export declare class RestApiConstruct extends Construct {
    readonly api: apigateway.RestApi;
    readonly authorizer: apigateway.CognitoUserPoolsAuthorizer;
    constructor(scope: Construct, id: string, props: RestApiConstructProps);
    /**
     * Creates a health check endpoint for monitoring
     */
    private createHealthCheckEndpoint;
    /**
     * Creates API resource structure for future phases
     */
    private createApiResourceStructure;
    /**
     * Creates API models for request/response validation
     */
    private createApiModels;
    /**
     * Creates usage plan for rate limiting in production
     */
    private createUsagePlan;
    /**
     * Configures WAF for production security
     */
    private configureWaf;
}
