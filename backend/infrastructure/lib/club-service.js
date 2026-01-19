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
        // Phase 3.1 Hydrated Functions
        // Lambda function for GET /users/me/clubs (hydrated)
        this.getUserClubsFunction = new lambdaNodejs.NodejsFunction(this, 'GetUserClubsFunction', {
            ...commonLambdaProps,
            functionName: `sydney-cycles-get-user-clubs-${props.environment}`,
            description: 'Get user clubs with hydrated data (authenticated users)',
            entry: 'services/club-service/handlers/user/get-user-clubs.ts',
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
            // Phase 3.1 hydrated functions
            this.getUserClubsFunction,
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
            // Phase 3.1 hydrated functions
            { func: this.getUserClubsFunction, phase: '3.1-ClubNavigation' },
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
        // Phase 3.1 Hydrated Endpoints
        // GET /users/me/clubs - Get user's clubs with hydrated data
        const usersClubs = usersMe.addResource('clubs');
        usersClubs.addMethod('GET', new apigateway.LambdaIntegration(this.getUserClubsFunction), {
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
    }
}
exports.ClubServiceConstruct = ClubServiceConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2x1Yi1zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2x1Yi1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7O0dBU0c7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsaURBQW1DO0FBQ25DLCtEQUFpRDtBQUNqRCw0RUFBOEQ7QUFDOUQsdUVBQXlEO0FBRXpELDJEQUE2QztBQUM3QywyQ0FBdUM7QUFZdkM7Ozs7O0dBS0c7QUFDSCxNQUFhLG9CQUFxQixTQUFRLHNCQUFTO0lBNEJqRCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXVCO1FBQy9ELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsOEJBQThCO1FBQzlCLE1BQU0saUJBQWlCLEdBQUc7WUFDeEIsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ2pDLFVBQVUsRUFBRSxHQUFHO1lBQ2YsV0FBVyxFQUFFO2dCQUNYLFVBQVUsRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLFNBQVM7Z0JBQ3JDLFdBQVcsRUFBRSxLQUFLLENBQUMsV0FBVzthQUMvQjtZQUNELFlBQVksRUFBRSxLQUFLLENBQUMsV0FBVyxLQUFLLFlBQVk7Z0JBQzlDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVM7Z0JBQzlCLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVE7WUFDL0IsUUFBUSxFQUFFO2dCQUNSLG1CQUFtQixFQUFFLEtBQUs7Z0JBQzFCLGVBQWUsRUFBRSxDQUFDLFlBQVksQ0FBQztnQkFDL0IsTUFBTSxFQUFFLEtBQUs7Z0JBQ2IsU0FBUyxFQUFFLEtBQUssRUFBRSwyQ0FBMkM7YUFDOUQ7U0FDRixDQUFDO1FBRUYsMENBQTBDO1FBQzFDLElBQUksQ0FBQyxpQkFBaUIs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NERBQTREO1FBQzVELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDaEQsVUFBVSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEVBQUU7WUFDdkYsVUFBVSxFQUFFLEtBQUssQ0FBQyxVQUFVO1lBQzVCLGlCQUFpQixFQUFFLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPO1lBQ3ZELGlCQUFpQixFQUFFO2dCQUNqQixtQ0FBbUMsRUFBRSxLQUFLO2FBQzNDO1lBQ0QsZUFBZSxFQUFFO2dCQUNmLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRTtnQkFDckIsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFO2dCQUNyQixFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUU7Z0JBQ3JCLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRTthQUN0QjtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXpyQkQsb0RBeXJCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ2x1YiBTZXJ2aWNlIEluZnJhc3RydWN0dXJlIC0gUGhhc2UgMi4xXG4gKiBcbiAqIENESyBjb25zdHJ1Y3QgZm9yIENsdWIgU2VydmljZSBMYW1iZGEgZnVuY3Rpb25zIGFuZCBBUEkgR2F0ZXdheSBpbnRlZ3JhdGlvbi5cbiAqIEludGVncmF0ZXMgd2l0aCBleGlzdGluZyBQaGFzZSAxLnggaW5mcmFzdHJ1Y3R1cmUgY29tcG9uZW50cy5cbiAqIFxuICogQ29tcGxpYW5jZTpcbiAqIC0gUGhhc2UgMi4xIFNwZWM6IC5raXJvL3NwZWNzL3BoYXNlLTIuMS5jbHViLXNlcnZpY2UudjEubWRcbiAqIC0gQVdTIEFyY2hpdGVjdHVyZTogLmtpcm8vc3BlY3MvYXJjaGl0ZWN0dXJlLmF3cy52MS5tZFxuICovXG5cbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBsYW1iZGFOb2RlanMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYS1ub2RlanMnO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgbG9ncyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbG9ncyc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuLyoqXG4gKiBDbHViIFNlcnZpY2UgY29uZmlndXJhdGlvblxuICovXG5leHBvcnQgaW50ZXJmYWNlIENsdWJTZXJ2aWNlUHJvcHMge1xuICBlbnZpcm9ubWVudDogc3RyaW5nO1xuICBhcGk6IGFwaWdhdGV3YXkuUmVzdEFwaTtcbiAgYXV0aG9yaXplcjogYXBpZ2F0ZXdheS5Db2duaXRvVXNlclBvb2xzQXV0aG9yaXplcjtcbiAgbWFpblRhYmxlOiBkeW5hbW9kYi5UYWJsZTtcbn1cblxuLyoqXG4gKiBDbHViIFNlcnZpY2UgY29uc3RydWN0XG4gKiBcbiAqIENyZWF0ZXMgTGFtYmRhIGZ1bmN0aW9ucyBmb3IgY2x1YiBvcGVyYXRpb25zIGFuZCBpbnRlZ3JhdGVzIHRoZW1cbiAqIHdpdGggdGhlIGV4aXN0aW5nIEFQSSBHYXRld2F5IGFuZCBEeW5hbW9EQiBpbmZyYXN0cnVjdHVyZS5cbiAqL1xuZXhwb3J0IGNsYXNzIENsdWJTZXJ2aWNlQ29uc3RydWN0IGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgLy8gUGhhc2UgMi4xIGZ1bmN0aW9uc1xuICBwdWJsaWMgcmVhZG9ubHkgbGlzdENsdWJzRnVuY3Rpb246IGxhbWJkYU5vZGVqcy5Ob2RlanNGdW5jdGlvbjtcbiAgcHVibGljIHJlYWRvbmx5IGdldENsdWJGdW5jdGlvbjogbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uO1xuICBwdWJsaWMgcmVhZG9ubHkgY3JlYXRlQ2x1YkZ1bmN0aW9uOiBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb247XG4gIHB1YmxpYyByZWFkb25seSB1cGRhdGVDbHViRnVuY3Rpb246IGxhbWJkYU5vZGVqcy5Ob2RlanNGdW5jdGlvbjtcblxuICAvLyBQaGFzZSAyLjIgbWVtYmVyc2hpcCBmdW5jdGlvbnMgKEJBVENIIDEgLSBEZXBsb3kgZmlyc3QpXG4gIHB1YmxpYyByZWFkb25seSBqb2luQ2x1YkZ1bmN0aW9uOiBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb247XG4gIHB1YmxpYyByZWFkb25seSBsZWF2ZUNsdWJGdW5jdGlvbjogbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uO1xuICBwdWJsaWMgcmVhZG9ubHkgbGlzdE1lbWJlcnNGdW5jdGlvbjogbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uO1xuICBcbiAgLy8gUGhhc2UgMi4yIG1lbWJlcnNoaXAgZnVuY3Rpb25zIChCQVRDSCAyIC0gRGVwbG95IHNlY29uZClcbiAgcHVibGljIHJlYWRvbmx5IHVwZGF0ZU1lbWJlckZ1bmN0aW9uOiBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb247XG4gIHB1YmxpYyByZWFkb25seSByZW1vdmVNZW1iZXJGdW5jdGlvbjogbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uO1xuXG4gIC8vIFBoYXNlIDIuMiBpbnZpdGF0aW9uIGZ1bmN0aW9ucyAoQkFUQ0ggMyAtIERlcGxveSB0aGlyZClcbiAgcHVibGljIHJlYWRvbmx5IGludml0ZVVzZXJGdW5jdGlvbjogbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uO1xuICBwdWJsaWMgcmVhZG9ubHkgYWNjZXB0SW52aXRhdGlvbkZ1bmN0aW9uOiBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb247XG4gIHB1YmxpYyByZWFkb25seSBsaXN0SW52aXRhdGlvbnNGdW5jdGlvbjogbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uO1xuXG4gIC8vIFBoYXNlIDIuMiB1c2VyIGZ1bmN0aW9ucyAoQkFUQ0ggNCAtIERlcGxveSBmb3VydGgpXG4gIHB1YmxpYyByZWFkb25seSBnZXRNZW1iZXJzaGlwc0Z1bmN0aW9uOiBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb247XG4gIHB1YmxpYyByZWFkb25seSBwcm9jZXNzSm9pblJlcXVlc3RGdW5jdGlvbjogbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uO1xuXG4gIC8vIFBoYXNlIDMuMSBoeWRyYXRlZCBmdW5jdGlvbnMgKE5FVyAtIERlcGxveSB3aXRoIFBoYXNlIDMuMSlcbiAgcHVibGljIHJlYWRvbmx5IGdldFVzZXJDbHVic0Z1bmN0aW9uOiBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb247XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IENsdWJTZXJ2aWNlUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgLy8gQ29tbW9uIExhbWJkYSBjb25maWd1cmF0aW9uXG4gICAgY29uc3QgY29tbW9uTGFtYmRhUHJvcHMgPSB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjRfWCxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgIG1lbW9yeVNpemU6IDI1NixcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLm1haW5UYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIEVOVklST05NRU5UOiBwcm9wcy5lbnZpcm9ubWVudCxcbiAgICAgIH0sXG4gICAgICBsb2dSZXRlbnRpb246IHByb3BzLmVudmlyb25tZW50ID09PSAncHJvZHVjdGlvbicgXG4gICAgICAgID8gbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9NT05USCBcbiAgICAgICAgOiBsb2dzLlJldGVudGlvbkRheXMuT05FX1dFRUssXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgbWluaWZ5OiBmYWxzZSwgLy8gRGlzYWJsZSBtaW5pZmljYXRpb24gdG8gc3BlZWQgdXAgYnVuZGxpbmdcbiAgICAgICAgc291cmNlTWFwOiBmYWxzZSwgLy8gRGlzYWJsZSBzb3VyY2UgbWFwcyB0byBzcGVlZCB1cCBidW5kbGluZ1xuICAgICAgfSxcbiAgICB9O1xuXG4gICAgLy8gTGFtYmRhIGZ1bmN0aW9uIGZvciBHRVQgL2NsdWJzIChwdWJsaWMpXG4gICAgdGhpcy5saXN0Q2x1YnNGdW5jdGlvbiA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ0xpc3RDbHVic0Z1bmN0aW9uJywge1xuICAgICAgLi4uY29tbW9uTGFtYmRhUHJvcHMsXG4gICAgICBmdW5jdGlvbk5hbWU6IGBzeWRuZXktY3ljbGVzLWxpc3QtY2x1YnMtJHtwcm9wcy5lbnZpcm9ubWVudH1gLFxuICAgICAgZGVzY3JpcHRpb246ICdMaXN0IGNsdWJzIHdpdGggcGFnaW5hdGlvbiBhbmQgZmlsdGVyaW5nIChwdWJsaWMgZW5kcG9pbnQpJyxcbiAgICAgIGVudHJ5OiAnc2VydmljZXMvY2x1Yi1zZXJ2aWNlL2hhbmRsZXJzL2xpc3QtY2x1YnMudHMnLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgIH0pO1xuXG4gICAgLy8gTGFtYmRhIGZ1bmN0aW9uIGZvciBHRVQgL2NsdWJzL3tpZH0gKHB1YmxpYylcbiAgICB0aGlzLmdldENsdWJGdW5jdGlvbiA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ0dldENsdWJGdW5jdGlvbicsIHtcbiAgICAgIC4uLmNvbW1vbkxhbWJkYVByb3BzLFxuICAgICAgZnVuY3Rpb25OYW1lOiBgc3lkbmV5LWN5Y2xlcy1nZXQtY2x1Yi0ke3Byb3BzLmVudmlyb25tZW50fWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ0dldCBjbHViIGRldGFpbHMgYnkgSUQgKHB1YmxpYyBlbmRwb2ludCknLFxuICAgICAgZW50cnk6ICdzZXJ2aWNlcy9jbHViLXNlcnZpY2UvaGFuZGxlcnMvZ2V0LWNsdWIudHMnLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgIH0pO1xuXG4gICAgLy8gTGFtYmRhIGZ1bmN0aW9uIGZvciBQT1NUIC9jbHVicyAoYWRtaW4gb25seSlcbiAgICB0aGlzLmNyZWF0ZUNsdWJGdW5jdGlvbiA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ0NyZWF0ZUNsdWJGdW5jdGlvbicsIHtcbiAgICAgIC4uLmNvbW1vbkxhbWJkYVByb3BzLFxuICAgICAgZnVuY3Rpb25OYW1lOiBgc3lkbmV5LWN5Y2xlcy1jcmVhdGUtY2x1Yi0ke3Byb3BzLmVudmlyb25tZW50fWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NyZWF0ZSBuZXcgY2x1YiAoU2l0ZUFkbWluIG9ubHkpJyxcbiAgICAgIGVudHJ5OiAnc2VydmljZXMvY2x1Yi1zZXJ2aWNlL2hhbmRsZXJzL2NyZWF0ZS1jbHViLnRzJyxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICB9KTtcblxuICAgIC8vIExhbWJkYSBmdW5jdGlvbiBmb3IgUFVUIC9jbHVicy97aWR9IChhZG1pbiBvbmx5KVxuICAgIHRoaXMudXBkYXRlQ2x1YkZ1bmN0aW9uID0gbmV3IGxhbWJkYU5vZGVqcy5Ob2RlanNGdW5jdGlvbih0aGlzLCAnVXBkYXRlQ2x1YkZ1bmN0aW9uJywge1xuICAgICAgLi4uY29tbW9uTGFtYmRhUHJvcHMsXG4gICAgICBmdW5jdGlvbk5hbWU6IGBzeWRuZXktY3ljbGVzLXVwZGF0ZS1jbHViLSR7cHJvcHMuZW52aXJvbm1lbnR9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVXBkYXRlIGV4aXN0aW5nIGNsdWIgKFNpdGVBZG1pbiBvbmx5KScsXG4gICAgICBlbnRyeTogJ3NlcnZpY2VzL2NsdWItc2VydmljZS9oYW5kbGVycy91cGRhdGUtY2x1Yi50cycsXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcicsXG4gICAgfSk7XG5cbiAgICAvLyBQaGFzZSAyLjIgTWVtYmVyc2hpcCBGdW5jdGlvbnNcblxuICAgIC8vIExhbWJkYSBmdW5jdGlvbiBmb3IgUE9TVCAvY2x1YnMve2lkfS9tZW1iZXJzXG4gICAgdGhpcy5qb2luQ2x1YkZ1bmN0aW9uID0gbmV3IGxhbWJkYU5vZGVqcy5Ob2RlanNGdW5jdGlvbih0aGlzLCAnSm9pbkNsdWJGdW5jdGlvbicsIHtcbiAgICAgIC4uLmNvbW1vbkxhbWJkYVByb3BzLFxuICAgICAgZnVuY3Rpb25OYW1lOiBgc3lkbmV5LWN5Y2xlcy1qb2luLWNsdWItJHtwcm9wcy5lbnZpcm9ubWVudH1gLFxuICAgICAgZGVzY3JpcHRpb246ICdKb2luIGNsdWIgKGF1dGhlbnRpY2F0ZWQgdXNlcnMpJyxcbiAgICAgIGVudHJ5OiAnc2VydmljZXMvY2x1Yi1zZXJ2aWNlL2hhbmRsZXJzL21lbWJlcnNoaXAvam9pbi1jbHViLnRzJyxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICB9KTtcblxuICAgIC8vIExhbWJkYSBmdW5jdGlvbiBmb3IgREVMRVRFIC9jbHVicy97aWR9L21lbWJlcnMvbWVcbiAgICB0aGlzLmxlYXZlQ2x1YkZ1bmN0aW9uID0gbmV3IGxhbWJkYU5vZGVqcy5Ob2RlanNGdW5jdGlvbih0aGlzLCAnTGVhdmVDbHViRnVuY3Rpb24nLCB7XG4gICAgICAuLi5jb21tb25MYW1iZGFQcm9wcyxcbiAgICAgIGZ1bmN0aW9uTmFtZTogYHN5ZG5leS1jeWNsZXMtbGVhdmUtY2x1Yi0ke3Byb3BzLmVudmlyb25tZW50fWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ0xlYXZlIGNsdWIgKGF1dGhlbnRpY2F0ZWQgdXNlcnMpJyxcbiAgICAgIGVudHJ5OiAnc2VydmljZXMvY2x1Yi1zZXJ2aWNlL2hhbmRsZXJzL21lbWJlcnNoaXAvbGVhdmUtY2x1Yi50cycsXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcicsXG4gICAgfSk7XG5cbiAgICAvLyBMYW1iZGEgZnVuY3Rpb24gZm9yIEdFVCAvY2x1YnMve2lkfS9tZW1iZXJzXG4gICAgdGhpcy5saXN0TWVtYmVyc0Z1bmN0aW9uID0gbmV3IGxhbWJkYU5vZGVqcy5Ob2RlanNGdW5jdGlvbih0aGlzLCAnTGlzdE1lbWJlcnNGdW5jdGlvbicsIHtcbiAgICAgIC4uLmNvbW1vbkxhbWJkYVByb3BzLFxuICAgICAgZnVuY3Rpb25OYW1lOiBgc3lkbmV5LWN5Y2xlcy1saXN0LW1lbWJlcnMtJHtwcm9wcy5lbnZpcm9ubWVudH1gLFxuICAgICAgZGVzY3JpcHRpb246ICdMaXN0IGNsdWIgbWVtYmVycyAoY2x1YiBtZW1iZXJzKScsXG4gICAgICBlbnRyeTogJ3NlcnZpY2VzL2NsdWItc2VydmljZS9oYW5kbGVycy9tZW1iZXJzaGlwL2xpc3QtbWVtYmVycy50cycsXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcicsXG4gICAgfSk7XG5cbiAgICAvLyBCQVRDSCAyIC0gTWVtYmVyIE1hbmFnZW1lbnQgRnVuY3Rpb25zXG4gICAgLy8gTGFtYmRhIGZ1bmN0aW9uIGZvciBQVVQgL2NsdWJzL3tpZH0vbWVtYmVycy97dXNlcklkfVxuICAgIHRoaXMudXBkYXRlTWVtYmVyRnVuY3Rpb24gPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdVcGRhdGVNZW1iZXJGdW5jdGlvbicsIHtcbiAgICAgIC4uLmNvbW1vbkxhbWJkYVByb3BzLFxuICAgICAgZnVuY3Rpb25OYW1lOiBgc3lkbmV5LWN5Y2xlcy11cGRhdGUtbWVtYmVyLSR7cHJvcHMuZW52aXJvbm1lbnR9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVXBkYXRlIG1lbWJlciByb2xlIChjbHViIGFkbWlucyknLFxuICAgICAgZW50cnk6ICdzZXJ2aWNlcy9jbHViLXNlcnZpY2UvaGFuZGxlcnMvbWVtYmVyc2hpcC91cGRhdGUtbWVtYmVyLnRzJyxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICB9KTtcblxuICAgIC8vIExhbWJkYSBmdW5jdGlvbiBmb3IgREVMRVRFIC9jbHVicy97aWR9L21lbWJlcnMve3VzZXJJZH1cbiAgICB0aGlzLnJlbW92ZU1lbWJlckZ1bmN0aW9uID0gbmV3IGxhbWJkYU5vZGVqcy5Ob2RlanNGdW5jdGlvbih0aGlzLCAnUmVtb3ZlTWVtYmVyRnVuY3Rpb24nLCB7XG4gICAgICAuLi5jb21tb25MYW1iZGFQcm9wcyxcbiAgICAgIGZ1bmN0aW9uTmFtZTogYHN5ZG5leS1jeWNsZXMtcmVtb3ZlLW1lbWJlci0ke3Byb3BzLmVudmlyb25tZW50fWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ1JlbW92ZSBtZW1iZXIgZnJvbSBjbHViIChjbHViIGFkbWlucyknLFxuICAgICAgZW50cnk6ICdzZXJ2aWNlcy9jbHViLXNlcnZpY2UvaGFuZGxlcnMvbWVtYmVyc2hpcC9yZW1vdmUtbWVtYmVyLnRzJyxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICB9KTtcblxuICAgIC8vIEJBVENIIDMgLSBJbnZpdGF0aW9uIEZ1bmN0aW9uc1xuICAgIC8vIExhbWJkYSBmdW5jdGlvbiBmb3IgUE9TVCAvY2x1YnMve2lkfS9pbnZpdGF0aW9uc1xuICAgIHRoaXMuaW52aXRlVXNlckZ1bmN0aW9uID0gbmV3IGxhbWJkYU5vZGVqcy5Ob2RlanNGdW5jdGlvbih0aGlzLCAnSW52aXRlVXNlckZ1bmN0aW9uJywge1xuICAgICAgLi4uY29tbW9uTGFtYmRhUHJvcHMsXG4gICAgICBmdW5jdGlvbk5hbWU6IGBzeWRuZXktY3ljbGVzLWludml0ZS11c2VyLSR7cHJvcHMuZW52aXJvbm1lbnR9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnSW52aXRlIHVzZXIgdG8gY2x1YiAoY2x1YiBhZG1pbnMpJyxcbiAgICAgIGVudHJ5OiAnc2VydmljZXMvY2x1Yi1zZXJ2aWNlL2hhbmRsZXJzL2ludml0YXRpb24vaW52aXRlLXVzZXIudHMnLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgIH0pO1xuXG4gICAgLy8gTGFtYmRhIGZ1bmN0aW9uIGZvciBQVVQgL2ludml0YXRpb25zL3tpZH1cbiAgICB0aGlzLmFjY2VwdEludml0YXRpb25GdW5jdGlvbiA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ0FjY2VwdEludml0YXRpb25GdW5jdGlvbicsIHtcbiAgICAgIC4uLmNvbW1vbkxhbWJkYVByb3BzLFxuICAgICAgZnVuY3Rpb25OYW1lOiBgc3lkbmV5LWN5Y2xlcy1hY2NlcHQtaW52aXRhdGlvbi0ke3Byb3BzLmVudmlyb25tZW50fWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ0FjY2VwdCBvciBkZWNsaW5lIGludml0YXRpb24gKGF1dGhlbnRpY2F0ZWQgdXNlcnMpJyxcbiAgICAgIGVudHJ5OiAnc2VydmljZXMvY2x1Yi1zZXJ2aWNlL2hhbmRsZXJzL2ludml0YXRpb24vYWNjZXB0LWludml0YXRpb24udHMnLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgIH0pO1xuXG4gICAgLy8gTGFtYmRhIGZ1bmN0aW9uIGZvciBHRVQgL3VzZXJzL21lL2ludml0YXRpb25zXG4gICAgdGhpcy5saXN0SW52aXRhdGlvbnNGdW5jdGlvbiA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ0xpc3RJbnZpdGF0aW9uc0Z1bmN0aW9uJywge1xuICAgICAgLi4uY29tbW9uTGFtYmRhUHJvcHMsXG4gICAgICBmdW5jdGlvbk5hbWU6IGBzeWRuZXktY3ljbGVzLWxpc3QtaW52aXRhdGlvbnMtJHtwcm9wcy5lbnZpcm9ubWVudH1gLFxuICAgICAgZGVzY3JpcHRpb246ICdMaXN0IHVzZXIgaW52aXRhdGlvbnMgKGF1dGhlbnRpY2F0ZWQgdXNlcnMpJyxcbiAgICAgIGVudHJ5OiAnc2VydmljZXMvY2x1Yi1zZXJ2aWNlL2hhbmRsZXJzL2ludml0YXRpb24vbGlzdC1pbnZpdGF0aW9ucy50cycsXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcicsXG4gICAgfSk7XG5cbiAgICAvLyBCQVRDSCA0IC0gVXNlciBGdW5jdGlvbnNcbiAgICAvLyBMYW1iZGEgZnVuY3Rpb24gZm9yIEdFVCAvdXNlcnMvbWUvbWVtYmVyc2hpcHNcbiAgICB0aGlzLmdldE1lbWJlcnNoaXBzRnVuY3Rpb24gPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdHZXRNZW1iZXJzaGlwc0Z1bmN0aW9uJywge1xuICAgICAgLi4uY29tbW9uTGFtYmRhUHJvcHMsXG4gICAgICBmdW5jdGlvbk5hbWU6IGBzeWRuZXktY3ljbGVzLWdldC1tZW1iZXJzaGlwcy0ke3Byb3BzLmVudmlyb25tZW50fWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ0dldCB1c2VyIG1lbWJlcnNoaXBzIChhdXRoZW50aWNhdGVkIHVzZXJzKScsXG4gICAgICBlbnRyeTogJ3NlcnZpY2VzL2NsdWItc2VydmljZS9oYW5kbGVycy91c2VyL2dldC1tZW1iZXJzaGlwcy50cycsXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcicsXG4gICAgfSk7XG5cbiAgICAvLyBMYW1iZGEgZnVuY3Rpb24gZm9yIFBVVCAvY2x1YnMve2lkfS9yZXF1ZXN0cy97bWVtYmVyc2hpcElkfVxuICAgIHRoaXMucHJvY2Vzc0pvaW5SZXF1ZXN0RnVuY3Rpb24gPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdQcm9jZXNzSm9pblJlcXVlc3RGdW5jdGlvbicsIHtcbiAgICAgIC4uLmNvbW1vbkxhbWJkYVByb3BzLFxuICAgICAgZnVuY3Rpb25OYW1lOiBgc3lkbmV5LWN5Y2xlcy1wcm9jZXNzLWpvaW4tcmVxdWVzdC0ke3Byb3BzLmVudmlyb25tZW50fWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ1Byb2Nlc3Mgam9pbiByZXF1ZXN0IChjbHViIGFkbWlucyknLFxuICAgICAgZW50cnk6ICdzZXJ2aWNlcy9jbHViLXNlcnZpY2UvaGFuZGxlcnMvbWVtYmVyc2hpcC9wcm9jZXNzLWpvaW4tcmVxdWVzdC50cycsXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcicsXG4gICAgfSk7XG5cbiAgICAvLyBQaGFzZSAzLjEgSHlkcmF0ZWQgRnVuY3Rpb25zXG5cbiAgICAvLyBMYW1iZGEgZnVuY3Rpb24gZm9yIEdFVCAvdXNlcnMvbWUvY2x1YnMgKGh5ZHJhdGVkKVxuICAgIHRoaXMuZ2V0VXNlckNsdWJzRnVuY3Rpb24gPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdHZXRVc2VyQ2x1YnNGdW5jdGlvbicsIHtcbiAgICAgIC4uLmNvbW1vbkxhbWJkYVByb3BzLFxuICAgICAgZnVuY3Rpb25OYW1lOiBgc3lkbmV5LWN5Y2xlcy1nZXQtdXNlci1jbHVicy0ke3Byb3BzLmVudmlyb25tZW50fWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ0dldCB1c2VyIGNsdWJzIHdpdGggaHlkcmF0ZWQgZGF0YSAoYXV0aGVudGljYXRlZCB1c2VycyknLFxuICAgICAgZW50cnk6ICdzZXJ2aWNlcy9jbHViLXNlcnZpY2UvaGFuZGxlcnMvdXNlci9nZXQtdXNlci1jbHVicy50cycsXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcicsXG4gICAgfSk7XG5cbiAgICAvLyBHcmFudCBEeW5hbW9EQiBwZXJtaXNzaW9ucyB0byBMYW1iZGEgZnVuY3Rpb25zXG4gICAgY29uc3QgYWxsRnVuY3Rpb25zID0gW1xuICAgICAgLy8gUGhhc2UgMi4xIGZ1bmN0aW9uc1xuICAgICAgdGhpcy5saXN0Q2x1YnNGdW5jdGlvbixcbiAgICAgIHRoaXMuZ2V0Q2x1YkZ1bmN0aW9uLFxuICAgICAgdGhpcy5jcmVhdGVDbHViRnVuY3Rpb24sXG4gICAgICB0aGlzLnVwZGF0ZUNsdWJGdW5jdGlvbixcbiAgICAgIC8vIFBoYXNlIDIuMiBtZW1iZXJzaGlwIGZ1bmN0aW9uc1xuICAgICAgdGhpcy5qb2luQ2x1YkZ1bmN0aW9uLFxuICAgICAgdGhpcy5sZWF2ZUNsdWJGdW5jdGlvbixcbiAgICAgIHRoaXMubGlzdE1lbWJlcnNGdW5jdGlvbixcbiAgICAgIHRoaXMudXBkYXRlTWVtYmVyRnVuY3Rpb24sXG4gICAgICB0aGlzLnJlbW92ZU1lbWJlckZ1bmN0aW9uLFxuICAgICAgLy8gUGhhc2UgMi4yIGludml0YXRpb24gZnVuY3Rpb25zXG4gICAgICB0aGlzLmludml0ZVVzZXJGdW5jdGlvbixcbiAgICAgIHRoaXMuYWNjZXB0SW52aXRhdGlvbkZ1bmN0aW9uLFxuICAgICAgdGhpcy5saXN0SW52aXRhdGlvbnNGdW5jdGlvbixcbiAgICAgIC8vIFBoYXNlIDIuMiB1c2VyIGZ1bmN0aW9uc1xuICAgICAgdGhpcy5nZXRNZW1iZXJzaGlwc0Z1bmN0aW9uLFxuICAgICAgdGhpcy5wcm9jZXNzSm9pblJlcXVlc3RGdW5jdGlvbixcbiAgICAgIC8vIFBoYXNlIDMuMSBoeWRyYXRlZCBmdW5jdGlvbnNcbiAgICAgIHRoaXMuZ2V0VXNlckNsdWJzRnVuY3Rpb24sXG4gICAgXTtcblxuICAgIGFsbEZ1bmN0aW9ucy5mb3JFYWNoKGZ1bmMgPT4ge1xuICAgICAgcHJvcHMubWFpblRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShmdW5jKTtcbiAgICB9KTtcblxuICAgIC8vIEFQSSBHYXRld2F5IGludGVncmF0aW9uXG4gICAgdGhpcy5zZXR1cEFwaUdhdGV3YXlJbnRlZ3JhdGlvbihwcm9wcyk7XG5cbiAgICAvLyBUYWdzIGZvciBhbGwgZnVuY3Rpb25zXG4gICAgdGhpcy50YWdBbGxGdW5jdGlvbnMocHJvcHMuZW52aXJvbm1lbnQpO1xuXG4gIH1cblxuICAvKipcbiAgICogVGFnIGFsbCBmdW5jdGlvbnMgZm9yIHJlc291cmNlIG1hbmFnZW1lbnRcbiAgICovXG4gIHByaXZhdGUgdGFnQWxsRnVuY3Rpb25zKGVudmlyb25tZW50OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBhbGxGdW5jdGlvbnMgPSBbXG4gICAgICAvLyBQaGFzZSAyLjEgZnVuY3Rpb25zXG4gICAgICB7IGZ1bmM6IHRoaXMubGlzdENsdWJzRnVuY3Rpb24sIHBoYXNlOiAnMi4xLUNsdWJTZXJ2aWNlJyB9LFxuICAgICAgeyBmdW5jOiB0aGlzLmdldENsdWJGdW5jdGlvbiwgcGhhc2U6ICcyLjEtQ2x1YlNlcnZpY2UnIH0sXG4gICAgICB7IGZ1bmM6IHRoaXMuY3JlYXRlQ2x1YkZ1bmN0aW9uLCBwaGFzZTogJzIuMS1DbHViU2VydmljZScgfSxcbiAgICAgIHsgZnVuYzogdGhpcy51cGRhdGVDbHViRnVuY3Rpb24sIHBoYXNlOiAnMi4xLUNsdWJTZXJ2aWNlJyB9LFxuICAgICAgLy8gUGhhc2UgMi4yIG1lbWJlcnNoaXAgZnVuY3Rpb25zXG4gICAgICB7IGZ1bmM6IHRoaXMuam9pbkNsdWJGdW5jdGlvbiwgcGhhc2U6ICcyLjItQ2x1Yk1lbWJlcnNoaXAnIH0sXG4gICAgICB7IGZ1bmM6IHRoaXMubGVhdmVDbHViRnVuY3Rpb24sIHBoYXNlOiAnMi4yLUNsdWJNZW1iZXJzaGlwJyB9LFxuICAgICAgeyBmdW5jOiB0aGlzLmxpc3RNZW1iZXJzRnVuY3Rpb24sIHBoYXNlOiAnMi4yLUNsdWJNZW1iZXJzaGlwJyB9LFxuICAgICAgeyBmdW5jOiB0aGlzLnVwZGF0ZU1lbWJlckZ1bmN0aW9uLCBwaGFzZTogJzIuMi1DbHViTWVtYmVyc2hpcCcgfSxcbiAgICAgIHsgZnVuYzogdGhpcy5yZW1vdmVNZW1iZXJGdW5jdGlvbiwgcGhhc2U6ICcyLjItQ2x1Yk1lbWJlcnNoaXAnIH0sXG4gICAgICAvLyBQaGFzZSAyLjIgaW52aXRhdGlvbiBmdW5jdGlvbnNcbiAgICAgIHsgZnVuYzogdGhpcy5pbnZpdGVVc2VyRnVuY3Rpb24sIHBoYXNlOiAnMi4yLUNsdWJJbnZpdGF0aW9ucycgfSxcbiAgICAgIHsgZnVuYzogdGhpcy5hY2NlcHRJbnZpdGF0aW9uRnVuY3Rpb24sIHBoYXNlOiAnMi4yLUNsdWJJbnZpdGF0aW9ucycgfSxcbiAgICAgIHsgZnVuYzogdGhpcy5saXN0SW52aXRhdGlvbnNGdW5jdGlvbiwgcGhhc2U6ICcyLjItQ2x1Ykludml0YXRpb25zJyB9LFxuICAgICAgLy8gUGhhc2UgMi4yIHVzZXIgZnVuY3Rpb25zXG4gICAgICB7IGZ1bmM6IHRoaXMuZ2V0TWVtYmVyc2hpcHNGdW5jdGlvbiwgcGhhc2U6ICcyLjItQ2x1Yk1lbWJlcnNoaXAnIH0sXG4gICAgICB7IGZ1bmM6IHRoaXMucHJvY2Vzc0pvaW5SZXF1ZXN0RnVuY3Rpb24sIHBoYXNlOiAnMi4yLUNsdWJNZW1iZXJzaGlwJyB9LFxuICAgICAgLy8gUGhhc2UgMy4xIGh5ZHJhdGVkIGZ1bmN0aW9uc1xuICAgICAgeyBmdW5jOiB0aGlzLmdldFVzZXJDbHVic0Z1bmN0aW9uLCBwaGFzZTogJzMuMS1DbHViTmF2aWdhdGlvbicgfSxcbiAgICBdO1xuXG4gICAgYWxsRnVuY3Rpb25zLmZvckVhY2goKHsgZnVuYywgcGhhc2UgfSkgPT4ge1xuICAgICAgY2RrLlRhZ3Mub2YoZnVuYykuYWRkKCdDb21wb25lbnQnLCAnQ2x1YlNlcnZpY2UnKTtcbiAgICAgIGNkay5UYWdzLm9mKGZ1bmMpLmFkZCgnUGhhc2UnLCBwaGFzZSk7XG4gICAgICBjZGsuVGFncy5vZihmdW5jKS5hZGQoJ0Vudmlyb25tZW50JywgZW52aXJvbm1lbnQpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB1cCBBUEkgR2F0ZXdheSBpbnRlZ3JhdGlvbiBmb3IgY2x1YiBlbmRwb2ludHNcbiAgICovXG4gIHByaXZhdGUgc2V0dXBBcGlHYXRld2F5SW50ZWdyYXRpb24ocHJvcHM6IENsdWJTZXJ2aWNlUHJvcHMpOiB2b2lkIHtcbiAgICAvLyBHZXQgdGhlIHYxIHJlc291cmNlIChzaG91bGQgZXhpc3QgZnJvbSBQaGFzZSAxLjEpXG4gICAgY29uc3QgdjFSZXNvdXJjZSA9IHByb3BzLmFwaS5yb290LmdldFJlc291cmNlKCd2MScpO1xuICAgIGlmICghdjFSZXNvdXJjZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCd2MSBBUEkgcmVzb3VyY2Ugbm90IGZvdW5kIC0gZW5zdXJlIFBoYXNlIDEuMSBpbmZyYXN0cnVjdHVyZSBpcyBkZXBsb3llZCcpO1xuICAgIH1cblxuICAgIC8vIEdldCBvciBjcmVhdGUgdGhlIGNsdWJzIHJlc291cmNlXG4gICAgbGV0IGNsdWJzUmVzb3VyY2UgPSB2MVJlc291cmNlLmdldFJlc291cmNlKCdjbHVicycpO1xuICAgIGlmICghY2x1YnNSZXNvdXJjZSkge1xuICAgICAgY2x1YnNSZXNvdXJjZSA9IHYxUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ2NsdWJzJyk7XG4gICAgfVxuXG4gICAgLy8gR2V0IG9yIGNyZWF0ZSB0aGUgdXNlcnMgcmVzb3VyY2VcbiAgICBsZXQgdXNlcnNSZXNvdXJjZSA9IHYxUmVzb3VyY2UuZ2V0UmVzb3VyY2UoJ3VzZXJzJyk7XG4gICAgaWYgKCF1c2Vyc1Jlc291cmNlKSB7XG4gICAgICB1c2Vyc1Jlc291cmNlID0gdjFSZXNvdXJjZS5hZGRSZXNvdXJjZSgndXNlcnMnKTtcbiAgICB9XG5cbiAgICAvLyBHZXQgb3IgY3JlYXRlIHRoZSBpbnZpdGF0aW9ucyByZXNvdXJjZVxuICAgIGxldCBpbnZpdGF0aW9uc1Jlc291cmNlID0gdjFSZXNvdXJjZS5nZXRSZXNvdXJjZSgnaW52aXRhdGlvbnMnKTtcbiAgICBpZiAoIWludml0YXRpb25zUmVzb3VyY2UpIHtcbiAgICAgIGludml0YXRpb25zUmVzb3VyY2UgPSB2MVJlc291cmNlLmFkZFJlc291cmNlKCdpbnZpdGF0aW9ucycpO1xuICAgIH1cblxuICAgIC8vIEdFVCAvY2x1YnMgZW5kcG9pbnQgKHB1YmxpYyAtIG5vIGF1dGhvcml6YXRpb24pXG4gICAgY2x1YnNSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHRoaXMubGlzdENsdWJzRnVuY3Rpb24pLCB7XG4gICAgICAvLyBObyBhdXRob3JpemVyIGZvciBwdWJsaWMgZW5kcG9pbnRcbiAgICAgIG1ldGhvZFJlc3BvbnNlczogW1xuICAgICAgICB7XG4gICAgICAgICAgc3RhdHVzQ29kZTogJzIwMCcsXG4gICAgICAgICAgcmVzcG9uc2VNb2RlbHM6IHtcbiAgICAgICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzogYXBpZ2F0ZXdheS5Nb2RlbC5FTVBUWV9NT0RFTCxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgc3RhdHVzQ29kZTogJzQwMCcsXG4gICAgICAgICAgcmVzcG9uc2VNb2RlbHM6IHtcbiAgICAgICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzogYXBpZ2F0ZXdheS5Nb2RlbC5FUlJPUl9NT0RFTCxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgc3RhdHVzQ29kZTogJzUwMCcsXG4gICAgICAgICAgcmVzcG9uc2VNb2RlbHM6IHtcbiAgICAgICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzogYXBpZ2F0ZXdheS5Nb2RlbC5FUlJPUl9NT0RFTCxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIFBPU1QgL2NsdWJzIGVuZHBvaW50IChhZG1pbiBvbmx5IC0gcmVxdWlyZXMgYXV0aG9yaXphdGlvbilcbiAgICBjbHVic1Jlc291cmNlLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHRoaXMuY3JlYXRlQ2x1YkZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogcHJvcHMuYXV0aG9yaXplcixcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXG4gICAgICByZXF1ZXN0TW9kZWxzOiB7XG4gICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzogYXBpZ2F0ZXdheS5Nb2RlbC5FTVBUWV9NT0RFTCwgLy8gV2lsbCBiZSB2YWxpZGF0ZWQgaW4gTGFtYmRhXG4gICAgICB9LFxuICAgICAgbWV0aG9kUmVzcG9uc2VzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnMjAxJyxcbiAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVNUFRZX01PREVMLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnNDAwJyxcbiAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVSUk9SX01PREVMLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnNDAxJyxcbiAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVSUk9SX01PREVMLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnNDAzJyxcbiAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVSUk9SX01PREVMLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnNDA5JyxcbiAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVSUk9SX01PREVMLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnNTAwJyxcbiAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVSUk9SX01PREVMLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gR2V0IG9yIGNyZWF0ZSB0aGUge2NsdWJJZH0gcmVzb3VyY2UgdW5kZXIgY2x1YnMgKG1hdGNoaW5nIHJlc3QtYXBpLnRzIHN0cnVjdHVyZSlcbiAgICBsZXQgY2x1YklkUmVzb3VyY2UgPSBjbHVic1Jlc291cmNlLmdldFJlc291cmNlKCd7Y2x1YklkfScpO1xuICAgIGlmICghY2x1YklkUmVzb3VyY2UpIHtcbiAgICAgIGNsdWJJZFJlc291cmNlID0gY2x1YnNSZXNvdXJjZS5hZGRSZXNvdXJjZSgne2NsdWJJZH0nKTtcbiAgICB9XG5cbiAgICAvLyBHRVQgL2NsdWJzL3tjbHViSWR9IGVuZHBvaW50IChwdWJsaWMgLSBubyBhdXRob3JpemF0aW9uKVxuICAgIGNsdWJJZFJlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odGhpcy5nZXRDbHViRnVuY3Rpb24pLCB7XG4gICAgICAvLyBObyBhdXRob3JpemVyIGZvciBwdWJsaWMgZW5kcG9pbnRcbiAgICAgIHJlcXVlc3RQYXJhbWV0ZXJzOiB7XG4gICAgICAgICdtZXRob2QucmVxdWVzdC5wYXRoLmNsdWJJZCc6IHRydWUsXG4gICAgICB9LFxuICAgICAgbWV0aG9kUmVzcG9uc2VzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnMjAwJyxcbiAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVNUFRZX01PREVMLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnNDAwJyxcbiAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVSUk9SX01PREVMLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnNDA0JyxcbiAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVSUk9SX01PREVMLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnNTAwJyxcbiAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVSUk9SX01PREVMLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gUFVUIC9jbHVicy97Y2x1YklkfSBlbmRwb2ludCAoYWRtaW4gb25seSAtIHJlcXVpcmVzIGF1dGhvcml6YXRpb24pXG4gICAgY2x1YklkUmVzb3VyY2UuYWRkTWV0aG9kKCdQVVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih0aGlzLnVwZGF0ZUNsdWJGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHByb3BzLmF1dGhvcml6ZXIsXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcbiAgICAgICAgJ21ldGhvZC5yZXF1ZXN0LnBhdGguY2x1YklkJzogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICByZXF1ZXN0TW9kZWxzOiB7XG4gICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzogYXBpZ2F0ZXdheS5Nb2RlbC5FTVBUWV9NT0RFTCwgLy8gV2lsbCBiZSB2YWxpZGF0ZWQgaW4gTGFtYmRhXG4gICAgICB9LFxuICAgICAgbWV0aG9kUmVzcG9uc2VzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnMjAwJyxcbiAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVNUFRZX01PREVMLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnNDAwJyxcbiAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVSUk9SX01PREVMLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnNDAxJyxcbiAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVSUk9SX01PREVMLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnNDAzJyxcbiAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVSUk9SX01PREVMLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnNDA0JyxcbiAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVSUk9SX01PREVMLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnNDA5JyxcbiAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVSUk9SX01PREVMLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnNTAwJyxcbiAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVSUk9SX01PREVMLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gUGhhc2UgMi4yIE1lbWJlcnNoaXAgRW5kcG9pbnRzXG5cbiAgICAvLyBHZXQgb3IgY3JlYXRlIHRoZSBtZW1iZXJzIHJlc291cmNlIHVuZGVyIGNsdWJzL3tjbHViSWR9XG4gICAgbGV0IG1lbWJlcnNSZXNvdXJjZSA9IGNsdWJJZFJlc291cmNlLmdldFJlc291cmNlKCdtZW1iZXJzJyk7XG4gICAgaWYgKCFtZW1iZXJzUmVzb3VyY2UpIHtcbiAgICAgIG1lbWJlcnNSZXNvdXJjZSA9IGNsdWJJZFJlc291cmNlLmFkZFJlc291cmNlKCdtZW1iZXJzJyk7XG4gICAgfVxuXG4gICAgLy8gUE9TVCAvY2x1YnMve2NsdWJJZH0vbWVtYmVycyAtIEpvaW4gY2x1YlxuICAgIG1lbWJlcnNSZXNvdXJjZS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih0aGlzLmpvaW5DbHViRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiBwcm9wcy5hdXRob3JpemVyLFxuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcbiAgICAgIHJlcXVlc3RQYXJhbWV0ZXJzOiB7XG4gICAgICAgICdtZXRob2QucmVxdWVzdC5wYXRoLmNsdWJJZCc6IHRydWUsXG4gICAgICB9LFxuICAgICAgbWV0aG9kUmVzcG9uc2VzOiBbXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzIwMScgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnMjAyJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc0MDAnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwMScgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNDAzJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc0MDknIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzUwMCcgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBHRVQgL2NsdWJzL3tjbHViSWR9L21lbWJlcnMgLSBMaXN0IGNsdWIgbWVtYmVyc1xuICAgIG1lbWJlcnNSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHRoaXMubGlzdE1lbWJlcnNGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHByb3BzLmF1dGhvcml6ZXIsXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcbiAgICAgICAgJ21ldGhvZC5yZXF1ZXN0LnBhdGguY2x1YklkJzogdHJ1ZSxcbiAgICAgICAgJ21ldGhvZC5yZXF1ZXN0LnF1ZXJ5c3RyaW5nLmxpbWl0JzogZmFsc2UsXG4gICAgICAgICdtZXRob2QucmVxdWVzdC5xdWVyeXN0cmluZy5jdXJzb3InOiBmYWxzZSxcbiAgICAgICAgJ21ldGhvZC5yZXF1ZXN0LnF1ZXJ5c3RyaW5nLnJvbGUnOiBmYWxzZSxcbiAgICAgICAgJ21ldGhvZC5yZXF1ZXN0LnF1ZXJ5c3RyaW5nLnN0YXR1cyc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIG1ldGhvZFJlc3BvbnNlczogW1xuICAgICAgICB7IHN0YXR1c0NvZGU6ICcyMDAnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwMCcgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNDAxJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc0MDMnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwNCcgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNTAwJyB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIERFTEVURSAvY2x1YnMve2NsdWJJZH0vbWVtYmVycy9tZSAtIExlYXZlIGNsdWJcbiAgICBjb25zdCBtZW1iZXJzTWUgPSBtZW1iZXJzUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ21lJyk7XG4gICAgbWVtYmVyc01lLmFkZE1ldGhvZCgnREVMRVRFJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odGhpcy5sZWF2ZUNsdWJGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHByb3BzLmF1dGhvcml6ZXIsXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcbiAgICAgICAgJ21ldGhvZC5yZXF1ZXN0LnBhdGguY2x1YklkJzogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBtZXRob2RSZXNwb25zZXM6IFtcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnMjAwJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc0MDAnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwMScgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNDAzJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc0MDQnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzUwMCcgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBCQVRDSCAyIC0gTWVtYmVyIE1hbmFnZW1lbnQgQVBJIFJvdXRlcyAodXNpbmcgc2luZ3VsYXIgXCJtZW1iZXJcIiB0byBhdm9pZCBjb25mbGljdClcbiAgICAvLyBDcmVhdGUgc2VwYXJhdGUgXCJtZW1iZXJcIiByZXNvdXJjZSBmb3IgYWRtaW4gb3BlcmF0aW9ucyBvbiBzcGVjaWZpYyB1c2Vyc1xuICAgIGxldCBtZW1iZXJSZXNvdXJjZSA9IGNsdWJJZFJlc291cmNlLmdldFJlc291cmNlKCdtZW1iZXInKTtcbiAgICBpZiAoIW1lbWJlclJlc291cmNlKSB7XG4gICAgICBtZW1iZXJSZXNvdXJjZSA9IGNsdWJJZFJlc291cmNlLmFkZFJlc291cmNlKCdtZW1iZXInKTtcbiAgICB9XG5cbiAgICAvLyBQVVQgL2NsdWJzL3tjbHViSWR9L21lbWJlci97dXNlcklkfSAtIFVwZGF0ZSBtZW1iZXIgcm9sZVxuICAgIGNvbnN0IG1lbWJlclVzZXJJZCA9IG1lbWJlclJlc291cmNlLmFkZFJlc291cmNlKCd7dXNlcklkfScpO1xuICAgIG1lbWJlclVzZXJJZC5hZGRNZXRob2QoJ1BVVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHRoaXMudXBkYXRlTWVtYmVyRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiBwcm9wcy5hdXRob3JpemVyLFxuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcbiAgICAgIHJlcXVlc3RQYXJhbWV0ZXJzOiB7XG4gICAgICAgICdtZXRob2QucmVxdWVzdC5wYXRoLmNsdWJJZCc6IHRydWUsXG4gICAgICAgICdtZXRob2QucmVxdWVzdC5wYXRoLnVzZXJJZCc6IHRydWUsXG4gICAgICB9LFxuICAgICAgbWV0aG9kUmVzcG9uc2VzOiBbXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzIwMCcgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNDAwJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc0MDEnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwMycgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNDA0JyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc1MDAnIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gREVMRVRFIC9jbHVicy97Y2x1YklkfS9tZW1iZXIve3VzZXJJZH0gLSBSZW1vdmUgbWVtYmVyXG4gICAgbWVtYmVyVXNlcklkLmFkZE1ldGhvZCgnREVMRVRFJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odGhpcy5yZW1vdmVNZW1iZXJGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHByb3BzLmF1dGhvcml6ZXIsXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcbiAgICAgICAgJ21ldGhvZC5yZXF1ZXN0LnBhdGguY2x1YklkJzogdHJ1ZSxcbiAgICAgICAgJ21ldGhvZC5yZXF1ZXN0LnBhdGgudXNlcklkJzogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBtZXRob2RSZXNwb25zZXM6IFtcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnMjAwJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc0MDAnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwMScgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNDAzJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc0MDQnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzUwMCcgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBQaGFzZSAyLjIgSW52aXRhdGlvbiBFbmRwb2ludHNcblxuICAgIC8vIEdldCBvciBjcmVhdGUgdGhlIGludml0YXRpb25zIHJlc291cmNlIHVuZGVyIGNsdWJzL3tjbHViSWR9XG4gICAgbGV0IGNsdWJJbnZpdGF0aW9uc1Jlc291cmNlID0gY2x1YklkUmVzb3VyY2UuZ2V0UmVzb3VyY2UoJ2ludml0YXRpb25zJyk7XG4gICAgaWYgKCFjbHViSW52aXRhdGlvbnNSZXNvdXJjZSkge1xuICAgICAgY2x1Ykludml0YXRpb25zUmVzb3VyY2UgPSBjbHViSWRSZXNvdXJjZS5hZGRSZXNvdXJjZSgnaW52aXRhdGlvbnMnKTtcbiAgICB9XG5cbiAgICAvLyBQT1NUIC9jbHVicy97Y2x1YklkfS9pbnZpdGF0aW9ucyAtIEludml0ZSB1c2VyIHRvIGNsdWJcbiAgICBjbHViSW52aXRhdGlvbnNSZXNvdXJjZS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih0aGlzLmludml0ZVVzZXJGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHByb3BzLmF1dGhvcml6ZXIsXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcbiAgICAgICAgJ21ldGhvZC5yZXF1ZXN0LnBhdGguY2x1YklkJzogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBtZXRob2RSZXNwb25zZXM6IFtcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnMjAxJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc0MDAnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwMScgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNDAzJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc0MDQnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwOScgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNTAwJyB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIFBVVCAvaW52aXRhdGlvbnMve2lkfSAtIEFjY2VwdC9kZWNsaW5lIGludml0YXRpb25cbiAgICBjb25zdCBpbnZpdGF0aW9uSWQgPSBpbnZpdGF0aW9uc1Jlc291cmNlLmFkZFJlc291cmNlKCd7aWR9Jyk7XG4gICAgaW52aXRhdGlvbklkLmFkZE1ldGhvZCgnUFVUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odGhpcy5hY2NlcHRJbnZpdGF0aW9uRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiBwcm9wcy5hdXRob3JpemVyLFxuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcbiAgICAgIHJlcXVlc3RQYXJhbWV0ZXJzOiB7XG4gICAgICAgICdtZXRob2QucmVxdWVzdC5wYXRoLmlkJzogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBtZXRob2RSZXNwb25zZXM6IFtcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnMjAwJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc0MDAnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwMScgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNDAzJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc0MDQnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzUwMCcgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBQaGFzZSAyLjIgSm9pbiBSZXF1ZXN0IE1hbmFnZW1lbnRcblxuICAgIC8vIEdldCBvciBjcmVhdGUgdGhlIHJlcXVlc3RzIHJlc291cmNlIHVuZGVyIGNsdWJzL3tjbHViSWR9XG4gICAgbGV0IHJlcXVlc3RzUmVzb3VyY2UgPSBjbHViSWRSZXNvdXJjZS5nZXRSZXNvdXJjZSgncmVxdWVzdHMnKTtcbiAgICBpZiAoIXJlcXVlc3RzUmVzb3VyY2UpIHtcbiAgICAgIHJlcXVlc3RzUmVzb3VyY2UgPSBjbHViSWRSZXNvdXJjZS5hZGRSZXNvdXJjZSgncmVxdWVzdHMnKTtcbiAgICB9XG5cbiAgICAvLyBQVVQgL2NsdWJzL3tjbHViSWR9L3JlcXVlc3RzL3ttZW1iZXJzaGlwSWR9IC0gUHJvY2VzcyBqb2luIHJlcXVlc3RcbiAgICBjb25zdCByZXF1ZXN0TWVtYmVyc2hpcElkID0gcmVxdWVzdHNSZXNvdXJjZS5hZGRSZXNvdXJjZSgne21lbWJlcnNoaXBJZH0nKTtcbiAgICByZXF1ZXN0TWVtYmVyc2hpcElkLmFkZE1ldGhvZCgnUFVUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odGhpcy5wcm9jZXNzSm9pblJlcXVlc3RGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHByb3BzLmF1dGhvcml6ZXIsXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcbiAgICAgICAgJ21ldGhvZC5yZXF1ZXN0LnBhdGguY2x1YklkJzogdHJ1ZSxcbiAgICAgICAgJ21ldGhvZC5yZXF1ZXN0LnBhdGgubWVtYmVyc2hpcElkJzogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBtZXRob2RSZXNwb25zZXM6IFtcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnMjAwJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc0MDAnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwMScgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNDAzJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc0MDQnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzUwMCcgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBQaGFzZSAyLjIgVXNlciBFbmRwb2ludHNcblxuICAgIC8vIEdFVCAvdXNlcnMvbWUvbWVtYmVyc2hpcHMgLSBHZXQgdXNlcidzIGNsdWIgbWVtYmVyc2hpcHNcbiAgICBsZXQgdXNlcnNNZSA9IHVzZXJzUmVzb3VyY2UuZ2V0UmVzb3VyY2UoJ21lJyk7XG4gICAgaWYgKCF1c2Vyc01lKSB7XG4gICAgICB1c2Vyc01lID0gdXNlcnNSZXNvdXJjZS5hZGRSZXNvdXJjZSgnbWUnKTtcbiAgICB9XG4gICAgY29uc3QgdXNlcnNNZW1iZXJzaGlwcyA9IHVzZXJzTWUuYWRkUmVzb3VyY2UoJ21lbWJlcnNoaXBzJyk7XG4gICAgdXNlcnNNZW1iZXJzaGlwcy5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHRoaXMuZ2V0TWVtYmVyc2hpcHNGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHByb3BzLmF1dGhvcml6ZXIsXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcbiAgICAgICAgJ21ldGhvZC5yZXF1ZXN0LnF1ZXJ5c3RyaW5nLnN0YXR1cyc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIG1ldGhvZFJlc3BvbnNlczogW1xuICAgICAgICB7IHN0YXR1c0NvZGU6ICcyMDAnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwMCcgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNDAxJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc1MDAnIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gR0VUIC91c2Vycy9tZS9pbnZpdGF0aW9ucyAtIEdldCB1c2VyJ3MgcGVuZGluZyBpbnZpdGF0aW9uc1xuICAgIGNvbnN0IHVzZXJzSW52aXRhdGlvbnMgPSB1c2Vyc01lLmFkZFJlc291cmNlKCdpbnZpdGF0aW9ucycpO1xuICAgIHVzZXJzSW52aXRhdGlvbnMuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih0aGlzLmxpc3RJbnZpdGF0aW9uc0Z1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogcHJvcHMuYXV0aG9yaXplcixcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXG4gICAgICByZXF1ZXN0UGFyYW1ldGVyczoge1xuICAgICAgICAnbWV0aG9kLnJlcXVlc3QucXVlcnlzdHJpbmcubGltaXQnOiBmYWxzZSxcbiAgICAgICAgJ21ldGhvZC5yZXF1ZXN0LnF1ZXJ5c3RyaW5nLmN1cnNvcic6IGZhbHNlLFxuICAgICAgICAnbWV0aG9kLnJlcXVlc3QucXVlcnlzdHJpbmcuc3RhdHVzJzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgbWV0aG9kUmVzcG9uc2VzOiBbXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzIwMCcgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNDAwJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc0MDEnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzUwMCcgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBQaGFzZSAzLjEgSHlkcmF0ZWQgRW5kcG9pbnRzXG5cbiAgICAvLyBHRVQgL3VzZXJzL21lL2NsdWJzIC0gR2V0IHVzZXIncyBjbHVicyB3aXRoIGh5ZHJhdGVkIGRhdGFcbiAgICBjb25zdCB1c2Vyc0NsdWJzID0gdXNlcnNNZS5hZGRSZXNvdXJjZSgnY2x1YnMnKTtcbiAgICB1c2Vyc0NsdWJzLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odGhpcy5nZXRVc2VyQ2x1YnNGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHByb3BzLmF1dGhvcml6ZXIsXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcbiAgICAgICAgJ21ldGhvZC5yZXF1ZXN0LnF1ZXJ5c3RyaW5nLnN0YXR1cyc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIG1ldGhvZFJlc3BvbnNlczogW1xuICAgICAgICB7IHN0YXR1c0NvZGU6ICcyMDAnIH0sXG4gICAgICAgIHsgc3RhdHVzQ29kZTogJzQwMCcgfSxcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnNDAxJyB9LFxuICAgICAgICB7IHN0YXR1c0NvZGU6ICc1MDAnIH0sXG4gICAgICBdLFxuICAgIH0pO1xuICB9XG59Il19