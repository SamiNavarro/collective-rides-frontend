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

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as logs from 'aws-cdk-lib/aws-logs';
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
export class ClubServiceConstruct extends Construct {
  // Phase 2.1 functions
  public readonly listClubsFunction: lambdaNodejs.NodejsFunction;
  public readonly getClubFunction: lambdaNodejs.NodejsFunction;
  public readonly createClubFunction: lambdaNodejs.NodejsFunction;
  public readonly updateClubFunction: lambdaNodejs.NodejsFunction;

  // Phase 2.2 membership functions (BATCH 1 - Deploy first)
  public readonly joinClubFunction: lambdaNodejs.NodejsFunction;
  public readonly leaveClubFunction: lambdaNodejs.NodejsFunction;
  public readonly listMembersFunction: lambdaNodejs.NodejsFunction;
  
  // Phase 2.2 membership functions (BATCH 2 - Deploy second)
  public readonly updateMemberFunction: lambdaNodejs.NodejsFunction;
  public readonly removeMemberFunction: lambdaNodejs.NodejsFunction;

  // Phase 2.2 invitation functions (BATCH 3 - Deploy third)
  public readonly inviteUserFunction: lambdaNodejs.NodejsFunction;
  public readonly acceptInvitationFunction: lambdaNodejs.NodejsFunction;
  public readonly listInvitationsFunction: lambdaNodejs.NodejsFunction;

  // Phase 2.2 user functions (BATCH 4 - Deploy fourth)
  public readonly getMembershipsFunction: lambdaNodejs.NodejsFunction;
  public readonly processJoinRequestFunction: lambdaNodejs.NodejsFunction;

  constructor(scope: Construct, id: string, props: ClubServiceProps) {
    super(scope, id);

    // Common Lambda configuration
    const commonLambdaProps = {
      runtime: lambda.Runtime.NODEJS_24_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        TABLE_NAME: props.mainTable.tableName,
        ENVIRONMENT: props.environment,
      },
      logRetention: props.environment === 'production' 
        ? logs.RetentionDays.ONE_MONTH 
        : logs.RetentionDays.ONE_WEEK,
      bundling: {
        forceDockerBundling: false,
        externalModules: ['@aws-sdk/*'],
        minify: false, // Disable minification to speed up bundling
        sourceMap: false, // Disable source maps to speed up bundling
      },
    };

    // Lambda function for GET /clubs (public)
    this.listClubsFunction = new lambdaNodejs.NodejsFunction(this, 'ListClubsFunction', {
      ...commonLambdaProps,
      functionName: `sydney-cycles-list-clubs-${props.environment}`,
      description: 'List clubs with pagination and filtering (public endpoint)',
      entry: 'services/club-service/handlers/list-clubs.ts',
      handler: 'handler',
    });

    // Lambda function for GET /clubs/{id} (public)
    this.getClubFunction = new lambdaNodejs.NodejsFunction(this, 'GetClubFunction', {
      ...commonLambdaProps,
      functionName: `sydney-cycles-get-club-${props.environment}`,
      description: 'Get club details by ID (public endpoint)',
      entry: 'services/club-service/handlers/get-club.ts',
      handler: 'handler',
    });

    // Lambda function for POST /clubs (admin only)
    this.createClubFunction = new lambdaNodejs.NodejsFunction(this, 'CreateClubFunction', {
      ...commonLambdaProps,
      functionName: `sydney-cycles-create-club-${props.environment}`,
      description: 'Create new club (SiteAdmin only)',
      entry: 'services/club-service/handlers/create-club.ts',
      handler: 'handler',
    });

    // Lambda function for PUT /clubs/{id} (admin only)
    this.updateClubFunction = new lambdaNodejs.NodejsFunction(this, 'UpdateClubFunction', {
      ...commonLambdaProps,
      functionName: `sydney-cycles-update-club-${props.environment}`,
      description: 'Update existing club (SiteAdmin only)',
      entry: 'services/club-service/handlers/update-club.ts',
      handler: 'handler',
    });

    // Phase 2.2 Membership Functions

    // Lambda function for POST /clubs/{id}/members
    this.joinClubFunction = new lambdaNodejs.NodejsFunction(this, 'JoinClubFunction', {
      ...commonLambdaProps,
      functionName: `sydney-cycles-join-club-${props.environment}`,
      description: 'Join club (authenticated users)',
      entry: 'services/club-service/handlers/membership/join-club.ts',
      handler: 'handler',
    });

    // Lambda function for DELETE /clubs/{id}/members/me
    this.leaveClubFunction = new lambdaNodejs.NodejsFunction(this, 'LeaveClubFunction', {
      ...commonLambdaProps,
      functionName: `sydney-cycles-leave-club-${props.environment}`,
      description: 'Leave club (authenticated users)',
      entry: 'services/club-service/handlers/membership/leave-club.ts',
      handler: 'handler',
    });

    // Lambda function for GET /clubs/{id}/members
    this.listMembersFunction = new lambdaNodejs.NodejsFunction(this, 'ListMembersFunction', {
      ...commonLambdaProps,
      functionName: `sydney-cycles-list-members-${props.environment}`,
      description: 'List club members (club members)',
      entry: 'services/club-service/handlers/membership/list-members.ts',
      handler: 'handler',
    });

    // BATCH 2 - Member Management Functions
    // Lambda function for PUT /clubs/{id}/members/{userId}
    this.updateMemberFunction = new lambdaNodejs.NodejsFunction(this, 'UpdateMemberFunction', {
      ...commonLambdaProps,
      functionName: `sydney-cycles-update-member-${props.environment}`,
      description: 'Update member role (club admins)',
      entry: 'services/club-service/handlers/membership/update-member.ts',
      handler: 'handler',
    });

    // Lambda function for DELETE /clubs/{id}/members/{userId}
    this.removeMemberFunction = new lambdaNodejs.NodejsFunction(this, 'RemoveMemberFunction', {
      ...commonLambdaProps,
      functionName: `sydney-cycles-remove-member-${props.environment}`,
      description: 'Remove member from club (club admins)',
      entry: 'services/club-service/handlers/membership/remove-member.ts',
      handler: 'handler',
    });

    // BATCH 3 - Invitation Functions
    // Lambda function for POST /clubs/{id}/invitations
    this.inviteUserFunction = new lambdaNodejs.NodejsFunction(this, 'InviteUserFunction', {
      ...commonLambdaProps,
      functionName: `sydney-cycles-invite-user-${props.environment}`,
      description: 'Invite user to club (club admins)',
      entry: 'services/club-service/handlers/invitation/invite-user.ts',
      handler: 'handler',
    });

    // Lambda function for PUT /invitations/{id}
    this.acceptInvitationFunction = new lambdaNodejs.NodejsFunction(this, 'AcceptInvitationFunction', {
      ...commonLambdaProps,
      functionName: `sydney-cycles-accept-invitation-${props.environment}`,
      description: 'Accept or decline invitation (authenticated users)',
      entry: 'services/club-service/handlers/invitation/accept-invitation.ts',
      handler: 'handler',
    });

    // Lambda function for GET /users/me/invitations
    this.listInvitationsFunction = new lambdaNodejs.NodejsFunction(this, 'ListInvitationsFunction', {
      ...commonLambdaProps,
      functionName: `sydney-cycles-list-invitations-${props.environment}`,
      description: 'List user invitations (authenticated users)',
      entry: 'services/club-service/handlers/invitation/list-invitations.ts',
      handler: 'handler',
    });

    // BATCH 4 - User Functions
    // Lambda function for GET /users/me/memberships
    this.getMembershipsFunction = new lambdaNodejs.NodejsFunction(this, 'GetMembershipsFunction', {
      ...commonLambdaProps,
      functionName: `sydney-cycles-get-memberships-${props.environment}`,
      description: 'Get user memberships (authenticated users)',
      entry: 'services/club-service/handlers/user/get-memberships.ts',
      handler: 'handler',
    });

    // Lambda function for PUT /clubs/{id}/requests/{membershipId}
    this.processJoinRequestFunction = new lambdaNodejs.NodejsFunction(this, 'ProcessJoinRequestFunction', {
      ...commonLambdaProps,
      functionName: `sydney-cycles-process-join-request-${props.environment}`,
      description: 'Process join request (club admins)',
      entry: 'services/club-service/handlers/membership/process-join-request.ts',
      handler: 'handler',
    });

    // Grant DynamoDB permissions to Lambda functions
    const allFunctions = [
      // Phase 2.1 functions
      this.listClubsFunction,
      this.getClubFunction,
      this.createClubFunction,
      this.updateClubFunction,
      // Phase 2.2 membership functions
      this.joinClubFunction,
      this.leaveClubFunction,
      this.listMembersFunction,
      this.updateMemberFunction,
      this.removeMemberFunction,
      // Phase 2.2 invitation functions
      this.inviteUserFunction,
      this.acceptInvitationFunction,
      this.listInvitationsFunction,
      // Phase 2.2 user functions
      this.getMembershipsFunction,
      this.processJoinRequestFunction,
    ];

    allFunctions.forEach(func => {
      props.mainTable.grantReadWriteData(func);
    });

    // API Gateway integration
    this.setupApiGatewayIntegration(props);

    // Tags for all functions
    this.tagAllFunctions(props.environment);

  }

  /**
   * Tag all functions for resource management
   */
  private tagAllFunctions(environment: string): void {
    const allFunctions = [
      // Phase 2.1 functions
      { func: this.listClubsFunction, phase: '2.1-ClubService' },
      { func: this.getClubFunction, phase: '2.1-ClubService' },
      { func: this.createClubFunction, phase: '2.1-ClubService' },
      { func: this.updateClubFunction, phase: '2.1-ClubService' },
      // Phase 2.2 membership functions
      { func: this.joinClubFunction, phase: '2.2-ClubMembership' },
      { func: this.leaveClubFunction, phase: '2.2-ClubMembership' },
      { func: this.listMembersFunction, phase: '2.2-ClubMembership' },
      { func: this.updateMemberFunction, phase: '2.2-ClubMembership' },
      { func: this.removeMemberFunction, phase: '2.2-ClubMembership' },
      // Phase 2.2 invitation functions
      { func: this.inviteUserFunction, phase: '2.2-ClubInvitations' },
      { func: this.acceptInvitationFunction, phase: '2.2-ClubInvitations' },
      { func: this.listInvitationsFunction, phase: '2.2-ClubInvitations' },
      // Phase 2.2 user functions
      { func: this.getMembershipsFunction, phase: '2.2-ClubMembership' },
      { func: this.processJoinRequestFunction, phase: '2.2-ClubMembership' },
    ];

    allFunctions.forEach(({ func, phase }) => {
      cdk.Tags.of(func).add('Component', 'ClubService');
      cdk.Tags.of(func).add('Phase', phase);
      cdk.Tags.of(func).add('Environment', environment);
    });
  }

  /**
   * Set up API Gateway integration for club endpoints
   */
  private setupApiGatewayIntegration(props: ClubServiceProps): void {
    // Get the v1 resource (should exist from Phase 1.1)
    const v1Resource = props.api.root.getResource('v1');
    if (!v1Resource) {
      throw new Error('v1 API resource not found - ensure Phase 1.1 infrastructure is deployed');
    }

    // Get or create the clubs resource
    let clubsResource = v1Resource.getResource('clubs');
    if (!clubsResource) {
      clubsResource = v1Resource.addResource('clubs');
    }

    // Get or create the users resource
    let usersResource = v1Resource.getResource('users');
    if (!usersResource) {
      usersResource = v1Resource.addResource('users');
    }

    // Get or create the invitations resource
    let invitationsResource = v1Resource.getResource('invitations');
    if (!invitationsResource) {
      invitationsResource = v1Resource.addResource('invitations');
    }

    // GET /clubs endpoint (public - no authorization)
    clubsResource.addMethod('GET', new apigateway.LambdaIntegration(this.listClubsFunction), {
      // No authorizer for public endpoint
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
        {
          statusCode: '400',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
      ],
    });

    // POST /clubs endpoint (admin only - requires authorization)
    clubsResource.addMethod('POST', new apigateway.LambdaIntegration(this.createClubFunction), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
      requestModels: {
        'application/json': apigateway.Model.EMPTY_MODEL, // Will be validated in Lambda
      },
      methodResponses: [
        {
          statusCode: '201',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
        {
          statusCode: '400',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
        {
          statusCode: '401',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
        {
          statusCode: '403',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
        {
          statusCode: '409',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
      ],
    });

    // Get or create the {clubId} resource under clubs (matching rest-api.ts structure)
    let clubIdResource = clubsResource.getResource('{clubId}');
    if (!clubIdResource) {
      clubIdResource = clubsResource.addResource('{clubId}');
    }

    // GET /clubs/{clubId} endpoint (public - no authorization)
    clubIdResource.addMethod('GET', new apigateway.LambdaIntegration(this.getClubFunction), {
      // No authorizer for public endpoint
      requestParameters: {
        'method.request.path.clubId': true,
      },
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
        {
          statusCode: '400',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
        {
          statusCode: '404',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
      ],
    });

    // PUT /clubs/{clubId} endpoint (admin only - requires authorization)
    clubIdResource.addMethod('PUT', new apigateway.LambdaIntegration(this.updateClubFunction), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
      requestParameters: {
        'method.request.path.clubId': true,
      },
      requestModels: {
        'application/json': apigateway.Model.EMPTY_MODEL, // Will be validated in Lambda
      },
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
        {
          statusCode: '400',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
        {
          statusCode: '401',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
        {
          statusCode: '403',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
        {
          statusCode: '404',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
        {
          statusCode: '409',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
      ],
    });

    // Phase 2.2 Membership Endpoints

    // Get or create the members resource under clubs/{clubId}
    let membersResource = clubIdResource.getResource('members');
    if (!membersResource) {
      membersResource = clubIdResource.addResource('members');
    }

    // POST /clubs/{clubId}/members - Join club
    membersResource.addMethod('POST', new apigateway.LambdaIntegration(this.joinClubFunction), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
      requestParameters: {
        'method.request.path.clubId': true,
      },
      methodResponses: [
        { statusCode: '201' },
        { statusCode: '202' },
        { statusCode: '400' },
        { statusCode: '401' },
        { statusCode: '403' },
        { statusCode: '409' },
        { statusCode: '500' },
      ],
    });

    // GET /clubs/{clubId}/members - List club members
    membersResource.addMethod('GET', new apigateway.LambdaIntegration(this.listMembersFunction), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
      requestParameters: {
        'method.request.path.clubId': true,
        'method.request.querystring.limit': false,
        'method.request.querystring.cursor': false,
        'method.request.querystring.role': false,
        'method.request.querystring.status': false,
      },
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '400' },
        { statusCode: '401' },
        { statusCode: '403' },
        { statusCode: '404' },
        { statusCode: '500' },
      ],
    });

    // DELETE /clubs/{clubId}/members/me - Leave club
    const membersMe = membersResource.addResource('me');
    membersMe.addMethod('DELETE', new apigateway.LambdaIntegration(this.leaveClubFunction), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
      requestParameters: {
        'method.request.path.clubId': true,
      },
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '400' },
        { statusCode: '401' },
        { statusCode: '403' },
        { statusCode: '404' },
        { statusCode: '500' },
      ],
    });

    // BATCH 2 - Member Management API Routes (using singular "member" to avoid conflict)
    // Create separate "member" resource for admin operations on specific users
    let memberResource = clubIdResource.getResource('member');
    if (!memberResource) {
      memberResource = clubIdResource.addResource('member');
    }

    // PUT /clubs/{clubId}/member/{userId} - Update member role
    const memberUserId = memberResource.addResource('{userId}');
    memberUserId.addMethod('PUT', new apigateway.LambdaIntegration(this.updateMemberFunction), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
      requestParameters: {
        'method.request.path.clubId': true,
        'method.request.path.userId': true,
      },
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '400' },
        { statusCode: '401' },
        { statusCode: '403' },
        { statusCode: '404' },
        { statusCode: '500' },
      ],
    });

    // DELETE /clubs/{clubId}/member/{userId} - Remove member
    memberUserId.addMethod('DELETE', new apigateway.LambdaIntegration(this.removeMemberFunction), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
      requestParameters: {
        'method.request.path.clubId': true,
        'method.request.path.userId': true,
      },
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '400' },
        { statusCode: '401' },
        { statusCode: '403' },
        { statusCode: '404' },
        { statusCode: '500' },
      ],
    });

    // Phase 2.2 Invitation Endpoints

    // Get or create the invitations resource under clubs/{clubId}
    let clubInvitationsResource = clubIdResource.getResource('invitations');
    if (!clubInvitationsResource) {
      clubInvitationsResource = clubIdResource.addResource('invitations');
    }

    // POST /clubs/{clubId}/invitations - Invite user to club
    clubInvitationsResource.addMethod('POST', new apigateway.LambdaIntegration(this.inviteUserFunction), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
      requestParameters: {
        'method.request.path.clubId': true,
      },
      methodResponses: [
        { statusCode: '201' },
        { statusCode: '400' },
        { statusCode: '401' },
        { statusCode: '403' },
        { statusCode: '404' },
        { statusCode: '409' },
        { statusCode: '500' },
      ],
    });

    // PUT /invitations/{id} - Accept/decline invitation
    const invitationId = invitationsResource.addResource('{id}');
    invitationId.addMethod('PUT', new apigateway.LambdaIntegration(this.acceptInvitationFunction), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
      requestParameters: {
        'method.request.path.id': true,
      },
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '400' },
        { statusCode: '401' },
        { statusCode: '403' },
        { statusCode: '404' },
        { statusCode: '500' },
      ],
    });

    // Phase 2.2 Join Request Management

    // Get or create the requests resource under clubs/{clubId}
    let requestsResource = clubIdResource.getResource('requests');
    if (!requestsResource) {
      requestsResource = clubIdResource.addResource('requests');
    }

    // PUT /clubs/{clubId}/requests/{membershipId} - Process join request
    const requestMembershipId = requestsResource.addResource('{membershipId}');
    requestMembershipId.addMethod('PUT', new apigateway.LambdaIntegration(this.processJoinRequestFunction), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
      requestParameters: {
        'method.request.path.clubId': true,
        'method.request.path.membershipId': true,
      },
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '400' },
        { statusCode: '401' },
        { statusCode: '403' },
        { statusCode: '404' },
        { statusCode: '500' },
      ],
    });

    // Phase 2.2 User Endpoints

    // GET /users/me/memberships - Get user's club memberships
    let usersMe = usersResource.getResource('me');
    if (!usersMe) {
      usersMe = usersResource.addResource('me');
    }
    const usersMemberships = usersMe.addResource('memberships');
    usersMemberships.addMethod('GET', new apigateway.LambdaIntegration(this.getMembershipsFunction), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
      requestParameters: {
        'method.request.querystring.status': false,
      },
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '400' },
        { statusCode: '401' },
        { statusCode: '500' },
      ],
    });

    // GET /users/me/invitations - Get user's pending invitations
    const usersInvitations = usersMe.addResource('invitations');
    usersInvitations.addMethod('GET', new apigateway.LambdaIntegration(this.listInvitationsFunction), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
      requestParameters: {
        'method.request.querystring.limit': false,
        'method.request.querystring.cursor': false,
        'method.request.querystring.status': false,
      },
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '400' },
        { statusCode: '401' },
        { statusCode: '500' },
      ],
    });
  }
}