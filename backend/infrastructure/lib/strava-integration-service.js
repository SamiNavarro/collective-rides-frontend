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
exports.StravaIntegrationService = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const kms = __importStar(require("aws-cdk-lib/aws-kms"));
const path = __importStar(require("path"));
const constructs_1 = require("constructs");
const aws_lambda_nodejs_1 = require("aws-cdk-lib/aws-lambda-nodejs");
class StravaIntegrationService extends constructs_1.Construct {
    constructor(scope, id, props) {
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
        this.oauthConnectFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'OAuthConnectFunction', {
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
        this.oauthCallbackFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'OAuthCallbackFunction', {
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
        this.webhookFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'WebhookFunction', {
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
    setupApiRoutes(api) {
        // /integrations/strava routes
        const integrationsResource = api.root.getResource('integrations') ||
            api.root.addResource('integrations');
        const stravaResource = integrationsResource.addResource('strava');
        // GET /integrations/strava/connect
        stravaResource.addResource('connect').addMethod('GET', new apigateway.LambdaIntegration(this.oauthConnectFunction));
        // GET /integrations/strava/callback
        stravaResource.addResource('callback').addMethod('GET', new apigateway.LambdaIntegration(this.oauthCallbackFunction));
        // POST /integrations/strava/webhook (public endpoint)
        const webhookResource = stravaResource.addResource('webhook');
        webhookResource.addMethod('GET', new apigateway.LambdaIntegration(this.webhookFunction));
        webhookResource.addMethod('POST', new apigateway.LambdaIntegration(this.webhookFunction));
    }
}
exports.StravaIntegrationService = StravaIntegrationService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyYXZhLWludGVncmF0aW9uLXNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzdHJhdmEtaW50ZWdyYXRpb24tc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQywrREFBaUQ7QUFDakQsdUVBQXlEO0FBRXpELHlEQUEyQztBQUMzQywyQ0FBNkI7QUFDN0IsMkNBQXVDO0FBQ3ZDLHFFQUErRDtBQVEvRCxNQUFhLHdCQUF5QixTQUFRLHNCQUFTO0lBTXJELFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBb0M7UUFDNUUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQixzQ0FBc0M7UUFDdEMsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsMEJBQTBCLEVBQUU7WUFDdEUsV0FBVyxFQUFFLDRDQUE0QztZQUN6RCxpQkFBaUIsRUFBRSxJQUFJO1NBQ3hCLENBQUMsQ0FBQztRQUVILCtCQUErQjtRQUMvQixNQUFNLGlCQUFpQixHQUFHO1lBQ3hCLGVBQWUsRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLFNBQVM7WUFDMUMsVUFBVSxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLO1lBQ3pDLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLElBQUksRUFBRTtZQUNwRCxvQkFBb0IsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixJQUFJLEVBQUU7WUFDNUQsbUJBQW1CLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsSUFBSSxFQUFFO1lBQzFELDJCQUEyQixFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLElBQUksRUFBRTtTQUMzRSxDQUFDO1FBRUYseUJBQXlCO1FBQ3pCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLGtDQUFjLENBQUMsSUFBSSxFQUFFLHNCQUFzQixFQUFFO1lBQzNFLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsT0FBTyxFQUFFLFNBQVM7WUFDbEIsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLHFFQUFxRSxDQUFDO1lBQ2xHLFdBQVcsRUFBRSxpQkFBaUI7WUFDOUIsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNqQyxRQUFRLEVBQUU7Z0JBQ1IsZUFBZSxFQUFFLENBQUMsU0FBUyxDQUFDO2dCQUM1QixNQUFNLEVBQUUsSUFBSTtnQkFDWixTQUFTLEVBQUUsSUFBSTthQUNoQjtTQUNGLENBQUMsQ0FBQztRQUVILDBCQUEwQjtRQUMxQixJQUFJLENBQUMscUJBQXFCLEdBQUcsSUFBSSxrQ0FBYyxDQUFDLElBQUksRUFBRSx1QkFBdUIsRUFBRTtZQUM3RSxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLE9BQU8sRUFBRSxTQUFTO1lBQ2xCLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxzRUFBc0UsQ0FBQztZQUNuRyxXQUFXLEVBQUUsaUJBQWlCO1lBQzlCLE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDakMsUUFBUSxFQUFFO2dCQUNSLGVBQWUsRUFBRSxDQUFDLFNBQVMsQ0FBQztnQkFDNUIsTUFBTSxFQUFFLElBQUk7Z0JBQ1osU0FBUyxFQUFFLElBQUk7YUFDaEI7U0FDRixDQUFDLENBQUM7UUFFSCxtQkFBbUI7UUFDbkIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLGtDQUFjLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQ2pFLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsT0FBTyxFQUFFLFNBQVM7WUFDbEIsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLHVFQUF1RSxDQUFDO1lBQ3BHLFdBQVcsRUFBRSxpQkFBaUI7WUFDOUIsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNqQyxRQUFRLEVBQUU7Z0JBQ1IsZUFBZSxFQUFFLENBQUMsU0FBUyxDQUFDO2dCQUM1QixNQUFNLEVBQUUsSUFBSTtnQkFDWixTQUFTLEVBQUUsSUFBSTthQUNoQjtTQUNGLENBQUMsQ0FBQztRQUVILG9CQUFvQjtRQUNwQixLQUFLLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQzlELEtBQUssQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDL0QsS0FBSyxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7UUFFekQsSUFBSSxDQUFDLGtCQUFrQixDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQ3hFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7UUFFbEUsMEJBQTBCO1FBQzFCLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFTyxjQUFjLENBQUMsR0FBdUI7UUFDNUMsOEJBQThCO1FBQzlCLE1BQU0sb0JBQW9CLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDO1lBQy9ELEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sY0FBYyxHQUFHLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVsRSxtQ0FBbUM7UUFDbkMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUNuRCxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FDNUQsQ0FBQztRQUVGLG9DQUFvQztRQUNwQyxjQUFjLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQ3BELElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUM3RCxDQUFDO1FBRUYsc0RBQXNEO1FBQ3RELE1BQU0sZUFBZSxHQUFHLGNBQWMsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDOUQsZUFBZSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQzdCLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FDdkQsQ0FBQztRQUNGLGVBQWUsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUM5QixJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQ3ZELENBQUM7SUFDSixDQUFDO0NBQ0Y7QUF4R0QsNERBd0dDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIGttcyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mta21zJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCB7IE5vZGVqc0Z1bmN0aW9uIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYS1ub2RlanMnO1xuXG5pbnRlcmZhY2UgU3RyYXZhSW50ZWdyYXRpb25TZXJ2aWNlUHJvcHMge1xuICBhcGk6IGFwaWdhdGV3YXkuUmVzdEFwaTtcbiAgbWFpblRhYmxlOiBkeW5hbW9kYi5UYWJsZTtcbiAgZW52aXJvbm1lbnQ6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFN0cmF2YUludGVncmF0aW9uU2VydmljZSBleHRlbmRzIENvbnN0cnVjdCB7XG4gIHB1YmxpYyByZWFkb25seSBvYXV0aENvbm5lY3RGdW5jdGlvbjogTm9kZWpzRnVuY3Rpb247XG4gIHB1YmxpYyByZWFkb25seSBvYXV0aENhbGxiYWNrRnVuY3Rpb246IE5vZGVqc0Z1bmN0aW9uO1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViaG9va0Z1bmN0aW9uOiBOb2RlanNGdW5jdGlvbjtcbiAgcHVibGljIHJlYWRvbmx5IHRva2VuRW5jcnlwdGlvbktleToga21zLktleTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogU3RyYXZhSW50ZWdyYXRpb25TZXJ2aWNlUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgLy8gQ3JlYXRlIEtNUyBrZXkgZm9yIHRva2VuIGVuY3J5cHRpb25cbiAgICB0aGlzLnRva2VuRW5jcnlwdGlvbktleSA9IG5ldyBrbXMuS2V5KHRoaXMsICdTdHJhdmFUb2tlbkVuY3J5cHRpb25LZXknLCB7XG4gICAgICBkZXNjcmlwdGlvbjogJ0tNUyBrZXkgZm9yIGVuY3J5cHRpbmcgU3RyYXZhIE9BdXRoIHRva2VucycsXG4gICAgICBlbmFibGVLZXlSb3RhdGlvbjogdHJ1ZSxcbiAgICB9KTtcblxuICAgIC8vIENvbW1vbiBlbnZpcm9ubWVudCB2YXJpYWJsZXNcbiAgICBjb25zdCBjb21tb25FbnZpcm9ubWVudCA9IHtcbiAgICAgIE1BSU5fVEFCTEVfTkFNRTogcHJvcHMubWFpblRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIEtNU19LRVlfSUQ6IHRoaXMudG9rZW5FbmNyeXB0aW9uS2V5LmtleUlkLFxuICAgICAgU1RSQVZBX0NMSUVOVF9JRDogcHJvY2Vzcy5lbnYuU1RSQVZBX0NMSUVOVF9JRCB8fCAnJyxcbiAgICAgIFNUUkFWQV9DTElFTlRfU0VDUkVUOiBwcm9jZXNzLmVudi5TVFJBVkFfQ0xJRU5UX1NFQ1JFVCB8fCAnJyxcbiAgICAgIFNUUkFWQV9SRURJUkVDVF9VUkk6IHByb2Nlc3MuZW52LlNUUkFWQV9SRURJUkVDVF9VUkkgfHwgJycsXG4gICAgICBTVFJBVkFfV0VCSE9PS19WRVJJRllfVE9LRU46IHByb2Nlc3MuZW52LlNUUkFWQV9XRUJIT09LX1ZFUklGWV9UT0tFTiB8fCAnJyxcbiAgICB9O1xuXG4gICAgLy8gT0F1dGggQ29ubmVjdCBGdW5jdGlvblxuICAgIHRoaXMub2F1dGhDb25uZWN0RnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ09BdXRoQ29ubmVjdEZ1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzI0X1gsXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcicsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uL3NlcnZpY2VzL3N0cmF2YS1pbnRlZ3JhdGlvbi1zZXJ2aWNlL2hhbmRsZXJzL29hdXRoL2Nvbm5lY3QudHMnKSxcbiAgICAgIGVudmlyb25tZW50OiBjb21tb25FbnZpcm9ubWVudCxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydhd3Mtc2RrJ10sXG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIE9BdXRoIENhbGxiYWNrIEZ1bmN0aW9uXG4gICAgdGhpcy5vYXV0aENhbGxiYWNrRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ09BdXRoQ2FsbGJhY2tGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yNF9YLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zZXJ2aWNlcy9zdHJhdmEtaW50ZWdyYXRpb24tc2VydmljZS9oYW5kbGVycy9vYXV0aC9jYWxsYmFjay50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IGNvbW1vbkVudmlyb25tZW50LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ2F3cy1zZGsnXSxcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gV2ViaG9vayBGdW5jdGlvblxuICAgIHRoaXMud2ViaG9va0Z1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdXZWJob29rRnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjRfWCxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc2VydmljZXMvc3RyYXZhLWludGVncmF0aW9uLXNlcnZpY2UvaGFuZGxlcnMvd2ViaG9vay93ZWJob29rLnRzJyksXG4gICAgICBlbnZpcm9ubWVudDogY29tbW9uRW52aXJvbm1lbnQsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnYXdzLXNkayddLFxuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBHcmFudCBwZXJtaXNzaW9uc1xuICAgIHByb3BzLm1haW5UYWJsZS5ncmFudFJlYWRXcml0ZURhdGEodGhpcy5vYXV0aENvbm5lY3RGdW5jdGlvbik7XG4gICAgcHJvcHMubWFpblRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YSh0aGlzLm9hdXRoQ2FsbGJhY2tGdW5jdGlvbik7XG4gICAgcHJvcHMubWFpblRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YSh0aGlzLndlYmhvb2tGdW5jdGlvbik7XG5cbiAgICB0aGlzLnRva2VuRW5jcnlwdGlvbktleS5ncmFudEVuY3J5cHREZWNyeXB0KHRoaXMub2F1dGhDYWxsYmFja0Z1bmN0aW9uKTtcbiAgICB0aGlzLnRva2VuRW5jcnlwdGlvbktleS5ncmFudEVuY3J5cHREZWNyeXB0KHRoaXMud2ViaG9va0Z1bmN0aW9uKTtcblxuICAgIC8vIEFQSSBHYXRld2F5IEludGVncmF0aW9uXG4gICAgdGhpcy5zZXR1cEFwaVJvdXRlcyhwcm9wcy5hcGkpO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXR1cEFwaVJvdXRlcyhhcGk6IGFwaWdhdGV3YXkuUmVzdEFwaSk6IHZvaWQge1xuICAgIC8vIC9pbnRlZ3JhdGlvbnMvc3RyYXZhIHJvdXRlc1xuICAgIGNvbnN0IGludGVncmF0aW9uc1Jlc291cmNlID0gYXBpLnJvb3QuZ2V0UmVzb3VyY2UoJ2ludGVncmF0aW9ucycpIHx8IFxuICAgICAgYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2ludGVncmF0aW9ucycpO1xuICAgIGNvbnN0IHN0cmF2YVJlc291cmNlID0gaW50ZWdyYXRpb25zUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3N0cmF2YScpO1xuXG4gICAgLy8gR0VUIC9pbnRlZ3JhdGlvbnMvc3RyYXZhL2Nvbm5lY3RcbiAgICBzdHJhdmFSZXNvdXJjZS5hZGRSZXNvdXJjZSgnY29ubmVjdCcpLmFkZE1ldGhvZCgnR0VUJywgXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih0aGlzLm9hdXRoQ29ubmVjdEZ1bmN0aW9uKVxuICAgICk7XG5cbiAgICAvLyBHRVQgL2ludGVncmF0aW9ucy9zdHJhdmEvY2FsbGJhY2tcbiAgICBzdHJhdmFSZXNvdXJjZS5hZGRSZXNvdXJjZSgnY2FsbGJhY2snKS5hZGRNZXRob2QoJ0dFVCcsIFxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odGhpcy5vYXV0aENhbGxiYWNrRnVuY3Rpb24pXG4gICAgKTtcblxuICAgIC8vIFBPU1QgL2ludGVncmF0aW9ucy9zdHJhdmEvd2ViaG9vayAocHVibGljIGVuZHBvaW50KVxuICAgIGNvbnN0IHdlYmhvb2tSZXNvdXJjZSA9IHN0cmF2YVJlc291cmNlLmFkZFJlc291cmNlKCd3ZWJob29rJyk7XG4gICAgd2ViaG9va1Jlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih0aGlzLndlYmhvb2tGdW5jdGlvbilcbiAgICApO1xuICAgIHdlYmhvb2tSZXNvdXJjZS5hZGRNZXRob2QoJ1BPU1QnLCBcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHRoaXMud2ViaG9va0Z1bmN0aW9uKVxuICAgICk7XG4gIH1cbn0iXX0=