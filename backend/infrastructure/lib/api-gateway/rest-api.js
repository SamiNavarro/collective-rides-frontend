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
                        'https://collectiverides.com' // Custom domain (if configured)
                    ]
                    : [
                        'http://localhost:3000',
                        'http://127.0.0.1:3000',
                        'https://collective-rides-frontend.vercel.app' // Allow Vercel in development too
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzdC1hcGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZXN0LWFwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1RUFBeUQ7QUFFekQsK0RBQWlEO0FBQ2pELDJEQUE2QztBQUM3QywyQ0FBdUM7QUFjdkM7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHO0FBQ0gsTUFBYSxnQkFBaUIsU0FBUSxzQkFBUztJQUk3QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTRCO1FBQ3BFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsNENBQTRDO1FBQzVDLE1BQU0sUUFBUSxHQUFHLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUU7WUFDN0QsWUFBWSxFQUFFLGlDQUFpQyxLQUFLLENBQUMsV0FBVyxFQUFFO1lBQ2xFLFNBQVMsRUFBRSxLQUFLLENBQUMsV0FBVyxLQUFLLFlBQVk7Z0JBQzNDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVM7Z0JBQzlCLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVE7WUFDL0IsYUFBYSxFQUFFLEtBQUssQ0FBQyxXQUFXLEtBQUssWUFBWTtnQkFDL0MsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsTUFBTTtnQkFDMUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztTQUM5QixDQUFDLENBQUM7UUFFSCx5QkFBeUI7UUFDekIsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFFO1lBQzdELFdBQVcsRUFBRSxxQkFBcUIsS0FBSyxDQUFDLFdBQVcsRUFBRTtZQUNyRCxXQUFXLEVBQUUseUNBQXlDLEtBQUssQ0FBQyxXQUFXLEVBQUU7WUFFekUsNEJBQTRCO1lB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QztZQUNwQixLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxlQUFlO1NBQ2hDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7T0FFRztJQUNLLFlBQVk7UUFDbEIsb0RBQW9EO1FBQ3BELHlEQUF5RDtRQUV6RCxpQ0FBaUM7UUFDakMsa0JBQWtCO1FBQ2xCLGlDQUFpQztRQUNqQyw2QkFBNkI7UUFDN0IsbUJBQW1CO1FBQ25CLDRCQUE0QjtJQUM5QixDQUFDO0NBQ0Y7QUEzUUQsNENBMlFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xuaW1wb3J0ICogYXMgY29nbml0byBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY29nbml0byc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBsb2dzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sb2dzJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG4vKipcbiAqIEFQSSBHYXRld2F5IFJFU1QgQVBJIENvbmZpZ3VyYXRpb25cbiAqIFxuICogSW50ZXJmYWNlIGZvciBjb25maWd1cmluZyB0aGUgUkVTVCBBUEkgY29uc3RydWN0IGJhc2VkIG9uIGVudmlyb25tZW50XG4gKiBhbmQgc2VjdXJpdHkgcmVxdWlyZW1lbnRzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJlc3RBcGlDb25zdHJ1Y3RQcm9wcyB7XG4gIGVudmlyb25tZW50OiBzdHJpbmc7XG4gIHVzZXJQb29sOiBjb2duaXRvLlVzZXJQb29sO1xuICBlbmFibGVXYWY/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIEFQSSBHYXRld2F5IFJFU1QgQVBJIENvbnN0cnVjdCAtIFBoYXNlIDEuMVxuICogXG4gKiBDcmVhdGVzIGFuZCBjb25maWd1cmVzIEFXUyBBUEkgR2F0ZXdheSBSRVNUIEFQSSBmb3IgSFRUUCBBUEkgbGF5ZXJcbiAqIGFjY29yZGluZyB0byB0aGUgY2Fub25pY2FsIEFXUyBhcmNoaXRlY3R1cmUgc3BlY2lmaWNhdGlvbi5cbiAqIFxuICogRmVhdHVyZXM6XG4gKiAtIFJFU1QgQVBJIHdpdGggcHJvcGVyIENPUlMgY29uZmlndXJhdGlvblxuICogLSBIZWFsdGggY2hlY2sgZW5kcG9pbnQgZm9yIG1vbml0b3JpbmdcbiAqIC0gSldUIGF1dGhvcml6ZXIgaW50ZWdyYXRpb24gKHJlYWR5IGZvciBQaGFzZSAxLjIpXG4gKiAtIENsb3VkV2F0Y2ggbG9nZ2luZyBhbmQgbW9uaXRvcmluZ1xuICogLSBSZXF1ZXN0L3Jlc3BvbnNlIHZhbGlkYXRpb25cbiAqIC0gV0FGIGludGVncmF0aW9uIGZvciBwcm9kdWN0aW9uIHNlY3VyaXR5XG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIEFXUyBBcmNoaXRlY3R1cmU6IC5raXJvL3NwZWNzL2FyY2hpdGVjdHVyZS5hd3MudjEubWRcbiAqIC0gSW1wbGVtZW50YXRpb24gUGxhbjogLmtpcm8vc3BlY3MvaW1wbGVtZW50YXRpb24udjEubWQgKFBoYXNlIDEuMSlcbiAqL1xuZXhwb3J0IGNsYXNzIFJlc3RBcGlDb25zdHJ1Y3QgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBwdWJsaWMgcmVhZG9ubHkgYXBpOiBhcGlnYXRld2F5LlJlc3RBcGk7XG4gIHB1YmxpYyByZWFkb25seSBhdXRob3JpemVyOiBhcGlnYXRld2F5LkNvZ25pdG9Vc2VyUG9vbHNBdXRob3JpemVyO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBSZXN0QXBpQ29uc3RydWN0UHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgLy8gQ2xvdWRXYXRjaCBsb2cgZ3JvdXAgZm9yIEFQSSBHYXRld2F5IGxvZ3NcbiAgICBjb25zdCBsb2dHcm91cCA9IG5ldyBsb2dzLkxvZ0dyb3VwKHRoaXMsICdBcGlHYXRld2F5TG9nR3JvdXAnLCB7XG4gICAgICBsb2dHcm91cE5hbWU6IGAvYXdzL2FwaWdhdGV3YXkvc3lkbmV5LWN5Y2xlcy0ke3Byb3BzLmVudmlyb25tZW50fWAsXG4gICAgICByZXRlbnRpb246IHByb3BzLmVudmlyb25tZW50ID09PSAncHJvZHVjdGlvbicgXG4gICAgICAgID8gbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9NT05USCBcbiAgICAgICAgOiBsb2dzLlJldGVudGlvbkRheXMuT05FX1dFRUssXG4gICAgICByZW1vdmFsUG9saWN5OiBwcm9wcy5lbnZpcm9ubWVudCA9PT0gJ3Byb2R1Y3Rpb24nIFxuICAgICAgICA/IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTiBcbiAgICAgICAgOiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgIH0pO1xuXG4gICAgLy8gUkVTVCBBUEkgY29uZmlndXJhdGlvblxuICAgIHRoaXMuYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCAnU3lkbmV5Q3ljbGVzUmVzdEFwaScsIHtcbiAgICAgIHJlc3RBcGlOYW1lOiBgc3lkbmV5LWN5Y2xlcy1hcGktJHtwcm9wcy5lbnZpcm9ubWVudH1gLFxuICAgICAgZGVzY3JpcHRpb246IGBTeWRuZXkgQ3ljbGluZyBQbGF0Zm9ybSB2MSBSRVNUIEFQSSAtICR7cHJvcHMuZW52aXJvbm1lbnR9YCxcbiAgICAgIFxuICAgICAgLy8gQVBJIEdhdGV3YXkgY29uZmlndXJhdGlvblxuICAgICAgZW5kcG9pbnRDb25maWd1cmF0aW9uOiB7XG4gICAgICAgIHR5cGVzOiBbYXBpZ2F0ZXdheS5FbmRwb2ludFR5cGUuUkVHSU9OQUxdLFxuICAgICAgfSxcbiAgICAgIFxuICAgICAgLy8gQ2xvdWRXYXRjaCBsb2dnaW5nXG4gICAgICBjbG91ZFdhdGNoUm9sZTogdHJ1ZSxcbiAgICAgIGRlcGxveU9wdGlvbnM6IHtcbiAgICAgICAgc3RhZ2VOYW1lOiBwcm9wcy5lbnZpcm9ubWVudCxcbiAgICAgICAgbG9nZ2luZ0xldmVsOiBhcGlnYXRld2F5Lk1ldGhvZExvZ2dpbmdMZXZlbC5JTkZPLFxuICAgICAgICBkYXRhVHJhY2VFbmFibGVkOiBwcm9wcy5lbnZpcm9ubWVudCAhPT0gJ3Byb2R1Y3Rpb24nLCAvLyBEaXNhYmxlIGluIHByb2QgZm9yIHNlY3VyaXR5XG4gICAgICAgIG1ldHJpY3NFbmFibGVkOiB0cnVlLFxuICAgICAgICBhY2Nlc3NMb2dEZXN0aW5hdGlvbjogbmV3IGFwaWdhdGV3YXkuTG9nR3JvdXBMb2dEZXN0aW5hdGlvbihsb2dHcm91cCksXG4gICAgICAgIGFjY2Vzc0xvZ0Zvcm1hdDogYXBpZ2F0ZXdheS5BY2Nlc3NMb2dGb3JtYXQuanNvbldpdGhTdGFuZGFyZEZpZWxkcyh7XG4gICAgICAgICAgY2FsbGVyOiB0cnVlLFxuICAgICAgICAgIGh0dHBNZXRob2Q6IHRydWUsXG4gICAgICAgICAgaXA6IHRydWUsXG4gICAgICAgICAgcHJvdG9jb2w6IHRydWUsXG4gICAgICAgICAgcmVxdWVzdFRpbWU6IHRydWUsXG4gICAgICAgICAgcmVzb3VyY2VQYXRoOiB0cnVlLFxuICAgICAgICAgIHJlc3BvbnNlTGVuZ3RoOiB0cnVlLFxuICAgICAgICAgIHN0YXR1czogdHJ1ZSxcbiAgICAgICAgICB1c2VyOiB0cnVlLFxuICAgICAgICB9KSxcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vIENPUlMgY29uZmlndXJhdGlvbiBmb3IgZnJvbnRlbmQgaW50ZWdyYXRpb25cbiAgICAgIGRlZmF1bHRDb3JzUHJlZmxpZ2h0T3B0aW9uczoge1xuICAgICAgICBhbGxvd09yaWdpbnM6IHByb3BzLmVudmlyb25tZW50ID09PSAncHJvZHVjdGlvbicgXG4gICAgICAgICAgPyBbXG4gICAgICAgICAgICAgICdodHRwczovL3N5ZG5leWN5Y2xlcy5jb20nLCAvLyBQcm9kdWN0aW9uIGRvbWFpblxuICAgICAgICAgICAgICAnaHR0cHM6Ly9jb2xsZWN0aXZlLXJpZGVzLWZyb250ZW5kLnZlcmNlbC5hcHAnLCAvLyBWZXJjZWwgZGVwbG95bWVudFxuICAgICAgICAgICAgICAnaHR0cHM6Ly9jb2xsZWN0aXZlcmlkZXMuY29tJyAvLyBDdXN0b20gZG9tYWluIChpZiBjb25maWd1cmVkKVxuICAgICAgICAgICAgXVxuICAgICAgICAgIDogW1xuICAgICAgICAgICAgICAnaHR0cDovL2xvY2FsaG9zdDozMDAwJywgXG4gICAgICAgICAgICAgICdodHRwOi8vMTI3LjAuMC4xOjMwMDAnLFxuICAgICAgICAgICAgICAnaHR0cHM6Ly9jb2xsZWN0aXZlLXJpZGVzLWZyb250ZW5kLnZlcmNlbC5hcHAnIC8vIEFsbG93IFZlcmNlbCBpbiBkZXZlbG9wbWVudCB0b29cbiAgICAgICAgICAgIF0sIC8vIERldmVsb3BtZW50XG4gICAgICAgIGFsbG93TWV0aG9kczogWydHRVQnLCAnUE9TVCcsICdQVVQnLCAnREVMRVRFJywgJ09QVElPTlMnXSxcbiAgICAgICAgYWxsb3dIZWFkZXJzOiBbXG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZScsXG4gICAgICAgICAgJ1gtQW16LURhdGUnLFxuICAgICAgICAgICdBdXRob3JpemF0aW9uJyxcbiAgICAgICAgICAnWC1BcGktS2V5JyxcbiAgICAgICAgICAnWC1BbXotU2VjdXJpdHktVG9rZW4nLFxuICAgICAgICAgICdYLUFtei1Vc2VyLUFnZW50JyxcbiAgICAgICAgXSxcbiAgICAgICAgYWxsb3dDcmVkZW50aWFsczogdHJ1ZSxcbiAgICAgICAgbWF4QWdlOiBjZGsuRHVyYXRpb24uaG91cnMoMSksXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBCaW5hcnkgbWVkaWEgdHlwZXNcbiAgICAgIGJpbmFyeU1lZGlhVHlwZXM6IFsnaW1hZ2UvKicsICdhcHBsaWNhdGlvbi9wZGYnXSxcbiAgICAgIFxuICAgICAgLy8gTWluaW11bSBjb21wcmVzc2lvbiBzaXplXG4gICAgICBtaW5pbXVtQ29tcHJlc3Npb25TaXplOiAxMDI0LFxuICAgICAgXG4gICAgICAvLyBBUEkga2V5IGNvbmZpZ3VyYXRpb24gKGZvciBmdXR1cmUgcmF0ZSBsaW1pdGluZylcbiAgICAgIGFwaUtleVNvdXJjZVR5cGU6IGFwaWdhdGV3YXkuQXBpS2V5U291cmNlVHlwZS5IRUFERVIsXG4gICAgICBcbiAgICAgIC8vIFJlbW92YWwgcG9saWN5XG4gICAgICBwb2xpY3k6IHVuZGVmaW5lZCwgLy8gV2lsbCBiZSBjb25maWd1cmVkIHdpdGggcmVzb3VyY2UgcG9saWNpZXMgaWYgbmVlZGVkXG4gICAgfSk7XG5cbiAgICAvLyBDb2duaXRvIFVzZXIgUG9vbCBBdXRob3JpemVyIGZvciBKV1QgdmFsaWRhdGlvblxuICAgIHRoaXMuYXV0aG9yaXplciA9IG5ldyBhcGlnYXRld2F5LkNvZ25pdG9Vc2VyUG9vbHNBdXRob3JpemVyKHRoaXMsICdDb2duaXRvQXV0aG9yaXplcicsIHtcbiAgICAgIGNvZ25pdG9Vc2VyUG9vbHM6IFtwcm9wcy51c2VyUG9vbF0sXG4gICAgICBhdXRob3JpemVyTmFtZTogYHN5ZG5leS1jeWNsZXMtYXV0aG9yaXplci0ke3Byb3BzLmVudmlyb25tZW50fWAsXG4gICAgICBpZGVudGl0eVNvdXJjZTogJ21ldGhvZC5yZXF1ZXN0LmhlYWRlci5BdXRob3JpemF0aW9uJyxcbiAgICAgIHJlc3VsdHNDYWNoZVR0bDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksIC8vIENhY2hlIGF1dGhvcml6YXRpb24gcmVzdWx0c1xuICAgIH0pO1xuXG4gICAgLy8gSGVhbHRoIGNoZWNrIGVuZHBvaW50IChubyBhdXRob3JpemF0aW9uIHJlcXVpcmVkKVxuICAgIHRoaXMuY3JlYXRlSGVhbHRoQ2hlY2tFbmRwb2ludCgpO1xuXG4gICAgLy8gQVBJIHJlc291cmNlIHN0cnVjdHVyZSBwcmVwYXJhdGlvbiBmb3IgZnV0dXJlIHBoYXNlc1xuICAgIHRoaXMuY3JlYXRlQXBpUmVzb3VyY2VTdHJ1Y3R1cmUoKTtcblxuICAgIC8vIFJlcXVlc3QvUmVzcG9uc2UgbW9kZWxzIGZvciB2YWxpZGF0aW9uXG4gICAgdGhpcy5jcmVhdGVBcGlNb2RlbHMoKTtcblxuICAgIC8vIFVzYWdlIHBsYW4gZm9yIHJhdGUgbGltaXRpbmcgKHByb2R1Y3Rpb24pXG4gICAgaWYgKHByb3BzLmVudmlyb25tZW50ID09PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIHRoaXMuY3JlYXRlVXNhZ2VQbGFuKCk7XG4gICAgfVxuXG4gICAgLy8gV0FGIGludGVncmF0aW9uIGZvciBwcm9kdWN0aW9uIHNlY3VyaXR5XG4gICAgaWYgKHByb3BzLmVuYWJsZVdhZiAmJiBwcm9wcy5lbnZpcm9ubWVudCA9PT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICB0aGlzLmNvbmZpZ3VyZVdhZigpO1xuICAgIH1cblxuICAgIC8vIFRhZ3MgZm9yIHJlc291cmNlIG1hbmFnZW1lbnRcbiAgICBjZGsuVGFncy5vZih0aGlzLmFwaSkuYWRkKCdDb21wb25lbnQnLCAnQXBpTGF5ZXInKTtcbiAgICBjZGsuVGFncy5vZih0aGlzLmFwaSkuYWRkKCdQaGFzZScsICcxLjEtSW5mcmFzdHJ1Y3R1cmUnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgaGVhbHRoIGNoZWNrIGVuZHBvaW50IGZvciBtb25pdG9yaW5nXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZUhlYWx0aENoZWNrRW5kcG9pbnQoKTogdm9pZCB7XG4gICAgLy8gU2ltcGxlIGhlYWx0aCBjaGVjayBMYW1iZGEgZnVuY3Rpb25cbiAgICBjb25zdCBoZWFsdGhDaGVja0Z1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnSGVhbHRoQ2hlY2tGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxuICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUlubGluZShgXG4gICAgICAgIGV4cG9ydHMuaGFuZGxlciA9IGFzeW5jIChldmVudCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0ge1xuICAgICAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgc3RhdHVzOiAnaGVhbHRoeScsXG4gICAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgICB2ZXJzaW9uOiAnMS4wLjAnLFxuICAgICAgICAgICAgICBwaGFzZTogJzEuMS1JbmZyYXN0cnVjdHVyZS1Gb3VuZGF0aW9uJyxcbiAgICAgICAgICAgICAgZW52aXJvbm1lbnQ6IHByb2Nlc3MuZW52LkVOVklST05NRU5UIHx8ICdkZXZlbG9wbWVudCcsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICB9O1xuICAgICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgICAgfTtcbiAgICAgIGApLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgRU5WSVJPTk1FTlQ6IHRoaXMubm9kZS50cnlHZXRDb250ZXh0KCdlbnZpcm9ubWVudCcpIHx8ICdkZXZlbG9wbWVudCcsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgICAgbWVtb3J5U2l6ZTogMTI4LFxuICAgIH0pO1xuXG4gICAgLy8gSGVhbHRoIGVuZHBvaW50XG4gICAgY29uc3QgaGVhbHRoUmVzb3VyY2UgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdoZWFsdGgnKTtcbiAgICBoZWFsdGhSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGhlYWx0aENoZWNrRnVuY3Rpb24pLCB7XG4gICAgICBtZXRob2RSZXNwb25zZXM6IFt7XG4gICAgICAgIHN0YXR1c0NvZGU6ICcyMDAnLFxuICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzogYXBpZ2F0ZXdheS5Nb2RlbC5FTVBUWV9NT0RFTCxcbiAgICAgICAgfSxcbiAgICAgIH1dLFxuICAgIH0pO1xuXG4gICAgLy8gVGFncyBmb3IgdGhlIGhlYWx0aCBjaGVjayBmdW5jdGlvblxuICAgIGNkay5UYWdzLm9mKGhlYWx0aENoZWNrRnVuY3Rpb24pLmFkZCgnQ29tcG9uZW50JywgJ0hlYWx0aENoZWNrJyk7XG4gICAgY2RrLlRhZ3Mub2YoaGVhbHRoQ2hlY2tGdW5jdGlvbikuYWRkKCdQaGFzZScsICcxLjEtSW5mcmFzdHJ1Y3R1cmUnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIEFQSSByZXNvdXJjZSBzdHJ1Y3R1cmUgZm9yIGZ1dHVyZSBwaGFzZXNcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlQXBpUmVzb3VyY2VTdHJ1Y3R1cmUoKTogdm9pZCB7XG4gICAgLy8gQVBJIHYxIHJlc291cmNlXG4gICAgY29uc3QgdjFSZXNvdXJjZSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3YxJyk7XG5cbiAgICAvLyBOb3RlOiBJbmRpdmlkdWFsIHNlcnZpY2VzIHdpbGwgY3JlYXRlIHRoZWlyIG93biByZXNvdXJjZSBzdHJ1Y3R1cmVzXG4gICAgLy8gVGhpcyBlbnN1cmVzIG5vIGNvbmZsaWN0cyBhbmQgYWxsb3dzIHNlcnZpY2VzIHRvIG1hbmFnZSB0aGVpciBvd24gQVBJIHBhdGhzXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBBUEkgbW9kZWxzIGZvciByZXF1ZXN0L3Jlc3BvbnNlIHZhbGlkYXRpb25cbiAgICovXG4gIHByaXZhdGUgY3JlYXRlQXBpTW9kZWxzKCk6IHZvaWQge1xuICAgIC8vIEVycm9yIHJlc3BvbnNlIG1vZGVsXG4gICAgdGhpcy5hcGkuYWRkTW9kZWwoJ0Vycm9yTW9kZWwnLCB7XG4gICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgbW9kZWxOYW1lOiAnRXJyb3JNb2RlbCcsXG4gICAgICBzY2hlbWE6IHtcbiAgICAgICAgc2NoZW1hOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFWZXJzaW9uLkRSQUZUNCxcbiAgICAgICAgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5PQkpFQ1QsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBtZXNzYWdlOiB7XG4gICAgICAgICAgICB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHRpbWVzdGFtcDoge1xuICAgICAgICAgICAgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnZXJyb3InLCAnbWVzc2FnZSddLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIFN1Y2Nlc3MgcmVzcG9uc2UgbW9kZWxcbiAgICB0aGlzLmFwaS5hZGRNb2RlbCgnU3VjY2Vzc01vZGVsJywge1xuICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgIG1vZGVsTmFtZTogJ1N1Y2Nlc3NNb2RlbCcsXG4gICAgICBzY2hlbWE6IHtcbiAgICAgICAgc2NoZW1hOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFWZXJzaW9uLkRSQUZUNCxcbiAgICAgICAgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5PQkpFQ1QsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBzdWNjZXNzOiB7XG4gICAgICAgICAgICB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLkJPT0xFQU4sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLk9CSkVDVCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHRpbWVzdGFtcDoge1xuICAgICAgICAgICAgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnc3VjY2VzcyddLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIHVzYWdlIHBsYW4gZm9yIHJhdGUgbGltaXRpbmcgaW4gcHJvZHVjdGlvblxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVVc2FnZVBsYW4oKTogdm9pZCB7XG4gICAgY29uc3QgdXNhZ2VQbGFuID0gdGhpcy5hcGkuYWRkVXNhZ2VQbGFuKCdEZWZhdWx0VXNhZ2VQbGFuJywge1xuICAgICAgbmFtZTogJ3N5ZG5leS1jeWNsZXMtdXNhZ2UtcGxhbicsXG4gICAgICBkZXNjcmlwdGlvbjogJ0RlZmF1bHQgdXNhZ2UgcGxhbiBmb3IgU3lkbmV5IEN5Y2xlcyBBUEknLFxuICAgICAgdGhyb3R0bGU6IHtcbiAgICAgICAgcmF0ZUxpbWl0OiAxMDAwLCAvLyByZXF1ZXN0cyBwZXIgc2Vjb25kXG4gICAgICAgIGJ1cnN0TGltaXQ6IDIwMDAsIC8vIGJ1cnN0IGNhcGFjaXR5XG4gICAgICB9LFxuICAgICAgcXVvdGE6IHtcbiAgICAgICAgbGltaXQ6IDEwMDAwMCwgLy8gcmVxdWVzdHMgcGVyIG1vbnRoXG4gICAgICAgIHBlcmlvZDogYXBpZ2F0ZXdheS5QZXJpb2QuTU9OVEgsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gQXNzb2NpYXRlIHdpdGggQVBJIHN0YWdlXG4gICAgdXNhZ2VQbGFuLmFkZEFwaVN0YWdlKHtcbiAgICAgIHN0YWdlOiB0aGlzLmFwaS5kZXBsb3ltZW50U3RhZ2UsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ29uZmlndXJlcyBXQUYgZm9yIHByb2R1Y3Rpb24gc2VjdXJpdHlcbiAgICovXG4gIHByaXZhdGUgY29uZmlndXJlV2FmKCk6IHZvaWQge1xuICAgIC8vIFdBRiBjb25maWd1cmF0aW9uIHdpbGwgYmUgaW1wbGVtZW50ZWQgd2hlbiBuZWVkZWRcbiAgICAvLyBUaGlzIGlzIGEgcGxhY2Vob2xkZXIgZm9yIGZ1dHVyZSBzZWN1cml0eSBlbmhhbmNlbWVudHNcbiAgICBcbiAgICAvLyBDb21tb24gV0FGIHJ1bGVzIHRvIGltcGxlbWVudDpcbiAgICAvLyAtIFJhdGUgbGltaXRpbmdcbiAgICAvLyAtIElQIHdoaXRlbGlzdGluZy9ibGFja2xpc3RpbmdcbiAgICAvLyAtIFNRTCBpbmplY3Rpb24gcHJvdGVjdGlvblxuICAgIC8vIC0gWFNTIHByb3RlY3Rpb25cbiAgICAvLyAtIEdlb2dyYXBoaWMgcmVzdHJpY3Rpb25zXG4gIH1cbn0iXX0=