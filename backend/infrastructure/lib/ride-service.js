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
exports.RideService = void 0;
const constructs_1 = require("constructs");
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const lambdaNodejs = __importStar(require("aws-cdk-lib/aws-lambda-nodejs"));
const aws_apigateway_1 = require("aws-cdk-lib/aws-apigateway");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
class RideService extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        const { api, authorizer, mainTable, environment } = props;
        // Common Lambda configuration with optimized bundling
        const commonLambdaProps = {
            runtime: lambda.Runtime.NODEJS_24_X,
            timeout: aws_cdk_lib_1.Duration.seconds(30),
            memorySize: 256,
            environment: {
                DYNAMODB_TABLE_NAME: mainTable.tableName,
                NODE_OPTIONS: '--enable-source-maps',
                ENVIRONMENT: environment,
            },
            logRetention: environment === 'production'
                ? logs.RetentionDays.ONE_MONTH
                : logs.RetentionDays.ONE_WEEK,
            bundling: {
                forceDockerBundling: false,
                externalModules: ['@aws-sdk/*'],
                minify: false,
                sourceMap: false, // Disable source maps to speed up bundling
            },
        };
        // DynamoDB permissions
        const dynamoPolicy = new aws_iam_1.PolicyStatement({
            effect: aws_iam_1.Effect.ALLOW,
            actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
                'dynamodb:BatchGetItem',
                'dynamodb:BatchWriteItem',
                'dynamodb:TransactWriteItems',
                'dynamodb:TransactGetItems'
            ],
            resources: [
                mainTable.tableArn,
                `${mainTable.tableArn}/index/*`
            ]
        });
        // Ride Management Handlers
        const createRideHandler = new lambdaNodejs.NodejsFunction(this, 'CreateRideHandler', {
            ...commonLambdaProps,
            functionName: `sydney-cycles-create-ride-${environment}`,
            description: 'Create new ride (draft or published)',
            entry: 'services/ride-service/handlers/ride/create-ride.ts',
            handler: 'handler',
        });
        createRideHandler.addToRolePolicy(dynamoPolicy);
        const publishRideHandler = new lambdaNodejs.NodejsFunction(this, 'PublishRideHandler', {
            ...commonLambdaProps,
            functionName: `sydney-cycles-publish-ride-${environment}`,
            description: 'Publish a draft ride',
            entry: 'services/ride-service/handlers/ride/publish-ride.ts',
            handler: 'handler',
        });
        publishRideHandler.addToRolePolicy(dynamoPolicy);
        const listRidesHandler = new lambdaNodejs.NodejsFunction(this, 'ListRidesHandler', {
            ...commonLambdaProps,
            functionName: `sydney-cycles-list-rides-${environment}`,
            description: 'List rides with filtering and pagination',
            entry: 'services/ride-service/handlers/ride/list-rides.ts',
            handler: 'handler',
        });
        listRidesHandler.addToRolePolicy(dynamoPolicy);
        const getRideHandler = new lambdaNodejs.NodejsFunction(this, 'GetRideHandler', {
            ...commonLambdaProps,
            functionName: `sydney-cycles-get-ride-${environment}`,
            description: 'Get ride details by ID',
            entry: 'services/ride-service/handlers/ride/get-ride.ts',
            handler: 'handler',
        });
        getRideHandler.addToRolePolicy(dynamoPolicy);
        const updateRideHandler = new lambdaNodejs.NodejsFunction(this, 'UpdateRideHandler', {
            ...commonLambdaProps,
            functionName: `sydney-cycles-update-ride-${environment}`,
            description: 'Update ride details (Phase 3.3.4)',
            entry: 'services/ride-service/handlers/ride/update-ride.ts',
            handler: 'handler',
        });
        updateRideHandler.addToRolePolicy(dynamoPolicy);
        const cancelRideHandler = new lambdaNodejs.NodejsFunction(this, 'CancelRideHandler', {
            ...commonLambdaProps,
            functionName: `sydney-cycles-cancel-ride-${environment}`,
            description: 'Cancel a ride (Phase 3.3.4)',
            entry: 'services/ride-service/handlers/ride/cancel-ride.ts',
            handler: 'handler',
        });
        cancelRideHandler.addToRolePolicy(dynamoPolicy);
        // Participation Handlers
        const joinRideHandler = new lambdaNodejs.NodejsFunction(this, 'JoinRideHandler', {
            ...commonLambdaProps,
            functionName: `sydney-cycles-join-ride-${environment}`,
            description: 'Join a published ride',
            entry: 'services/ride-service/handlers/participation/join-ride.ts',
            handler: 'handler',
        });
        joinRideHandler.addToRolePolicy(dynamoPolicy);
        const leaveRideHandler = new lambdaNodejs.NodejsFunction(this, 'LeaveRideHandler', {
            ...commonLambdaProps,
            functionName: `sydney-cycles-leave-ride-${environment}`,
            description: 'Leave a ride',
            entry: 'services/ride-service/handlers/participation/leave-ride.ts',
            handler: 'handler',
        });
        leaveRideHandler.addToRolePolicy(dynamoPolicy);
        // User Handlers
        const getUserRidesHandler = new lambdaNodejs.NodejsFunction(this, 'GetUserRidesHandler', {
            ...commonLambdaProps,
            functionName: `sydney-cycles-get-user-rides-${environment}`,
            description: 'Get user ride history and participation',
            entry: 'services/ride-service/handlers/user/get-user-rides.ts',
            handler: 'handler',
        });
        getUserRidesHandler.addToRolePolicy(dynamoPolicy);
        // Phase 2.5: Completion Handlers
        const completeRideHandler = new lambdaNodejs.NodejsFunction(this, 'CompleteRideHandler', {
            ...commonLambdaProps,
            functionName: `sydney-cycles-complete-ride-${environment}`,
            description: 'Complete a ride',
            entry: 'services/ride-service/handlers/completion/complete-ride.ts',
            handler: 'handler',
        });
        completeRideHandler.addToRolePolicy(dynamoPolicy);
        const getRideSummaryHandler = new lambdaNodejs.NodejsFunction(this, 'GetRideSummaryHandler', {
            ...commonLambdaProps,
            functionName: `sydney-cycles-get-ride-summary-${environment}`,
            description: 'Get ride completion summary',
            entry: 'services/ride-service/handlers/completion/get-ride-summary.ts',
            handler: 'handler',
        });
        getRideSummaryHandler.addToRolePolicy(dynamoPolicy);
        // Phase 2.5: Attendance Handlers
        const updateAttendanceHandler = new lambdaNodejs.NodejsFunction(this, 'UpdateAttendanceHandler', {
            ...commonLambdaProps,
            functionName: `sydney-cycles-update-attendance-${environment}`,
            description: 'Update participant attendance',
            entry: 'services/ride-service/handlers/attendance/update-attendance.ts',
            handler: 'handler',
        });
        updateAttendanceHandler.addToRolePolicy(dynamoPolicy);
        const linkManualEvidenceHandler = new lambdaNodejs.NodejsFunction(this, 'LinkManualEvidenceHandler', {
            ...commonLambdaProps,
            functionName: `sydney-cycles-link-manual-evidence-${environment}`,
            description: 'Link manual evidence for attendance',
            entry: 'services/ride-service/handlers/evidence/link-manual-evidence.ts',
            handler: 'handler',
        });
        linkManualEvidenceHandler.addToRolePolicy(dynamoPolicy);
        // API Gateway Routes
        const v1 = api.root.getResource('v1') || api.root.addResource('v1');
        const clubs = v1.getResource('clubs') || v1.addResource('clubs');
        const clubResource = clubs.getResource('{clubId}') || clubs.addResource('{clubId}');
        const ridesResource = clubResource.addResource('rides');
        // Club ride endpoints
        ridesResource.addMethod('POST', new aws_apigateway_1.LambdaIntegration(createRideHandler), {
            authorizer,
            authorizationType: aws_apigateway_1.AuthorizationType.COGNITO
        });
        ridesResource.addMethod('GET', new aws_apigateway_1.LambdaIntegration(listRidesHandler), {
            authorizer,
            authorizationType: aws_apigateway_1.AuthorizationType.COGNITO
        });
        const rideResource = ridesResource.addResource('{rideId}');
        rideResource.addMethod('GET', new aws_apigateway_1.LambdaIntegration(getRideHandler), {
            authorizer,
            authorizationType: aws_apigateway_1.AuthorizationType.COGNITO
        });
        // Update ride endpoint (Phase 3.3.4)
        rideResource.addMethod('PUT', new aws_apigateway_1.LambdaIntegration(updateRideHandler), {
            authorizer,
            authorizationType: aws_apigateway_1.AuthorizationType.COGNITO
        });
        // Cancel ride endpoint (Phase 3.3.4)
        rideResource.addMethod('DELETE', new aws_apigateway_1.LambdaIntegration(cancelRideHandler), {
            authorizer,
            authorizationType: aws_apigateway_1.AuthorizationType.COGNITO
        });
        // Publish ride endpoint
        const publishResource = rideResource.addResource('publish');
        publishResource.addMethod('POST', new aws_apigateway_1.LambdaIntegration(publishRideHandler), {
            authorizer,
            authorizationType: aws_apigateway_1.AuthorizationType.COGNITO
        });
        // Join ride endpoint (Phase 3.3.2)
        const joinResource = rideResource.addResource('join');
        joinResource.addMethod('POST', new aws_apigateway_1.LambdaIntegration(joinRideHandler), {
            authorizer,
            authorizationType: aws_apigateway_1.AuthorizationType.COGNITO
        });
        // Participation endpoints (legacy - keeping for backward compatibility)
        const participantsResource = rideResource.addResource('participants');
        participantsResource.addMethod('POST', new aws_apigateway_1.LambdaIntegration(joinRideHandler), {
            authorizer,
            authorizationType: aws_apigateway_1.AuthorizationType.COGNITO
        });
        const meParticipantResource = participantsResource.addResource('me');
        meParticipantResource.addMethod('DELETE', new aws_apigateway_1.LambdaIntegration(leaveRideHandler), {
            authorizer,
            authorizationType: aws_apigateway_1.AuthorizationType.COGNITO
        });
        // User rides endpoint
        const users = v1.getResource('users') || v1.addResource('users');
        const meResource = users.getResource('me') || users.addResource('me');
        const userRidesResource = meResource.addResource('rides');
        userRidesResource.addMethod('GET', new aws_apigateway_1.LambdaIntegration(getUserRidesHandler), {
            authorizer,
            authorizationType: aws_apigateway_1.AuthorizationType.COGNITO
        });
        // Phase 2.5: Completion endpoints
        const completeResource = rideResource.addResource('complete');
        completeResource.addMethod('POST', new aws_apigateway_1.LambdaIntegration(completeRideHandler), {
            authorizer,
            authorizationType: aws_apigateway_1.AuthorizationType.COGNITO
        });
        const summaryResource = rideResource.addResource('summary');
        summaryResource.addMethod('GET', new aws_apigateway_1.LambdaIntegration(getRideSummaryHandler), {
            authorizer,
            authorizationType: aws_apigateway_1.AuthorizationType.COGNITO
        });
        // Phase 2.5: Attendance endpoints
        const participantResource = participantsResource.addResource('{userId}');
        const attendanceResource = participantResource.addResource('attendance');
        attendanceResource.addMethod('PUT', new aws_apigateway_1.LambdaIntegration(updateAttendanceHandler), {
            authorizer,
            authorizationType: aws_apigateway_1.AuthorizationType.COGNITO
        });
        // Phase 2.5: Evidence endpoints
        const evidenceResource = participantResource.addResource('evidence');
        const manualEvidenceResource = evidenceResource.addResource('manual');
        manualEvidenceResource.addMethod('POST', new aws_apigateway_1.LambdaIntegration(linkManualEvidenceHandler), {
            authorizer,
            authorizationType: aws_apigateway_1.AuthorizationType.COGNITO
        });
    }
}
exports.RideService = RideService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmlkZS1zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmlkZS1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkNBQXVDO0FBRXZDLCtEQUFpRDtBQUNqRCw0RUFBOEQ7QUFFOUQsK0RBQW9IO0FBQ3BILDZDQUF1QztBQUN2QyxpREFBOEQ7QUFDOUQsMkRBQTZDO0FBUzdDLE1BQWEsV0FBWSxTQUFRLHNCQUFTO0lBQ3hDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBdUI7UUFDL0QsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQixNQUFNLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBRTFELHNEQUFzRDtRQUN0RCxNQUFNLGlCQUFpQixHQUFHO1lBQ3hCLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsT0FBTyxFQUFFLHNCQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUM3QixVQUFVLEVBQUUsR0FBRztZQUNmLFdBQVcsRUFBRTtnQkFDWCxtQkFBbUIsRUFBRSxTQUFTLENBQUMsU0FBUztnQkFDeEMsWUFBWSxFQUFFLHNCQUFzQjtnQkFDcEMsV0FBVyxFQUFFLFdBQVc7YUFDekI7WUFDRCxZQUFZLEVBQUUsV0FBVyxLQUFLLFlBQVk7Z0JBQ3hDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVM7Z0JBQzlCLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVE7WUFDL0IsUUFBUSxFQUFFO2dCQUNSLG1CQUFtQixFQUFFLEtBQUs7Z0JBQzFCLGVBQWUsRUFBRSxDQUFDLFlBQVksQ0FBQztnQkFDL0IsTUFBTSxFQUFFLEtBQUs7Z0JBQ2IsU0FBUyxFQUFFLEtBQUssRUFBRSwyQ0FBMkM7YUFDOUQ7U0FDRixDQUFD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VyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3pFLE1BQU0sa0JBQWtCLEdBQUcsbUJBQW1CLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3pFLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxrQ0FBaUIsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFO1lBQ2xGLFVBQVU7WUFDVixpQkFBaUIsRUFBRSxrQ0FBaUIsQ0FBQyxPQUFPO1NBQzdDLENBQUMsQ0FBQztRQUVILGdDQUFnQztRQUNoQyxNQUFNLGdCQUFnQixHQUFHLG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNyRSxNQUFNLHNCQUFzQixHQUFHLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN0RSxzQkFBc0IsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksa0NBQWlCLENBQUMseUJBQXlCLENBQUMsRUFBRTtZQUN6RixVQUFVO1lBQ1YsaUJBQWlCLEVBQUUsa0NBQWlCLENBQUMsT0FBTztTQUM3QyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUE5UUQsa0NBOFFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgbGFtYmRhTm9kZWpzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEtbm9kZWpzJztcbmltcG9ydCB7IFRhYmxlIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCB7IFJlc3RBcGksIExhbWJkYUludGVncmF0aW9uLCBBdXRob3JpemVyLCBBdXRob3JpemF0aW9uVHlwZSwgQ29yc09wdGlvbnMgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgeyBEdXJhdGlvbiB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IFBvbGljeVN0YXRlbWVudCwgRWZmZWN0IH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBsb2dzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sb2dzJztcblxuZXhwb3J0IGludGVyZmFjZSBSaWRlU2VydmljZVByb3BzIHtcbiAgYXBpOiBSZXN0QXBpO1xuICBhdXRob3JpemVyOiBBdXRob3JpemVyO1xuICBtYWluVGFibGU6IFRhYmxlO1xuICBlbnZpcm9ubWVudDogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgUmlkZVNlcnZpY2UgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogUmlkZVNlcnZpY2VQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICBjb25zdCB7IGFwaSwgYXV0aG9yaXplciwgbWFpblRhYmxlLCBlbnZpcm9ubWVudCB9ID0gcHJvcHM7XG5cbiAgICAvLyBDb21tb24gTGFtYmRhIGNvbmZpZ3VyYXRpb24gd2l0aCBvcHRpbWl6ZWQgYnVuZGxpbmdcbiAgICBjb25zdCBjb21tb25MYW1iZGFQcm9wcyA9IHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yNF9YLFxuICAgICAgdGltZW91dDogRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICBtZW1vcnlTaXplOiAyNTYsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBEWU5BTU9EQl9UQUJMRV9OQU1FOiBtYWluVGFibGUudGFibGVOYW1lLFxuICAgICAgICBOT0RFX09QVElPTlM6ICctLWVuYWJsZS1zb3VyY2UtbWFwcycsXG4gICAgICAgIEVOVklST05NRU5UOiBlbnZpcm9ubWVudCxcbiAgICAgIH0sXG4gICAgICBsb2dSZXRlbnRpb246IGVudmlyb25tZW50ID09PSAncHJvZHVjdGlvbicgXG4gICAgICAgID8gbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9NT05USCBcbiAgICAgICAgOiBsb2dzLlJldGVudGlvbkRheXMuT05FX1dFRUssXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgbWluaWZ5OiBmYWxzZSwgLy8gRGlzYWJsZSBtaW5pZmljYXRpb24gdG8gc3BlZWQgdXAgYnVuZGxpbmdcbiAgICAgICAgc291cmNlTWFwOiBmYWxzZSwgLy8gRGlzYWJsZSBzb3VyY2UgbWFwcyB0byBzcGVlZCB1cCBidW5kbGluZ1xuICAgICAgfSxcbiAgICB9O1xuXG4gICAgLy8gRHluYW1vREIgcGVybWlzc2lvbnNcbiAgICBjb25zdCBkeW5hbW9Qb2xpY3kgPSBuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGVmZmVjdDogRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnZHluYW1vZGI6R2V0SXRlbScsXG4gICAgICAgICdkeW5hbW9kYjpQdXRJdGVtJyxcbiAgICAgICAgJ2R5bmFtb2RiOlVwZGF0ZUl0ZW0nLFxuICAgICAgICAnZHluYW1vZGI6RGVsZXRlSXRlbScsXG4gICAgICAgICdkeW5hbW9kYjpRdWVyeScsXG4gICAgICAgICdkeW5hbW9kYjpTY2FuJyxcbiAgICAgICAgJ2R5bmFtb2RiOkJhdGNoR2V0SXRlbScsXG4gICAgICAgICdkeW5hbW9kYjpCYXRjaFdyaXRlSXRlbScsXG4gICAgICAgICdkeW5hbW9kYjpUcmFuc2FjdFdyaXRlSXRlbXMnLFxuICAgICAgICAnZHluYW1vZGI6VHJhbnNhY3RHZXRJdGVtcydcbiAgICAgIF0sXG4gICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgbWFpblRhYmxlLnRhYmxlQXJuLFxuICAgICAgICBgJHttYWluVGFibGUudGFibGVBcm59L2luZGV4LypgXG4gICAgICBdXG4gICAgfSk7XG5cbiAgICAvLyBSaWRlIE1hbmFnZW1lbnQgSGFuZGxlcnNcbiAgICBjb25zdCBjcmVhdGVSaWRlSGFuZGxlciA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ0NyZWF0ZVJpZGVIYW5kbGVyJywge1xuICAgICAgLi4uY29tbW9uTGFtYmRhUHJvcHMsXG4gICAgICBmdW5jdGlvbk5hbWU6IGBzeWRuZXktY3ljbGVzLWNyZWF0ZS1yaWRlLSR7ZW52aXJvbm1lbnR9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ3JlYXRlIG5ldyByaWRlIChkcmFmdCBvciBwdWJsaXNoZWQpJyxcbiAgICAgIGVudHJ5OiAnc2VydmljZXMvcmlkZS1zZXJ2aWNlL2hhbmRsZXJzL3JpZGUvY3JlYXRlLXJpZGUudHMnLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgIH0pO1xuICAgIGNyZWF0ZVJpZGVIYW5kbGVyLmFkZFRvUm9sZVBvbGljeShkeW5hbW9Qb2xpY3kpO1xuXG4gICAgY29uc3QgcHVibGlzaFJpZGVIYW5kbGVyID0gbmV3IGxhbWJkYU5vZGVqcy5Ob2RlanNGdW5jdGlvbih0aGlzLCAnUHVibGlzaFJpZGVIYW5kbGVyJywge1xuICAgICAgLi4uY29tbW9uTGFtYmRhUHJvcHMsXG4gICAgICBmdW5jdGlvbk5hbWU6IGBzeWRuZXktY3ljbGVzLXB1Ymxpc2gtcmlkZS0ke2Vudmlyb25tZW50fWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ1B1Ymxpc2ggYSBkcmFmdCByaWRlJyxcbiAgICAgIGVudHJ5OiAnc2VydmljZXMvcmlkZS1zZXJ2aWNlL2hhbmRsZXJzL3JpZGUvcHVibGlzaC1yaWRlLnRzJyxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICB9KTtcbiAgICBwdWJsaXNoUmlkZUhhbmRsZXIuYWRkVG9Sb2xlUG9saWN5KGR5bmFtb1BvbGljeSk7XG5cbiAgICBjb25zdCBsaXN0UmlkZXNIYW5kbGVyID0gbmV3IGxhbWJkYU5vZGVqcy5Ob2RlanNGdW5jdGlvbih0aGlzLCAnTGlzdFJpZGVzSGFuZGxlcicsIHtcbiAgICAgIC4uLmNvbW1vbkxhbWJkYVByb3BzLFxuICAgICAgZnVuY3Rpb25OYW1lOiBgc3lkbmV5LWN5Y2xlcy1saXN0LXJpZGVzLSR7ZW52aXJvbm1lbnR9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnTGlzdCByaWRlcyB3aXRoIGZpbHRlcmluZyBhbmQgcGFnaW5hdGlvbicsXG4gICAgICBlbnRyeTogJ3NlcnZpY2VzL3JpZGUtc2VydmljZS9oYW5kbGVycy9yaWRlL2xpc3QtcmlkZXMudHMnLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgIH0pO1xuICAgIGxpc3RSaWRlc0hhbmRsZXIuYWRkVG9Sb2xlUG9saWN5KGR5bmFtb1BvbGljeSk7XG5cbiAgICBjb25zdCBnZXRSaWRlSGFuZGxlciA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ0dldFJpZGVIYW5kbGVyJywge1xuICAgICAgLi4uY29tbW9uTGFtYmRhUHJvcHMsXG4gICAgICBmdW5jdGlvbk5hbWU6IGBzeWRuZXktY3ljbGVzLWdldC1yaWRlLSR7ZW52aXJvbm1lbnR9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnR2V0IHJpZGUgZGV0YWlscyBieSBJRCcsXG4gICAgICBlbnRyeTogJ3NlcnZpY2VzL3JpZGUtc2VydmljZS9oYW5kbGVycy9yaWRlL2dldC1yaWRlLnRzJyxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICB9KTtcbiAgICBnZXRSaWRlSGFuZGxlci5hZGRUb1JvbGVQb2xpY3koZHluYW1vUG9saWN5KTtcblxuICAgIGNvbnN0IHVwZGF0ZVJpZGVIYW5kbGVyID0gbmV3IGxhbWJkYU5vZGVqcy5Ob2RlanNGdW5jdGlvbih0aGlzLCAnVXBkYXRlUmlkZUhhbmRsZXInLCB7XG4gICAgICAuLi5jb21tb25MYW1iZGFQcm9wcyxcbiAgICAgIGZ1bmN0aW9uTmFtZTogYHN5ZG5leS1jeWNsZXMtdXBkYXRlLXJpZGUtJHtlbnZpcm9ubWVudH1gLFxuICAgICAgZGVzY3JpcHRpb246ICdVcGRhdGUgcmlkZSBkZXRhaWxzIChQaGFzZSAzLjMuNCknLFxuICAgICAgZW50cnk6ICdzZXJ2aWNlcy9yaWRlLXNlcnZpY2UvaGFuZGxlcnMvcmlkZS91cGRhdGUtcmlkZS50cycsXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcicsXG4gICAgfSk7XG4gICAgdXBkYXRlUmlkZUhhbmRsZXIuYWRkVG9Sb2xlUG9saWN5KGR5bmFtb1BvbGljeSk7XG5cbiAgICBjb25zdCBjYW5jZWxSaWRlSGFuZGxlciA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ0NhbmNlbFJpZGVIYW5kbGVyJywge1xuICAgICAgLi4uY29tbW9uTGFtYmRhUHJvcHMsXG4gICAgICBmdW5jdGlvbk5hbWU6IGBzeWRuZXktY3ljbGVzLWNhbmNlbC1yaWRlLSR7ZW52aXJvbm1lbnR9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ2FuY2VsIGEgcmlkZSAoUGhhc2UgMy4zLjQpJyxcbiAgICAgIGVudHJ5OiAnc2VydmljZXMvcmlkZS1zZXJ2aWNlL2hhbmRsZXJzL3JpZGUvY2FuY2VsLXJpZGUudHMnLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgIH0pO1xuICAgIGNhbmNlbFJpZGVIYW5kbGVyLmFkZFRvUm9sZVBvbGljeShkeW5hbW9Qb2xpY3kpO1xuXG4gICAgLy8gUGFydGljaXBhdGlvbiBIYW5kbGVyc1xuICAgIGNvbnN0IGpvaW5SaWRlSGFuZGxlciA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ0pvaW5SaWRlSGFuZGxlcicsIHtcbiAgICAgIC4uLmNvbW1vbkxhbWJkYVByb3BzLFxuICAgICAgZnVuY3Rpb25OYW1lOiBgc3lkbmV5LWN5Y2xlcy1qb2luLXJpZGUtJHtlbnZpcm9ubWVudH1gLFxuICAgICAgZGVzY3JpcHRpb246ICdKb2luIGEgcHVibGlzaGVkIHJpZGUnLFxuICAgICAgZW50cnk6ICdzZXJ2aWNlcy9yaWRlLXNlcnZpY2UvaGFuZGxlcnMvcGFydGljaXBhdGlvbi9qb2luLXJpZGUudHMnLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgIH0pO1xuICAgIGpvaW5SaWRlSGFuZGxlci5hZGRUb1JvbGVQb2xpY3koZHluYW1vUG9saWN5KTtcblxuICAgIGNvbnN0IGxlYXZlUmlkZUhhbmRsZXIgPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdMZWF2ZVJpZGVIYW5kbGVyJywge1xuICAgICAgLi4uY29tbW9uTGFtYmRhUHJvcHMsXG4gICAgICBmdW5jdGlvbk5hbWU6IGBzeWRuZXktY3ljbGVzLWxlYXZlLXJpZGUtJHtlbnZpcm9ubWVudH1gLFxuICAgICAgZGVzY3JpcHRpb246ICdMZWF2ZSBhIHJpZGUnLFxuICAgICAgZW50cnk6ICdzZXJ2aWNlcy9yaWRlLXNlcnZpY2UvaGFuZGxlcnMvcGFydGljaXBhdGlvbi9sZWF2ZS1yaWRlLnRzJyxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICB9KTtcbiAgICBsZWF2ZVJpZGVIYW5kbGVyLmFkZFRvUm9sZVBvbGljeShkeW5hbW9Qb2xpY3kpO1xuXG4gICAgLy8gVXNlciBIYW5kbGVyc1xuICAgIGNvbnN0IGdldFVzZXJSaWRlc0hhbmRsZXIgPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdHZXRVc2VyUmlkZXNIYW5kbGVyJywge1xuICAgICAgLi4uY29tbW9uTGFtYmRhUHJvcHMsXG4gICAgICBmdW5jdGlvbk5hbWU6IGBzeWRuZXktY3ljbGVzLWdldC11c2VyLXJpZGVzLSR7ZW52aXJvbm1lbnR9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnR2V0IHVzZXIgcmlkZSBoaXN0b3J5IGFuZCBwYXJ0aWNpcGF0aW9uJyxcbiAgICAgIGVudHJ5OiAnc2VydmljZXMvcmlkZS1zZXJ2aWNlL2hhbmRsZXJzL3VzZXIvZ2V0LXVzZXItcmlkZXMudHMnLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgIH0pO1xuICAgIGdldFVzZXJSaWRlc0hhbmRsZXIuYWRkVG9Sb2xlUG9saWN5KGR5bmFtb1BvbGljeSk7XG5cbiAgICAvLyBQaGFzZSAyLjU6IENvbXBsZXRpb24gSGFuZGxlcnNcbiAgICBjb25zdCBjb21wbGV0ZVJpZGVIYW5kbGVyID0gbmV3IGxhbWJkYU5vZGVqcy5Ob2RlanNGdW5jdGlvbih0aGlzLCAnQ29tcGxldGVSaWRlSGFuZGxlcicsIHtcbiAgICAgIC4uLmNvbW1vbkxhbWJkYVByb3BzLFxuICAgICAgZnVuY3Rpb25OYW1lOiBgc3lkbmV5LWN5Y2xlcy1jb21wbGV0ZS1yaWRlLSR7ZW52aXJvbm1lbnR9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29tcGxldGUgYSByaWRlJyxcbiAgICAgIGVudHJ5OiAnc2VydmljZXMvcmlkZS1zZXJ2aWNlL2hhbmRsZXJzL2NvbXBsZXRpb24vY29tcGxldGUtcmlkZS50cycsXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcicsXG4gICAgfSk7XG4gICAgY29tcGxldGVSaWRlSGFuZGxlci5hZGRUb1JvbGVQb2xpY3koZHluYW1vUG9saWN5KTtcblxuICAgIGNvbnN0IGdldFJpZGVTdW1tYXJ5SGFuZGxlciA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ0dldFJpZGVTdW1tYXJ5SGFuZGxlcicsIHtcbiAgICAgIC4uLmNvbW1vbkxhbWJkYVByb3BzLFxuICAgICAgZnVuY3Rpb25OYW1lOiBgc3lkbmV5LWN5Y2xlcy1nZXQtcmlkZS1zdW1tYXJ5LSR7ZW52aXJvbm1lbnR9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnR2V0IHJpZGUgY29tcGxldGlvbiBzdW1tYXJ5JyxcbiAgICAgIGVudHJ5OiAnc2VydmljZXMvcmlkZS1zZXJ2aWNlL2hhbmRsZXJzL2NvbXBsZXRpb24vZ2V0LXJpZGUtc3VtbWFyeS50cycsXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcicsXG4gICAgfSk7XG4gICAgZ2V0UmlkZVN1bW1hcnlIYW5kbGVyLmFkZFRvUm9sZVBvbGljeShkeW5hbW9Qb2xpY3kpO1xuXG4gICAgLy8gUGhhc2UgMi41OiBBdHRlbmRhbmNlIEhhbmRsZXJzXG4gICAgY29uc3QgdXBkYXRlQXR0ZW5kYW5jZUhhbmRsZXIgPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdVcGRhdGVBdHRlbmRhbmNlSGFuZGxlcicsIHtcbiAgICAgIC4uLmNvbW1vbkxhbWJkYVByb3BzLFxuICAgICAgZnVuY3Rpb25OYW1lOiBgc3lkbmV5LWN5Y2xlcy11cGRhdGUtYXR0ZW5kYW5jZS0ke2Vudmlyb25tZW50fWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ1VwZGF0ZSBwYXJ0aWNpcGFudCBhdHRlbmRhbmNlJyxcbiAgICAgIGVudHJ5OiAnc2VydmljZXMvcmlkZS1zZXJ2aWNlL2hhbmRsZXJzL2F0dGVuZGFuY2UvdXBkYXRlLWF0dGVuZGFuY2UudHMnLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgIH0pO1xuICAgIHVwZGF0ZUF0dGVuZGFuY2VIYW5kbGVyLmFkZFRvUm9sZVBvbGljeShkeW5hbW9Qb2xpY3kpO1xuXG4gICAgY29uc3QgbGlua01hbnVhbEV2aWRlbmNlSGFuZGxlciA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ0xpbmtNYW51YWxFdmlkZW5jZUhhbmRsZXInLCB7XG4gICAgICAuLi5jb21tb25MYW1iZGFQcm9wcyxcbiAgICAgIGZ1bmN0aW9uTmFtZTogYHN5ZG5leS1jeWNsZXMtbGluay1tYW51YWwtZXZpZGVuY2UtJHtlbnZpcm9ubWVudH1gLFxuICAgICAgZGVzY3JpcHRpb246ICdMaW5rIG1hbnVhbCBldmlkZW5jZSBmb3IgYXR0ZW5kYW5jZScsXG4gICAgICBlbnRyeTogJ3NlcnZpY2VzL3JpZGUtc2VydmljZS9oYW5kbGVycy9ldmlkZW5jZS9saW5rLW1hbnVhbC1ldmlkZW5jZS50cycsXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcicsXG4gICAgfSk7XG4gICAgbGlua01hbnVhbEV2aWRlbmNlSGFuZGxlci5hZGRUb1JvbGVQb2xpY3koZHluYW1vUG9saWN5KTtcblxuICAgIC8vIEFQSSBHYXRld2F5IFJvdXRlc1xuICAgIGNvbnN0IHYxID0gYXBpLnJvb3QuZ2V0UmVzb3VyY2UoJ3YxJykgfHwgYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3YxJyk7XG4gICAgY29uc3QgY2x1YnMgPSB2MS5nZXRSZXNvdXJjZSgnY2x1YnMnKSB8fCB2MS5hZGRSZXNvdXJjZSgnY2x1YnMnKTtcbiAgICBjb25zdCBjbHViUmVzb3VyY2UgPSBjbHVicy5nZXRSZXNvdXJjZSgne2NsdWJJZH0nKSB8fCBjbHVicy5hZGRSZXNvdXJjZSgne2NsdWJJZH0nKTtcbiAgICBjb25zdCByaWRlc1Jlc291cmNlID0gY2x1YlJlc291cmNlLmFkZFJlc291cmNlKCdyaWRlcycpO1xuXG4gICAgLy8gQ2x1YiByaWRlIGVuZHBvaW50c1xuICAgIHJpZGVzUmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgbmV3IExhbWJkYUludGVncmF0aW9uKGNyZWF0ZVJpZGVIYW5kbGVyKSwge1xuICAgICAgYXV0aG9yaXplcixcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBBdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPXG4gICAgfSk7XG5cbiAgICByaWRlc1Jlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgbmV3IExhbWJkYUludGVncmF0aW9uKGxpc3RSaWRlc0hhbmRsZXIpLCB7XG4gICAgICBhdXRob3JpemVyLFxuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IEF1dGhvcml6YXRpb25UeXBlLkNPR05JVE9cbiAgICB9KTtcblxuICAgIGNvbnN0IHJpZGVSZXNvdXJjZSA9IHJpZGVzUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3tyaWRlSWR9Jyk7XG4gICAgcmlkZVJlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgbmV3IExhbWJkYUludGVncmF0aW9uKGdldFJpZGVIYW5kbGVyKSwge1xuICAgICAgYXV0aG9yaXplcixcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBBdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPXG4gICAgfSk7XG5cbiAgICAvLyBVcGRhdGUgcmlkZSBlbmRwb2ludCAoUGhhc2UgMy4zLjQpXG4gICAgcmlkZVJlc291cmNlLmFkZE1ldGhvZCgnUFVUJywgbmV3IExhbWJkYUludGVncmF0aW9uKHVwZGF0ZVJpZGVIYW5kbGVyKSwge1xuICAgICAgYXV0aG9yaXplcixcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBBdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPXG4gICAgfSk7XG5cbiAgICAvLyBDYW5jZWwgcmlkZSBlbmRwb2ludCAoUGhhc2UgMy4zLjQpXG4gICAgcmlkZVJlc291cmNlLmFkZE1ldGhvZCgnREVMRVRFJywgbmV3IExhbWJkYUludGVncmF0aW9uKGNhbmNlbFJpZGVIYW5kbGVyKSwge1xuICAgICAgYXV0aG9yaXplcixcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBBdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPXG4gICAgfSk7XG5cbiAgICAvLyBQdWJsaXNoIHJpZGUgZW5kcG9pbnRcbiAgICBjb25zdCBwdWJsaXNoUmVzb3VyY2UgPSByaWRlUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3B1Ymxpc2gnKTtcbiAgICBwdWJsaXNoUmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgbmV3IExhbWJkYUludGVncmF0aW9uKHB1Ymxpc2hSaWRlSGFuZGxlciksIHtcbiAgICAgIGF1dGhvcml6ZXIsXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogQXV0aG9yaXphdGlvblR5cGUuQ09HTklUT1xuICAgIH0pO1xuXG4gICAgLy8gSm9pbiByaWRlIGVuZHBvaW50IChQaGFzZSAzLjMuMilcbiAgICBjb25zdCBqb2luUmVzb3VyY2UgPSByaWRlUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ2pvaW4nKTtcbiAgICBqb2luUmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgbmV3IExhbWJkYUludGVncmF0aW9uKGpvaW5SaWRlSGFuZGxlciksIHtcbiAgICAgIGF1dGhvcml6ZXIsXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogQXV0aG9yaXphdGlvblR5cGUuQ09HTklUT1xuICAgIH0pO1xuXG4gICAgLy8gUGFydGljaXBhdGlvbiBlbmRwb2ludHMgKGxlZ2FjeSAtIGtlZXBpbmcgZm9yIGJhY2t3YXJkIGNvbXBhdGliaWxpdHkpXG4gICAgY29uc3QgcGFydGljaXBhbnRzUmVzb3VyY2UgPSByaWRlUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3BhcnRpY2lwYW50cycpO1xuICAgIHBhcnRpY2lwYW50c1Jlc291cmNlLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBMYW1iZGFJbnRlZ3JhdGlvbihqb2luUmlkZUhhbmRsZXIpLCB7XG4gICAgICBhdXRob3JpemVyLFxuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IEF1dGhvcml6YXRpb25UeXBlLkNPR05JVE9cbiAgICB9KTtcblxuICAgIGNvbnN0IG1lUGFydGljaXBhbnRSZXNvdXJjZSA9IHBhcnRpY2lwYW50c1Jlc291cmNlLmFkZFJlc291cmNlKCdtZScpO1xuICAgIG1lUGFydGljaXBhbnRSZXNvdXJjZS5hZGRNZXRob2QoJ0RFTEVURScsIG5ldyBMYW1iZGFJbnRlZ3JhdGlvbihsZWF2ZVJpZGVIYW5kbGVyKSwge1xuICAgICAgYXV0aG9yaXplcixcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBBdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPXG4gICAgfSk7XG5cbiAgICAvLyBVc2VyIHJpZGVzIGVuZHBvaW50XG4gICAgY29uc3QgdXNlcnMgPSB2MS5nZXRSZXNvdXJjZSgndXNlcnMnKSB8fCB2MS5hZGRSZXNvdXJjZSgndXNlcnMnKTtcbiAgICBjb25zdCBtZVJlc291cmNlID0gdXNlcnMuZ2V0UmVzb3VyY2UoJ21lJykgfHwgdXNlcnMuYWRkUmVzb3VyY2UoJ21lJyk7XG4gICAgY29uc3QgdXNlclJpZGVzUmVzb3VyY2UgPSBtZVJlc291cmNlLmFkZFJlc291cmNlKCdyaWRlcycpO1xuICAgIHVzZXJSaWRlc1Jlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgbmV3IExhbWJkYUludGVncmF0aW9uKGdldFVzZXJSaWRlc0hhbmRsZXIpLCB7XG4gICAgICBhdXRob3JpemVyLFxuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IEF1dGhvcml6YXRpb25UeXBlLkNPR05JVE9cbiAgICB9KTtcblxuICAgIC8vIFBoYXNlIDIuNTogQ29tcGxldGlvbiBlbmRwb2ludHNcbiAgICBjb25zdCBjb21wbGV0ZVJlc291cmNlID0gcmlkZVJlc291cmNlLmFkZFJlc291cmNlKCdjb21wbGV0ZScpO1xuICAgIGNvbXBsZXRlUmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgbmV3IExhbWJkYUludGVncmF0aW9uKGNvbXBsZXRlUmlkZUhhbmRsZXIpLCB7XG4gICAgICBhdXRob3JpemVyLFxuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IEF1dGhvcml6YXRpb25UeXBlLkNPR05JVE9cbiAgICB9KTtcblxuICAgIGNvbnN0IHN1bW1hcnlSZXNvdXJjZSA9IHJpZGVSZXNvdXJjZS5hZGRSZXNvdXJjZSgnc3VtbWFyeScpO1xuICAgIHN1bW1hcnlSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBMYW1iZGFJbnRlZ3JhdGlvbihnZXRSaWRlU3VtbWFyeUhhbmRsZXIpLCB7XG4gICAgICBhdXRob3JpemVyLFxuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IEF1dGhvcml6YXRpb25UeXBlLkNPR05JVE9cbiAgICB9KTtcblxuICAgIC8vIFBoYXNlIDIuNTogQXR0ZW5kYW5jZSBlbmRwb2ludHNcbiAgICBjb25zdCBwYXJ0aWNpcGFudFJlc291cmNlID0gcGFydGljaXBhbnRzUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3t1c2VySWR9Jyk7XG4gICAgY29uc3QgYXR0ZW5kYW5jZVJlc291cmNlID0gcGFydGljaXBhbnRSZXNvdXJjZS5hZGRSZXNvdXJjZSgnYXR0ZW5kYW5jZScpO1xuICAgIGF0dGVuZGFuY2VSZXNvdXJjZS5hZGRNZXRob2QoJ1BVVCcsIG5ldyBMYW1iZGFJbnRlZ3JhdGlvbih1cGRhdGVBdHRlbmRhbmNlSGFuZGxlciksIHtcbiAgICAgIGF1dGhvcml6ZXIsXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogQXV0aG9yaXphdGlvblR5cGUuQ09HTklUT1xuICAgIH0pO1xuXG4gICAgLy8gUGhhc2UgMi41OiBFdmlkZW5jZSBlbmRwb2ludHNcbiAgICBjb25zdCBldmlkZW5jZVJlc291cmNlID0gcGFydGljaXBhbnRSZXNvdXJjZS5hZGRSZXNvdXJjZSgnZXZpZGVuY2UnKTtcbiAgICBjb25zdCBtYW51YWxFdmlkZW5jZVJlc291cmNlID0gZXZpZGVuY2VSZXNvdXJjZS5hZGRSZXNvdXJjZSgnbWFudWFsJyk7XG4gICAgbWFudWFsRXZpZGVuY2VSZXNvdXJjZS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgTGFtYmRhSW50ZWdyYXRpb24obGlua01hbnVhbEV2aWRlbmNlSGFuZGxlciksIHtcbiAgICAgIGF1dGhvcml6ZXIsXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogQXV0aG9yaXphdGlvblR5cGUuQ09HTklUT1xuICAgIH0pO1xuICB9XG59Il19