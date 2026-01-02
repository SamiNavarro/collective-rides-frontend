/**
 * Club Service Infrastructure - Phase 2.1
 *
 * CDK construct for Club Service Lambda functions and API Gateway integration.
 * Integrates with existing Phase 1.x infrastructure components.
 *
 * Compliance:
 * - Phase 2.1 Spec: .kiro/specs/phase-2.1.club-service.v1.md
 * - AWS Architecture: .kiro/specs/architecture.aws.v1.md
 */
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
/**
 * Club Service configuration
 */
export interface ClubServiceProps {
    environment: string;
    api: apigateway.RestApi;
    authorizer: apigateway.CognitoUserPoolsAuthorizer;
    mainTable: dynamodb.Table;
}
/**
 * Club Service construct
 *
 * Creates Lambda functions for club operations and integrates them
 * with the existing API Gateway and DynamoDB infrastructure.
 */
export declare class ClubServiceConstruct extends Construct {
    readonly listClubsFunction: lambdaNodejs.NodejsFunction;
    readonly getClubFunction: lambdaNodejs.NodejsFunction;
    readonly createClubFunction: lambdaNodejs.NodejsFunction;
    readonly updateClubFunction: lambdaNodejs.NodejsFunction;
    readonly joinClubFunction: lambdaNodejs.NodejsFunction;
    readonly leaveClubFunction: lambdaNodejs.NodejsFunction;
    readonly listMembersFunction: lambdaNodejs.NodejsFunction;
    readonly updateMemberFunction: lambdaNodejs.NodejsFunction;
    readonly removeMemberFunction: lambdaNodejs.NodejsFunction;
    readonly inviteUserFunction: lambdaNodejs.NodejsFunction;
    readonly acceptInvitationFunction: lambdaNodejs.NodejsFunction;
    readonly listInvitationsFunction: lambdaNodejs.NodejsFunction;
    readonly getMembershipsFunction: lambdaNodejs.NodejsFunction;
    readonly processJoinRequestFunction: lambdaNodejs.NodejsFunction;
    constructor(scope: Construct, id: string, props: ClubServiceProps);
    /**
     * Tag all functions for resource management
     */
    private tagAllFunctions;
    /**
     * Set up API Gateway integration for club endpoints
     */
    private setupApiGatewayIntegration;
}
