import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as path from 'path';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface StravaIntegrationServiceProps {
  api: apigateway.RestApi;
  mainTable: dynamodb.Table;
  environment: string;
}

export class StravaIntegrationService extends Construct {
  public readonly oauthConnectFunction: NodejsFunction;
  public readonly oauthCallbackFunction: NodejsFunction;
  public readonly webhookFunction: NodejsFunction;
  public readonly tokenEncryptionKey: kms.Key;

  constructor(scope: Construct, id: string, props: StravaIntegrationServiceProps) {
    super(scope, id);

    // Create KMS key for token encryption
    this.tokenEncryptionKey = new kms.Key(this, 'StravaTokenEncryptionKey', {
      description: 'KMS key for encrypting Strava OAuth tokens',
      enableKeyRotation: true,
    });

    // Common environment variables
    const commonEnvironment = {
      MAIN_TABLE_NAME: props.mainTable.tableName,
      KMS_KEY_ID: this.tokenEncryptionKey.keyId,
      STRAVA_CLIENT_ID: process.env.STRAVA_CLIENT_ID || '',
      STRAVA_CLIENT_SECRET: process.env.STRAVA_CLIENT_SECRET || '',
      STRAVA_REDIRECT_URI: process.env.STRAVA_REDIRECT_URI || '',
      STRAVA_WEBHOOK_VERIFY_TOKEN: process.env.STRAVA_WEBHOOK_VERIFY_TOKEN || '',
    };

    // OAuth Connect Function
    this.oauthConnectFunction = new NodejsFunction(this, 'OAuthConnectFunction', {
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../services/strava-integration-service/handlers/oauth/connect.ts'),
      environment: commonEnvironment,
      timeout: cdk.Duration.seconds(30),
      bundling: {
        externalModules: ['aws-sdk'],
        minify: true,
        sourceMap: true,
      },
    });

    // OAuth Callback Function
    this.oauthCallbackFunction = new NodejsFunction(this, 'OAuthCallbackFunction', {
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../services/strava-integration-service/handlers/oauth/callback.ts'),
      environment: commonEnvironment,
      timeout: cdk.Duration.seconds(30),
      bundling: {
        externalModules: ['aws-sdk'],
        minify: true,
        sourceMap: true,
      },
    });

    // Webhook Function
    this.webhookFunction = new NodejsFunction(this, 'WebhookFunction', {
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../services/strava-integration-service/handlers/webhook/webhook.ts'),
      environment: commonEnvironment,
      timeout: cdk.Duration.seconds(30),
      bundling: {
        externalModules: ['aws-sdk'],
        minify: true,
        sourceMap: true,
      },
    });

    // Grant permissions
    props.mainTable.grantReadWriteData(this.oauthConnectFunction);
    props.mainTable.grantReadWriteData(this.oauthCallbackFunction);
    props.mainTable.grantReadWriteData(this.webhookFunction);

    this.tokenEncryptionKey.grantEncryptDecrypt(this.oauthCallbackFunction);
    this.tokenEncryptionKey.grantEncryptDecrypt(this.webhookFunction);

    // API Gateway Integration
    this.setupApiRoutes(props.api);
  }

  private setupApiRoutes(api: apigateway.RestApi): void {
    // /integrations/strava routes
    const integrationsResource = api.root.getResource('integrations') || 
      api.root.addResource('integrations');
    const stravaResource = integrationsResource.addResource('strava');

    // GET /integrations/strava/connect
    stravaResource.addResource('connect').addMethod('GET', 
      new apigateway.LambdaIntegration(this.oauthConnectFunction)
    );

    // GET /integrations/strava/callback
    stravaResource.addResource('callback').addMethod('GET', 
      new apigateway.LambdaIntegration(this.oauthCallbackFunction)
    );

    // POST /integrations/strava/webhook (public endpoint)
    const webhookResource = stravaResource.addResource('webhook');
    webhookResource.addMethod('GET', 
      new apigateway.LambdaIntegration(this.webhookFunction)
    );
    webhookResource.addMethod('POST', 
      new apigateway.LambdaIntegration(this.webhookFunction)
    );
  }
}