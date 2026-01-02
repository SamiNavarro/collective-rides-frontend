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
                    ? ['https://sydneycycles.com'] // Production domain
                    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzdC1hcGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZXN0LWFwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1RUFBeUQ7QUFFekQsK0RBQWlEO0FBQ2pELDJEQUE2QztBQUM3QywyQ0FBdUM7QUFjdkM7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHO0FBQ0gsTUFBYSxnQkFBaUIsU0FBUSxzQkFBUztJQUk3QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTRCO1FBQ3BFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsNENBQTRDO1FBQzVDLE1BQU0sUUFBUSxHQUFHLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUU7WUFDN0QsWUFBWSxFQUFFLGlDQUFpQyxLQUFLLENBQUMsV0FBVyxFQUFFO1lBQ2xFLFNBQVMsRUFBRSxLQUFLLENBQUMsV0FBVyxLQUFLLFlBQVk7Z0JBQzNDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVM7Z0JBQzlCLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVE7WUFDL0IsYUFBYSxFQUFFLEtBQUssQ0FBQyxXQUFXLEtBQUssWUFBWTtnQkFDL0MsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsTUFBTTtnQkFDMUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztTQUM5QixDQUFDLENBQUM7UUFFSCx5QkFBeUI7UUFDekIsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFFO1lBQzdELFdBQVcsRUFBRSxxQkFBcUIsS0FBSyxDQUFDLFdBQVcsRUFBRTtZQUNyRCxXQUFXLEVBQUUseUNBQXlDLEtBQUssQ0FBQyxXQUFXLEVBQUU7WUFFekUsNEJBQTRCO1lB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QUNMLENBQUM7SUFFRDs7T0FFRztJQUNLLFlBQVk7UUFDbEIsb0RBQW9EO1FBQ3BELHlEQUF5RDtRQUV6RCxpQ0FBaUM7UUFDakMsa0JBQWtCO1FBQ2xCLGlDQUFpQztRQUNqQyw2QkFBNkI7UUFDN0IsbUJBQW1CO1FBQ25CLDRCQUE0QjtJQUM5QixDQUFDO0NBQ0Y7QUFuUUQsNENBbVFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xuaW1wb3J0ICogYXMgY29nbml0byBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY29nbml0byc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBsb2dzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sb2dzJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG4vKipcbiAqIEFQSSBHYXRld2F5IFJFU1QgQVBJIENvbmZpZ3VyYXRpb25cbiAqIFxuICogSW50ZXJmYWNlIGZvciBjb25maWd1cmluZyB0aGUgUkVTVCBBUEkgY29uc3RydWN0IGJhc2VkIG9uIGVudmlyb25tZW50XG4gKiBhbmQgc2VjdXJpdHkgcmVxdWlyZW1lbnRzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJlc3RBcGlDb25zdHJ1Y3RQcm9wcyB7XG4gIGVudmlyb25tZW50OiBzdHJpbmc7XG4gIHVzZXJQb29sOiBjb2duaXRvLlVzZXJQb29sO1xuICBlbmFibGVXYWY/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIEFQSSBHYXRld2F5IFJFU1QgQVBJIENvbnN0cnVjdCAtIFBoYXNlIDEuMVxuICogXG4gKiBDcmVhdGVzIGFuZCBjb25maWd1cmVzIEFXUyBBUEkgR2F0ZXdheSBSRVNUIEFQSSBmb3IgSFRUUCBBUEkgbGF5ZXJcbiAqIGFjY29yZGluZyB0byB0aGUgY2Fub25pY2FsIEFXUyBhcmNoaXRlY3R1cmUgc3BlY2lmaWNhdGlvbi5cbiAqIFxuICogRmVhdHVyZXM6XG4gKiAtIFJFU1QgQVBJIHdpdGggcHJvcGVyIENPUlMgY29uZmlndXJhdGlvblxuICogLSBIZWFsdGggY2hlY2sgZW5kcG9pbnQgZm9yIG1vbml0b3JpbmdcbiAqIC0gSldUIGF1dGhvcml6ZXIgaW50ZWdyYXRpb24gKHJlYWR5IGZvciBQaGFzZSAxLjIpXG4gKiAtIENsb3VkV2F0Y2ggbG9nZ2luZyBhbmQgbW9uaXRvcmluZ1xuICogLSBSZXF1ZXN0L3Jlc3BvbnNlIHZhbGlkYXRpb25cbiAqIC0gV0FGIGludGVncmF0aW9uIGZvciBwcm9kdWN0aW9uIHNlY3VyaXR5XG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIEFXUyBBcmNoaXRlY3R1cmU6IC5raXJvL3NwZWNzL2FyY2hpdGVjdHVyZS5hd3MudjEubWRcbiAqIC0gSW1wbGVtZW50YXRpb24gUGxhbjogLmtpcm8vc3BlY3MvaW1wbGVtZW50YXRpb24udjEubWQgKFBoYXNlIDEuMSlcbiAqL1xuZXhwb3J0IGNsYXNzIFJlc3RBcGlDb25zdHJ1Y3QgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBwdWJsaWMgcmVhZG9ubHkgYXBpOiBhcGlnYXRld2F5LlJlc3RBcGk7XG4gIHB1YmxpYyByZWFkb25seSBhdXRob3JpemVyOiBhcGlnYXRld2F5LkNvZ25pdG9Vc2VyUG9vbHNBdXRob3JpemVyO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBSZXN0QXBpQ29uc3RydWN0UHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgLy8gQ2xvdWRXYXRjaCBsb2cgZ3JvdXAgZm9yIEFQSSBHYXRld2F5IGxvZ3NcbiAgICBjb25zdCBsb2dHcm91cCA9IG5ldyBsb2dzLkxvZ0dyb3VwKHRoaXMsICdBcGlHYXRld2F5TG9nR3JvdXAnLCB7XG4gICAgICBsb2dHcm91cE5hbWU6IGAvYXdzL2FwaWdhdGV3YXkvc3lkbmV5LWN5Y2xlcy0ke3Byb3BzLmVudmlyb25tZW50fWAsXG4gICAgICByZXRlbnRpb246IHByb3BzLmVudmlyb25tZW50ID09PSAncHJvZHVjdGlvbicgXG4gICAgICAgID8gbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9NT05USCBcbiAgICAgICAgOiBsb2dzLlJldGVudGlvbkRheXMuT05FX1dFRUssXG4gICAgICByZW1vdmFsUG9saWN5OiBwcm9wcy5lbnZpcm9ubWVudCA9PT0gJ3Byb2R1Y3Rpb24nIFxuICAgICAgICA/IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTiBcbiAgICAgICAgOiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgIH0pO1xuXG4gICAgLy8gUkVTVCBBUEkgY29uZmlndXJhdGlvblxuICAgIHRoaXMuYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCAnU3lkbmV5Q3ljbGVzUmVzdEFwaScsIHtcbiAgICAgIHJlc3RBcGlOYW1lOiBgc3lkbmV5LWN5Y2xlcy1hcGktJHtwcm9wcy5lbnZpcm9ubWVudH1gLFxuICAgICAgZGVzY3JpcHRpb246IGBTeWRuZXkgQ3ljbGluZyBQbGF0Zm9ybSB2MSBSRVNUIEFQSSAtICR7cHJvcHMuZW52aXJvbm1lbnR9YCxcbiAgICAgIFxuICAgICAgLy8gQVBJIEdhdGV3YXkgY29uZmlndXJhdGlvblxuICAgICAgZW5kcG9pbnRDb25maWd1cmF0aW9uOiB7XG4gICAgICAgIHR5cGVzOiBbYXBpZ2F0ZXdheS5FbmRwb2ludFR5cGUuUkVHSU9OQUxdLFxuICAgICAgfSxcbiAgICAgIFxuICAgICAgLy8gQ2xvdWRXYXRjaCBsb2dnaW5nXG4gICAgICBjbG91ZFdhdGNoUm9sZTogdHJ1ZSxcbiAgICAgIGRlcGxveU9wdGlvbnM6IHtcbiAgICAgICAgc3RhZ2VOYW1lOiBwcm9wcy5lbnZpcm9ubWVudCxcbiAgICAgICAgbG9nZ2luZ0xldmVsOiBhcGlnYXRld2F5Lk1ldGhvZExvZ2dpbmdMZXZlbC5JTkZPLFxuICAgICAgICBkYXRhVHJhY2VFbmFibGVkOiBwcm9wcy5lbnZpcm9ubWVudCAhPT0gJ3Byb2R1Y3Rpb24nLCAvLyBEaXNhYmxlIGluIHByb2QgZm9yIHNlY3VyaXR5XG4gICAgICAgIG1ldHJpY3NFbmFibGVkOiB0cnVlLFxuICAgICAgICBhY2Nlc3NMb2dEZXN0aW5hdGlvbjogbmV3IGFwaWdhdGV3YXkuTG9nR3JvdXBMb2dEZXN0aW5hdGlvbihsb2dHcm91cCksXG4gICAgICAgIGFjY2Vzc0xvZ0Zvcm1hdDogYXBpZ2F0ZXdheS5BY2Nlc3NMb2dGb3JtYXQuanNvbldpdGhTdGFuZGFyZEZpZWxkcyh7XG4gICAgICAgICAgY2FsbGVyOiB0cnVlLFxuICAgICAgICAgIGh0dHBNZXRob2Q6IHRydWUsXG4gICAgICAgICAgaXA6IHRydWUsXG4gICAgICAgICAgcHJvdG9jb2w6IHRydWUsXG4gICAgICAgICAgcmVxdWVzdFRpbWU6IHRydWUsXG4gICAgICAgICAgcmVzb3VyY2VQYXRoOiB0cnVlLFxuICAgICAgICAgIHJlc3BvbnNlTGVuZ3RoOiB0cnVlLFxuICAgICAgICAgIHN0YXR1czogdHJ1ZSxcbiAgICAgICAgICB1c2VyOiB0cnVlLFxuICAgICAgICB9KSxcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vIENPUlMgY29uZmlndXJhdGlvbiBmb3IgZnJvbnRlbmQgaW50ZWdyYXRpb25cbiAgICAgIGRlZmF1bHRDb3JzUHJlZmxpZ2h0T3B0aW9uczoge1xuICAgICAgICBhbGxvd09yaWdpbnM6IHByb3BzLmVudmlyb25tZW50ID09PSAncHJvZHVjdGlvbicgXG4gICAgICAgICAgPyBbJ2h0dHBzOi8vc3lkbmV5Y3ljbGVzLmNvbSddIC8vIFByb2R1Y3Rpb24gZG9tYWluXG4gICAgICAgICAgOiBbJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCcsICdodHRwOi8vMTI3LjAuMC4xOjMwMDAnXSwgLy8gRGV2ZWxvcG1lbnRcbiAgICAgICAgYWxsb3dNZXRob2RzOiBbJ0dFVCcsICdQT1NUJywgJ1BVVCcsICdERUxFVEUnLCAnT1BUSU9OUyddLFxuICAgICAgICBhbGxvd0hlYWRlcnM6IFtcbiAgICAgICAgICAnQ29udGVudC1UeXBlJyxcbiAgICAgICAgICAnWC1BbXotRGF0ZScsXG4gICAgICAgICAgJ0F1dGhvcml6YXRpb24nLFxuICAgICAgICAgICdYLUFwaS1LZXknLFxuICAgICAgICAgICdYLUFtei1TZWN1cml0eS1Ub2tlbicsXG4gICAgICAgICAgJ1gtQW16LVVzZXItQWdlbnQnLFxuICAgICAgICBdLFxuICAgICAgICBhbGxvd0NyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICBtYXhBZ2U6IGNkay5EdXJhdGlvbi5ob3VycygxKSxcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vIEJpbmFyeSBtZWRpYSB0eXBlc1xuICAgICAgYmluYXJ5TWVkaWFUeXBlczogWydpbWFnZS8qJywgJ2FwcGxpY2F0aW9uL3BkZiddLFxuICAgICAgXG4gICAgICAvLyBNaW5pbXVtIGNvbXByZXNzaW9uIHNpemVcbiAgICAgIG1pbmltdW1Db21wcmVzc2lvblNpemU6IDEwMjQsXG4gICAgICBcbiAgICAgIC8vIEFQSSBrZXkgY29uZmlndXJhdGlvbiAoZm9yIGZ1dHVyZSByYXRlIGxpbWl0aW5nKVxuICAgICAgYXBpS2V5U291cmNlVHlwZTogYXBpZ2F0ZXdheS5BcGlLZXlTb3VyY2VUeXBlLkhFQURFUixcbiAgICAgIFxuICAgICAgLy8gUmVtb3ZhbCBwb2xpY3lcbiAgICAgIHBvbGljeTogdW5kZWZpbmVkLCAvLyBXaWxsIGJlIGNvbmZpZ3VyZWQgd2l0aCByZXNvdXJjZSBwb2xpY2llcyBpZiBuZWVkZWRcbiAgICB9KTtcblxuICAgIC8vIENvZ25pdG8gVXNlciBQb29sIEF1dGhvcml6ZXIgZm9yIEpXVCB2YWxpZGF0aW9uXG4gICAgdGhpcy5hdXRob3JpemVyID0gbmV3IGFwaWdhdGV3YXkuQ29nbml0b1VzZXJQb29sc0F1dGhvcml6ZXIodGhpcywgJ0NvZ25pdG9BdXRob3JpemVyJywge1xuICAgICAgY29nbml0b1VzZXJQb29sczogW3Byb3BzLnVzZXJQb29sXSxcbiAgICAgIGF1dGhvcml6ZXJOYW1lOiBgc3lkbmV5LWN5Y2xlcy1hdXRob3JpemVyLSR7cHJvcHMuZW52aXJvbm1lbnR9YCxcbiAgICAgIGlkZW50aXR5U291cmNlOiAnbWV0aG9kLnJlcXVlc3QuaGVhZGVyLkF1dGhvcml6YXRpb24nLFxuICAgICAgcmVzdWx0c0NhY2hlVHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSwgLy8gQ2FjaGUgYXV0aG9yaXphdGlvbiByZXN1bHRzXG4gICAgfSk7XG5cbiAgICAvLyBIZWFsdGggY2hlY2sgZW5kcG9pbnQgKG5vIGF1dGhvcml6YXRpb24gcmVxdWlyZWQpXG4gICAgdGhpcy5jcmVhdGVIZWFsdGhDaGVja0VuZHBvaW50KCk7XG5cbiAgICAvLyBBUEkgcmVzb3VyY2Ugc3RydWN0dXJlIHByZXBhcmF0aW9uIGZvciBmdXR1cmUgcGhhc2VzXG4gICAgdGhpcy5jcmVhdGVBcGlSZXNvdXJjZVN0cnVjdHVyZSgpO1xuXG4gICAgLy8gUmVxdWVzdC9SZXNwb25zZSBtb2RlbHMgZm9yIHZhbGlkYXRpb25cbiAgICB0aGlzLmNyZWF0ZUFwaU1vZGVscygpO1xuXG4gICAgLy8gVXNhZ2UgcGxhbiBmb3IgcmF0ZSBsaW1pdGluZyAocHJvZHVjdGlvbilcbiAgICBpZiAocHJvcHMuZW52aXJvbm1lbnQgPT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgdGhpcy5jcmVhdGVVc2FnZVBsYW4oKTtcbiAgICB9XG5cbiAgICAvLyBXQUYgaW50ZWdyYXRpb24gZm9yIHByb2R1Y3Rpb24gc2VjdXJpdHlcbiAgICBpZiAocHJvcHMuZW5hYmxlV2FmICYmIHByb3BzLmVudmlyb25tZW50ID09PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIHRoaXMuY29uZmlndXJlV2FmKCk7XG4gICAgfVxuXG4gICAgLy8gVGFncyBmb3IgcmVzb3VyY2UgbWFuYWdlbWVudFxuICAgIGNkay5UYWdzLm9mKHRoaXMuYXBpKS5hZGQoJ0NvbXBvbmVudCcsICdBcGlMYXllcicpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMuYXBpKS5hZGQoJ1BoYXNlJywgJzEuMS1JbmZyYXN0cnVjdHVyZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBoZWFsdGggY2hlY2sgZW5kcG9pbnQgZm9yIG1vbml0b3JpbmdcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlSGVhbHRoQ2hlY2tFbmRwb2ludCgpOiB2b2lkIHtcbiAgICAvLyBTaW1wbGUgaGVhbHRoIGNoZWNrIExhbWJkYSBmdW5jdGlvblxuICAgIGNvbnN0IGhlYWx0aENoZWNrRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdIZWFsdGhDaGVja0Z1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE4X1gsXG4gICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tSW5saW5lKGBcbiAgICAgICAgZXhwb3J0cy5oYW5kbGVyID0gYXN5bmMgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSB7XG4gICAgICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICBzdGF0dXM6ICdoZWFsdGh5JyxcbiAgICAgICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICAgIHZlcnNpb246ICcxLjAuMCcsXG4gICAgICAgICAgICAgIHBoYXNlOiAnMS4xLUluZnJhc3RydWN0dXJlLUZvdW5kYXRpb24nLFxuICAgICAgICAgICAgICBlbnZpcm9ubWVudDogcHJvY2Vzcy5lbnYuRU5WSVJPTk1FTlQgfHwgJ2RldmVsb3BtZW50JyxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIH07XG4gICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICB9O1xuICAgICAgYCksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBFTlZJUk9OTUVOVDogdGhpcy5ub2RlLnRyeUdldENvbnRleHQoJ2Vudmlyb25tZW50JykgfHwgJ2RldmVsb3BtZW50JyxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgICBtZW1vcnlTaXplOiAxMjgsXG4gICAgfSk7XG5cbiAgICAvLyBIZWFsdGggZW5kcG9pbnRcbiAgICBjb25zdCBoZWFsdGhSZXNvdXJjZSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2hlYWx0aCcpO1xuICAgIGhlYWx0aFJlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oaGVhbHRoQ2hlY2tGdW5jdGlvbiksIHtcbiAgICAgIG1ldGhvZFJlc3BvbnNlczogW3tcbiAgICAgICAgc3RhdHVzQ29kZTogJzIwMCcsXG4gICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVNUFRZX01PREVMLFxuICAgICAgICB9LFxuICAgICAgfV0sXG4gICAgfSk7XG5cbiAgICAvLyBUYWdzIGZvciB0aGUgaGVhbHRoIGNoZWNrIGZ1bmN0aW9uXG4gICAgY2RrLlRhZ3Mub2YoaGVhbHRoQ2hlY2tGdW5jdGlvbikuYWRkKCdDb21wb25lbnQnLCAnSGVhbHRoQ2hlY2snKTtcbiAgICBjZGsuVGFncy5vZihoZWFsdGhDaGVja0Z1bmN0aW9uKS5hZGQoJ1BoYXNlJywgJzEuMS1JbmZyYXN0cnVjdHVyZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgQVBJIHJlc291cmNlIHN0cnVjdHVyZSBmb3IgZnV0dXJlIHBoYXNlc1xuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVBcGlSZXNvdXJjZVN0cnVjdHVyZSgpOiB2b2lkIHtcbiAgICAvLyBBUEkgdjEgcmVzb3VyY2VcbiAgICBjb25zdCB2MVJlc291cmNlID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgndjEnKTtcblxuICAgIC8vIE5vdGU6IEluZGl2aWR1YWwgc2VydmljZXMgd2lsbCBjcmVhdGUgdGhlaXIgb3duIHJlc291cmNlIHN0cnVjdHVyZXNcbiAgICAvLyBUaGlzIGVuc3VyZXMgbm8gY29uZmxpY3RzIGFuZCBhbGxvd3Mgc2VydmljZXMgdG8gbWFuYWdlIHRoZWlyIG93biBBUEkgcGF0aHNcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIEFQSSBtb2RlbHMgZm9yIHJlcXVlc3QvcmVzcG9uc2UgdmFsaWRhdGlvblxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVBcGlNb2RlbHMoKTogdm9pZCB7XG4gICAgLy8gRXJyb3IgcmVzcG9uc2UgbW9kZWxcbiAgICB0aGlzLmFwaS5hZGRNb2RlbCgnRXJyb3JNb2RlbCcsIHtcbiAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICBtb2RlbE5hbWU6ICdFcnJvck1vZGVsJyxcbiAgICAgIHNjaGVtYToge1xuICAgICAgICBzY2hlbWE6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVZlcnNpb24uRFJBRlQ0LFxuICAgICAgICB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLk9CSkVDVCxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGVycm9yOiB7XG4gICAgICAgICAgICB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIG1lc3NhZ2U6IHtcbiAgICAgICAgICAgIHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgdGltZXN0YW1wOiB7XG4gICAgICAgICAgICB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydlcnJvcicsICdtZXNzYWdlJ10sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gU3VjY2VzcyByZXNwb25zZSBtb2RlbFxuICAgIHRoaXMuYXBpLmFkZE1vZGVsKCdTdWNjZXNzTW9kZWwnLCB7XG4gICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgbW9kZWxOYW1lOiAnU3VjY2Vzc01vZGVsJyxcbiAgICAgIHNjaGVtYToge1xuICAgICAgICBzY2hlbWE6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVZlcnNpb24uRFJBRlQ0LFxuICAgICAgICB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLk9CSkVDVCxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHN1Y2Nlc3M6IHtcbiAgICAgICAgICAgIHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuQk9PTEVBTixcbiAgICAgICAgICB9LFxuICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuT0JKRUNULFxuICAgICAgICAgIH0sXG4gICAgICAgICAgdGltZXN0YW1wOiB7XG4gICAgICAgICAgICB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydzdWNjZXNzJ10sXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgdXNhZ2UgcGxhbiBmb3IgcmF0ZSBsaW1pdGluZyBpbiBwcm9kdWN0aW9uXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZVVzYWdlUGxhbigpOiB2b2lkIHtcbiAgICBjb25zdCB1c2FnZVBsYW4gPSB0aGlzLmFwaS5hZGRVc2FnZVBsYW4oJ0RlZmF1bHRVc2FnZVBsYW4nLCB7XG4gICAgICBuYW1lOiAnc3lkbmV5LWN5Y2xlcy11c2FnZS1wbGFuJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnRGVmYXVsdCB1c2FnZSBwbGFuIGZvciBTeWRuZXkgQ3ljbGVzIEFQSScsXG4gICAgICB0aHJvdHRsZToge1xuICAgICAgICByYXRlTGltaXQ6IDEwMDAsIC8vIHJlcXVlc3RzIHBlciBzZWNvbmRcbiAgICAgICAgYnVyc3RMaW1pdDogMjAwMCwgLy8gYnVyc3QgY2FwYWNpdHlcbiAgICAgIH0sXG4gICAgICBxdW90YToge1xuICAgICAgICBsaW1pdDogMTAwMDAwLCAvLyByZXF1ZXN0cyBwZXIgbW9udGhcbiAgICAgICAgcGVyaW9kOiBhcGlnYXRld2F5LlBlcmlvZC5NT05USCxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBBc3NvY2lhdGUgd2l0aCBBUEkgc3RhZ2VcbiAgICB1c2FnZVBsYW4uYWRkQXBpU3RhZ2Uoe1xuICAgICAgc3RhZ2U6IHRoaXMuYXBpLmRlcGxveW1lbnRTdGFnZSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25maWd1cmVzIFdBRiBmb3IgcHJvZHVjdGlvbiBzZWN1cml0eVxuICAgKi9cbiAgcHJpdmF0ZSBjb25maWd1cmVXYWYoKTogdm9pZCB7XG4gICAgLy8gV0FGIGNvbmZpZ3VyYXRpb24gd2lsbCBiZSBpbXBsZW1lbnRlZCB3aGVuIG5lZWRlZFxuICAgIC8vIFRoaXMgaXMgYSBwbGFjZWhvbGRlciBmb3IgZnV0dXJlIHNlY3VyaXR5IGVuaGFuY2VtZW50c1xuICAgIFxuICAgIC8vIENvbW1vbiBXQUYgcnVsZXMgdG8gaW1wbGVtZW50OlxuICAgIC8vIC0gUmF0ZSBsaW1pdGluZ1xuICAgIC8vIC0gSVAgd2hpdGVsaXN0aW5nL2JsYWNrbGlzdGluZ1xuICAgIC8vIC0gU1FMIGluamVjdGlvbiBwcm90ZWN0aW9uXG4gICAgLy8gLSBYU1MgcHJvdGVjdGlvblxuICAgIC8vIC0gR2VvZ3JhcGhpYyByZXN0cmljdGlvbnNcbiAgfVxufSJdfQ==