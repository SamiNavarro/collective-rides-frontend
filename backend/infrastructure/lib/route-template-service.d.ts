import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
export interface RouteTemplateServiceProps {
    mainTable: dynamodb.Table;
    vpc?: ec2.Vpc;
    environment: string;
}
export declare class RouteTemplateService extends Construct {
    readonly templateHandler: lambda.Function;
    readonly searchHandler: lambda.Function;
    readonly cacheCluster?: elasticache.CfnCacheCluster;
    constructor(scope: Construct, id: string, props: RouteTemplateServiceProps);
}
