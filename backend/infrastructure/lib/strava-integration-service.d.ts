import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
interface StravaIntegrationServiceProps {
    api: apigateway.RestApi;
    mainTable: dynamodb.Table;
    environment: string;
}
export declare class StravaIntegrationService extends Construct {
    readonly oauthConnectFunction: NodejsFunction;
    readonly oauthCallbackFunction: NodejsFunction;
    readonly webhookFunction: NodejsFunction;
    readonly tokenEncryptionKey: kms.Key;
    constructor(scope: Construct, id: string, props: StravaIntegrationServiceProps);
    private setupApiRoutes;
}
export {};
