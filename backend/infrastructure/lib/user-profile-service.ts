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

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

/**
 * User Profile Service configuration
 */
export interface UserProfileServiceProps {
  environment: string;
  api: apigateway.RestApi;
  authorizer: apigateway.CognitoUserPoolsAuthorizer;
  mainTable: dynamodb.Table;
}

/**
 * User Profile Service construct
 * 
 * Creates Lambda functions for user profile operations and integrates them
 * with the existing API Gateway and DynamoDB infrastructure.
 */
export class UserProfileServiceConstruct extends Construct {
  public readonly getCurrentUserFunction: lambdaNodejs.NodejsFunction;
  public readonly getUserByIdFunction: lambdaNodejs.NodejsFunction;
  public readonly updateUserFunction: lambdaNodejs.NodejsFunction;

  constructor(scope: Construct, id: string, props: UserProfileServiceProps) {
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
  private setupApiGatewayIntegration(props: UserProfileServiceProps): void {
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