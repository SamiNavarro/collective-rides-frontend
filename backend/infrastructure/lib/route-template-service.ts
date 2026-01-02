import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface RouteTemplateServiceProps {
  mainTable: dynamodb.Table;
  vpc?: ec2.Vpc;
  environment: string;
}

export class RouteTemplateService extends Construct {
  public readonly templateHandler: lambda.Function;
  public readonly searchHandler: lambda.Function;
  public readonly cacheCluster?: elasticache.CfnCacheCluster;

  constructor(scope: Construct, id: string, props: RouteTemplateServiceProps) {
    super(scope, id);

    // ElastiCache for template search caching (optional for MVP)
    let cacheEndpoint: string | undefined;
    if (props.vpc) {
      const cacheSubnetGroup = new elasticache.CfnSubnetGroup(this, 'CacheSubnetGroup', {
        description: 'Subnet group for route template cache',
        subnetIds: props.vpc.privateSubnets.map(subnet => subnet.subnetId),
      });

      this.cacheCluster = new elasticache.CfnCacheCluster(this, 'TemplateCache', {
        cacheNodeType: 'cache.t3.micro',
        engine: 'redis',
        numCacheNodes: 1,
        cacheSubnetGroupName: cacheSubnetGroup.ref,
        vpcSecurityGroupIds: [], // Will be configured if VPC is provided
      });

      cacheEndpoint = this.cacheCluster.attrRedisEndpointAddress;
    }

    // IAM role for template Lambda functions
    const templateRole = new iam.Role(this, 'TemplateRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        ...(props.vpc ? [iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole')] : []),
      ],
      inlinePolicies: {
        TemplatePolicy: new iam.PolicyDocument({
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
          ],
        }),
      },
    });

    // Template Management Handler
    this.templateHandler = new lambdaNodejs.NodejsFunction(this, 'TemplateHandler', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: 'services/route-template-service/handlers/template-management.ts',
      handler: 'handler',
      bundling: {
        forceDockerBundling: false,
        externalModules: ['@aws-sdk/*'],
        minify: false,
        sourceMap: false,
      },
      role: templateRole,
      timeout: cdk.Duration.seconds(30),
      vpc: props.vpc,
      environment: {
        MAIN_TABLE_NAME: props.mainTable.tableName,
        CACHE_ENDPOINT: cacheEndpoint || '',
        ENVIRONMENT: props.environment,
      },
    });

    // Template Search Handler
    this.searchHandler = new lambdaNodejs.NodejsFunction(this, 'SearchHandler', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: 'services/route-template-service/handlers/template-search.ts',
      handler: 'handler',
      bundling: {
        forceDockerBundling: false,
        externalModules: ['@aws-sdk/*'],
        minify: false,
        sourceMap: false,
      },
      role: templateRole,
      timeout: cdk.Duration.seconds(30),
      vpc: props.vpc,
      environment: {
        MAIN_TABLE_NAME: props.mainTable.tableName,
        CACHE_ENDPOINT: cacheEndpoint || '',
        ENVIRONMENT: props.environment,
      },
    });

    // Output cache endpoint if created
    if (cacheEndpoint) {
      new cdk.CfnOutput(this, 'TemplateCacheEndpoint', {
        value: cacheEndpoint,
        description: 'ElastiCache endpoint for template caching',
      });
    }
  }
}