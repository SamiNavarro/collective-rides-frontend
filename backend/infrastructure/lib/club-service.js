"use strict";
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
exports.ClubServiceConstruct = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const lambdaNodejs = __importStar(require("aws-cdk-lib/aws-lambda-nodejs"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const constructs_1 = require("constructs");
/**
 * Club Service construct
 *
 * Creates Lambda functions for club operations and integrates them
 * with the existing API Gateway and DynamoDB infrastructure.
 */
class ClubServiceConstruct extends constructs_1.Construct {
    constructor(scope, id, props) {
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
                minify: false,
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
    tagAllFunctions(environment) {
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
    setupApiGatewayIntegration(props) {
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
exports.ClubServiceConstruct = ClubServiceConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2x1Yi1zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2x1Yi1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7O0dBU0c7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsaURBQW1DO0FBQ25DLCtEQUFpRDtBQUNqRCw0RUFBOEQ7QUFDOUQsdUVBQXlEO0FBRXpELDJEQUE2QztBQUM3QywyQ0FBdUM7QUFZdkM7Ozs7O0dBS0c7QUFDSCxNQUFhLG9CQUFxQixTQUFRLHNCQUFTO0lBeUJqRCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXVCO1FBQy9ELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsOEJBQThCO1FBQzlCLE1BQU0saUJBQWlCLEdBQUc7WUFDeEIsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ2pDLFVBQVUsRUFBRSxHQUFHO1lBQ2YsV0FBVyxFQUFFO2dCQUNYLFVBQVUsRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLFNBQVM7Z0JBQ3JDLFdBQVcsRUFBRSxLQUFLLENBQUMsV0FBVzthQUMvQjtZQUNELFlBQVksRUFBRSxLQUFLLENBQUMsV0FBVyxLQUFLLFlBQVk7Z0JBQzlDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVM7Z0JBQzlCLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVE7WUFDL0IsUUFBUSxFQUFFO2dCQUNSLG1CQUFtQixFQUFFLEtBQUs7Z0JBQzFCLGVBQWUsRUFBRSxDQUFDLFlBQVksQ0FBQztnQkFDL0IsTUFBTSxFQUFFLEtBQUs7Z0JBQ2IsU0FBUyxFQUFFLEtBQUssRUFBRSwyQ0FBMkM7YUFDOUQ7U0FDRixDQUFDO1FBRUYsMENBQTBDO1FBQzFDLElBQUksQ0FBQyxpQkFBaUIs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LEVBQUU7YUFDdEI7U0FDRixDQUFDLENBQUM7UUFFSCw2REFBNkQ7UUFDN0QsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzVELGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLEVBQUU7WUFDaEcsVUFBVSxFQUFFLEtBQUssQ0FBQyxVQUFVO1lBQzVCLGlCQUFpQixFQUFFLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPO1lBQ3ZELGlCQUFpQixFQUFFO2dCQUNqQixrQ0FBa0MsRUFBRSxLQUFLO2dCQUN6QyxtQ0FBbUMsRUFBRSxLQUFLO2dCQUMxQyxtQ0FBbUMsRUFBRSxLQUFLO2FBQzNDO1lBQ0QsZUFBZSxFQUFFO2dCQUNmLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRTtnQkFDckIsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFO2dCQUNyQixFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUU7Z0JBQ3JCLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRTthQUN0QjtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXJwQkQsb0RBcXBCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ2x1YiBTZXJ2aWNlIEluZnJhc3RydWN0dXJlIC0gUGhhc2UgMi4xXG4gKiBcbiAqIENESyBjb25zdHJ1Y3QgZm9yIENsdWIgU2VydmljZSBMYW1iZGEgZnVuY3Rpb25zIGFuZCBBUEkgR2F0ZXdheSBpbnRlZ3JhdGlvbi5cbiAqIEludGVncmF0ZXMgd2l0aCBleGlzdGluZyBQaGFzZSAxLnggaW5mcmFzdHJ1Y3R1cmUgY29tcG9uZW50cy5cbiAqIFxuICogQ29tcGxpYW5jZTpcbiAqIC0gUGhhc2UgMi4xIFNwZWM6IC5raXJvL3NwZWNzL3BoYXNlLTIuMS5jbHViLXNlcnZpY2UudjEubWRcbiAqIC0gQVdTIEFyY2hpdGVjdHVyZTogLmtpcm8vc3BlY3MvYXJjaGl0ZWN0dXJlLmF3cy52MS5tZFxuICovXG5cbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBsYW1iZGFOb2RlanMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYS1ub2RlanMnO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgbG9ncyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbG9ncyc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuLyoqXG4gKiBDbHViIFNlcnZpY2UgY29uZmlndXJhdGlvblxuICovXG5leHBvcnQgaW50ZXJmYWNlIENsdWJTZXJ2aWNlUHJvcHMge1xuICBlbnZpcm9ubWVudDogc3RyaW5nO1xuICBhcGk6IGFwaWdhdGV3YXkuUmVzdEFwaTtcbiAgYXV0aG9yaXplcjogYXBpZ2F0ZXdheS5Db2duaXRvVXNlclBvb2xzQXV0aG9yaXplcjtcbiAgbWFpblRhYmxlOiBkeW5hbW9kYi5UYWJsZTtcbn1cblxuLyoqXG4gKiBDbHViIFNlcnZpY2UgY29uc3RydWN0XG4gKiBcbiAqIENyZWF0ZXMgTGFtYmRhIGZ1bmN0aW9ucyBmb3IgY2x1YiBvcGVyYXRpb25zIGFuZCBpbnRlZ3JhdGVzIHRoZW1cbiAqIHdpdGggdGhlIGV4aXN0aW5nIEFQSSBHYXRld2F5IGFuZCBEeW5hbW9EQiBpbmZyYXN0cnVjdHVyZS5cbiAqL1xuZXhwb3J0IGNsYXNzIENsdWJTZXJ2aWNlQ29uc3RydWN0IGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgLy8gUGhhc2UgMi4xIGZ1bmN0aW9uc1xuICBwdWJsaWMgcmVhZG9ubHkgbGlzdENsdWJzRnVuY3Rpb246IGxhbWJkYU5vZGVqcy5Ob2RlanNGdW5jdGlvbjtcbiAgcHVibGljIHJlYWRvbmx5IGdldENsdWJGdW5jdGlvbjogbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uO1xuICBwdWJsaWMgcmVhZG9ubHkgY3JlYXRlQ2x1YkZ1bmN0aW9uOiBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb247XG4gIHB1YmxpYyByZWFkb25seSB1cGRhdGVDbHViRnVuY3Rpb246IGxhbWJkYU5vZGVqcy5Ob2RlanNGdW5jdGlvbjtcblxuICAvLyBQaGFzZSAyLjIgbWVtYmVyc2hpcCBmdW5jdGlvbnMgKEJBVENIIDEgLSBEZXBsb3kgZmlyc3QpXG4gIHB1YmxpYyByZWFkb25seSBqb2luQ2x1YkZ1bmN0aW9uOiBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb247XG4gIHB1YmxpYyByZWFkb25seSBsZWF2ZUNsdWJGdW5jdGlvbjogbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uO1xuICBwdWJsaWMgcmVhZG9ubHkgbGlzdE1lbWJlcnNGdW5jdGlvbjogbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uO1xuICBcbiAgLy8gUGhhc2UgMi4yIG1lbWJlcnNoaXAgZnVuY3Rpb25zIChCQVRDSCAyIC0gRGVwbG95IHNlY29uZClcbiAgcHVibGljIHJlYWRvbmx5IHVwZGF0ZU1lbWJlckZ1bmN0aW9uOiBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb247XG4gIHB1YmxpYyByZWFkb25seSByZW1vdmVNZW1iZXJGdW5jdGlvbjogbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uO1xuXG4gIC8vIFBoYXNlIDIuMiBpbnZpdGF0aW9uIGZ1bmN0aW9ucyAoQkFUQ0ggMyAtIERlcGxveSB0aGlyZClcbiAgcHVibGljIHJlYWRvbmx5IGludml0ZVVzZXJGdW5jdGlvbjogbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uO1xuICBwdWJsaWMgcmVhZG9ubHkgYWNjZXB0SW52aXRhdGlvbkZ1bmN0aW9uOiBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb247XG4gIHB1YmxpYyByZWFkb25seSBsaXN0SW52aXRhdGlvbnNGdW5jdGlvbjogbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uO1xuXG4gIC8vIFBoYXNlIDIuMiB1c2VyIGZ1bmN0aW9ucyAoQkFUQ0ggNCAtIERlcGxveSBmb3VydGgpXG4gIHB1YmxpYyByZWFkb25seSBnZXRNZW1iZXJzaGlwc0Z1bmN0aW9uOiBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb247XG4gIHB1YmxpYyByZWFkb25seSBwcm9jZXNzSm9pblJlcXVlc3RGdW5jdGlvbjogbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBDbHViU2VydmljZVByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIC8vIENvbW1vbiBMYW1iZGEgY29uZmlndXJhdGlvblxuICAgIGNvbnN0IGNvbW1vbkxhbWJkYVByb3BzID0ge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzI0X1gsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICBtZW1vcnlTaXplOiAyNTYsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy5tYWluVGFibGUudGFibGVOYW1lLFxuICAgICAgICBFTlZJUk9OTUVOVDogcHJvcHMuZW52aXJvbm1lbnQsXG4gICAgICB9LFxuICAgICAgbG9nUmV0ZW50aW9uOiBwcm9wcy5lbnZpcm9ubWVudCA9PT0gJ3Byb2R1Y3Rpb24nIFxuICAgICAgICA/IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfTU9OVEggXG4gICAgICAgIDogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9XRUVLLFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIG1pbmlmeTogZmFsc2UsIC8vIERpc2FibGUgbWluaWZpY2F0aW9uIHRvIHNwZWVkIHVwIGJ1bmRsaW5nXG4gICAgICAgIHNvdXJjZU1hcDogZmFsc2UsIC8vIERpc2FibGUgc291cmNlIG1hcHMgdG8gc3BlZWQgdXAgYnVuZGxpbmdcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIC8vIExhbWJkYSBmdW5jdGlvbiBmb3IgR0VUIC9jbHVicyAocHVibGljKVxuICAgIHRoaXMubGlzdENsdWJzRnVuY3Rpb24gPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdMaXN0Q2x1YnNGdW5jdGlvbicsIHtcbiAgICAgIC4uLmNvbW1vbkxhbWJkYVByb3BzLFxuICAgICAgZnVuY3Rpb25OYW1lOiBgc3lkbmV5LWN5Y2xlcy1saXN0LWNsdWJzLSR7cHJvcHMuZW52aXJvbm1lbnR9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnTGlzdCBjbHVicyB3aXRoIHBhZ2luYXRpb24gYW5kIGZpbHRlcmluZyAocHVibGljIGVuZHBvaW50KScsXG4gICAgICBlbnRyeTogJ3NlcnZpY2VzL2NsdWItc2VydmljZS9oYW5kbGVycy9saXN0LWNsdWJzLnRzJyxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICB9KTtcblxuICAgIC8vIExhbWJkYSBmdW5jdGlvbiBmb3IgR0VUIC9jbHVicy97aWR9IChwdWJsaWMpXG4gICAgdGhpcy5nZXRDbHViRnVuY3Rpb24gPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdHZXRDbHViRnVuY3Rpb24nLCB7XG4gICAgICAuLi5jb21tb25MYW1iZGFQcm9wcyxcbiAgICAgIGZ1bmN0aW9uTmFtZTogYHN5ZG5leS1jeWNsZXMtZ2V0LWNsdWItJHtwcm9wcy5lbnZpcm9ubWVudH1gLFxuICAgICAgZGVzY3JpcHRpb246ICdHZXQgY2x1YiBkZXRhaWxzIGJ5IElEIChwdWJsaWMgZW5kcG9pbnQpJyxcbiAgICAgIGVudHJ5OiAnc2VydmljZXMvY2x1Yi1zZXJ2aWNlL2hhbmRsZXJzL2dldC1jbHViLnRzJyxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICB9KTtcblxuICAgIC8vIExhbWJkYSBmdW5jdGlvbiBmb3IgUE9TVCAvY2x1YnMgKGFkbWluIG9ubHkpXG4gICAgdGhpcy5jcmVhdGVDbHViRnVuY3Rpb24gPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdDcmVhdGVDbHViRnVuY3Rpb24nLCB7XG4gICAgICAuLi5jb21tb25MYW1iZGFQcm9wcyxcbiAgICAgIGZ1bmN0aW9uTmFtZTogYHN5ZG5leS1jeWNsZXMtY3JlYXRlLWNsdWItJHtwcm9wcy5lbnZpcm9ubWVudH1gLFxuICAgICAgZGVzY3JpcHRpb246ICdDcmVhdGUgbmV3IGNsdWIgKFNpdGVBZG1pbiBvbmx5KScsXG4gICAgICBlbnRyeTogJ3NlcnZpY2VzL2NsdWItc2VydmljZS9oYW5kbGVycy9jcmVhdGUtY2x1Yi50cycsXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcicsXG4gICAgfSk7XG5cbiAgICAvLyBMYW1iZGEgZnVuY3Rpb24gZm9yIFBVVCAvY2x1YnMve2lkfSAoYWRtaW4gb25seSlcbiAgICB0aGlzLnVwZGF0ZUNsdWJGdW5jdGlvbiA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ1VwZGF0ZUNsdWJGdW5jdGlvbicsIHtcbiAgICAgIC4uLmNvbW1vbkxhbWJkYVByb3BzLFxuICAgICAgZnVuY3Rpb25OYW1lOiBgc3lkbmV5LWN5Y2xlcy11cGRhdGUtY2x1Yi0ke3Byb3BzLmVudmlyb25tZW50fWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ1VwZGF0ZSBleGlzdGluZyBjbHViIChTaXRlQWRtaW4gb25seSknLFxuICAgICAgZW50cnk6ICdzZXJ2aWNlcy9jbHViLXNlcnZpY2UvaGFuZGxlcnMvdXBkYXRlLWNsdWIudHMnLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgIH0pO1xuXG4gICAgLy8gUGhhc2UgMi4yIE1lbWJlcnNoaXAgRnVuY3Rpb25zXG5cbiAgICAvLyBMYW1iZGEgZnVuY3Rpb24gZm9yIFBPU1QgL2NsdWJzL3tpZH0vbWVtYmVyc1xuICAgIHRoaXMuam9pbkNsdWJGdW5jdGlvbiA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ0pvaW5DbHViRnVuY3Rpb24nLCB7XG4gICAgICAuLi5jb21tb25MYW1iZGFQcm9wcyxcbiAgICAgIGZ1bmN0aW9uTmFtZTogYHN5ZG5leS1jeWNsZXMtam9pbi1jbHViLSR7cHJvcHMuZW52aXJvbm1lbnR9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnSm9pbiBjbHViIChhdXRoZW50aWNhdGVkIHVzZXJzKScsXG4gICAgICBlbnRyeTogJ3NlcnZpY2VzL2NsdWItc2VydmljZS9oYW5kbGVycy9tZW1iZXJzaGlwL2pvaW4tY2x1Yi50cycsXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcicsXG4gICAgfSk7XG5cbiAgICAvLyBMYW1iZGEgZnVuY3Rpb24gZm9yIERFTEVURSAvY2x1YnMve2lkfS9tZW1iZXJzL21lXG4gICAgdGhpcy5sZWF2ZUNsdWJGdW5jdGlvbiA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ0xlYXZlQ2x1YkZ1bmN0aW9uJywge1xuICAgICAgLi4uY29tbW9uTGFtYmRhUHJvcHMsXG4gICAgICBmdW5jdGlvbk5hbWU6IGBzeWRuZXktY3ljbGVzLWxlYXZlLWNsdWItJHtwcm9wcy5lbnZpcm9ubWVudH1gLFxuICAgICAgZGVzY3JpcHRpb246ICdMZWF2ZSBjbHViIChhdXRoZW50aWNhdGVkIHVzZXJzKScsXG4gICAgICBlbnRyeTogJ3NlcnZpY2VzL2NsdWItc2VydmljZS9oYW5kbGVycy9tZW1iZXJzaGlwL2xlYXZlLWNsdWIudHMnLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgIH0pO1xuXG4gICAgLy8gTGFtYmRhIGZ1bmN0aW9uIGZvciBHRVQgL2NsdWJzL3tpZH0vbWVtYmVyc1xuICAgIHRoaXMubGlzdE1lbWJlcnNGdW5jdGlvbiA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ0xpc3RNZW1iZXJzRnVuY3Rpb24nLCB7XG4gICAgICAuLi5jb21tb25MYW1iZGFQcm9wcyxcbiAgICAgIGZ1bmN0aW9uTmFtZTogYHN5ZG5leS1jeWNsZXMtbGlzdC1tZW1iZXJzLSR7cHJvcHMuZW52aXJvbm1lbnR9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnTGlzdCBjbHViIG1lbWJlcnMgKGNsdWIgbWVtYmVycyknLFxuICAgICAgZW50cnk6ICdzZXJ2aWNlcy9jbHViLXNlcnZpY2UvaGFuZGxlcnMvbWVtYmVyc2hpcC9saXN0LW1lbWJlcnMudHMnLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgIH0pO1xuXG4gICAgLy8gQkFUQ0ggMiAtIE1lbWJlciBNYW5hZ2VtZW50IEZ1bmN0aW9uc1xuICAgIC8vIExhbWJkYSBmdW5jdGlvbiBmb3IgUFVUIC9jbHVicy97aWR9L21lbWJlcnMve3VzZXJJZH1cbiAgICB0aGlzLnVwZGF0ZU1lbWJlckZ1bmN0aW9uID0gbmV3IGxhbWJkYU5vZGVqcy5Ob2RlanNGdW5jdGlvbih0aGlzLCAnVXBkYXRlTWVtYmVyRnVuY3Rpb24nLCB7XG4gICAgICAuLi5jb21tb25MYW1iZGFQcm9wcyxcbiAgICAgIGZ1bmN0aW9uTmFtZTogYHN5ZG5leS1jeWNsZXMtdXBkYXRlLW1lbWJlci0ke3Byb3BzLmVudmlyb25tZW50fWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ1VwZGF0ZSBtZW1iZXIgcm9sZSAoY2x1YiBhZG1pbnMpJyxcbiAgICAgIGVudHJ5OiAnc2VydmljZXMvY2x1Yi1zZXJ2aWNlL2hhbmRsZXJzL21lbWJlcnNoaXAvdXBkYXRlLW1lbWJlci50cycsXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcicsXG4gICAgfSk7XG5cbiAgICAvLyBMYW1iZGEgZnVuY3Rpb24gZm9yIERFTEVURSAvY2x1YnMve2lkfS9tZW1iZXJzL3t1c2VySWR9XG4gICAgdGhpcy5yZW1vdmVNZW1iZXJGdW5jdGlvbiA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ1JlbW92ZU1lbWJlckZ1bmN0aW9uJywge1xuICAgICAgLi4uY29tbW9uTGFtYmRhUHJvcHMsXG4gICAgICBmdW5jdGlvbk5hbWU6IGBzeWRuZXktY3ljbGVzLXJlbW92ZS1tZW1iZXItJHtwcm9wcy5lbnZpcm9ubWVudH1gLFxuICAgICAgZGVzY3JpcHRpb246ICdSZW1vdmUgbWVtYmVyIGZyb20gY2x1YiAoY2x1YiBhZG1pbnMpJyxcbiAgICAgIGVudHJ5OiAnc2VydmljZXMvY2x1Yi1zZXJ2aWNlL2hhbmRsZXJzL21lbWJlcnNoaXAvcmVtb3ZlLW1lbWJlci50cycsXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcicsXG4gICAgfSk7XG5cbiAgICAvLyBCQVRDSCAzIC0gSW52aXRhdGlvbiBGdW5jdGlvbnNcbiAgICAvLyBMYW1iZGEgZnVuY3Rpb24gZm9yIFBPU1QgL2NsdWJzL3tpZH0vaW52aXRhdGlvbnNcbiAgICB0aGlzLmludml0ZVVzZXJGdW5jdGlvbiA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ0ludml0ZVVzZXJGdW5jdGlvbicsIHtcbiAgICAgIC4uLmNvbW1vbkxhbWJkYVByb3BzLFxuICAgICAgZnVuY3Rpb25OYW1lOiBgc3lkbmV5LWN5Y2xlcy1pbnZpdGUtdXNlci0ke3Byb3BzLmVudmlyb25tZW50fWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ0ludml0ZSB1c2VyIHRvIGNsdWIgKGNsdWIgYWRtaW5zKScsXG4gICAgICBlbnRyeTogJ3NlcnZpY2VzL2NsdWItc2VydmljZS9oYW5kbGVycy9pbnZpdGF0aW9uL2ludml0ZS11c2VyLnRzJyxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICB9KTtcblxuICAgIC8vIExhbWJkYSBmdW5jdGlvbiBmb3IgUFVUIC9pbnZpdGF0aW9ucy97aWR9XG4gICAgdGhpcy5hY2NlcHRJbnZpdGF0aW9uRnVuY3Rpb24gPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdBY2NlcHRJbnZpdGF0aW9uRnVuY3Rpb24nLCB7XG4gICAgICAuLi5jb21tb25MYW1iZGFQcm9wcyxcbiAgICAgIGZ1bmN0aW9uTmFtZTogYHN5ZG5leS1jeWNsZXMtYWNjZXB0LWludml0YXRpb24tJHtwcm9wcy5lbnZpcm9ubWVudH1gLFxuICAgICAgZGVzY3JpcHRpb246ICdBY2NlcHQgb3IgZGVjbGluZSBpbnZpdGF0aW9uIChhdXRoZW50aWNhdGVkIHVzZXJzKScsXG4gICAgICBlbnRyeTogJ3NlcnZpY2VzL2NsdWItc2VydmljZS9oYW5kbGVycy9pbnZpdGF0aW9uL2FjY2VwdC1pbnZpdGF0aW9uLnRzJyxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICB9KTtcblxuICAgIC8vIExhbWJkYSBmdW5jdGlvbiBmb3IgR0VUIC91c2Vycy9tZS9pbnZpdGF0aW9uc1xuICAgIHRoaXMubGlzdEludml0YXRpb25zRnVuY3Rpb24gPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdMaXN0SW52aXRhdGlvbnNGdW5jdGlvbicsIHtcbiAgICAgIC4uLmNvbW1vbkxhbWJkYVByb3BzLFxuICAgICAgZnVuY3Rpb25OYW1lOiBgc3lkbmV5LWN5Y2xlcy1saXN0LWludml0YXRpb25zLSR7cHJvcHMuZW52aXJvbm1lbnR9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnTGlzdCB1c2VyIGludml0YXRpb25zIChhdXRoZW50aWNhdGVkIHVzZXJzKScsXG4gICAgICBlbnRyeTogJ3NlcnZpY2VzL2NsdWItc2VydmljZS9oYW5kbGVycy9pbnZpdGF0aW9uL2xpc3QtaW52aXRhdGlvbnMudHMnLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgIH0pO1xuXG4gICAgLy8gQkFUQ0ggNCAtIFVzZXIgRnVuY3Rpb25zXG4gICAgLy8gTGFtYmRhIGZ1bmN0aW9uIGZvciBHRVQgL3VzZXJzL21lL21lbWJlcnNoaXBzXG4gICAgdGhpcy5nZXRNZW1iZXJzaGlwc0Z1bmN0aW9uID0gbmV3IGxhbWJkYU5vZGVqcy5Ob2RlanNGdW5jdGlvbih0aGlzLCAnR2V0TWVtYmVyc2hpcHNGdW5jdGlvbicsIHtcbiAgICAgIC4uLmNvbW1vbkxhbWJkYVByb3BzLFxuICAgICAgZnVuY3Rpb25OYW1lOiBgc3lkbmV5LWN5Y2xlcy1nZXQtbWVtYmVyc2hpcHMtJHtwcm9wcy5lbnZpcm9ubWVudH1gLFxuICAgICAgZGVzY3JpcHRpb246ICdHZXQgdXNlciBtZW1iZXJzaGlwcyAoYXV0aGVudGljYXRlZCB1c2VycyknLFxuICAgICAgZW50cnk6ICdzZXJ2aWNlcy9jbHViLXNlcnZpY2UvaGFuZGxlcnMvdXNlci9nZXQtbWVtYmVyc2hpcHMudHMnLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgIH0pO1xuXG4gICAgLy8gTGFtYmRhIGZ1bmN0aW9uIGZvciBQVVQgL2NsdWJzL3tpZH0vcmVxdWVzdHMve21lbWJlcnNoaXBJZH1cbiAgICB0aGlzLnByb2Nlc3NKb2luUmVxdWVzdEZ1bmN0aW9uID0gbmV3IGxhbWJkYU5vZGVqcy5Ob2RlanNGdW5jdGlvbih0aGlzLCAnUHJvY2Vzc0pvaW5SZXF1ZXN0RnVuY3Rpb24nLCB7XG4gICAgICAuLi5jb21tb25MYW1iZGFQcm9wcyxcbiAgICAgIGZ1bmN0aW9uTmFtZTogYHN5ZG5leS1jeWNsZXMtcHJvY2Vzcy1qb2luLXJlcXVlc3QtJHtwcm9wcy5lbnZpcm9ubWVudH1gLFxuICAgICAgZGVzY3JpcHRpb246ICdQcm9jZXNzIGpvaW4gcmVxdWVzdCAoY2x1YiBhZG1pbnMpJyxcbiAgICAgIGVudHJ5OiAnc2VydmljZXMvY2x1Yi1zZXJ2aWNlL2hhbmRsZXJzL21lbWJlcnNoaXAvcHJvY2Vzcy1qb2luLXJlcXVlc3QudHMnLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgRHluYW1vREIgcGVybWlzc2lvbnMgdG8gTGFtYmRhIGZ1bmN0aW9uc1xuICAgIGNvbnN0IGFsbEZ1bmN0aW9ucyA9IFtcbiAgICAgIC8vIFBoYXNlIDIuMSBmdW5jdGlvbnNcbiAgICAgIHRoaXMubGlzdENsdWJzRnVuY3Rpb24sXG4gICAgICB0aGlzLmdldENsdWJGdW5jdGlvbixcbiAgICAgIHRoaXMuY3JlYXRlQ2x1YkZ1bmN0aW9uLFxuICAgICAgdGhpcy51cGRhdGVDbHViRnVuY3Rpb24sXG4gICAgICAvLyBQaGFzZSAyLjIgbWVtYmVyc2hpcCBmdW5jdGlvbnNcbiAgICAgIHRoaXMuam9pbkNsdWJGdW5jdGlvbixcbiAgICAgIHRoaXMubGVhdmVDbHViRnVuY3Rpb24sXG4gICAgICB0aGlzLmxpc3RNZW1iZXJzRnVuY3Rpb24sXG4gICAgICB0aGlzLnVwZGF0ZU1lbWJlckZ1bmN0aW9uLFxuICAgICAgdGhpcy5yZW1vdmVNZW1iZXJGdW5jdGlvbixcbiAgICAgIC8vIFBoYXNlIDIuMiBpbnZpdGF0aW9uIGZ1bmN0aW9uc1xuICAgICAgdGhpcy5pbnZpdGVVc2VyRnVuY3Rpb24sXG4gICAgICB0aGlzLmFjY2VwdEludml0YXRpb25GdW5jdGlvbixcbiAgICAgIHRoaXMubGlzdEludml0YXRpb25zRnVuY3Rpb24sXG4gICAgICAvLyBQaGFzZSAyLjIgdXNlciBmdW5jdGlvbnNcbiAgICAgIHRoaXMuZ2V0TWVtYmVyc2hpcHNGdW5jdGlvbixcbiAgICAgIHRoaXMucHJvY2Vzc0pvaW5SZXF1ZXN0RnVuY3Rpb24sXG4gICAgXTtcblxuICAgIGFsbEZ1bmN0aW9ucy5mb3JFYWNoKGZ1bmMgPT4ge1xuICAgICAgcHJvcHMubWFpblRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShmdW5jKTtcbiAgICB9KTtcblxuICAgIC8vIEFQSSBHYXRld2F5IGludGVncmF0aW9uXG4gICAgdGhpcy5zZXR1cEFwaUdhdGV3YXlJbnRlZ3JhdGlvbihwcm9wcyk7XG5cbiAgICAvLyBUYWdzIGZvciBhbGwgZnVuY3Rpb25zXG4gICAgdGhpcy50YWdBbGxGdW5jdGlvbnMocHJvcHMuZW52aXJvbm1lbnQpO1xuXG4gIH1cblxuICAvKipcbiAgICogVGFnIGFsbCBmdW5jdGlvbnMgZm9yIHJlc291cmNlIG1hbmFnZW1lbnRcbiAgICovXG4gIHByaXZhdGUgdGFnQWxsRnVuY3Rpb25zKGVudmlyb25tZW50OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBhbGxGdW5jdGlvbnMgPSBbXG4gICAgICAvLyBQaGFzZSAyLjEgZnVuY3Rpb25zXG4gICAgICB7IGZ1bmM6IHRoaXMubGlzdENsdWJzRnVuY3Rpb24sIHBoYXNlOiAnMi4xLUNsdWJTZXJ2aWNlJyB9LFxuICAgICAgeyBmdW5jOiB0aGlzLmdldENsdWJGdW5jdGlvbiwgcGhhc2U6ICcyLjEtQ2x1YlNlcnZpY2UnIH0sXG4gICAgICB7IGZ1bmM6IHRoaXMuY3JlYXRlQ2x1YkZ1bmN0aW9uLCBwaGFzZTogJzIuMS1DbHViU2VydmljZScgfSxcbiAgICAgIHsgZnVuYzogdGhpcy51cGRhdGVDbHViRnVuY3Rpb24sIHBoYXNlOiAnMi4xLUNsdWJTZXJ2aWNlJyB9LFxuICAgICAgLy8gUGhhc2UgMi4yIG1lbWJlcnNoaXAgZnVuY3Rpb25zXG4gICAgICB7IGZ1bmM6IHRoaXMuam9pbkNsdWJGdW5jdGlvbiwgcGhhc2U6ICcyLjItQ2x1Yk1lbWJlcnNoaXAnIH0sXG4gICAgICB7IGZ1bmM6IHRoaXMubGVhdmVDbHViRnVuY3Rpb24sIHBoYXNlOiAnMi4yLUNsdWJNZW1iZXJzaGlwJyB9LFxuICAgICAgeyBmdW5jOiB0aGlzLmxpc3RNZW1iZXJzRnVuY3Rpb24sIHBoYXNlOiAnMi4yLUNsdWJNZW1iZXJzaGlwJyB9LFxuICAgICAgeyBmdW5jOiB0aGlzLnVwZGF0ZU1lbWJlckZ1bmN0aW9uLCBwaGFzZTogJzIuMi1DbHViTWVtYmVyc2hpcCcgfSxcbiAgICAgIHsgZnVuYzogdGhpcy5yZW1vdmVNZW1iZXJGdW5jdGlvbiwgcGhhc2U6ICcyLjItQ2x1Yk1lbWJlcnNoaXAnIH0sXG4gICAgICAvLyBQaGFzZSAyLjIgaW52aXRhdGlvbiBmdW5jdGlvbnNcbiAgICAgIHsgZnVuYzogdGhpcy5pbnZpdGVVc2VyRnVuY3Rpb24sIHBoYXNlOiAnMi4yLUNsdWJJbnZpdGF0aW9ucycgfSxcbiAgICAgIHsgZnVuYzogdGhpcy5hY2NlcHRJbnZpdGF0aW9uRnVuY3Rpb24sIHBoYXNlOiAnMi4yLUNsdWJJbnZpdGF0aW9ucycgfSxcbiAgICAgIHsgZnVuYzogdGhpcy5saXN0SW52aXRhdGlvbnNGdW5jdGlvbiwgcGhhc2U6ICcyLjItQ2x1Ykludml0YXRpb25zJyB9LFxuICAgICAgLy8gUGhhc2UgMi4yIHVzZXIgZnVuY3Rpb25zXG4gICAgICB7IGZ1bmM6IHRoaXMuZ2V0TWVtYmVyc2hpcHNGdW5jdGlvbiwgcGhhc2U6ICcyLjItQ2x1Yk1lbWJlcnNoaXAnIH0sXG4gICAgICB7IGZ1bmM6IHRoaXMucHJvY2Vzc0pvaW5SZXF1ZXN0RnVuY3Rpb24sIHBoYXNlOiAnMi4yLUNsdWJNZW1iZXJzaGlwJyB9LFxuICAgIF07XG5cbiAgICBhbGxGdW5jdGlvbnMuZm9yRWFjaCgoeyBmdW5jLCBwaGFzZSB9KSA9PiB7XG4gICAgICBjZGsuVGFncy5vZihmdW5jKS5hZGQoJ0NvbXBvbmVudCcsICdDbHViU2VydmljZScpO1xuICAgICAgY2RrLlRhZ3Mub2YoZnVuYykuYWRkKCdQaGFzZScsIHBoYXNlKTtcbiAgICAgIGNkay5UYWdzLm9mKGZ1bmMpLmFkZCgnRW52aXJvbm1lbnQnLCBlbnZpcm9ubWVudCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHVwIEFQSSBHYXRld2F5IGludGVncmF0aW9uIGZvciBjbHViIGVuZHBvaW50c1xuICAgKi9cbiAgcHJpdmF0ZSBzZXR1cEFwaUdhdGV3YXlJbnRlZ3JhdGlvbihwcm9wczogQ2x1YlNlcnZpY2VQcm9wcyk6IHZvaWQge1xuICAgIC8vIEdldCB0aGUgdjEgcmVzb3VyY2UgKHNob3VsZCBleGlzdCBmcm9tIFBoYXNlIDEuMSlcbiAgICBjb25zdCB2MVJlc291cmNlID0gcHJvcHMuYXBpLnJvb3QuZ2V0UmVzb3VyY2UoJ3YxJyk7XG4gICAgaWYgKCF2MVJlc291cmNlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3YxIEFQSSByZXNvdXJjZSBub3QgZm91bmQgLSBlbnN1cmUgUGhhc2UgMS4xIGluZnJhc3RydWN0dXJlIGlzIGRlcGxveWVkJyk7XG4gICAgfVxuXG4gICAgLy8gR2V0IG9yIGNyZWF0ZSB0aGUgY2x1YnMgcmVzb3VyY2VcbiAgICBsZXQgY2x1YnNSZXNvdXJjZSA9IHYxUmVzb3VyY2UuZ2V0UmVzb3VyY2UoJ2NsdWJzJyk7XG4gICAgaWYgKCFjbHVic1Jlc291cmNlKSB7XG4gICAgICBjbHVic1Jlc291cmNlID0gdjFSZXNvdXJjZS5hZGRSZXNvdXJjZSgnY2x1YnMnKTtcbiAgICB9XG5cbiAgICAvLyBHZXQgb3IgY3JlYXRlIHRoZSB1c2VycyByZXNvdXJjZVxuICAgIGxldCB1c2Vyc1Jlc291cmNlID0gdjFSZXNvdXJjZS5nZXRSZXNvdXJjZSgndXNlcnMnKTtcbiAgICBpZiAoIXVzZXJzUmVzb3VyY2UpIHtcbiAgICAgIHVzZXJzUmVzb3VyY2UgPSB2MVJlc291cmNlLmFkZFJlc291cmNlKCd1c2VycycpO1xuICAgIH1cblxuICAgIC8vIEdldCBvciBjcmVhdGUgdGhlIGludml0YXRpb25zIHJlc291cmNlXG4gICAgbGV0IGludml0YXRpb25zUmVzb3VyY2UgPSB2MVJlc291cmNlLmdldFJlc291cmNlKCdpbnZpdGF0aW9ucycpO1xuICAgIGlmICghaW52aXRhdGlvbnNSZXNvdXJjZSkge1xuICAgICAgaW52aXRhdGlvbnNSZXNvdXJjZSA9IHYxUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ2ludml0YXRpb25zJyk7XG4gICAgfVxuXG4gICAgLy8gR0VUIC9jbHVicyBlbmRwb2ludCAocHVibGljIC0gbm8gYXV0aG9yaXphdGlvbilcbiAgICBjbHVic1Jlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odGhpcy5saXN0Q2x1YnNGdW5jdGlvbiksIHtcbiAgICAgIC8vIE5vIGF1dGhvcml6ZXIgZm9yIHB1YmxpYyBlbmRwb2ludFxuICAgICAgbWV0aG9kUmVzcG9uc2VzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnMjAwJyxcbiAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVNUFRZX01PREVMLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnNDAwJyxcbiAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVSUk9SX01PREVMLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnNTAwJyxcbiAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVSUk9SX01PREVMLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gUE9TVCAvY2x1YnMgZW5kcG9pbnQgKGFkbWluIG9ubHkgLSByZXF1aXJlcyBhdXRob3JpemF0aW9uKVxuICAgIGNsdWJzUmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odGhpcy5jcmVhdGVDbHViRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiBwcm9wcy5hdXRob3JpemVyLFxuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcbiAgICAgIHJlcXVlc3RNb2RlbHM6IHtcbiAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVNUFRZX01PREVMLCAvLyBXaWxsIGJlIHZhbGlkYXRlZCBpbiBMYW1iZGFcbiAgICAgIH0sXG4gICAgICBtZXRob2RSZXNwb25zZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHN0YXR1c0NvZGU6ICcyMDEnLFxuICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IGFwaWdhdGV3YXkuTW9kZWwuRU1QVFlfTU9ERUwsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHN0YXR1c0NvZGU6ICc0MDAnLFxuICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IGFwaWdhdGV3YXkuTW9kZWwuRVJST1JfTU9ERUwsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHN0YXR1c0NvZGU6ICc0MDEnLFxuICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IGFwaWdhdGV3YXkuTW9kZWwuRVJST1JfTU9ERUwsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHN0YXR1c0NvZGU6ICc0MDMnLFxuICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IGFwaWdhdGV3YXkuTW9kZWwuRVJST1JfTU9ERUwsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHN0YXR1c0NvZGU6ICc0MDknLFxuICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IGFwaWdhdGV3YXkuTW9kZWwuRVJST1JfTU9ERUwsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHN0YXR1c0NvZGU6ICc1MDAnLFxuICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IGFwaWdhdGV3YXkuTW9kZWwuRVJST1JfTU9ERUwsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBHZXQgb3IgY3JlYXRlIHRoZSB7Y2x1YklkfSByZXNvdXJjZSB1bmRlciBjbHVicyAobWF0Y2hpbmcgcmVzdC1hcGkudHMgc3RydWN0dXJlKVxuICAgIGxldCBjbHViSWRSZXNvdXJjZSA9IGNsdWJzUmVzb3VyY2UuZ2V0UmVzb3VyY2UoJ3tjbHViSWR9Jyk7XG4gICAgaWYgKCFjbHViSWRSZXNvdXJjZSkge1xuICAgICAgY2x1YklkUmVzb3VyY2UgPSBjbHVic1Jlc291cmNlLmFkZFJlc291cmNlKCd7Y2x1YklkfScpO1xuICAgIH1cblxuICAgIC8vIEdFVCAvY2x1YnMve2NsdWJJZH0gZW5kcG9pbnQgKHB1YmxpYyAtIG5vIGF1dGhvcml6YXRpb24pXG4gICAgY2x1YklkUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih0aGlzLmdldENsdWJGdW5jdGlvbiksIHtcbiAgICAgIC8vIE5vIGF1dGhvcml6ZXIgZm9yIHB1YmxpYyBlbmRwb2ludFxuICAgICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcbiAgICAgICAgJ21ldGhvZC5yZXF1ZXN0LnBhdGguY2x1YklkJzogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBtZXRob2RSZXNwb25zZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHN0YXR1c0NvZGU6ICcyMDAnLFxuICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IGFwaWdhdGV3YXkuTW9kZWwuRU1QVFlfTU9ERUwsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHN0YXR1c0NvZGU6ICc0MDAnLFxuICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IGFwaWdhdGV3YXkuTW9kZWwuRVJST1JfTU9ERUwsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHN0YXR1c0NvZGU6ICc0MDQnLFxuICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IGFwaWdhdGV3YXkuTW9kZWwuRVJST1JfTU9ERUwsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHN0YXR1c0NvZGU6ICc1MDAnLFxuICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IGFwaWdhdGV3YXkuTW9kZWwuRVJST1JfTU9ERUwsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBQVVQgL2NsdWJzL3tjbHViSWR9IGVuZHBvaW50IChhZG1pbiBvbmx5IC0gcmVxdWlyZXMgYXV0aG9yaXphdGlvbilcbiAgICBjbHViSWRSZXNvdXJjZS5hZGRNZXRob2QoJ1BVVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHRoaXMudXBkYXRlQ2x1YkZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogcHJvcHMuYXV0aG9yaXplcixcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXG4gICAgICByZXF1ZXN0UGFyYW1ldGVyczoge1xuICAgICAgICAnbWV0aG9kLnJlcXVlc3QucGF0aC5jbHViSWQnOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHJlcXVlc3RNb2RlbHM6IHtcbiAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVNUFRZX01PREVMLCAvLyBXaWxsIGJlIHZhbGlkYXRlZCBpbiBMYW1iZGFcbiAgICAgIH0sXG4gICAgICBtZXRob2RSZXNwb25zZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHN0YXR1c0NvZGU6ICcyMDAnLFxuICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IGFwaWdhdGV3YXkuTW9kZWwuRU1QVFlfTU9ERUwsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHN0YXR1c0NvZGU6ICc0MDAnLFxuICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IGFwaWdhdGV3YXkuTW9kZWwuRVJST1JfTU9ERUwsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHN0YXR1c0NvZGU6ICc0MDEnLFxuICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IGFwaWdhdGV3YXkuTW9kZWwuRVJST1JfTU9ERUwsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHN0YXR1c0NvZGU6ICc0MDMnLFxuICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IGFwaWdhdGV3YXkuTW9kZWwuRVJST1JfTU9ERUwsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHN0YXR1c0NvZGU6ICc0MDQnLFxuICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IGFwaWdhdGV3YXkuTW9kZWwuRVJST1JfTU9ERUwsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHN0YXR1c0NvZGU6ICc0MDknLFxuICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IGFwaWdhdGV3YXkuTW9kZWwuRVJST1JfTU9ERUwsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHN0YXR1c0NvZGU6ICc1MDAnLFxuICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IGFwaWdhdGV3YXkuTW9kZWwuRVJST1JfTU9ERUwsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBQaGFzZSAyLjIgTWVtYmVyc2hpcCBFbmRwb2ludHNcblxuICAgIC8vIEdldCBvciBjcmVhdGUgdGhlIG1lbWJlcnMgcmVzb3VyY2UgdW5kZXIgY2x1YnMve2NsdWJJZH1cbiAgICBsZXQgbWVtYmVyc1Jlc291cmNlID0gY2x1YklkUmVzb3VyY2UuZ2V0UmVzb3VyY2UoJ21lbWJlcnMnKTtcbiAgICBpZiAoIW1lbWJlcnNSZXNvdXJjZSkge1xuICAgICAgbWVtYmVyc1Jlc291cmNlID0gY2x1YklkUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ21lbWJlcnMnKTtcbiAgICB9XG5cbiAgICAvLyBQT1NUIC9jbHVicy97Y2x1YklkfS9tZW1iZXJzIC0gSm9pbiBjbHViXG4gICAgbWVtYmVyc1Jlc291cmNlLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHRoaXMuam9pbkNsdWJGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHByb3BzLmF1dGhvcml6ZXIsXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcbiAgICAgICAgJ21ldGhvZC5yZXF1ZXN0LnBhdGguY2x1YklkJzogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBtZXRob2RSZXNwb25zZXM6IFtcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnMjAxJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICcyMDInIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwMCcgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNDAxJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc0MDMnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwOScgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNTAwJyB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIEdFVCAvY2x1YnMve2NsdWJJZH0vbWVtYmVycyAtIExpc3QgY2x1YiBtZW1iZXJzXG4gICAgbWVtYmVyc1Jlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odGhpcy5saXN0TWVtYmVyc0Z1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogcHJvcHMuYXV0aG9yaXplcixcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXG4gICAgICByZXF1ZXN0UGFyYW1ldGVyczoge1xuICAgICAgICAnbWV0aG9kLnJlcXVlc3QucGF0aC5jbHViSWQnOiB0cnVlLFxuICAgICAgICAnbWV0aG9kLnJlcXVlc3QucXVlcnlzdHJpbmcubGltaXQnOiBmYWxzZSxcbiAgICAgICAgJ21ldGhvZC5yZXF1ZXN0LnF1ZXJ5c3RyaW5nLmN1cnNvcic6IGZhbHNlLFxuICAgICAgICAnbWV0aG9kLnJlcXVlc3QucXVlcnlzdHJpbmcucm9sZSc6IGZhbHNlLFxuICAgICAgICAnbWV0aG9kLnJlcXVlc3QucXVlcnlzdHJpbmcuc3RhdHVzJzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgbWV0aG9kUmVzcG9uc2VzOiBbXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzIwMCcgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNDAwJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc0MDEnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwMycgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNDA0JyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc1MDAnIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gREVMRVRFIC9jbHVicy97Y2x1YklkfS9tZW1iZXJzL21lIC0gTGVhdmUgY2x1YlxuICAgIGNvbnN0IG1lbWJlcnNNZSA9IG1lbWJlcnNSZXNvdXJjZS5hZGRSZXNvdXJjZSgnbWUnKTtcbiAgICBtZW1iZXJzTWUuYWRkTWV0aG9kKCdERUxFVEUnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih0aGlzLmxlYXZlQ2x1YkZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogcHJvcHMuYXV0aG9yaXplcixcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXG4gICAgICByZXF1ZXN0UGFyYW1ldGVyczoge1xuICAgICAgICAnbWV0aG9kLnJlcXVlc3QucGF0aC5jbHViSWQnOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIG1ldGhvZFJlc3BvbnNlczogW1xuICAgICAgICB7IHN0YXR1c0NvZGU6ICcyMDAnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwMCcgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNDAxJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc0MDMnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwNCcgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNTAwJyB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIEJBVENIIDIgLSBNZW1iZXIgTWFuYWdlbWVudCBBUEkgUm91dGVzICh1c2luZyBzaW5ndWxhciBcIm1lbWJlclwiIHRvIGF2b2lkIGNvbmZsaWN0KVxuICAgIC8vIENyZWF0ZSBzZXBhcmF0ZSBcIm1lbWJlclwiIHJlc291cmNlIGZvciBhZG1pbiBvcGVyYXRpb25zIG9uIHNwZWNpZmljIHVzZXJzXG4gICAgbGV0IG1lbWJlclJlc291cmNlID0gY2x1YklkUmVzb3VyY2UuZ2V0UmVzb3VyY2UoJ21lbWJlcicpO1xuICAgIGlmICghbWVtYmVyUmVzb3VyY2UpIHtcbiAgICAgIG1lbWJlclJlc291cmNlID0gY2x1YklkUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ21lbWJlcicpO1xuICAgIH1cblxuICAgIC8vIFBVVCAvY2x1YnMve2NsdWJJZH0vbWVtYmVyL3t1c2VySWR9IC0gVXBkYXRlIG1lbWJlciByb2xlXG4gICAgY29uc3QgbWVtYmVyVXNlcklkID0gbWVtYmVyUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3t1c2VySWR9Jyk7XG4gICAgbWVtYmVyVXNlcklkLmFkZE1ldGhvZCgnUFVUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odGhpcy51cGRhdGVNZW1iZXJGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHByb3BzLmF1dGhvcml6ZXIsXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcbiAgICAgICAgJ21ldGhvZC5yZXF1ZXN0LnBhdGguY2x1YklkJzogdHJ1ZSxcbiAgICAgICAgJ21ldGhvZC5yZXF1ZXN0LnBhdGgudXNlcklkJzogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBtZXRob2RSZXNwb25zZXM6IFtcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnMjAwJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc0MDAnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwMScgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNDAzJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc0MDQnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzUwMCcgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBERUxFVEUgL2NsdWJzL3tjbHViSWR9L21lbWJlci97dXNlcklkfSAtIFJlbW92ZSBtZW1iZXJcbiAgICBtZW1iZXJVc2VySWQuYWRkTWV0aG9kKCdERUxFVEUnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih0aGlzLnJlbW92ZU1lbWJlckZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogcHJvcHMuYXV0aG9yaXplcixcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXG4gICAgICByZXF1ZXN0UGFyYW1ldGVyczoge1xuICAgICAgICAnbWV0aG9kLnJlcXVlc3QucGF0aC5jbHViSWQnOiB0cnVlLFxuICAgICAgICAnbWV0aG9kLnJlcXVlc3QucGF0aC51c2VySWQnOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIG1ldGhvZFJlc3BvbnNlczogW1xuICAgICAgICB7IHN0YXR1c0NvZGU6ICcyMDAnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwMCcgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNDAxJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc0MDMnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwNCcgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNTAwJyB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIFBoYXNlIDIuMiBJbnZpdGF0aW9uIEVuZHBvaW50c1xuXG4gICAgLy8gR2V0IG9yIGNyZWF0ZSB0aGUgaW52aXRhdGlvbnMgcmVzb3VyY2UgdW5kZXIgY2x1YnMve2NsdWJJZH1cbiAgICBsZXQgY2x1Ykludml0YXRpb25zUmVzb3VyY2UgPSBjbHViSWRSZXNvdXJjZS5nZXRSZXNvdXJjZSgnaW52aXRhdGlvbnMnKTtcbiAgICBpZiAoIWNsdWJJbnZpdGF0aW9uc1Jlc291cmNlKSB7XG4gICAgICBjbHViSW52aXRhdGlvbnNSZXNvdXJjZSA9IGNsdWJJZFJlc291cmNlLmFkZFJlc291cmNlKCdpbnZpdGF0aW9ucycpO1xuICAgIH1cblxuICAgIC8vIFBPU1QgL2NsdWJzL3tjbHViSWR9L2ludml0YXRpb25zIC0gSW52aXRlIHVzZXIgdG8gY2x1YlxuICAgIGNsdWJJbnZpdGF0aW9uc1Jlc291cmNlLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHRoaXMuaW52aXRlVXNlckZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogcHJvcHMuYXV0aG9yaXplcixcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXG4gICAgICByZXF1ZXN0UGFyYW1ldGVyczoge1xuICAgICAgICAnbWV0aG9kLnJlcXVlc3QucGF0aC5jbHViSWQnOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIG1ldGhvZFJlc3BvbnNlczogW1xuICAgICAgICB7IHN0YXR1c0NvZGU6ICcyMDEnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwMCcgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNDAxJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc0MDMnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwNCcgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNDA5JyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc1MDAnIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gUFVUIC9pbnZpdGF0aW9ucy97aWR9IC0gQWNjZXB0L2RlY2xpbmUgaW52aXRhdGlvblxuICAgIGNvbnN0IGludml0YXRpb25JZCA9IGludml0YXRpb25zUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3tpZH0nKTtcbiAgICBpbnZpdGF0aW9uSWQuYWRkTWV0aG9kKCdQVVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih0aGlzLmFjY2VwdEludml0YXRpb25GdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHByb3BzLmF1dGhvcml6ZXIsXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcbiAgICAgICAgJ21ldGhvZC5yZXF1ZXN0LnBhdGguaWQnOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIG1ldGhvZFJlc3BvbnNlczogW1xuICAgICAgICB7IHN0YXR1c0NvZGU6ICcyMDAnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwMCcgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNDAxJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc0MDMnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwNCcgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNTAwJyB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIFBoYXNlIDIuMiBKb2luIFJlcXVlc3QgTWFuYWdlbWVudFxuXG4gICAgLy8gR2V0IG9yIGNyZWF0ZSB0aGUgcmVxdWVzdHMgcmVzb3VyY2UgdW5kZXIgY2x1YnMve2NsdWJJZH1cbiAgICBsZXQgcmVxdWVzdHNSZXNvdXJjZSA9IGNsdWJJZFJlc291cmNlLmdldFJlc291cmNlKCdyZXF1ZXN0cycpO1xuICAgIGlmICghcmVxdWVzdHNSZXNvdXJjZSkge1xuICAgICAgcmVxdWVzdHNSZXNvdXJjZSA9IGNsdWJJZFJlc291cmNlLmFkZFJlc291cmNlKCdyZXF1ZXN0cycpO1xuICAgIH1cblxuICAgIC8vIFBVVCAvY2x1YnMve2NsdWJJZH0vcmVxdWVzdHMve21lbWJlcnNoaXBJZH0gLSBQcm9jZXNzIGpvaW4gcmVxdWVzdFxuICAgIGNvbnN0IHJlcXVlc3RNZW1iZXJzaGlwSWQgPSByZXF1ZXN0c1Jlc291cmNlLmFkZFJlc291cmNlKCd7bWVtYmVyc2hpcElkfScpO1xuICAgIHJlcXVlc3RNZW1iZXJzaGlwSWQuYWRkTWV0aG9kKCdQVVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih0aGlzLnByb2Nlc3NKb2luUmVxdWVzdEZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogcHJvcHMuYXV0aG9yaXplcixcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXG4gICAgICByZXF1ZXN0UGFyYW1ldGVyczoge1xuICAgICAgICAnbWV0aG9kLnJlcXVlc3QucGF0aC5jbHViSWQnOiB0cnVlLFxuICAgICAgICAnbWV0aG9kLnJlcXVlc3QucGF0aC5tZW1iZXJzaGlwSWQnOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIG1ldGhvZFJlc3BvbnNlczogW1xuICAgICAgICB7IHN0YXR1c0NvZGU6ICcyMDAnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwMCcgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNDAxJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc0MDMnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwNCcgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNTAwJyB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIFBoYXNlIDIuMiBVc2VyIEVuZHBvaW50c1xuXG4gICAgLy8gR0VUIC91c2Vycy9tZS9tZW1iZXJzaGlwcyAtIEdldCB1c2VyJ3MgY2x1YiBtZW1iZXJzaGlwc1xuICAgIGxldCB1c2Vyc01lID0gdXNlcnNSZXNvdXJjZS5nZXRSZXNvdXJjZSgnbWUnKTtcbiAgICBpZiAoIXVzZXJzTWUpIHtcbiAgICAgIHVzZXJzTWUgPSB1c2Vyc1Jlc291cmNlLmFkZFJlc291cmNlKCdtZScpO1xuICAgIH1cbiAgICBjb25zdCB1c2Vyc01lbWJlcnNoaXBzID0gdXNlcnNNZS5hZGRSZXNvdXJjZSgnbWVtYmVyc2hpcHMnKTtcbiAgICB1c2Vyc01lbWJlcnNoaXBzLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odGhpcy5nZXRNZW1iZXJzaGlwc0Z1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogcHJvcHMuYXV0aG9yaXplcixcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXG4gICAgICByZXF1ZXN0UGFyYW1ldGVyczoge1xuICAgICAgICAnbWV0aG9kLnJlcXVlc3QucXVlcnlzdHJpbmcuc3RhdHVzJzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgbWV0aG9kUmVzcG9uc2VzOiBbXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzIwMCcgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNDAwJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc0MDEnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzUwMCcgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBHRVQgL3VzZXJzL21lL2ludml0YXRpb25zIC0gR2V0IHVzZXIncyBwZW5kaW5nIGludml0YXRpb25zXG4gICAgY29uc3QgdXNlcnNJbnZpdGF0aW9ucyA9IHVzZXJzTWUuYWRkUmVzb3VyY2UoJ2ludml0YXRpb25zJyk7XG4gICAgdXNlcnNJbnZpdGF0aW9ucy5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHRoaXMubGlzdEludml0YXRpb25zRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiBwcm9wcy5hdXRob3JpemVyLFxuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcbiAgICAgIHJlcXVlc3RQYXJhbWV0ZXJzOiB7XG4gICAgICAgICdtZXRob2QucmVxdWVzdC5xdWVyeXN0cmluZy5saW1pdCc6IGZhbHNlLFxuICAgICAgICAnbWV0aG9kLnJlcXVlc3QucXVlcnlzdHJpbmcuY3Vyc29yJzogZmFsc2UsXG4gICAgICAgICdtZXRob2QucmVxdWVzdC5xdWVyeXN0cmluZy5zdGF0dXMnOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICBtZXRob2RSZXNwb25zZXM6IFtcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnMjAwJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc0MDAnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwMScgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNTAwJyB9LFxuICAgICAgXSxcbiAgICB9KTtcbiAgfVxufSJdfQ==