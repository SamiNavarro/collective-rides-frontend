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
exports.RouteTemplateService = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const lambdaNodejs = __importStar(require("aws-cdk-lib/aws-lambda-nodejs"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const elasticache = __importStar(require("aws-cdk-lib/aws-elasticache"));
const constructs_1 = require("constructs");
class RouteTemplateService extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        // ElastiCache for template search caching (optional for MVP)
        let cacheEndpoint;
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
exports.RouteTemplateService = RouteTemplateService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUtdGVtcGxhdGUtc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJvdXRlLXRlbXBsYXRlLXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsK0RBQWlEO0FBQ2pELDRFQUE4RDtBQUM5RCx5REFBMkM7QUFFM0MseUVBQTJEO0FBRTNELDJDQUF1QztBQVF2QyxNQUFhLG9CQUFxQixTQUFRLHNCQUFTO0lBS2pELFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBZ0M7UUFDeEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQiw2REFBNkQ7UUFDN0QsSUFBSSxhQUFpQyxDQUFDO1FBQ3RDLElBQUksS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNiLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxXQUFXLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtnQkFDaEYsV0FBVyxFQUFFLHVDQUF1QztnQkFDcEQsU0FBUyxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUM7YUFDbkUsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLFdBQVcsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtnQkFDekUsYUFBYSxFQUFFLGdCQUFnQjtnQkFDL0IsTUFBTSxFQUFFLE9BQU87Z0JBQ2YsYUFBYSxFQUFFLENBQUM7Z0JBQ2hCLG9CQUFvQixFQUFFLGdCQUFnQixDQUFDLEdBQUc7Z0JBQzFDLG1CQUFtQixFQUFFLEVBQUUsRUFBRSx3Q0FBd0M7YUFDbEUsQ0FBQyxDQUFDO1lBRUgsYUFBYSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsd0JBQXdCLENBQUM7U0FDNUQ7UUFFRCx5Q0FBeUM7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QztRQUVILG1DQUFtQztRQUNuQyxJQUFJLGFBQWEsRUFBRTtZQUNqQixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLHVCQUF1QixFQUFFO2dCQUMvQyxLQUFLLEVBQUUsYUFBYTtnQkFDcEIsV0FBVyxFQUFFLDJDQUEyQzthQUN6RCxDQUFDLENBQUM7U0FDSjtJQUNILENBQUM7Q0FDRjtBQTVHRCxvREE0R0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgbGFtYmRhTm9kZWpzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEtbm9kZWpzJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBlbGFzdGljYWNoZSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWxhc3RpY2FjaGUnO1xuaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUm91dGVUZW1wbGF0ZVNlcnZpY2VQcm9wcyB7XG4gIG1haW5UYWJsZTogZHluYW1vZGIuVGFibGU7XG4gIHZwYz86IGVjMi5WcGM7XG4gIGVudmlyb25tZW50OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBSb3V0ZVRlbXBsYXRlU2VydmljZSBleHRlbmRzIENvbnN0cnVjdCB7XG4gIHB1YmxpYyByZWFkb25seSB0ZW1wbGF0ZUhhbmRsZXI6IGxhbWJkYS5GdW5jdGlvbjtcbiAgcHVibGljIHJlYWRvbmx5IHNlYXJjaEhhbmRsZXI6IGxhbWJkYS5GdW5jdGlvbjtcbiAgcHVibGljIHJlYWRvbmx5IGNhY2hlQ2x1c3Rlcj86IGVsYXN0aWNhY2hlLkNmbkNhY2hlQ2x1c3RlcjtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogUm91dGVUZW1wbGF0ZVNlcnZpY2VQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICAvLyBFbGFzdGlDYWNoZSBmb3IgdGVtcGxhdGUgc2VhcmNoIGNhY2hpbmcgKG9wdGlvbmFsIGZvciBNVlApXG4gICAgbGV0IGNhY2hlRW5kcG9pbnQ6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICBpZiAocHJvcHMudnBjKSB7XG4gICAgICBjb25zdCBjYWNoZVN1Ym5ldEdyb3VwID0gbmV3IGVsYXN0aWNhY2hlLkNmblN1Ym5ldEdyb3VwKHRoaXMsICdDYWNoZVN1Ym5ldEdyb3VwJywge1xuICAgICAgICBkZXNjcmlwdGlvbjogJ1N1Ym5ldCBncm91cCBmb3Igcm91dGUgdGVtcGxhdGUgY2FjaGUnLFxuICAgICAgICBzdWJuZXRJZHM6IHByb3BzLnZwYy5wcml2YXRlU3VibmV0cy5tYXAoc3VibmV0ID0+IHN1Ym5ldC5zdWJuZXRJZCksXG4gICAgICB9KTtcblxuICAgICAgdGhpcy5jYWNoZUNsdXN0ZXIgPSBuZXcgZWxhc3RpY2FjaGUuQ2ZuQ2FjaGVDbHVzdGVyKHRoaXMsICdUZW1wbGF0ZUNhY2hlJywge1xuICAgICAgICBjYWNoZU5vZGVUeXBlOiAnY2FjaGUudDMubWljcm8nLFxuICAgICAgICBlbmdpbmU6ICdyZWRpcycsXG4gICAgICAgIG51bUNhY2hlTm9kZXM6IDEsXG4gICAgICAgIGNhY2hlU3VibmV0R3JvdXBOYW1lOiBjYWNoZVN1Ym5ldEdyb3VwLnJlZixcbiAgICAgICAgdnBjU2VjdXJpdHlHcm91cElkczogW10sIC8vIFdpbGwgYmUgY29uZmlndXJlZCBpZiBWUEMgaXMgcHJvdmlkZWRcbiAgICAgIH0pO1xuXG4gICAgICBjYWNoZUVuZHBvaW50ID0gdGhpcy5jYWNoZUNsdXN0ZXIuYXR0clJlZGlzRW5kcG9pbnRBZGRyZXNzO1xuICAgIH1cblxuICAgIC8vIElBTSByb2xlIGZvciB0ZW1wbGF0ZSBMYW1iZGEgZnVuY3Rpb25zXG4gICAgY29uc3QgdGVtcGxhdGVSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdUZW1wbGF0ZVJvbGUnLCB7XG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnbGFtYmRhLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgIG1hbmFnZWRQb2xpY2llczogW1xuICAgICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ3NlcnZpY2Utcm9sZS9BV1NMYW1iZGFCYXNpY0V4ZWN1dGlvblJvbGUnKSxcbiAgICAgICAgLi4uKHByb3BzLnZwYyA/IFtpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ3NlcnZpY2Utcm9sZS9BV1NMYW1iZGFWUENBY2Nlc3NFeGVjdXRpb25Sb2xlJyldIDogW10pLFxuICAgICAgXSxcbiAgICAgIGlubGluZVBvbGljaWVzOiB7XG4gICAgICAgIFRlbXBsYXRlUG9saWN5OiBuZXcgaWFtLlBvbGljeURvY3VtZW50KHtcbiAgICAgICAgICBzdGF0ZW1lbnRzOiBbXG4gICAgICAgICAgICAvLyBEeW5hbW9EQiBwZXJtaXNzaW9uc1xuICAgICAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICAnZHluYW1vZGI6R2V0SXRlbScsXG4gICAgICAgICAgICAgICAgJ2R5bmFtb2RiOlB1dEl0ZW0nLFxuICAgICAgICAgICAgICAgICdkeW5hbW9kYjpVcGRhdGVJdGVtJyxcbiAgICAgICAgICAgICAgICAnZHluYW1vZGI6RGVsZXRlSXRlbScsXG4gICAgICAgICAgICAgICAgJ2R5bmFtb2RiOlF1ZXJ5JyxcbiAgICAgICAgICAgICAgICAnZHluYW1vZGI6U2NhbicsXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIHJlc291cmNlczogW1xuICAgICAgICAgICAgICAgIHByb3BzLm1haW5UYWJsZS50YWJsZUFybixcbiAgICAgICAgICAgICAgICBgJHtwcm9wcy5tYWluVGFibGUudGFibGVBcm59L2luZGV4LypgLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gVGVtcGxhdGUgTWFuYWdlbWVudCBIYW5kbGVyXG4gICAgdGhpcy50ZW1wbGF0ZUhhbmRsZXIgPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdUZW1wbGF0ZUhhbmRsZXInLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjRfWCxcbiAgICAgIGVudHJ5OiAnc2VydmljZXMvcm91dGUtdGVtcGxhdGUtc2VydmljZS9oYW5kbGVycy90ZW1wbGF0ZS1tYW5hZ2VtZW50LnRzJyxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBtaW5pZnk6IGZhbHNlLFxuICAgICAgICBzb3VyY2VNYXA6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHJvbGU6IHRlbXBsYXRlUm9sZSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgIHZwYzogcHJvcHMudnBjLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgTUFJTl9UQUJMRV9OQU1FOiBwcm9wcy5tYWluVGFibGUudGFibGVOYW1lLFxuICAgICAgICBDQUNIRV9FTkRQT0lOVDogY2FjaGVFbmRwb2ludCB8fCAnJyxcbiAgICAgICAgRU5WSVJPTk1FTlQ6IHByb3BzLmVudmlyb25tZW50LFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIFRlbXBsYXRlIFNlYXJjaCBIYW5kbGVyXG4gICAgdGhpcy5zZWFyY2hIYW5kbGVyID0gbmV3IGxhbWJkYU5vZGVqcy5Ob2RlanNGdW5jdGlvbih0aGlzLCAnU2VhcmNoSGFuZGxlcicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yNF9YLFxuICAgICAgZW50cnk6ICdzZXJ2aWNlcy9yb3V0ZS10ZW1wbGF0ZS1zZXJ2aWNlL2hhbmRsZXJzL3RlbXBsYXRlLXNlYXJjaC50cycsXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcicsXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgbWluaWZ5OiBmYWxzZSxcbiAgICAgICAgc291cmNlTWFwOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICByb2xlOiB0ZW1wbGF0ZVJvbGUsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICB2cGM6IHByb3BzLnZwYyxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIE1BSU5fVEFCTEVfTkFNRTogcHJvcHMubWFpblRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgQ0FDSEVfRU5EUE9JTlQ6IGNhY2hlRW5kcG9pbnQgfHwgJycsXG4gICAgICAgIEVOVklST05NRU5UOiBwcm9wcy5lbnZpcm9ubWVudCxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBPdXRwdXQgY2FjaGUgZW5kcG9pbnQgaWYgY3JlYXRlZFxuICAgIGlmIChjYWNoZUVuZHBvaW50KSB7XG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVGVtcGxhdGVDYWNoZUVuZHBvaW50Jywge1xuICAgICAgICB2YWx1ZTogY2FjaGVFbmRwb2ludCxcbiAgICAgICAgZGVzY3JpcHRpb246ICdFbGFzdGlDYWNoZSBlbmRwb2ludCBmb3IgdGVtcGxhdGUgY2FjaGluZycsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn0iXX0=