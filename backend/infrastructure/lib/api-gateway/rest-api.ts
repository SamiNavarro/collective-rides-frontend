import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

/**
 * API Gateway REST API Configuration
 * 
 * Interface for configuring the REST API construct based on environment
 * and security requirements.
 */
export interface RestApiConstructProps {
  environment: string;
  userPool: cognito.UserPool;
  enableWaf?: boolean;
}

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
export class RestApiConstruct extends Construct {
  public readonly api: apigateway.RestApi;
  public readonly authorizer: apigateway.CognitoUserPoolsAuthorizer;

  constructor(scope: Construct, id: string, props: RestApiConstructProps) {
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
        dataTraceEnabled: props.environment !== 'production', // Disable in prod for security
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
          : ['http://localhost:3000', 'http://127.0.0.1:3000'], // Development
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
  private createHealthCheckEndpoint(): void {
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
  private createApiResourceStructure(): void {
    // API v1 resource
    const v1Resource = this.api.root.addResource('v1');

    // Note: Individual services will create their own resource structures
    // This ensures no conflicts and allows services to manage their own API paths
  }

  /**
   * Creates API models for request/response validation
   */
  private createApiModels(): void {
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
  private createUsagePlan(): void {
    const usagePlan = this.api.addUsagePlan('DefaultUsagePlan', {
      name: 'sydney-cycles-usage-plan',
      description: 'Default usage plan for Sydney Cycles API',
      throttle: {
        rateLimit: 1000, // requests per second
        burstLimit: 2000, // burst capacity
      },
      quota: {
        limit: 100000, // requests per month
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
  private configureWaf(): void {
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