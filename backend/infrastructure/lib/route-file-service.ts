import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

export interface RouteFileServiceProps {
  mainTable: dynamodb.Table;
  environment: string;
}

export class RouteFileService extends Construct {
  public readonly routesBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly fileUploadHandler: lambda.Function;
  public readonly fileProcessingHandler: lambda.Function;
  public readonly fileDownloadHandler: lambda.Function;
  public readonly analyticsHandler: lambda.Function;

  constructor(scope: Construct, id: string, props: RouteFileServiceProps) {
    super(scope, id);

    // S3 Bucket for route files
    this.routesBucket = new s3.Bucket(this, 'RoutesBucket', {
      bucketName: `sydney-cycles-routes-${props.environment}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT],
          allowedOrigins: ['*'], // Will be restricted in production
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // CloudFront Distribution for global file distribution
    this.distribution = new cloudfront.Distribution(this, 'RoutesDistribution', {
      comment: 'Sydney Cycles Routes CDN',
      defaultBehavior: {
        origin: new origins.S3Origin(this.routesBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // US, Canada, Europe
      enabled: true,
    });

    // IAM role for Lambda functions
    const routeFileRole = new iam.Role(this, 'RouteFileRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        RouteFilePolicy: new iam.PolicyDocument({
          statements: [
            // DynamoDB permissions
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              resources: [
                props.mainTable.tableArn,
                `${props.mainTable.tableArn}/index/*`,
              ],
            }),
            // S3 permissions
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:GetObjectVersion',
                's3:PutObjectAcl',
              ],
              resources: [`${this.routesBucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:ListBucket',
                's3:GetBucketLocation',
                's3:GetBucketVersioning',
              ],
              resources: [this.routesBucket.bucketArn],
            }),
            // CloudFront permissions for signed URLs
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudfront:CreateInvalidation',
              ],
              resources: [`arn:aws:cloudfront::${cdk.Stack.of(this).account}:distribution/${this.distribution.distributionId}`],
            }),
          ],
        }),
      },
    });

    // File Upload Handler - Generate presigned URLs
    this.fileUploadHandler = new lambdaNodejs.NodejsFunction(this, 'FileUploadHandler', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: 'services/route-file-service/handlers/upload/request-upload-url.ts',
      handler: 'handler',
      bundling: {
        forceDockerBundling: false,
        externalModules: ['@aws-sdk/*'],
        minify: false,
        sourceMap: false,
      },
      role: routeFileRole,
      timeout: cdk.Duration.seconds(30),
      environment: {
        MAIN_TABLE_NAME: props.mainTable.tableName,
        ROUTES_BUCKET_NAME: this.routesBucket.bucketName,
        ENVIRONMENT: props.environment,
      },
    });

    // File Processing Handler - Process uploaded GPX files
    this.fileProcessingHandler = new lambdaNodejs.NodejsFunction(this, 'FileProcessingHandler', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: 'services/route-file-service/handlers/processing/process-file.ts',
      handler: 'handler',
      bundling: {
        forceDockerBundling: false,
        externalModules: ['@aws-sdk/*'],
        minify: false,
        sourceMap: false,
      },
      role: routeFileRole,
      timeout: cdk.Duration.minutes(5), // GPX processing can take time
      memorySize: 1024, // More memory for file processing
      environment: {
        MAIN_TABLE_NAME: props.mainTable.tableName,
        ROUTES_BUCKET_NAME: this.routesBucket.bucketName,
        ENVIRONMENT: props.environment,
      },
    });

    // File Download Handler - Generate signed download URLs
    this.fileDownloadHandler = new lambdaNodejs.NodejsFunction(this, 'FileDownloadHandler', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: 'services/route-file-service/handlers/download/download-file.ts',
      handler: 'handler',
      bundling: {
        forceDockerBundling: false,
        externalModules: ['@aws-sdk/*'],
        minify: false,
        sourceMap: false,
      },
      role: routeFileRole,
      timeout: cdk.Duration.seconds(30),
      environment: {
        MAIN_TABLE_NAME: props.mainTable.tableName,
        ROUTES_BUCKET_NAME: this.routesBucket.bucketName,
        CLOUDFRONT_DOMAIN: this.distribution.distributionDomainName,
        ENVIRONMENT: props.environment,
      },
    });

    // Analytics Handler - Generate route analytics
    this.analyticsHandler = new lambdaNodejs.NodejsFunction(this, 'AnalyticsHandler', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: 'services/route-file-service/handlers/analytics/get-analytics.ts',
      handler: 'handler',
      bundling: {
        forceDockerBundling: false,
        externalModules: ['@aws-sdk/*'],
        minify: false,
        sourceMap: false,
      },
      role: routeFileRole,
      timeout: cdk.Duration.seconds(30),
      environment: {
        MAIN_TABLE_NAME: props.mainTable.tableName,
        ROUTES_BUCKET_NAME: this.routesBucket.bucketName,
        CLOUDFRONT_DOMAIN: this.distribution.distributionDomainName,
        ENVIRONMENT: props.environment,
      },
    });

    // S3 Event Rule for automatic file processing
    const s3EventRule = new events.Rule(this, 'S3UploadRule', {
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: {
          bucket: {
            name: [this.routesBucket.bucketName],
          },
          object: {
            key: [{ prefix: 'gpx-files/' }],
          },
        },
      },
    });

    s3EventRule.addTarget(new targets.LambdaFunction(this.fileProcessingHandler));

    // Grant S3 bucket permissions to Lambda functions
    this.routesBucket.grantReadWrite(this.fileUploadHandler);
    this.routesBucket.grantReadWrite(this.fileProcessingHandler);
    this.routesBucket.grantRead(this.fileDownloadHandler);
    this.routesBucket.grantRead(this.analyticsHandler);

    // Output important values
    new cdk.CfnOutput(this, 'RoutesBucketName', {
      value: this.routesBucket.bucketName,
      description: 'S3 bucket for route files',
    });

    new cdk.CfnOutput(this, 'RoutesDistributionDomain', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront distribution domain for route files',
    });

    new cdk.CfnOutput(this, 'RoutesDistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront distribution ID',
    });
  }
}