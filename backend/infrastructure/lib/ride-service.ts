import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { RestApi, LambdaIntegration, Authorizer, AuthorizationType } from 'aws-cdk-lib/aws-apigateway';
import { Duration } from 'aws-cdk-lib';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface RideServiceProps {
  api: RestApi;
  authorizer: Authorizer;
  mainTable: Table;
  environment: string;
}

export class RideService extends Construct {
  constructor(scope: Construct, id: string, props: RideServiceProps) {
    super(scope, id);

    const { api, authorizer, mainTable, environment } = props;

    // Common Lambda configuration with optimized bundling
    const commonLambdaProps = {
      runtime: lambda.Runtime.NODEJS_24_X,
      timeout: Duration.seconds(30),
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
        minify: false, // Disable minification to speed up bundling
        sourceMap: false, // Disable source maps to speed up bundling
      },
    };

    // DynamoDB permissions
    const dynamoPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
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
    ridesResource.addMethod('POST', new LambdaIntegration(createRideHandler), {
      authorizer,
      authorizationType: AuthorizationType.COGNITO
    });

    ridesResource.addMethod('GET', new LambdaIntegration(listRidesHandler), {
      authorizer,
      authorizationType: AuthorizationType.COGNITO
    });

    const rideResource = ridesResource.addResource('{rideId}');
    rideResource.addMethod('GET', new LambdaIntegration(getRideHandler), {
      authorizer,
      authorizationType: AuthorizationType.COGNITO
    });

    // Publish ride endpoint
    const publishResource = rideResource.addResource('publish');
    publishResource.addMethod('POST', new LambdaIntegration(publishRideHandler), {
      authorizer,
      authorizationType: AuthorizationType.COGNITO
    });

    // Participation endpoints
    const participantsResource = rideResource.addResource('participants');
    participantsResource.addMethod('POST', new LambdaIntegration(joinRideHandler), {
      authorizer,
      authorizationType: AuthorizationType.COGNITO
    });

    const meParticipantResource = participantsResource.addResource('me');
    meParticipantResource.addMethod('DELETE', new LambdaIntegration(leaveRideHandler), {
      authorizer,
      authorizationType: AuthorizationType.COGNITO
    });

    // User rides endpoint
    const users = v1.getResource('users') || v1.addResource('users');
    const meResource = users.getResource('me') || users.addResource('me');
    const userRidesResource = meResource.addResource('rides');
    userRidesResource.addMethod('GET', new LambdaIntegration(getUserRidesHandler), {
      authorizer,
      authorizationType: AuthorizationType.COGNITO
    });

    // Phase 2.5: Completion endpoints
    const completeResource = rideResource.addResource('complete');
    completeResource.addMethod('POST', new LambdaIntegration(completeRideHandler), {
      authorizer,
      authorizationType: AuthorizationType.COGNITO
    });

    const summaryResource = rideResource.addResource('summary');
    summaryResource.addMethod('GET', new LambdaIntegration(getRideSummaryHandler), {
      authorizer,
      authorizationType: AuthorizationType.COGNITO
    });

    // Phase 2.5: Attendance endpoints
    const participantResource = participantsResource.addResource('{userId}');
    const attendanceResource = participantResource.addResource('attendance');
    attendanceResource.addMethod('PUT', new LambdaIntegration(updateAttendanceHandler), {
      authorizer,
      authorizationType: AuthorizationType.COGNITO
    });

    // Phase 2.5: Evidence endpoints
    const evidenceResource = participantResource.addResource('evidence');
    const manualEvidenceResource = evidenceResource.addResource('manual');
    manualEvidenceResource.addMethod('POST', new LambdaIntegration(linkManualEvidenceHandler), {
      authorizer,
      authorizationType: AuthorizationType.COGNITO
    });
  }
}