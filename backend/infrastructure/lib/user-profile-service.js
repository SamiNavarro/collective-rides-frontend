"use strict";
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
exports.UserProfileServiceConstruct = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const lambdaNodejs = __importStar(require("aws-cdk-lib/aws-lambda-nodejs"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const constructs_1 = require("constructs");
/**
 * User Profile Service construct
 *
 * Creates Lambda functions for user profile operations and integrates them
 * with the existing API Gateway and DynamoDB infrastructure.
 */
class UserProfileServiceConstruct extends constructs_1.Construct {
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
        };
        // Lambda function for GET /users/me
        this.getCurrentUserFunction = new lambdaNodejs.NodejsFunction(this, 'GetCurrentUserFunction', {
            ...commonLambdaProps,
            functionName: `sydney-cycles-get-current-user-${props.environment}`,
            description: 'Get current user profile with lazy creation',
            entry: 'services/user-profile/handlers/get-current-user.ts',
            handler: 'handler',
            bundling: {
                forceDockerBundling: false,
                externalModules: ['@aws-sdk/*'],
            },
        });
        // Lambda function for GET /users/{id}
        this.getUserByIdFunction = new lambdaNodejs.NodejsFunction(this, 'GetUserByIdFunction', {
            ...commonLambdaProps,
            functionName: `sydney-cycles-get-user-by-id-${props.environment}`,
            description: 'Get user profile by ID (SiteAdmin only)',
            entry: 'services/user-profile/handlers/get-user-by-id.ts',
            handler: 'handler',
            bundling: {
                forceDockerBundling: false,
                externalModules: ['@aws-sdk/*'],
            },
        });
        // Lambda function for PUT /users/{id}
        this.updateUserFunction = new lambdaNodejs.NodejsFunction(this, 'UpdateUserFunction', {
            ...commonLambdaProps,
            functionName: `sydney-cycles-update-user-${props.environment}`,
            description: 'Update user profile with authorization',
            entry: 'services/user-profile/handlers/update-user.ts',
            handler: 'handler',
            bundling: {
                forceDockerBundling: false,
                externalModules: ['@aws-sdk/*'],
            },
        });
        // Grant DynamoDB permissions to Lambda functions
        props.mainTable.grantReadWriteData(this.getCurrentUserFunction);
        props.mainTable.grantReadWriteData(this.getUserByIdFunction);
        props.mainTable.grantReadWriteData(this.updateUserFunction);
        // API Gateway integration
        this.setupApiGatewayIntegration(props);
        // Tags for resource management
        cdk.Tags.of(this.getCurrentUserFunction).add('Component', 'UserProfileService');
        cdk.Tags.of(this.getCurrentUserFunction).add('Phase', '1.2-UserProfile');
        cdk.Tags.of(this.getUserByIdFunction).add('Component', 'UserProfileService');
        cdk.Tags.of(this.getUserByIdFunction).add('Phase', '1.2-UserProfile');
        cdk.Tags.of(this.updateUserFunction).add('Component', 'UserProfileService');
        cdk.Tags.of(this.updateUserFunction).add('Phase', '1.2-UserProfile');
    }
    /**
     * Set up API Gateway integration for user profile endpoints
     */
    setupApiGatewayIntegration(props) {
        // Get the v1 resource (should exist from Phase 1.1)
        const v1Resource = props.api.root.getResource('v1');
        if (!v1Resource) {
            throw new Error('v1 API resource not found - ensure Phase 1.1 infrastructure is deployed');
        }
        // Get or create the users resource
        let usersResource = v1Resource.getResource('users');
        if (!usersResource) {
            usersResource = v1Resource.addResource('users');
        }
        // GET /users/me endpoint
        let meResource = usersResource.getResource('me');
        if (!meResource) {
            meResource = usersResource.addResource('me');
        }
        meResource.addMethod('GET', new apigateway.LambdaIntegration(this.getCurrentUserFunction), {
            authorizer: props.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            methodResponses: [
                {
                    statusCode: '200',
                    responseModels: {
                        'application/json': apigateway.Model.EMPTY_MODEL,
                    },
                },
                {
                    statusCode: '401',
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
        // GET /users/{id} endpoint  
        let userIdResource = usersResource.getResource('{id}');
        if (!userIdResource) {
            userIdResource = usersResource.addResource('{id}');
        }
        userIdResource.addMethod('GET', new apigateway.LambdaIntegration(this.getUserByIdFunction), {
            authorizer: props.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestParameters: {
                'method.request.path.id': true,
            },
            methodResponses: [
                {
                    statusCode: '200',
                    responseModels: {
                        'application/json': apigateway.Model.EMPTY_MODEL,
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
                    statusCode: '500',
                    responseModels: {
                        'application/json': apigateway.Model.ERROR_MODEL,
                    },
                },
            ],
        });
        // PUT /users/{id} endpoint
        userIdResource.addMethod('PUT', new apigateway.LambdaIntegration(this.updateUserFunction), {
            authorizer: props.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestParameters: {
                'method.request.path.id': true,
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
                    statusCode: '500',
                    responseModels: {
                        'application/json': apigateway.Model.ERROR_MODEL,
                    },
                },
            ],
        });
    }
}
exports.UserProfileServiceConstruct = UserProfileServiceConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlci1wcm9maWxlLXNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1c2VyLXByb2ZpbGUtc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7OztHQVNHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILGlEQUFtQztBQUNuQywrREFBaUQ7QUFDakQsNEVBQThEO0FBQzlELHVFQUF5RDtBQUd6RCwyREFBNkM7QUFDN0MsMkNBQXVDO0FBWXZDOzs7OztHQUtHO0FBQ0gsTUFBYSwyQkFBNEIsU0FBUSxzQkFBUztJQUt4RCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQThCO1FBQ3RFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsOEJBQThCO1FBQzlCLE1BQU0saUJBQWlCLEdBQUc7WUFDeEIsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ2pDLFVBQVUsRUFBRSxHQUFHO1lBQ2YsV0FBVyxFQUFFO2dCQUNYLFVBQVUsRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLFNBQVM7Z0JBQ3JDLFdBQVcsRUFBRSxLQUFLLENBQUMsV0FBVzthQUMvQjtZQUNELFlBQVksRUFBRSxLQUFLLENBQUMsV0FBVyxLQUFLLFlBQVk7Z0JBQzlDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVM7Z0JBQzlCLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVE7U0FDaEMsQ0FBQztRQUVGLG9DQUFvQztRQUNwQyxJQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxZQUFZLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSx3QkFBd0IsRUFBRTtZQUM1RixHQUFHLGlCQUFpQjtZQUNwQixZQUFZLEVBQUUsa0NBQWtDLEtBQUssQ0FBQyxXQUFXLEVBQUU7WUFD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QztDQUNGO0FBNU5ELGtFQTROQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVXNlciBQcm9maWxlIFNlcnZpY2UgSW5mcmFzdHJ1Y3R1cmUgLSBQaGFzZSAxLjJcbiAqIFxuICogQ0RLIGNvbnN0cnVjdCBmb3IgVXNlciBQcm9maWxlIFNlcnZpY2UgTGFtYmRhIGZ1bmN0aW9ucyBhbmQgQVBJIEdhdGV3YXkgaW50ZWdyYXRpb24uXG4gKiBJbnRlZ3JhdGVzIHdpdGggZXhpc3RpbmcgUGhhc2UgMS4xIGluZnJhc3RydWN0dXJlIGNvbXBvbmVudHMuXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDEuMiBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0xLjIudXNlci1wcm9maWxlLnYxLm1kXG4gKiAtIEFXUyBBcmNoaXRlY3R1cmU6IC5raXJvL3NwZWNzL2FyY2hpdGVjdHVyZS5hd3MudjEubWRcbiAqL1xuXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgbGFtYmRhTm9kZWpzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEtbm9kZWpzJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIGNvZ25pdG8gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZ25pdG8nO1xuaW1wb3J0ICogYXMgbG9ncyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbG9ncyc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuLyoqXG4gKiBVc2VyIFByb2ZpbGUgU2VydmljZSBjb25maWd1cmF0aW9uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVXNlclByb2ZpbGVTZXJ2aWNlUHJvcHMge1xuICBlbnZpcm9ubWVudDogc3RyaW5nO1xuICBhcGk6IGFwaWdhdGV3YXkuUmVzdEFwaTtcbiAgYXV0aG9yaXplcjogYXBpZ2F0ZXdheS5Db2duaXRvVXNlclBvb2xzQXV0aG9yaXplcjtcbiAgbWFpblRhYmxlOiBkeW5hbW9kYi5UYWJsZTtcbn1cblxuLyoqXG4gKiBVc2VyIFByb2ZpbGUgU2VydmljZSBjb25zdHJ1Y3RcbiAqIFxuICogQ3JlYXRlcyBMYW1iZGEgZnVuY3Rpb25zIGZvciB1c2VyIHByb2ZpbGUgb3BlcmF0aW9ucyBhbmQgaW50ZWdyYXRlcyB0aGVtXG4gKiB3aXRoIHRoZSBleGlzdGluZyBBUEkgR2F0ZXdheSBhbmQgRHluYW1vREIgaW5mcmFzdHJ1Y3R1cmUuXG4gKi9cbmV4cG9ydCBjbGFzcyBVc2VyUHJvZmlsZVNlcnZpY2VDb25zdHJ1Y3QgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBwdWJsaWMgcmVhZG9ubHkgZ2V0Q3VycmVudFVzZXJGdW5jdGlvbjogbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uO1xuICBwdWJsaWMgcmVhZG9ubHkgZ2V0VXNlckJ5SWRGdW5jdGlvbjogbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uO1xuICBwdWJsaWMgcmVhZG9ubHkgdXBkYXRlVXNlckZ1bmN0aW9uOiBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb247XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IFVzZXJQcm9maWxlU2VydmljZVByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIC8vIENvbW1vbiBMYW1iZGEgY29uZmlndXJhdGlvblxuICAgIGNvbnN0IGNvbW1vbkxhbWJkYVByb3BzID0ge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzI0X1gsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICBtZW1vcnlTaXplOiAyNTYsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy5tYWluVGFibGUudGFibGVOYW1lLFxuICAgICAgICBFTlZJUk9OTUVOVDogcHJvcHMuZW52aXJvbm1lbnQsXG4gICAgICB9LFxuICAgICAgbG9nUmV0ZW50aW9uOiBwcm9wcy5lbnZpcm9ubWVudCA9PT0gJ3Byb2R1Y3Rpb24nIFxuICAgICAgICA/IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfTU9OVEggXG4gICAgICAgIDogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9XRUVLLFxuICAgIH07XG5cbiAgICAvLyBMYW1iZGEgZnVuY3Rpb24gZm9yIEdFVCAvdXNlcnMvbWVcbiAgICB0aGlzLmdldEN1cnJlbnRVc2VyRnVuY3Rpb24gPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdHZXRDdXJyZW50VXNlckZ1bmN0aW9uJywge1xuICAgICAgLi4uY29tbW9uTGFtYmRhUHJvcHMsXG4gICAgICBmdW5jdGlvbk5hbWU6IGBzeWRuZXktY3ljbGVzLWdldC1jdXJyZW50LXVzZXItJHtwcm9wcy5lbnZpcm9ubWVudH1gLFxuICAgICAgZGVzY3JpcHRpb246ICdHZXQgY3VycmVudCB1c2VyIHByb2ZpbGUgd2l0aCBsYXp5IGNyZWF0aW9uJyxcbiAgICAgIGVudHJ5OiAnc2VydmljZXMvdXNlci1wcm9maWxlL2hhbmRsZXJzL2dldC1jdXJyZW50LXVzZXIudHMnLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gTGFtYmRhIGZ1bmN0aW9uIGZvciBHRVQgL3VzZXJzL3tpZH1cbiAgICB0aGlzLmdldFVzZXJCeUlkRnVuY3Rpb24gPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdHZXRVc2VyQnlJZEZ1bmN0aW9uJywge1xuICAgICAgLi4uY29tbW9uTGFtYmRhUHJvcHMsXG4gICAgICBmdW5jdGlvbk5hbWU6IGBzeWRuZXktY3ljbGVzLWdldC11c2VyLWJ5LWlkLSR7cHJvcHMuZW52aXJvbm1lbnR9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnR2V0IHVzZXIgcHJvZmlsZSBieSBJRCAoU2l0ZUFkbWluIG9ubHkpJyxcbiAgICAgIGVudHJ5OiAnc2VydmljZXMvdXNlci1wcm9maWxlL2hhbmRsZXJzL2dldC11c2VyLWJ5LWlkLnRzJyxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIExhbWJkYSBmdW5jdGlvbiBmb3IgUFVUIC91c2Vycy97aWR9XG4gICAgdGhpcy51cGRhdGVVc2VyRnVuY3Rpb24gPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdVcGRhdGVVc2VyRnVuY3Rpb24nLCB7XG4gICAgICAuLi5jb21tb25MYW1iZGFQcm9wcyxcbiAgICAgIGZ1bmN0aW9uTmFtZTogYHN5ZG5leS1jeWNsZXMtdXBkYXRlLXVzZXItJHtwcm9wcy5lbnZpcm9ubWVudH1gLFxuICAgICAgZGVzY3JpcHRpb246ICdVcGRhdGUgdXNlciBwcm9maWxlIHdpdGggYXV0aG9yaXphdGlvbicsXG4gICAgICBlbnRyeTogJ3NlcnZpY2VzL3VzZXItcHJvZmlsZS9oYW5kbGVycy91cGRhdGUtdXNlci50cycsXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcicsXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBHcmFudCBEeW5hbW9EQiBwZXJtaXNzaW9ucyB0byBMYW1iZGEgZnVuY3Rpb25zXG4gICAgcHJvcHMubWFpblRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YSh0aGlzLmdldEN1cnJlbnRVc2VyRnVuY3Rpb24pO1xuICAgIHByb3BzLm1haW5UYWJsZS5ncmFudFJlYWRXcml0ZURhdGEodGhpcy5nZXRVc2VyQnlJZEZ1bmN0aW9uKTtcbiAgICBwcm9wcy5tYWluVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKHRoaXMudXBkYXRlVXNlckZ1bmN0aW9uKTtcblxuICAgIC8vIEFQSSBHYXRld2F5IGludGVncmF0aW9uXG4gICAgdGhpcy5zZXR1cEFwaUdhdGV3YXlJbnRlZ3JhdGlvbihwcm9wcyk7XG5cbiAgICAvLyBUYWdzIGZvciByZXNvdXJjZSBtYW5hZ2VtZW50XG4gICAgY2RrLlRhZ3Mub2YodGhpcy5nZXRDdXJyZW50VXNlckZ1bmN0aW9uKS5hZGQoJ0NvbXBvbmVudCcsICdVc2VyUHJvZmlsZVNlcnZpY2UnKTtcbiAgICBjZGsuVGFncy5vZih0aGlzLmdldEN1cnJlbnRVc2VyRnVuY3Rpb24pLmFkZCgnUGhhc2UnLCAnMS4yLVVzZXJQcm9maWxlJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcy5nZXRVc2VyQnlJZEZ1bmN0aW9uKS5hZGQoJ0NvbXBvbmVudCcsICdVc2VyUHJvZmlsZVNlcnZpY2UnKTtcbiAgICBjZGsuVGFncy5vZih0aGlzLmdldFVzZXJCeUlkRnVuY3Rpb24pLmFkZCgnUGhhc2UnLCAnMS4yLVVzZXJQcm9maWxlJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcy51cGRhdGVVc2VyRnVuY3Rpb24pLmFkZCgnQ29tcG9uZW50JywgJ1VzZXJQcm9maWxlU2VydmljZScpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMudXBkYXRlVXNlckZ1bmN0aW9uKS5hZGQoJ1BoYXNlJywgJzEuMi1Vc2VyUHJvZmlsZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB1cCBBUEkgR2F0ZXdheSBpbnRlZ3JhdGlvbiBmb3IgdXNlciBwcm9maWxlIGVuZHBvaW50c1xuICAgKi9cbiAgcHJpdmF0ZSBzZXR1cEFwaUdhdGV3YXlJbnRlZ3JhdGlvbihwcm9wczogVXNlclByb2ZpbGVTZXJ2aWNlUHJvcHMpOiB2b2lkIHtcbiAgICAvLyBHZXQgdGhlIHYxIHJlc291cmNlIChzaG91bGQgZXhpc3QgZnJvbSBQaGFzZSAxLjEpXG4gICAgY29uc3QgdjFSZXNvdXJjZSA9IHByb3BzLmFwaS5yb290LmdldFJlc291cmNlKCd2MScpO1xuICAgIGlmICghdjFSZXNvdXJjZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCd2MSBBUEkgcmVzb3VyY2Ugbm90IGZvdW5kIC0gZW5zdXJlIFBoYXNlIDEuMSBpbmZyYXN0cnVjdHVyZSBpcyBkZXBsb3llZCcpO1xuICAgIH1cblxuICAgIC8vIEdldCBvciBjcmVhdGUgdGhlIHVzZXJzIHJlc291cmNlXG4gICAgbGV0IHVzZXJzUmVzb3VyY2UgPSB2MVJlc291cmNlLmdldFJlc291cmNlKCd1c2VycycpO1xuICAgIGlmICghdXNlcnNSZXNvdXJjZSkge1xuICAgICAgdXNlcnNSZXNvdXJjZSA9IHYxUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3VzZXJzJyk7XG4gICAgfVxuXG4gICAgLy8gR0VUIC91c2Vycy9tZSBlbmRwb2ludFxuICAgIGxldCBtZVJlc291cmNlID0gdXNlcnNSZXNvdXJjZS5nZXRSZXNvdXJjZSgnbWUnKTtcbiAgICBpZiAoIW1lUmVzb3VyY2UpIHtcbiAgICAgIG1lUmVzb3VyY2UgPSB1c2Vyc1Jlc291cmNlLmFkZFJlc291cmNlKCdtZScpO1xuICAgIH1cbiAgICBtZVJlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odGhpcy5nZXRDdXJyZW50VXNlckZ1bmN0aW9uKSwge1xuICAgICAgICBhdXRob3JpemVyOiBwcm9wcy5hdXRob3JpemVyLFxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgICBtZXRob2RSZXNwb25zZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdGF0dXNDb2RlOiAnMjAwJyxcbiAgICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzogYXBpZ2F0ZXdheS5Nb2RlbC5FTVBUWV9NT0RFTCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdGF0dXNDb2RlOiAnNDAxJyxcbiAgICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzogYXBpZ2F0ZXdheS5Nb2RlbC5FUlJPUl9NT0RFTCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdGF0dXNDb2RlOiAnNTAwJyxcbiAgICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzogYXBpZ2F0ZXdheS5Nb2RlbC5FUlJPUl9NT0RFTCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pO1xuXG4gICAgLy8gR0VUIC91c2Vycy97aWR9IGVuZHBvaW50ICBcbiAgICBsZXQgdXNlcklkUmVzb3VyY2UgPSB1c2Vyc1Jlc291cmNlLmdldFJlc291cmNlKCd7aWR9Jyk7XG4gICAgaWYgKCF1c2VySWRSZXNvdXJjZSkge1xuICAgICAgdXNlcklkUmVzb3VyY2UgPSB1c2Vyc1Jlc291cmNlLmFkZFJlc291cmNlKCd7aWR9Jyk7XG4gICAgfVxuICAgIFxuICAgIHVzZXJJZFJlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odGhpcy5nZXRVc2VyQnlJZEZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogcHJvcHMuYXV0aG9yaXplcixcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXG4gICAgICByZXF1ZXN0UGFyYW1ldGVyczoge1xuICAgICAgICAnbWV0aG9kLnJlcXVlc3QucGF0aC5pZCc6IHRydWUsXG4gICAgICB9LFxuICAgICAgbWV0aG9kUmVzcG9uc2VzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnMjAwJyxcbiAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVNUFRZX01PREVMLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnNDAxJyxcbiAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVSUk9SX01PREVMLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnNDAzJyxcbiAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVSUk9SX01PREVMLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnNDA0JyxcbiAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVSUk9SX01PREVMLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnNTAwJyxcbiAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVSUk9SX01PREVMLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gUFVUIC91c2Vycy97aWR9IGVuZHBvaW50XG4gICAgdXNlcklkUmVzb3VyY2UuYWRkTWV0aG9kKCdQVVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih0aGlzLnVwZGF0ZVVzZXJGdW5jdGlvbiksIHtcbiAgICAgICAgYXV0aG9yaXplcjogcHJvcHMuYXV0aG9yaXplcixcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcbiAgICAgICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAnbWV0aG9kLnJlcXVlc3QucGF0aC5pZCc6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVlc3RNb2RlbHM6IHtcbiAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IGFwaWdhdGV3YXkuTW9kZWwuRU1QVFlfTU9ERUwsIC8vIFdpbGwgYmUgdmFsaWRhdGVkIGluIExhbWJkYVxuICAgICAgICB9LFxuICAgICAgICBtZXRob2RSZXNwb25zZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdGF0dXNDb2RlOiAnMjAwJyxcbiAgICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzogYXBpZ2F0ZXdheS5Nb2RlbC5FTVBUWV9NT0RFTCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdGF0dXNDb2RlOiAnNDAwJyxcbiAgICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzogYXBpZ2F0ZXdheS5Nb2RlbC5FUlJPUl9NT0RFTCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdGF0dXNDb2RlOiAnNDAxJyxcbiAgICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzogYXBpZ2F0ZXdheS5Nb2RlbC5FUlJPUl9NT0RFTCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdGF0dXNDb2RlOiAnNDAzJyxcbiAgICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzogYXBpZ2F0ZXdheS5Nb2RlbC5FUlJPUl9NT0RFTCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdGF0dXNDb2RlOiAnNDA0JyxcbiAgICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzogYXBpZ2F0ZXdheS5Nb2RlbC5FUlJPUl9NT0RFTCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdGF0dXNDb2RlOiAnNTAwJyxcbiAgICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzogYXBpZ2F0ZXdheS5Nb2RlbC5FUlJPUl9NT0RFTCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pO1xuICB9XG59Il19