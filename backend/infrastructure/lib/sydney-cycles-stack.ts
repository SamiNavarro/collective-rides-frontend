import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { UserPoolConstruct } from './cognito/user-pool';
import { MainTableConstruct } from './dynamodb/main-table';
import { RestApiConstruct } from './api-gateway/rest-api';
import { UserProfileServiceConstruct } from './user-profile-service';
import { ClubServiceConstruct } from './club-service';
import { RideService } from './ride-service';
import { RouteFileService } from './route-file-service';
import { RouteTemplateService } from './route-template-service';
import { StravaIntegrationService } from './strava-integration-service';

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
export class SydneyCyclesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Environment and configuration
    const environment = this.node.tryGetContext('environment') || 'development';
    const isProd = environment === 'production';

    // Cognito User Pool for authentication
    const userPool = new UserPoolConstruct(this, 'UserPool', {
      environment,
      enableMfa: isProd, // MFA enabled in production
    });

    // DynamoDB table for data storage
    const mainTable = new MainTableConstruct(this, 'MainTable', {
      environment,
      enableBackup: isProd, // Backup enabled in production
    });

    // API Gateway for HTTP API layer
    const restApi = new RestApiConstruct(this, 'RestApi', {
      environment,
      userPool: userPool.userPool,
      enableWaf: isProd, // WAF enabled in production
    });

    // User Profile Service (Phase 1.2)
    const userProfileService = new UserProfileServiceConstruct(this, 'UserProfileService', {
      environment,
      api: restApi.api,
      authorizer: restApi.authorizer,
      mainTable: mainTable.table,
    });

    // Club Service (Phase 2.1)
    const clubService = new ClubServiceConstruct(this, 'ClubService', {
      environment,
      api: restApi.api,
      authorizer: restApi.authorizer,
      mainTable: mainTable.table,
    });

    // Ride Service (Phase 2.3)
    const rideService = new RideService(this, 'RideService', {
      api: restApi.api,
      authorizer: restApi.authorizer,
      mainTable: mainTable.table,
      environment,
    });

    // Route File Service (Phase 2.4)
    const routeFileService = new RouteFileService(this, 'RouteFileService', {
      mainTable: mainTable.table,
      environment,
    });

    // Route Template Service (Phase 2.4)
    const routeTemplateService = new RouteTemplateService(this, 'RouteTemplateService', {
      mainTable: mainTable.table,
      environment,
    });

    // Strava Integration Service (Phase 2.5)
    const stravaIntegrationService = new StravaIntegrationService(this, 'StravaIntegrationService', {
      api: restApi.api,
      mainTable: mainTable.table,
      environment,
    });

    // Add API Gateway routes for route management
    this.addRouteManagementRoutes(restApi, routeFileService, routeTemplateService);

    // Stack outputs for reference by other stacks or external systems
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPool.userPoolId,
      description: 'Cognito User Pool ID for authentication',
      exportName: `${this.stackName}-UserPoolId`,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPool.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID for frontend integration',
      exportName: `${this.stackName}-UserPoolClientId`,
    });

    new cdk.CfnOutput(this, 'MainTableName', {
      value: mainTable.table.tableName,
      description: 'DynamoDB main table name for data operations',
      exportName: `${this.stackName}-MainTableName`,
    });

    new cdk.CfnOutput(this, 'MainTableArn', {
      value: mainTable.table.tableArn,
      description: 'DynamoDB main table ARN for IAM policies',
      exportName: `${this.stackName}-MainTableArn`,
    });

    new cdk.CfnOutput(this, 'RestApiId', {
      value: restApi.api.restApiId,
      description: 'API Gateway REST API ID',
      exportName: `${this.stackName}-RestApiId`,
    });

    new cdk.CfnOutput(this, 'RestApiUrl', {
      value: restApi.api.url,
      description: 'API Gateway REST API URL for frontend integration',
      exportName: `${this.stackName}-RestApiUrl`,
    });

    // User Profile Service outputs
    new cdk.CfnOutput(this, 'GetCurrentUserFunctionName', {
      value: userProfileService.getCurrentUserFunction.functionName,
      description: 'Get current user Lambda function name',
      exportName: `${this.stackName}-GetCurrentUserFunctionName`,
    });

    new cdk.CfnOutput(this, 'GetUserByIdFunctionName', {
      value: userProfileService.getUserByIdFunction.functionName,
      description: 'Get user by ID Lambda function name',
      exportName: `${this.stackName}-GetUserByIdFunctionName`,
    });

    new cdk.CfnOutput(this, 'UpdateUserFunctionName', {
      value: userProfileService.updateUserFunction.functionName,
      description: 'Update user Lambda function name',
      exportName: `${this.stackName}-UpdateUserFunctionName`,
    });

    // Club Service outputs
    new cdk.CfnOutput(this, 'ListClubsFunctionName', {
      value: clubService.listClubsFunction.functionName,
      description: 'List clubs Lambda function name',
      exportName: `${this.stackName}-ListClubsFunctionName`,
    });

    new cdk.CfnOutput(this, 'GetClubFunctionName', {
      value: clubService.getClubFunction.functionName,
      description: 'Get club Lambda function name',
      exportName: `${this.stackName}-GetClubFunctionName`,
    });

    new cdk.CfnOutput(this, 'CreateClubFunctionName', {
      value: clubService.createClubFunction.functionName,
      description: 'Create club Lambda function name',
      exportName: `${this.stackName}-CreateClubFunctionName`,
    });

    new cdk.CfnOutput(this, 'UpdateClubFunctionName', {
      value: clubService.updateClubFunction.functionName,
      description: 'Update club Lambda function name',
      exportName: `${this.stackName}-UpdateClubFunctionName`,
    });

    // Tags for resource management
    cdk.Tags.of(this).add('Project', 'SydneyCycles');
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('Phase', '2.5-RideCompletion');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }

  /**
   * Add API Gateway routes for route management services (Phase 2.4)
   */
  private addRouteManagementRoutes(
    restApi: RestApiConstruct,
    routeFileService: RouteFileService,
    routeTemplateService: RouteTemplateService
  ): void {
    const v1Resource = restApi.api.root.getResource('v1') || restApi.api.root.addResource('v1');
    const clubsResource = v1Resource.getResource('clubs') || v1Resource.addResource('clubs');
    const clubResource = clubsResource.getResource('{clubId}') || clubsResource.addResource('{clubId}');

    // Route file management endpoints
    const routesResource = clubResource.addResource('routes');
    const routeResource = routesResource.addResource('{routeId}');
    const filesResource = routeResource.addResource('files');

    // POST /v1/clubs/{clubId}/routes/{routeId}/files/upload-url
    const uploadUrlResource = filesResource.addResource('upload-url');
    uploadUrlResource.addMethod('POST', 
      new cdk.aws_apigateway.LambdaIntegration(routeFileService.fileUploadHandler),
      {
        authorizer: restApi.authorizer,
        authorizationType: cdk.aws_apigateway.AuthorizationType.COGNITO,
      }
    );

    // POST /v1/clubs/{clubId}/routes/{routeId}/files/{version}/confirm
    const fileVersionResource = filesResource.addResource('{version}');
    const confirmResource = fileVersionResource.addResource('confirm');
    confirmResource.addMethod('POST',
      new cdk.aws_apigateway.LambdaIntegration(routeFileService.fileProcessingHandler),
      {
        authorizer: restApi.authorizer,
        authorizationType: cdk.aws_apigateway.AuthorizationType.COGNITO,
      }
    );

    // GET /v1/clubs/{clubId}/routes/{routeId}/files/{version}/download
    const downloadResource = fileVersionResource.addResource('download');
    downloadResource.addMethod('GET',
      new cdk.aws_apigateway.LambdaIntegration(routeFileService.fileDownloadHandler),
      {
        authorizer: restApi.authorizer,
        authorizationType: cdk.aws_apigateway.AuthorizationType.COGNITO,
      }
    );

    // GET /v1/clubs/{clubId}/routes/{routeId}/files/{version}/status
    const statusResource = fileVersionResource.addResource('status');
    statusResource.addMethod('GET',
      new cdk.aws_apigateway.LambdaIntegration(routeFileService.fileProcessingHandler),
      {
        authorizer: restApi.authorizer,
        authorizationType: cdk.aws_apigateway.AuthorizationType.COGNITO,
      }
    );

    // GET /v1/clubs/{clubId}/routes/{routeId}/analytics
    const analyticsResource = routeResource.addResource('analytics');
    analyticsResource.addMethod('GET',
      new cdk.aws_apigateway.LambdaIntegration(routeFileService.analyticsHandler),
      {
        authorizer: restApi.authorizer,
        authorizationType: cdk.aws_apigateway.AuthorizationType.COGNITO,
      }
    );

    // Route template management endpoints
    const templatesResource = clubResource.addResource('templates');

    // POST /v1/clubs/{clubId}/templates
    templatesResource.addMethod('POST',
      new cdk.aws_apigateway.LambdaIntegration(routeTemplateService.templateHandler),
      {
        authorizer: restApi.authorizer,
        authorizationType: cdk.aws_apigateway.AuthorizationType.COGNITO,
      }
    );

    // GET /v1/clubs/{clubId}/templates
    templatesResource.addMethod('GET',
      new cdk.aws_apigateway.LambdaIntegration(routeTemplateService.searchHandler),
      {
        authorizer: restApi.authorizer,
        authorizationType: cdk.aws_apigateway.AuthorizationType.COGNITO,
      }
    );
  }
}