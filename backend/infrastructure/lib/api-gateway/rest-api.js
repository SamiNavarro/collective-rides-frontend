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
exports.RestApiConstruct = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const constructs_1 = require("constructs");
/**
 * API Gateway REST API Construct - Phase 1.1
 *
 * Creates and configures AWS API Gateway REST API for HTTP API layer
 * according to the canonical AWS architecture specification.
 *
 * Features:
 * - REST API with proper CORS configuration
 * - Health check endpoint for monitoring
 * - JWT authorizer integration (ready for Phase 1.2)
 * - CloudWatch logging and monitoring
 * - Request/response validation
 * - WAF integration for production security
 *
 * Compliance:
 * - AWS Architecture: .kiro/specs/architecture.aws.v1.md
 * - Implementation Plan: .kiro/specs/implementation.v1.md (Phase 1.1)
 */
class RestApiConstruct extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        // CloudWatch log group for API Gateway logs
        const logGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
            logGroupName: `/aws/apigateway/sydney-cycles-${props.environment}`,
            retention: props.environment === 'production'
                ? logs.RetentionDays.ONE_MONTH
                : logs.RetentionDays.ONE_WEEK,
            removalPolicy: props.environment === 'production'
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
        });
        // REST API configuration
        this.api = new apigateway.RestApi(this, 'SydneyCyclesRestApi', {
            restApiName: `sydney-cycles-api-${props.environment}`,
            description: `Sydney Cycling Platform v1 REST API - ${props.environment}`,
            // API Gateway configuration
            endpointConfiguration: {
                types: [apigateway.EndpointType.REGIONAL],
            },
            // CloudWatch logging
            cloudWatchRole: true,
            deployOptions: {
                stageName: props.environment,
                loggingLevel: apigateway.MethodLoggingLevel.INFO,
                dataTraceEnabled: props.environment !== 'production',
                metricsEnabled: true,
                accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
                accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
                    caller: true,
                    httpMethod: true,
                    ip: true,
                    protocol: true,
                    requestTime: true,
                    resourcePath: true,
                    responseLength: true,
                    status: true,
                    user: true,
                }),
            },
            // CORS configuration for frontend integration
            defaultCorsPreflightOptions: {
                allowOrigins: props.environment === 'production'
                    ? [
                        'https://sydneycycles.com',
                        'https://collective-rides-frontend.vercel.app',
                        'https://collective-rides-frontend-atwt32j7j.vercel.app',
                        'https://collectiverides.com' // Custom domain (if configured)
                    ]
                    : [
                        'http://localhost:3000',
                        'http://127.0.0.1:3000',
                        'https://collective-rides-frontend.vercel.app',
                        'https://collective-rides-frontend-atwt32j7j.vercel.app', // Vercel preview
                    ],
                allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowHeaders: [
                    'Content-Type',
                    'X-Amz-Date',
                    'Authorization',
                    'X-Api-Key',
                    'X-Amz-Security-Token',
                    'X-Amz-User-Agent',
                ],
                allowCredentials: true,
                maxAge: cdk.Duration.hours(1),
            },
            // Binary media types
            binaryMediaTypes: ['image/*', 'application/pdf'],
            // Minimum compression size
            minimumCompressionSize: 1024,
            // API key configuration (for future rate limiting)
            apiKeySourceType: apigateway.ApiKeySourceType.HEADER,
            // Removal policy
            policy: undefined, // Will be configured with resource policies if needed
        });
        // Cognito User Pool Authorizer for JWT validation
        this.authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
            cognitoUserPools: [props.userPool],
            authorizerName: `sydney-cycles-authorizer-${props.environment}`,
            identitySource: 'method.request.header.Authorization',
            resultsCacheTtl: cdk.Duration.minutes(5), // Cache authorization results
        });
        // Health check endpoint (no authorization required)
        this.createHealthCheckEndpoint();
        // API resource structure preparation for future phases
        this.createApiResourceStructure();
        // Request/Response models for validation
        this.createApiModels();
        // Usage plan for rate limiting (production)
        if (props.environment === 'production') {
            this.createUsagePlan();
        }
        // WAF integration for production security
        if (props.enableWaf && props.environment === 'production') {
            this.configureWaf();
        }
        // Tags for resource management
        cdk.Tags.of(this.api).add('Component', 'ApiLayer');
        cdk.Tags.of(this.api).add('Phase', '1.1-Infrastructure');
    }
    /**
     * Creates a health check endpoint for monitoring
     */
    createHealthCheckEndpoint() {
        // Simple health check Lambda function
        const healthCheckFunction = new lambda.Function(this, 'HealthCheckFunction', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          const response = {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              status: 'healthy',
              timestamp: new Date().toISOString(),
              version: '1.0.0',
              phase: '1.1-Infrastructure-Foundation',
              environment: process.env.ENVIRONMENT || 'development',
            }),
          };
          return response;
        };
      `),
            environment: {
                ENVIRONMENT: this.node.tryGetContext('environment') || 'development',
            },
            timeout: cdk.Duration.seconds(10),
            memorySize: 128,
        });
        // Health endpoint
        const healthResource = this.api.root.addResource('health');
        healthResource.addMethod('GET', new apigateway.LambdaIntegration(healthCheckFunction), {
            methodResponses: [{
                    statusCode: '200',
                    responseModels: {
                        'application/json': apigateway.Model.EMPTY_MODEL,
                    },
                }],
        });
        // Tags for the health check function
        cdk.Tags.of(healthCheckFunction).add('Component', 'HealthCheck');
        cdk.Tags.of(healthCheckFunction).add('Phase', '1.1-Infrastructure');
    }
    /**
     * Creates API resource structure for future phases
     */
    createApiResourceStructure() {
        // API v1 resource
        const v1Resource = this.api.root.addResource('v1');
        // Note: Individual services will create their own resource structures
        // This ensures no conflicts and allows services to manage their own API paths
    }
    /**
     * Creates API models for request/response validation
     */
    createApiModels() {
        // Error response model
        this.api.addModel('ErrorModel', {
            contentType: 'application/json',
            modelName: 'ErrorModel',
            schema: {
                schema: apigateway.JsonSchemaVersion.DRAFT4,
                type: apigateway.JsonSchemaType.OBJECT,
                properties: {
                    error: {
                        type: apigateway.JsonSchemaType.STRING,
                    },
                    message: {
                        type: apigateway.JsonSchemaType.STRING,
                    },
                    timestamp: {
                        type: apigateway.JsonSchemaType.STRING,
                    },
                },
                required: ['error', 'message'],
            },
        });
        // Success response model
        this.api.addModel('SuccessModel', {
            contentType: 'application/json',
            modelName: 'SuccessModel',
            schema: {
                schema: apigateway.JsonSchemaVersion.DRAFT4,
                type: apigateway.JsonSchemaType.OBJECT,
                properties: {
                    success: {
                        type: apigateway.JsonSchemaType.BOOLEAN,
                    },
                    data: {
                        type: apigateway.JsonSchemaType.OBJECT,
                    },
                    timestamp: {
                        type: apigateway.JsonSchemaType.STRING,
                    },
                },
                required: ['success'],
            },
        });
    }
    /**
     * Creates usage plan for rate limiting in production
     */
    createUsagePlan() {
        const usagePlan = this.api.addUsagePlan('DefaultUsagePlan', {
            name: 'sydney-cycles-usage-plan',
            description: 'Default usage plan for Sydney Cycles API',
            throttle: {
                rateLimit: 1000,
                burstLimit: 2000, // burst capacity
            },
            quota: {
                limit: 100000,
                period: apigateway.Period.MONTH,
            },
        });
        // Associate with API stage
        usagePlan.addApiStage({
            stage: this.api.deploymentStage,
        });
    }
    /**
     * Configures WAF for production security
     */
    configureWaf() {
        // WAF configuration will be implemented when needed
        // This is a placeholder for future security enhancements
        // Common WAF rules to implement:
        // - Rate limiting
        // - IP whitelisting/blacklisting
        // - SQL injection protection
        // - XSS protection
        // - Geographic restrictions
    }
}
exports.RestApiConstruct = RestApiConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzdC1hcGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZXN0LWFwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1RUFBeUQ7QUFFekQsK0RBQWlEO0FBQ2pELDJEQUE2QztBQUM3QywyQ0FBdUM7QUFjdkM7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHO0FBQ0gsTUFBYSxnQkFBaUIsU0FBUSxzQkFBUztJQUk3QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTRCO1FBQ3BFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsNENBQTRDO1FBQzVDLE1BQU0sUUFBUSxHQUFHLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUU7WUFDN0QsWUFBWSxFQUFFLGlDQUFpQyxLQUFLLENBQUMsV0FBVyxFQUFFO1lBQ2xFLFNBQVMsRUFBRSxLQUFLLENBQUMsV0FBVyxLQUFLLFlBQVk7Z0JBQzNDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVM7Z0JBQzlCLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVE7WUFDL0IsYUFBYSxFQUFFLEtBQUssQ0FBQyxXQUFXLEtBQUssWUFBWTtnQkFDL0MsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsTUFBTTtnQkFDMUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztTQUM5QixDQUFDLENBQUM7UUFFSCx5QkFBeUI7UUFDekIsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFFO1lBQzdELFdBQVcsRUFBRSxxQkFBcUIsS0FBSyxDQUFDLFdBQVcsRUFBRTtZQUNyRCxXQUFXLEVBQUUseUNBQXlDLEtBQUssQ0FBQyxXQUFXLEVBQUU7WUFFekUsNEJBQTRCO1lB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QTJCO1FBQzNCLFNBQVMsQ0FBQyxXQUFXLENBQUM7WUFDcEIsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsZUFBZTtTQUNoQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7O09BRUc7SUFDSyxZQUFZO1FBQ2xCLG9EQUFvRDtRQUNwRCx5REFBeUQ7UUFFekQsaUNBQWlDO1FBQ2pDLGtCQUFrQjtRQUNsQixpQ0FBaUM7UUFDakMsNkJBQTZCO1FBQzdCLG1CQUFtQjtRQUNuQiw0QkFBNEI7SUFDOUIsQ0FBQztDQUNGO0FBN1FELDRDQTZRQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIGNvZ25pdG8gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZ25pdG8nO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgbG9ncyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbG9ncyc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuLyoqXG4gKiBBUEkgR2F0ZXdheSBSRVNUIEFQSSBDb25maWd1cmF0aW9uXG4gKiBcbiAqIEludGVyZmFjZSBmb3IgY29uZmlndXJpbmcgdGhlIFJFU1QgQVBJIGNvbnN0cnVjdCBiYXNlZCBvbiBlbnZpcm9ubWVudFxuICogYW5kIHNlY3VyaXR5IHJlcXVpcmVtZW50cy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSZXN0QXBpQ29uc3RydWN0UHJvcHMge1xuICBlbnZpcm9ubWVudDogc3RyaW5nO1xuICB1c2VyUG9vbDogY29nbml0by5Vc2VyUG9vbDtcbiAgZW5hYmxlV2FmPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBBUEkgR2F0ZXdheSBSRVNUIEFQSSBDb25zdHJ1Y3QgLSBQaGFzZSAxLjFcbiAqIFxuICogQ3JlYXRlcyBhbmQgY29uZmlndXJlcyBBV1MgQVBJIEdhdGV3YXkgUkVTVCBBUEkgZm9yIEhUVFAgQVBJIGxheWVyXG4gKiBhY2NvcmRpbmcgdG8gdGhlIGNhbm9uaWNhbCBBV1MgYXJjaGl0ZWN0dXJlIHNwZWNpZmljYXRpb24uXG4gKiBcbiAqIEZlYXR1cmVzOlxuICogLSBSRVNUIEFQSSB3aXRoIHByb3BlciBDT1JTIGNvbmZpZ3VyYXRpb25cbiAqIC0gSGVhbHRoIGNoZWNrIGVuZHBvaW50IGZvciBtb25pdG9yaW5nXG4gKiAtIEpXVCBhdXRob3JpemVyIGludGVncmF0aW9uIChyZWFkeSBmb3IgUGhhc2UgMS4yKVxuICogLSBDbG91ZFdhdGNoIGxvZ2dpbmcgYW5kIG1vbml0b3JpbmdcbiAqIC0gUmVxdWVzdC9yZXNwb25zZSB2YWxpZGF0aW9uXG4gKiAtIFdBRiBpbnRlZ3JhdGlvbiBmb3IgcHJvZHVjdGlvbiBzZWN1cml0eVxuICogXG4gKiBDb21wbGlhbmNlOlxuICogLSBBV1MgQXJjaGl0ZWN0dXJlOiAua2lyby9zcGVjcy9hcmNoaXRlY3R1cmUuYXdzLnYxLm1kXG4gKiAtIEltcGxlbWVudGF0aW9uIFBsYW46IC5raXJvL3NwZWNzL2ltcGxlbWVudGF0aW9uLnYxLm1kIChQaGFzZSAxLjEpXG4gKi9cbmV4cG9ydCBjbGFzcyBSZXN0QXBpQ29uc3RydWN0IGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgcHVibGljIHJlYWRvbmx5IGFwaTogYXBpZ2F0ZXdheS5SZXN0QXBpO1xuICBwdWJsaWMgcmVhZG9ubHkgYXV0aG9yaXplcjogYXBpZ2F0ZXdheS5Db2duaXRvVXNlclBvb2xzQXV0aG9yaXplcjtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogUmVzdEFwaUNvbnN0cnVjdFByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIC8vIENsb3VkV2F0Y2ggbG9nIGdyb3VwIGZvciBBUEkgR2F0ZXdheSBsb2dzXG4gICAgY29uc3QgbG9nR3JvdXAgPSBuZXcgbG9ncy5Mb2dHcm91cCh0aGlzLCAnQXBpR2F0ZXdheUxvZ0dyb3VwJywge1xuICAgICAgbG9nR3JvdXBOYW1lOiBgL2F3cy9hcGlnYXRld2F5L3N5ZG5leS1jeWNsZXMtJHtwcm9wcy5lbnZpcm9ubWVudH1gLFxuICAgICAgcmV0ZW50aW9uOiBwcm9wcy5lbnZpcm9ubWVudCA9PT0gJ3Byb2R1Y3Rpb24nIFxuICAgICAgICA/IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfTU9OVEggXG4gICAgICAgIDogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9XRUVLLFxuICAgICAgcmVtb3ZhbFBvbGljeTogcHJvcHMuZW52aXJvbm1lbnQgPT09ICdwcm9kdWN0aW9uJyBcbiAgICAgICAgPyBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4gXG4gICAgICAgIDogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICB9KTtcblxuICAgIC8vIFJFU1QgQVBJIGNvbmZpZ3VyYXRpb25cbiAgICB0aGlzLmFwaSA9IG5ldyBhcGlnYXRld2F5LlJlc3RBcGkodGhpcywgJ1N5ZG5leUN5Y2xlc1Jlc3RBcGknLCB7XG4gICAgICByZXN0QXBpTmFtZTogYHN5ZG5leS1jeWNsZXMtYXBpLSR7cHJvcHMuZW52aXJvbm1lbnR9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiBgU3lkbmV5IEN5Y2xpbmcgUGxhdGZvcm0gdjEgUkVTVCBBUEkgLSAke3Byb3BzLmVudmlyb25tZW50fWAsXG4gICAgICBcbiAgICAgIC8vIEFQSSBHYXRld2F5IGNvbmZpZ3VyYXRpb25cbiAgICAgIGVuZHBvaW50Q29uZmlndXJhdGlvbjoge1xuICAgICAgICB0eXBlczogW2FwaWdhdGV3YXkuRW5kcG9pbnRUeXBlLlJFR0lPTkFMXSxcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vIENsb3VkV2F0Y2ggbG9nZ2luZ1xuICAgICAgY2xvdWRXYXRjaFJvbGU6IHRydWUsXG4gICAgICBkZXBsb3lPcHRpb25zOiB7XG4gICAgICAgIHN0YWdlTmFtZTogcHJvcHMuZW52aXJvbm1lbnQsXG4gICAgICAgIGxvZ2dpbmdMZXZlbDogYXBpZ2F0ZXdheS5NZXRob2RMb2dnaW5nTGV2ZWwuSU5GTyxcbiAgICAgICAgZGF0YVRyYWNlRW5hYmxlZDogcHJvcHMuZW52aXJvbm1lbnQgIT09ICdwcm9kdWN0aW9uJywgLy8gRGlzYWJsZSBpbiBwcm9kIGZvciBzZWN1cml0eVxuICAgICAgICBtZXRyaWNzRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgYWNjZXNzTG9nRGVzdGluYXRpb246IG5ldyBhcGlnYXRld2F5LkxvZ0dyb3VwTG9nRGVzdGluYXRpb24obG9nR3JvdXApLFxuICAgICAgICBhY2Nlc3NMb2dGb3JtYXQ6IGFwaWdhdGV3YXkuQWNjZXNzTG9nRm9ybWF0Lmpzb25XaXRoU3RhbmRhcmRGaWVsZHMoe1xuICAgICAgICAgIGNhbGxlcjogdHJ1ZSxcbiAgICAgICAgICBodHRwTWV0aG9kOiB0cnVlLFxuICAgICAgICAgIGlwOiB0cnVlLFxuICAgICAgICAgIHByb3RvY29sOiB0cnVlLFxuICAgICAgICAgIHJlcXVlc3RUaW1lOiB0cnVlLFxuICAgICAgICAgIHJlc291cmNlUGF0aDogdHJ1ZSxcbiAgICAgICAgICByZXNwb25zZUxlbmd0aDogdHJ1ZSxcbiAgICAgICAgICBzdGF0dXM6IHRydWUsXG4gICAgICAgICAgdXNlcjogdHJ1ZSxcbiAgICAgICAgfSksXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBDT1JTIGNvbmZpZ3VyYXRpb24gZm9yIGZyb250ZW5kIGludGVncmF0aW9uXG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBwcm9wcy5lbnZpcm9ubWVudCA9PT0gJ3Byb2R1Y3Rpb24nIFxuICAgICAgICAgID8gW1xuICAgICAgICAgICAgICAnaHR0cHM6Ly9zeWRuZXljeWNsZXMuY29tJywgLy8gUHJvZHVjdGlvbiBkb21haW5cbiAgICAgICAgICAgICAgJ2h0dHBzOi8vY29sbGVjdGl2ZS1yaWRlcy1mcm9udGVuZC52ZXJjZWwuYXBwJywgLy8gVmVyY2VsIHByb2R1Y3Rpb25cbiAgICAgICAgICAgICAgJ2h0dHBzOi8vY29sbGVjdGl2ZS1yaWRlcy1mcm9udGVuZC1hdHd0MzJqN2oudmVyY2VsLmFwcCcsIC8vIFZlcmNlbCBwcmV2aWV3XG4gICAgICAgICAgICAgICdodHRwczovL2NvbGxlY3RpdmVyaWRlcy5jb20nIC8vIEN1c3RvbSBkb21haW4gKGlmIGNvbmZpZ3VyZWQpXG4gICAgICAgICAgICBdXG4gICAgICAgICAgOiBbXG4gICAgICAgICAgICAgICdodHRwOi8vbG9jYWxob3N0OjMwMDAnLCBcbiAgICAgICAgICAgICAgJ2h0dHA6Ly8xMjcuMC4wLjE6MzAwMCcsXG4gICAgICAgICAgICAgICdodHRwczovL2NvbGxlY3RpdmUtcmlkZXMtZnJvbnRlbmQudmVyY2VsLmFwcCcsIC8vIFZlcmNlbCBwcm9kdWN0aW9uXG4gICAgICAgICAgICAgICdodHRwczovL2NvbGxlY3RpdmUtcmlkZXMtZnJvbnRlbmQtYXR3dDMyajdqLnZlcmNlbC5hcHAnLCAvLyBWZXJjZWwgcHJldmlld1xuICAgICAgICAgICAgXSwgLy8gRGV2ZWxvcG1lbnRcbiAgICAgICAgYWxsb3dNZXRob2RzOiBbJ0dFVCcsICdQT1NUJywgJ1BVVCcsICdERUxFVEUnLCAnT1BUSU9OUyddLFxuICAgICAgICBhbGxvd0hlYWRlcnM6IFtcbiAgICAgICAgICAnQ29udGVudC1UeXBlJyxcbiAgICAgICAgICAnWC1BbXotRGF0ZScsXG4gICAgICAgICAgJ0F1dGhvcml6YXRpb24nLFxuICAgICAgICAgICdYLUFwaS1LZXknLFxuICAgICAgICAgICdYLUFtei1TZWN1cml0eS1Ub2tlbicsXG4gICAgICAgICAgJ1gtQW16LVVzZXItQWdlbnQnLFxuICAgICAgICBdLFxuICAgICAgICBhbGxvd0NyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICBtYXhBZ2U6IGNkay5EdXJhdGlvbi5ob3VycygxKSxcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vIEJpbmFyeSBtZWRpYSB0eXBlc1xuICAgICAgYmluYXJ5TWVkaWFUeXBlczogWydpbWFnZS8qJywgJ2FwcGxpY2F0aW9uL3BkZiddLFxuICAgICAgXG4gICAgICAvLyBNaW5pbXVtIGNvbXByZXNzaW9uIHNpemVcbiAgICAgIG1pbmltdW1Db21wcmVzc2lvblNpemU6IDEwMjQsXG4gICAgICBcbiAgICAgIC8vIEFQSSBrZXkgY29uZmlndXJhdGlvbiAoZm9yIGZ1dHVyZSByYXRlIGxpbWl0aW5nKVxuICAgICAgYXBpS2V5U291cmNlVHlwZTogYXBpZ2F0ZXdheS5BcGlLZXlTb3VyY2VUeXBlLkhFQURFUixcbiAgICAgIFxuICAgICAgLy8gUmVtb3ZhbCBwb2xpY3lcbiAgICAgIHBvbGljeTogdW5kZWZpbmVkLCAvLyBXaWxsIGJlIGNvbmZpZ3VyZWQgd2l0aCByZXNvdXJjZSBwb2xpY2llcyBpZiBuZWVkZWRcbiAgICB9KTtcblxuICAgIC8vIENvZ25pdG8gVXNlciBQb29sIEF1dGhvcml6ZXIgZm9yIEpXVCB2YWxpZGF0aW9uXG4gICAgdGhpcy5hdXRob3JpemVyID0gbmV3IGFwaWdhdGV3YXkuQ29nbml0b1VzZXJQb29sc0F1dGhvcml6ZXIodGhpcywgJ0NvZ25pdG9BdXRob3JpemVyJywge1xuICAgICAgY29nbml0b1VzZXJQb29sczogW3Byb3BzLnVzZXJQb29sXSxcbiAgICAgIGF1dGhvcml6ZXJOYW1lOiBgc3lkbmV5LWN5Y2xlcy1hdXRob3JpemVyLSR7cHJvcHMuZW52aXJvbm1lbnR9YCxcbiAgICAgIGlkZW50aXR5U291cmNlOiAnbWV0aG9kLnJlcXVlc3QuaGVhZGVyLkF1dGhvcml6YXRpb24nLFxuICAgICAgcmVzdWx0c0NhY2hlVHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSwgLy8gQ2FjaGUgYXV0aG9yaXphdGlvbiByZXN1bHRzXG4gICAgfSk7XG5cbiAgICAvLyBIZWFsdGggY2hlY2sgZW5kcG9pbnQgKG5vIGF1dGhvcml6YXRpb24gcmVxdWlyZWQpXG4gICAgdGhpcy5jcmVhdGVIZWFsdGhDaGVja0VuZHBvaW50KCk7XG5cbiAgICAvLyBBUEkgcmVzb3VyY2Ugc3RydWN0dXJlIHByZXBhcmF0aW9uIGZvciBmdXR1cmUgcGhhc2VzXG4gICAgdGhpcy5jcmVhdGVBcGlSZXNvdXJjZVN0cnVjdHVyZSgpO1xuXG4gICAgLy8gUmVxdWVzdC9SZXNwb25zZSBtb2RlbHMgZm9yIHZhbGlkYXRpb25cbiAgICB0aGlzLmNyZWF0ZUFwaU1vZGVscygpO1xuXG4gICAgLy8gVXNhZ2UgcGxhbiBmb3IgcmF0ZSBsaW1pdGluZyAocHJvZHVjdGlvbilcbiAgICBpZiAocHJvcHMuZW52aXJvbm1lbnQgPT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgdGhpcy5jcmVhdGVVc2FnZVBsYW4oKTtcbiAgICB9XG5cbiAgICAvLyBXQUYgaW50ZWdyYXRpb24gZm9yIHByb2R1Y3Rpb24gc2VjdXJpdHlcbiAgICBpZiAocHJvcHMuZW5hYmxlV2FmICYmIHByb3BzLmVudmlyb25tZW50ID09PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIHRoaXMuY29uZmlndXJlV2FmKCk7XG4gICAgfVxuXG4gICAgLy8gVGFncyBmb3IgcmVzb3VyY2UgbWFuYWdlbWVudFxuICAgIGNkay5UYWdzLm9mKHRoaXMuYXBpKS5hZGQoJ0NvbXBvbmVudCcsICdBcGlMYXllcicpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMuYXBpKS5hZGQoJ1BoYXNlJywgJzEuMS1JbmZyYXN0cnVjdHVyZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBoZWFsdGggY2hlY2sgZW5kcG9pbnQgZm9yIG1vbml0b3JpbmdcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlSGVhbHRoQ2hlY2tFbmRwb2ludCgpOiB2b2lkIHtcbiAgICAvLyBTaW1wbGUgaGVhbHRoIGNoZWNrIExhbWJkYSBmdW5jdGlvblxuICAgIGNvbnN0IGhlYWx0aENoZWNrRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdIZWFsdGhDaGVja0Z1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE4X1gsXG4gICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tSW5saW5lKGBcbiAgICAgICAgZXhwb3J0cy5oYW5kbGVyID0gYXN5bmMgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSB7XG4gICAgICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICBzdGF0dXM6ICdoZWFsdGh5JyxcbiAgICAgICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICAgIHZlcnNpb246ICcxLjAuMCcsXG4gICAgICAgICAgICAgIHBoYXNlOiAnMS4xLUluZnJhc3RydWN0dXJlLUZvdW5kYXRpb24nLFxuICAgICAgICAgICAgICBlbnZpcm9ubWVudDogcHJvY2Vzcy5lbnYuRU5WSVJPTk1FTlQgfHwgJ2RldmVsb3BtZW50JyxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIH07XG4gICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICB9O1xuICAgICAgYCksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBFTlZJUk9OTUVOVDogdGhpcy5ub2RlLnRyeUdldENvbnRleHQoJ2Vudmlyb25tZW50JykgfHwgJ2RldmVsb3BtZW50JyxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgICBtZW1vcnlTaXplOiAxMjgsXG4gICAgfSk7XG5cbiAgICAvLyBIZWFsdGggZW5kcG9pbnRcbiAgICBjb25zdCBoZWFsdGhSZXNvdXJjZSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2hlYWx0aCcpO1xuICAgIGhlYWx0aFJlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oaGVhbHRoQ2hlY2tGdW5jdGlvbiksIHtcbiAgICAgIG1ldGhvZFJlc3BvbnNlczogW3tcbiAgICAgICAgc3RhdHVzQ29kZTogJzIwMCcsXG4gICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVNUFRZX01PREVMLFxuICAgICAgICB9LFxuICAgICAgfV0sXG4gICAgfSk7XG5cbiAgICAvLyBUYWdzIGZvciB0aGUgaGVhbHRoIGNoZWNrIGZ1bmN0aW9uXG4gICAgY2RrLlRhZ3Mub2YoaGVhbHRoQ2hlY2tGdW5jdGlvbikuYWRkKCdDb21wb25lbnQnLCAnSGVhbHRoQ2hlY2snKTtcbiAgICBjZGsuVGFncy5vZihoZWFsdGhDaGVja0Z1bmN0aW9uKS5hZGQoJ1BoYXNlJywgJzEuMS1JbmZyYXN0cnVjdHVyZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgQVBJIHJlc291cmNlIHN0cnVjdHVyZSBmb3IgZnV0dXJlIHBoYXNlc1xuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVBcGlSZXNvdXJjZVN0cnVjdHVyZSgpOiB2b2lkIHtcbiAgICAvLyBBUEkgdjEgcmVzb3VyY2VcbiAgICBjb25zdCB2MVJlc291cmNlID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgndjEnKTtcblxuICAgIC8vIE5vdGU6IEluZGl2aWR1YWwgc2VydmljZXMgd2lsbCBjcmVhdGUgdGhlaXIgb3duIHJlc291cmNlIHN0cnVjdHVyZXNcbiAgICAvLyBUaGlzIGVuc3VyZXMgbm8gY29uZmxpY3RzIGFuZCBhbGxvd3Mgc2VydmljZXMgdG8gbWFuYWdlIHRoZWlyIG93biBBUEkgcGF0aHNcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIEFQSSBtb2RlbHMgZm9yIHJlcXVlc3QvcmVzcG9uc2UgdmFsaWRhdGlvblxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVBcGlNb2RlbHMoKTogdm9pZCB7XG4gICAgLy8gRXJyb3IgcmVzcG9uc2UgbW9kZWxcbiAgICB0aGlzLmFwaS5hZGRNb2RlbCgnRXJyb3JNb2RlbCcsIHtcbiAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICBtb2RlbE5hbWU6ICdFcnJvck1vZGVsJyxcbiAgICAgIHNjaGVtYToge1xuICAgICAgICBzY2hlbWE6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVZlcnNpb24uRFJBRlQ0LFxuICAgICAgICB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLk9CSkVDVCxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGVycm9yOiB7XG4gICAgICAgICAgICB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIG1lc3NhZ2U6IHtcbiAgICAgICAgICAgIHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgdGltZXN0YW1wOiB7XG4gICAgICAgICAgICB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydlcnJvcicsICdtZXNzYWdlJ10sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gU3VjY2VzcyByZXNwb25zZSBtb2RlbFxuICAgIHRoaXMuYXBpLmFkZE1vZGVsKCdTdWNjZXNzTW9kZWwnLCB7XG4gICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgbW9kZWxOYW1lOiAnU3VjY2Vzc01vZGVsJyxcbiAgICAgIHNjaGVtYToge1xuICAgICAgICBzY2hlbWE6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVZlcnNpb24uRFJBRlQ0LFxuICAgICAgICB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLk9CSkVDVCxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHN1Y2Nlc3M6IHtcbiAgICAgICAgICAgIHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuQk9PTEVBTixcbiAgICAgICAgICB9LFxuICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuT0JKRUNULFxuICAgICAgICAgIH0sXG4gICAgICAgICAgdGltZXN0YW1wOiB7XG4gICAgICAgICAgICB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydzdWNjZXNzJ10sXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgdXNhZ2UgcGxhbiBmb3IgcmF0ZSBsaW1pdGluZyBpbiBwcm9kdWN0aW9uXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZVVzYWdlUGxhbigpOiB2b2lkIHtcbiAgICBjb25zdCB1c2FnZVBsYW4gPSB0aGlzLmFwaS5hZGRVc2FnZVBsYW4oJ0RlZmF1bHRVc2FnZVBsYW4nLCB7XG4gICAgICBuYW1lOiAnc3lkbmV5LWN5Y2xlcy11c2FnZS1wbGFuJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnRGVmYXVsdCB1c2FnZSBwbGFuIGZvciBTeWRuZXkgQ3ljbGVzIEFQSScsXG4gICAgICB0aHJvdHRsZToge1xuICAgICAgICByYXRlTGltaXQ6IDEwMDAsIC8vIHJlcXVlc3RzIHBlciBzZWNvbmRcbiAgICAgICAgYnVyc3RMaW1pdDogMjAwMCwgLy8gYnVyc3QgY2FwYWNpdHlcbiAgICAgIH0sXG4gICAgICBxdW90YToge1xuICAgICAgICBsaW1pdDogMTAwMDAwLCAvLyByZXF1ZXN0cyBwZXIgbW9udGhcbiAgICAgICAgcGVyaW9kOiBhcGlnYXRld2F5LlBlcmlvZC5NT05USCxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBBc3NvY2lhdGUgd2l0aCBBUEkgc3RhZ2VcbiAgICB1c2FnZVBsYW4uYWRkQXBpU3RhZ2Uoe1xuICAgICAgc3RhZ2U6IHRoaXMuYXBpLmRlcGxveW1lbnRTdGFnZSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25maWd1cmVzIFdBRiBmb3IgcHJvZHVjdGlvbiBzZWN1cml0eVxuICAgKi9cbiAgcHJpdmF0ZSBjb25maWd1cmVXYWYoKTogdm9pZCB7XG4gICAgLy8gV0FGIGNvbmZpZ3VyYXRpb24gd2lsbCBiZSBpbXBsZW1lbnRlZCB3aGVuIG5lZWRlZFxuICAgIC8vIFRoaXMgaXMgYSBwbGFjZWhvbGRlciBmb3IgZnV0dXJlIHNlY3VyaXR5IGVuaGFuY2VtZW50c1xuICAgIFxuICAgIC8vIENvbW1vbiBXQUYgcnVsZXMgdG8gaW1wbGVtZW50OlxuICAgIC8vIC0gUmF0ZSBsaW1pdGluZ1xuICAgIC8vIC0gSVAgd2hpdGVsaXN0aW5nL2JsYWNrbGlzdGluZ1xuICAgIC8vIC0gU1FMIGluamVjdGlvbiBwcm90ZWN0aW9uXG4gICAgLy8gLSBYU1MgcHJvdGVjdGlvblxuICAgIC8vIC0gR2VvZ3JhcGhpYyByZXN0cmljdGlvbnNcbiAgfVxufSJdfQ==