"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SydneyCyclesStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const user_pool_1 = require("./cognito/user-pool");
const main_table_1 = require("./dynamodb/main-table");
const rest_api_1 = require("./api-gateway/rest-api");
const user_profile_service_1 = require("./user-profile-service");
const club_service_1 = require("./club-service");
const ride_service_1 = require("./ride-service");
const route_file_service_1 = require("./route-file-service");
const route_template_service_1 = require("./route-template-service");
const strava_integration_service_1 = require("./strava-integration-service");
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
class SydneyCyclesStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Environment and configuration
        const environment = this.node.tryGetContext('environment') || 'development';
        const isProd = environment === 'production';
        // Cognito User Pool for authentication
        const userPool = new user_pool_1.UserPoolConstruct(this, 'UserPool', {
            environment,
            enableMfa: isProd, // MFA enabled in production
        });
        // DynamoDB table for data storage
        const mainTable = new main_table_1.MainTableConstruct(this, 'MainTable', {
            environment,
            enableBackup: isProd, // Backup enabled in production
        });
        // API Gateway for HTTP API layer
        const restApi = new rest_api_1.RestApiConstruct(this, 'RestApi', {
            environment,
            userPool: userPool.userPool,
            enableWaf: isProd, // WAF enabled in production
        });
        // User Profile Service (Phase 1.2)
        const userProfileService = new user_profile_service_1.UserProfileServiceConstruct(this, 'UserProfileService', {
            environment,
            api: restApi.api,
            authorizer: restApi.authorizer,
            mainTable: mainTable.table,
        });
        // Club Service (Phase 2.1)
        const clubService = new club_service_1.ClubServiceConstruct(this, 'ClubService', {
            environment,
            api: restApi.api,
            authorizer: restApi.authorizer,
            mainTable: mainTable.table,
        });
        // Ride Service (Phase 2.3)
        const rideService = new ride_service_1.RideService(this, 'RideService', {
            api: restApi.api,
            authorizer: restApi.authorizer,
            mainTable: mainTable.table,
            environment,
        });
        // Route File Service (Phase 2.4)
        const routeFileService = new route_file_service_1.RouteFileService(this, 'RouteFileService', {
            mainTable: mainTable.table,
            environment,
        });
        // Route Template Service (Phase 2.4)
        const routeTemplateService = new route_template_service_1.RouteTemplateService(this, 'RouteTemplateService', {
            mainTable: mainTable.table,
            environment,
        });
        // Strava Integration Service (Phase 2.5)
        const stravaIntegrationService = new strava_integration_service_1.StravaIntegrationService(this, 'StravaIntegrationService', {
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
    addRouteManagementRoutes(restApi, routeFileService, routeTemplateService) {
        const v1Resource = restApi.api.root.getResource('v1') || restApi.api.root.addResource('v1');
        const clubsResource = v1Resource.getResource('clubs') || v1Resource.addResource('clubs');
        const clubResource = clubsResource.getResource('{clubId}') || clubsResource.addResource('{clubId}');
        // Route file management endpoints
        const routesResource = clubResource.addResource('routes');
        const routeResource = routesResource.addResource('{routeId}');
        const filesResource = routeResource.addResource('files');
        // POST /v1/clubs/{clubId}/routes/{routeId}/files/upload-url
        const uploadUrlResource = filesResource.addResource('upload-url');
        uploadUrlResource.addMethod('POST', new cdk.aws_apigateway.LambdaIntegration(routeFileService.fileUploadHandler), {
            authorizer: restApi.authorizer,
            authorizationType: cdk.aws_apigateway.AuthorizationType.COGNITO,
        });
        // POST /v1/clubs/{clubId}/routes/{routeId}/files/{version}/confirm
        const fileVersionResource = filesResource.addResource('{version}');
        const confirmResource = fileVersionResource.addResource('confirm');
        confirmResource.addMethod('POST', new cdk.aws_apigateway.LambdaIntegration(routeFileService.fileProcessingHandler), {
            authorizer: restApi.authorizer,
            authorizationType: cdk.aws_apigateway.AuthorizationType.COGNITO,
        });
        // GET /v1/clubs/{clubId}/routes/{routeId}/files/{version}/download
        const downloadResource = fileVersionResource.addResource('download');
        downloadResource.addMethod('GET', new cdk.aws_apigateway.LambdaIntegration(routeFileService.fileDownloadHandler), {
            authorizer: restApi.authorizer,
            authorizationType: cdk.aws_apigateway.AuthorizationType.COGNITO,
        });
        // GET /v1/clubs/{clubId}/routes/{routeId}/files/{version}/status
        const statusResource = fileVersionResource.addResource('status');
        statusResource.addMethod('GET', new cdk.aws_apigateway.LambdaIntegration(routeFileService.fileProcessingHandler), {
            authorizer: restApi.authorizer,
            authorizationType: cdk.aws_apigateway.AuthorizationType.COGNITO,
        });
        // GET /v1/clubs/{clubId}/routes/{routeId}/analytics
        const analyticsResource = routeResource.addResource('analytics');
        analyticsResource.addMethod('GET', new cdk.aws_apigateway.LambdaIntegration(routeFileService.analyticsHandler), {
            authorizer: restApi.authorizer,
            authorizationType: cdk.aws_apigateway.AuthorizationType.COGNITO,
        });
        // Route template management endpoints
        const templatesResource = clubResource.addResource('templates');
        // POST /v1/clubs/{clubId}/templates
        templatesResource.addMethod('POST', new cdk.aws_apigateway.LambdaIntegration(routeTemplateService.templateHandler), {
            authorizer: restApi.authorizer,
            authorizationType: cdk.aws_apigateway.AuthorizationType.COGNITO,
        });
        // GET /v1/clubs/{clubId}/templates
        templatesResource.addMethod('GET', new cdk.aws_apigateway.LambdaIntegration(routeTemplateService.searchHandler), {
            authorizer: restApi.authorizer,
            authorizationType: cdk.aws_apigateway.AuthorizationType.COGNITO,
        });
    }
}
exports.SydneyCyclesStack = SydneyCyclesStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3lkbmV5LWN5Y2xlcy1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInN5ZG5leS1jeWNsZXMtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFFbkMsbURBQXdEO0FBQ3hELHNEQUEyRDtBQUMzRCxxREFBMEQ7QUFDMUQsaUVBQXFFO0FBQ3JFLGlEQUFzRDtBQUN0RCxpREFBNkM7QUFDN0MsNkRBQXdEO0FBQ3hELHFFQUFnRTtBQUNoRSw2RUFBd0U7QUFFeEU7Ozs7Ozs7Ozs7Ozs7Ozs7R0FnQkc7QUFDSCxNQUFhLGlCQUFrQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQzlDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsZ0NBQWdDO1FBQ2hDLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxJQUFJLGFBQWEsQ0FBQztRQUM1RSxNQUFNLE1BQU0sR0FBRyxXQUFXLEtBQUssWUFBWSxDQUFDO1FBRTVDLHVDQUF1QztRQUN2QyxNQUFNLFFBQVEsR0FBRyxJQUFJLDZCQUFpQixDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDdkQsV0FBVztZQUNYLFNBQVMsRUFBRSxNQUFNLEVBQUUsNEJBQTRCO1NBQ2hELENBQUMsQ0FBQztRQUVILGtDQUFrQztRQUNsQyxNQUFNLFNBQVMsR0FBRyxJQUFJLCtCQUFrQixDQUFDLElBQUksRUFBRSxXQUFXLEVBQUU7WUFDMUQsV0FBVztZQUNYLFlBQVksRUFBRSxNQUFNLEVBQUUsK0JBQStCO1NBQ3RELENBQUMsQ0FBQztRQUVILGlDQUFpQztRQUNqQyxNQUFNLE9BQU8sR0FBRyxJQUFJLDJCQUFnQixDQUFDLElBQUksRUFBRSxTQUFTLEVBQUU7WUFDcEQsV0FBVztZ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LENBQUMsaUJBQWlCLENBQUMsT0FBTztTQUNoRSxDQUNGLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUExUEQsOENBMFBDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0IHsgVXNlclBvb2xDb25zdHJ1Y3QgfSBmcm9tICcuL2NvZ25pdG8vdXNlci1wb29sJztcbmltcG9ydCB7IE1haW5UYWJsZUNvbnN0cnVjdCB9IGZyb20gJy4vZHluYW1vZGIvbWFpbi10YWJsZSc7XG5pbXBvcnQgeyBSZXN0QXBpQ29uc3RydWN0IH0gZnJvbSAnLi9hcGktZ2F0ZXdheS9yZXN0LWFwaSc7XG5pbXBvcnQgeyBVc2VyUHJvZmlsZVNlcnZpY2VDb25zdHJ1Y3QgfSBmcm9tICcuL3VzZXItcHJvZmlsZS1zZXJ2aWNlJztcbmltcG9ydCB7IENsdWJTZXJ2aWNlQ29uc3RydWN0IH0gZnJvbSAnLi9jbHViLXNlcnZpY2UnO1xuaW1wb3J0IHsgUmlkZVNlcnZpY2UgfSBmcm9tICcuL3JpZGUtc2VydmljZSc7XG5pbXBvcnQgeyBSb3V0ZUZpbGVTZXJ2aWNlIH0gZnJvbSAnLi9yb3V0ZS1maWxlLXNlcnZpY2UnO1xuaW1wb3J0IHsgUm91dGVUZW1wbGF0ZVNlcnZpY2UgfSBmcm9tICcuL3JvdXRlLXRlbXBsYXRlLXNlcnZpY2UnO1xuaW1wb3J0IHsgU3RyYXZhSW50ZWdyYXRpb25TZXJ2aWNlIH0gZnJvbSAnLi9zdHJhdmEtaW50ZWdyYXRpb24tc2VydmljZSc7XG5cbi8qKlxuICogU3lkbmV5IEN5Y2xlcyBNYWluIEluZnJhc3RydWN0dXJlIFN0YWNrIC0gUGhhc2UgMS4xXG4gKiBcbiAqIFRoaXMgc3RhY2sgb3JjaGVzdHJhdGVzIGFsbCBmb3VuZGF0aW9uYWwgaW5mcmFzdHJ1Y3R1cmUgY29tcG9uZW50cyBmb3IgdGhlXG4gKiBTeWRuZXkgQ3ljbGluZyBQbGF0Zm9ybSB2MSBiYWNrZW5kLCBpbXBsZW1lbnRpbmcgdGhlIGNhbm9uaWNhbCBzcGVjaWZpY2F0aW9ucy5cbiAqIFxuICogQ29tcG9uZW50czpcbiAqIC0gQ29nbml0byBVc2VyIFBvb2wgZm9yIGF1dGhlbnRpY2F0aW9uXG4gKiAtIER5bmFtb0RCIHRhYmxlIGZvciBkYXRhIHN0b3JhZ2VcbiAqIC0gQVBJIEdhdGV3YXkgZm9yIEhUVFAgQVBJIGxheWVyXG4gKiAtIENsb3VkV2F0Y2ggZm9yIG1vbml0b3JpbmcgYW5kIGxvZ2dpbmdcbiAqIFxuICogQ29tcGxpYW5jZTpcbiAqIC0gQ2Fub25pY2FsIERvbWFpbiBNb2RlbDogLmtpcm8vc3BlY3MvZG9tYWluLnYxLm1kXG4gKiAtIEFXUyBBcmNoaXRlY3R1cmU6IC5raXJvL3NwZWNzL2FyY2hpdGVjdHVyZS5hd3MudjEubWRcbiAqIC0gSW1wbGVtZW50YXRpb24gUGxhbjogLmtpcm8vc3BlY3MvaW1wbGVtZW50YXRpb24udjEubWQgKFBoYXNlIDEuMSlcbiAqL1xuZXhwb3J0IGNsYXNzIFN5ZG5leUN5Y2xlc1N0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gRW52aXJvbm1lbnQgYW5kIGNvbmZpZ3VyYXRpb25cbiAgICBjb25zdCBlbnZpcm9ubWVudCA9IHRoaXMubm9kZS50cnlHZXRDb250ZXh0KCdlbnZpcm9ubWVudCcpIHx8ICdkZXZlbG9wbWVudCc7XG4gICAgY29uc3QgaXNQcm9kID0gZW52aXJvbm1lbnQgPT09ICdwcm9kdWN0aW9uJztcblxuICAgIC8vIENvZ25pdG8gVXNlciBQb29sIGZvciBhdXRoZW50aWNhdGlvblxuICAgIGNvbnN0IHVzZXJQb29sID0gbmV3IFVzZXJQb29sQ29uc3RydWN0KHRoaXMsICdVc2VyUG9vbCcsIHtcbiAgICAgIGVudmlyb25tZW50LFxuICAgICAgZW5hYmxlTWZhOiBpc1Byb2QsIC8vIE1GQSBlbmFibGVkIGluIHByb2R1Y3Rpb25cbiAgICB9KTtcblxuICAgIC8vIER5bmFtb0RCIHRhYmxlIGZvciBkYXRhIHN0b3JhZ2VcbiAgICBjb25zdCBtYWluVGFibGUgPSBuZXcgTWFpblRhYmxlQ29uc3RydWN0KHRoaXMsICdNYWluVGFibGUnLCB7XG4gICAgICBlbnZpcm9ubWVudCxcbiAgICAgIGVuYWJsZUJhY2t1cDogaXNQcm9kLCAvLyBCYWNrdXAgZW5hYmxlZCBpbiBwcm9kdWN0aW9uXG4gICAgfSk7XG5cbiAgICAvLyBBUEkgR2F0ZXdheSBmb3IgSFRUUCBBUEkgbGF5ZXJcbiAgICBjb25zdCByZXN0QXBpID0gbmV3IFJlc3RBcGlDb25zdHJ1Y3QodGhpcywgJ1Jlc3RBcGknLCB7XG4gICAgICBlbnZpcm9ubWVudCxcbiAgICAgIHVzZXJQb29sOiB1c2VyUG9vbC51c2VyUG9vbCxcbiAgICAgIGVuYWJsZVdhZjogaXNQcm9kLCAvLyBXQUYgZW5hYmxlZCBpbiBwcm9kdWN0aW9uXG4gICAgfSk7XG5cbiAgICAvLyBVc2VyIFByb2ZpbGUgU2VydmljZSAoUGhhc2UgMS4yKVxuICAgIGNvbnN0IHVzZXJQcm9maWxlU2VydmljZSA9IG5ldyBVc2VyUHJvZmlsZVNlcnZpY2VDb25zdHJ1Y3QodGhpcywgJ1VzZXJQcm9maWxlU2VydmljZScsIHtcbiAgICAgIGVudmlyb25tZW50LFxuICAgICAgYXBpOiByZXN0QXBpLmFwaSxcbiAgICAgIGF1dGhvcml6ZXI6IHJlc3RBcGkuYXV0aG9yaXplcixcbiAgICAgIG1haW5UYWJsZTogbWFpblRhYmxlLnRhYmxlLFxuICAgIH0pO1xuXG4gICAgLy8gQ2x1YiBTZXJ2aWNlIChQaGFzZSAyLjEpXG4gICAgY29uc3QgY2x1YlNlcnZpY2UgPSBuZXcgQ2x1YlNlcnZpY2VDb25zdHJ1Y3QodGhpcywgJ0NsdWJTZXJ2aWNlJywge1xuICAgICAgZW52aXJvbm1lbnQsXG4gICAgICBhcGk6IHJlc3RBcGkuYXBpLFxuICAgICAgYXV0aG9yaXplcjogcmVzdEFwaS5hdXRob3JpemVyLFxuICAgICAgbWFpblRhYmxlOiBtYWluVGFibGUudGFibGUsXG4gICAgfSk7XG5cbiAgICAvLyBSaWRlIFNlcnZpY2UgKFBoYXNlIDIuMylcbiAgICBjb25zdCByaWRlU2VydmljZSA9IG5ldyBSaWRlU2VydmljZSh0aGlzLCAnUmlkZVNlcnZpY2UnLCB7XG4gICAgICBhcGk6IHJlc3RBcGkuYXBpLFxuICAgICAgYXV0aG9yaXplcjogcmVzdEFwaS5hdXRob3JpemVyLFxuICAgICAgbWFpblRhYmxlOiBtYWluVGFibGUudGFibGUsXG4gICAgICBlbnZpcm9ubWVudCxcbiAgICB9KTtcblxuICAgIC8vIFJvdXRlIEZpbGUgU2VydmljZSAoUGhhc2UgMi40KVxuICAgIGNvbnN0IHJvdXRlRmlsZVNlcnZpY2UgPSBuZXcgUm91dGVGaWxlU2VydmljZSh0aGlzLCAnUm91dGVGaWxlU2VydmljZScsIHtcbiAgICAgIG1haW5UYWJsZTogbWFpblRhYmxlLnRhYmxlLFxuICAgICAgZW52aXJvbm1lbnQsXG4gICAgfSk7XG5cbiAgICAvLyBSb3V0ZSBUZW1wbGF0ZSBTZXJ2aWNlIChQaGFzZSAyLjQpXG4gICAgY29uc3Qgcm91dGVUZW1wbGF0ZVNlcnZpY2UgPSBuZXcgUm91dGVUZW1wbGF0ZVNlcnZpY2UodGhpcywgJ1JvdXRlVGVtcGxhdGVTZXJ2aWNlJywge1xuICAgICAgbWFpblRhYmxlOiBtYWluVGFibGUudGFibGUsXG4gICAgICBlbnZpcm9ubWVudCxcbiAgICB9KTtcblxuICAgIC8vIFN0cmF2YSBJbnRlZ3JhdGlvbiBTZXJ2aWNlIChQaGFzZSAyLjUpXG4gICAgY29uc3Qgc3RyYXZhSW50ZWdyYXRpb25TZXJ2aWNlID0gbmV3IFN0cmF2YUludGVncmF0aW9uU2VydmljZSh0aGlzLCAnU3RyYXZhSW50ZWdyYXRpb25TZXJ2aWNlJywge1xuICAgICAgYXBpOiByZXN0QXBpLmFwaSxcbiAgICAgIG1haW5UYWJsZTogbWFpblRhYmxlLnRhYmxlLFxuICAgICAgZW52aXJvbm1lbnQsXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgQVBJIEdhdGV3YXkgcm91dGVzIGZvciByb3V0ZSBtYW5hZ2VtZW50XG4gICAgdGhpcy5hZGRSb3V0ZU1hbmFnZW1lbnRSb3V0ZXMocmVzdEFwaSwgcm91dGVGaWxlU2VydmljZSwgcm91dGVUZW1wbGF0ZVNlcnZpY2UpO1xuXG4gICAgLy8gU3RhY2sgb3V0cHV0cyBmb3IgcmVmZXJlbmNlIGJ5IG90aGVyIHN0YWNrcyBvciBleHRlcm5hbCBzeXN0ZW1zXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1VzZXJQb29sSWQnLCB7XG4gICAgICB2YWx1ZTogdXNlclBvb2wudXNlclBvb2wudXNlclBvb2xJZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29nbml0byBVc2VyIFBvb2wgSUQgZm9yIGF1dGhlbnRpY2F0aW9uJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1Vc2VyUG9vbElkYCxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdVc2VyUG9vbENsaWVudElkJywge1xuICAgICAgdmFsdWU6IHVzZXJQb29sLnVzZXJQb29sQ2xpZW50LnVzZXJQb29sQ2xpZW50SWQsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvZ25pdG8gVXNlciBQb29sIENsaWVudCBJRCBmb3IgZnJvbnRlbmQgaW50ZWdyYXRpb24nLFxuICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LVVzZXJQb29sQ2xpZW50SWRgLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ01haW5UYWJsZU5hbWUnLCB7XG4gICAgICB2YWx1ZTogbWFpblRhYmxlLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnRHluYW1vREIgbWFpbiB0YWJsZSBuYW1lIGZvciBkYXRhIG9wZXJhdGlvbnMnLFxuICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LU1haW5UYWJsZU5hbWVgLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ01haW5UYWJsZUFybicsIHtcbiAgICAgIHZhbHVlOiBtYWluVGFibGUudGFibGUudGFibGVBcm4sXG4gICAgICBkZXNjcmlwdGlvbjogJ0R5bmFtb0RCIG1haW4gdGFibGUgQVJOIGZvciBJQU0gcG9saWNpZXMnLFxuICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LU1haW5UYWJsZUFybmAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnUmVzdEFwaUlkJywge1xuICAgICAgdmFsdWU6IHJlc3RBcGkuYXBpLnJlc3RBcGlJZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQVBJIEdhdGV3YXkgUkVTVCBBUEkgSUQnLFxuICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LVJlc3RBcGlJZGAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnUmVzdEFwaVVybCcsIHtcbiAgICAgIHZhbHVlOiByZXN0QXBpLmFwaS51cmwsXG4gICAgICBkZXNjcmlwdGlvbjogJ0FQSSBHYXRld2F5IFJFU1QgQVBJIFVSTCBmb3IgZnJvbnRlbmQgaW50ZWdyYXRpb24nLFxuICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LVJlc3RBcGlVcmxgLFxuICAgIH0pO1xuXG4gICAgLy8gVXNlciBQcm9maWxlIFNlcnZpY2Ugb3V0cHV0c1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdHZXRDdXJyZW50VXNlckZ1bmN0aW9uTmFtZScsIHtcbiAgICAgIHZhbHVlOiB1c2VyUHJvZmlsZVNlcnZpY2UuZ2V0Q3VycmVudFVzZXJGdW5jdGlvbi5mdW5jdGlvbk5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ0dldCBjdXJyZW50IHVzZXIgTGFtYmRhIGZ1bmN0aW9uIG5hbWUnLFxuICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUdldEN1cnJlbnRVc2VyRnVuY3Rpb25OYW1lYCxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdHZXRVc2VyQnlJZEZ1bmN0aW9uTmFtZScsIHtcbiAgICAgIHZhbHVlOiB1c2VyUHJvZmlsZVNlcnZpY2UuZ2V0VXNlckJ5SWRGdW5jdGlvbi5mdW5jdGlvbk5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ0dldCB1c2VyIGJ5IElEIExhbWJkYSBmdW5jdGlvbiBuYW1lJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1HZXRVc2VyQnlJZEZ1bmN0aW9uTmFtZWAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVXBkYXRlVXNlckZ1bmN0aW9uTmFtZScsIHtcbiAgICAgIHZhbHVlOiB1c2VyUHJvZmlsZVNlcnZpY2UudXBkYXRlVXNlckZ1bmN0aW9uLmZ1bmN0aW9uTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVXBkYXRlIHVzZXIgTGFtYmRhIGZ1bmN0aW9uIG5hbWUnLFxuICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LVVwZGF0ZVVzZXJGdW5jdGlvbk5hbWVgLFxuICAgIH0pO1xuXG4gICAgLy8gQ2x1YiBTZXJ2aWNlIG91dHB1dHNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnTGlzdENsdWJzRnVuY3Rpb25OYW1lJywge1xuICAgICAgdmFsdWU6IGNsdWJTZXJ2aWNlLmxpc3RDbHVic0Z1bmN0aW9uLmZ1bmN0aW9uTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnTGlzdCBjbHVicyBMYW1iZGEgZnVuY3Rpb24gbmFtZScsXG4gICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tTGlzdENsdWJzRnVuY3Rpb25OYW1lYCxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdHZXRDbHViRnVuY3Rpb25OYW1lJywge1xuICAgICAgdmFsdWU6IGNsdWJTZXJ2aWNlLmdldENsdWJGdW5jdGlvbi5mdW5jdGlvbk5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ0dldCBjbHViIExhbWJkYSBmdW5jdGlvbiBuYW1lJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1HZXRDbHViRnVuY3Rpb25OYW1lYCxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdDcmVhdGVDbHViRnVuY3Rpb25OYW1lJywge1xuICAgICAgdmFsdWU6IGNsdWJTZXJ2aWNlLmNyZWF0ZUNsdWJGdW5jdGlvbi5mdW5jdGlvbk5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NyZWF0ZSBjbHViIExhbWJkYSBmdW5jdGlvbiBuYW1lJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1DcmVhdGVDbHViRnVuY3Rpb25OYW1lYCxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdVcGRhdGVDbHViRnVuY3Rpb25OYW1lJywge1xuICAgICAgdmFsdWU6IGNsdWJTZXJ2aWNlLnVwZGF0ZUNsdWJGdW5jdGlvbi5mdW5jdGlvbk5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ1VwZGF0ZSBjbHViIExhbWJkYSBmdW5jdGlvbiBuYW1lJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1VcGRhdGVDbHViRnVuY3Rpb25OYW1lYCxcbiAgICB9KTtcblxuICAgIC8vIFRhZ3MgZm9yIHJlc291cmNlIG1hbmFnZW1lbnRcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ1Byb2plY3QnLCAnU3lkbmV5Q3ljbGVzJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdFbnZpcm9ubWVudCcsIGVudmlyb25tZW50KTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ1BoYXNlJywgJzIuNS1SaWRlQ29tcGxldGlvbicpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnTWFuYWdlZEJ5JywgJ0NESycpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBBUEkgR2F0ZXdheSByb3V0ZXMgZm9yIHJvdXRlIG1hbmFnZW1lbnQgc2VydmljZXMgKFBoYXNlIDIuNClcbiAgICovXG4gIHByaXZhdGUgYWRkUm91dGVNYW5hZ2VtZW50Um91dGVzKFxuICAgIHJlc3RBcGk6IFJlc3RBcGlDb25zdHJ1Y3QsXG4gICAgcm91dGVGaWxlU2VydmljZTogUm91dGVGaWxlU2VydmljZSxcbiAgICByb3V0ZVRlbXBsYXRlU2VydmljZTogUm91dGVUZW1wbGF0ZVNlcnZpY2VcbiAgKTogdm9pZCB7XG4gICAgY29uc3QgdjFSZXNvdXJjZSA9IHJlc3RBcGkuYXBpLnJvb3QuZ2V0UmVzb3VyY2UoJ3YxJykgfHwgcmVzdEFwaS5hcGkucm9vdC5hZGRSZXNvdXJjZSgndjEnKTtcbiAgICBjb25zdCBjbHVic1Jlc291cmNlID0gdjFSZXNvdXJjZS5nZXRSZXNvdXJjZSgnY2x1YnMnKSB8fCB2MVJlc291cmNlLmFkZFJlc291cmNlKCdjbHVicycpO1xuICAgIGNvbnN0IGNsdWJSZXNvdXJjZSA9IGNsdWJzUmVzb3VyY2UuZ2V0UmVzb3VyY2UoJ3tjbHViSWR9JykgfHwgY2x1YnNSZXNvdXJjZS5hZGRSZXNvdXJjZSgne2NsdWJJZH0nKTtcblxuICAgIC8vIFJvdXRlIGZpbGUgbWFuYWdlbWVudCBlbmRwb2ludHNcbiAgICBjb25zdCByb3V0ZXNSZXNvdXJjZSA9IGNsdWJSZXNvdXJjZS5hZGRSZXNvdXJjZSgncm91dGVzJyk7XG4gICAgY29uc3Qgcm91dGVSZXNvdXJjZSA9IHJvdXRlc1Jlc291cmNlLmFkZFJlc291cmNlKCd7cm91dGVJZH0nKTtcbiAgICBjb25zdCBmaWxlc1Jlc291cmNlID0gcm91dGVSZXNvdXJjZS5hZGRSZXNvdXJjZSgnZmlsZXMnKTtcblxuICAgIC8vIFBPU1QgL3YxL2NsdWJzL3tjbHViSWR9L3JvdXRlcy97cm91dGVJZH0vZmlsZXMvdXBsb2FkLXVybFxuICAgIGNvbnN0IHVwbG9hZFVybFJlc291cmNlID0gZmlsZXNSZXNvdXJjZS5hZGRSZXNvdXJjZSgndXBsb2FkLXVybCcpO1xuICAgIHVwbG9hZFVybFJlc291cmNlLmFkZE1ldGhvZCgnUE9TVCcsIFxuICAgICAgbmV3IGNkay5hd3NfYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihyb3V0ZUZpbGVTZXJ2aWNlLmZpbGVVcGxvYWRIYW5kbGVyKSxcbiAgICAgIHtcbiAgICAgICAgYXV0aG9yaXplcjogcmVzdEFwaS5hdXRob3JpemVyLFxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogY2RrLmF3c19hcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIFBPU1QgL3YxL2NsdWJzL3tjbHViSWR9L3JvdXRlcy97cm91dGVJZH0vZmlsZXMve3ZlcnNpb259L2NvbmZpcm1cbiAgICBjb25zdCBmaWxlVmVyc2lvblJlc291cmNlID0gZmlsZXNSZXNvdXJjZS5hZGRSZXNvdXJjZSgne3ZlcnNpb259Jyk7XG4gICAgY29uc3QgY29uZmlybVJlc291cmNlID0gZmlsZVZlcnNpb25SZXNvdXJjZS5hZGRSZXNvdXJjZSgnY29uZmlybScpO1xuICAgIGNvbmZpcm1SZXNvdXJjZS5hZGRNZXRob2QoJ1BPU1QnLFxuICAgICAgbmV3IGNkay5hd3NfYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihyb3V0ZUZpbGVTZXJ2aWNlLmZpbGVQcm9jZXNzaW5nSGFuZGxlciksXG4gICAgICB7XG4gICAgICAgIGF1dGhvcml6ZXI6IHJlc3RBcGkuYXV0aG9yaXplcixcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGNkay5hd3NfYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBHRVQgL3YxL2NsdWJzL3tjbHViSWR9L3JvdXRlcy97cm91dGVJZH0vZmlsZXMve3ZlcnNpb259L2Rvd25sb2FkXG4gICAgY29uc3QgZG93bmxvYWRSZXNvdXJjZSA9IGZpbGVWZXJzaW9uUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ2Rvd25sb2FkJyk7XG4gICAgZG93bmxvYWRSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsXG4gICAgICBuZXcgY2RrLmF3c19hcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHJvdXRlRmlsZVNlcnZpY2UuZmlsZURvd25sb2FkSGFuZGxlciksXG4gICAgICB7XG4gICAgICAgIGF1dGhvcml6ZXI6IHJlc3RBcGkuYXV0aG9yaXplcixcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGNkay5hd3NfYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBHRVQgL3YxL2NsdWJzL3tjbHViSWR9L3JvdXRlcy97cm91dGVJZH0vZmlsZXMve3ZlcnNpb259L3N0YXR1c1xuICAgIGNvbnN0IHN0YXR1c1Jlc291cmNlID0gZmlsZVZlcnNpb25SZXNvdXJjZS5hZGRSZXNvdXJjZSgnc3RhdHVzJyk7XG4gICAgc3RhdHVzUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLFxuICAgICAgbmV3IGNkay5hd3NfYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihyb3V0ZUZpbGVTZXJ2aWNlLmZpbGVQcm9jZXNzaW5nSGFuZGxlciksXG4gICAgICB7XG4gICAgICAgIGF1dGhvcml6ZXI6IHJlc3RBcGkuYXV0aG9yaXplcixcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGNkay5hd3NfYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBHRVQgL3YxL2NsdWJzL3tjbHViSWR9L3JvdXRlcy97cm91dGVJZH0vYW5hbHl0aWNzXG4gICAgY29uc3QgYW5hbHl0aWNzUmVzb3VyY2UgPSByb3V0ZVJlc291cmNlLmFkZFJlc291cmNlKCdhbmFseXRpY3MnKTtcbiAgICBhbmFseXRpY3NSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsXG4gICAgICBuZXcgY2RrLmF3c19hcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHJvdXRlRmlsZVNlcnZpY2UuYW5hbHl0aWNzSGFuZGxlciksXG4gICAgICB7XG4gICAgICAgIGF1dGhvcml6ZXI6IHJlc3RBcGkuYXV0aG9yaXplcixcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGNkay5hd3NfYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBSb3V0ZSB0ZW1wbGF0ZSBtYW5hZ2VtZW50IGVuZHBvaW50c1xuICAgIGNvbnN0IHRlbXBsYXRlc1Jlc291cmNlID0gY2x1YlJlc291cmNlLmFkZFJlc291cmNlKCd0ZW1wbGF0ZXMnKTtcblxuICAgIC8vIFBPU1QgL3YxL2NsdWJzL3tjbHViSWR9L3RlbXBsYXRlc1xuICAgIHRlbXBsYXRlc1Jlc291cmNlLmFkZE1ldGhvZCgnUE9TVCcsXG4gICAgICBuZXcgY2RrLmF3c19hcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHJvdXRlVGVtcGxhdGVTZXJ2aWNlLnRlbXBsYXRlSGFuZGxlciksXG4gICAgICB7XG4gICAgICAgIGF1dGhvcml6ZXI6IHJlc3RBcGkuYXV0aG9yaXplcixcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGNkay5hd3NfYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBHRVQgL3YxL2NsdWJzL3tjbHViSWR9L3RlbXBsYXRlc1xuICAgIHRlbXBsYXRlc1Jlc291cmNlLmFkZE1ldGhvZCgnR0VUJyxcbiAgICAgIG5ldyBjZGsuYXdzX2FwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24ocm91dGVUZW1wbGF0ZVNlcnZpY2Uuc2VhcmNoSGFuZGxlciksXG4gICAgICB7XG4gICAgICAgIGF1dGhvcml6ZXI6IHJlc3RBcGkuYXV0aG9yaXplcixcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGNkay5hd3NfYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgfVxuICAgICk7XG4gIH1cbn0iXX0=