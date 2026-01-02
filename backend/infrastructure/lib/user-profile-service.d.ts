/**
 * User Profile Service Infrastructure - Phase 1.2
 *
 * CDK construct for User Profile Service Lambda functions and API Gateway integration.
 * Integrates with existing Phase 1.1 infrastructure components.
 *
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 * - AWS Architecture: .kiro/specs/architecture.aws.v1.md
 */
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
/**
 * User Profile Service configuration
 */
export interface UserProfileServiceProps {
    environment: string;
    api: apigateway.RestApi;
    authorizer: apigateway.CognitoUserPoolsAuthorizer;
    mainTable: dynamodb.Table;
}
/**
 * User Profile Service construct
 *
 * Creates Lambda functions for user profile operations and integrates them
 * with the existing API Gateway and DynamoDB infrastructure.
 */
export declare class UserProfileServiceConstruct extends Construct {
    readonly getCurrentUserFunction: lambdaNodejs.NodejsFunction;
    readonly getUserByIdFunction: lambdaNodejs.NodejsFunction;
    readonly updateUserFunction: lambdaNodejs.NodejsFunction;
    constructor(scope: Construct, id: string, props: UserProfileServiceProps);
    /**
     * Set up API Gateway integration for user profile endpoints
     */
    private setupApiGatewayIntegration;
}
