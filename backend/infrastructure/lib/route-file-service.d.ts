import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
export interface RouteFileServiceProps {
    mainTable: dynamodb.Table;
    environment: string;
}
export declare class RouteFileService extends Construct {
    readonly routesBucket: s3.Bucket;
    readonly distribution: cloudfront.Distribution;
    readonly fileUploadHandler: lambda.Function;
    readonly fileProcessingHandler: lambda.Function;
    readonly fileDownloadHandler: lambda.Function;
    readonly analyticsHandler: lambda.Function;
    constructor(scope: Construct, id: string, props: RouteFileServiceProps);
}
