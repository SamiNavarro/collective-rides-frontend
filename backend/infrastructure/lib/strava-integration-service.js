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
            entry: '../services/strava-integration-service/handlers/oauth/connect.ts',
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
            entry: '../services/strava-integration-service/handlers/oauth/callback.ts',
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
            entry: '../services/strava-integration-service/handlers/webhook/webhook.ts',
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyYXZhLWludGVncmF0aW9uLXNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzdHJhdmEtaW50ZWdyYXRpb24tc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQywrREFBaUQ7QUFDakQsdUVBQXlEO0FBRXpELHlEQUEyQztBQUMzQywyQ0FBdUM7QUFDdkMscUVBQStEO0FBUS9ELE1BQWEsd0JBQXlCLFNBQVEsc0JBQVM7SUFNckQsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFvQztRQUM1RSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLHNDQUFzQztRQUN0QyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSwwQkFBMEIsRUFBRTtZQUN0RSxXQUFXLEVBQUUsNENBQTRDO1lBQ3pELGlCQUFpQixFQUFFLElBQUk7U0FDeEIsQ0FBQyxDQUFDO1FBRUgsK0JBQStCO1FBQy9CLE1BQU0saUJBQWlCLEdBQUc7WUFDeEIsZUFBZSxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsU0FBUztZQUMxQyxVQUFVLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUs7WUFDekMsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsSUFBSSxFQUFFO1lBQ3BELG9CQUFvQixFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLElBQUksRUFBRTtZQUM1RCxtQkFBbUIsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixJQUFJLEVBQUU7WUFDMUQsMkJBQTJCLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsSUFBSSxFQUFFO1NBQzNFLENBQUM7UUFFRix5QkFBeUI7UUFDekIsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksa0NBQWMsQ0FB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QUFDLENBQUMsU0FBUyxDQUFDLEtBQUssRUFDcEQsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQzdELENBQUM7UUFFRixzREFBc0Q7UUFDdEQsTUFBTSxlQUFlLEdBQUcsY0FBYyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM5RCxlQUFlLENBQUMsU0FBUyxDQUFDLEtBQUssRUFDN0IsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUN2RCxDQUFDO1FBQ0YsZUFBZSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQzlCLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FDdkQsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQXhHRCw0REF3R0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMga21zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1rbXMnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgeyBOb2RlanNGdW5jdGlvbiB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEtbm9kZWpzJztcblxuaW50ZXJmYWNlIFN0cmF2YUludGVncmF0aW9uU2VydmljZVByb3BzIHtcbiAgYXBpOiBhcGlnYXRld2F5LlJlc3RBcGk7XG4gIG1haW5UYWJsZTogZHluYW1vZGIuVGFibGU7XG4gIGVudmlyb25tZW50OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBTdHJhdmFJbnRlZ3JhdGlvblNlcnZpY2UgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBwdWJsaWMgcmVhZG9ubHkgb2F1dGhDb25uZWN0RnVuY3Rpb246IE5vZGVqc0Z1bmN0aW9uO1xuICBwdWJsaWMgcmVhZG9ubHkgb2F1dGhDYWxsYmFja0Z1bmN0aW9uOiBOb2RlanNGdW5jdGlvbjtcbiAgcHVibGljIHJlYWRvbmx5IHdlYmhvb2tGdW5jdGlvbjogTm9kZWpzRnVuY3Rpb247XG4gIHB1YmxpYyByZWFkb25seSB0b2tlbkVuY3J5cHRpb25LZXk6IGttcy5LZXk7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IFN0cmF2YUludGVncmF0aW9uU2VydmljZVByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIC8vIENyZWF0ZSBLTVMga2V5IGZvciB0b2tlbiBlbmNyeXB0aW9uXG4gICAgdGhpcy50b2tlbkVuY3J5cHRpb25LZXkgPSBuZXcga21zLktleSh0aGlzLCAnU3RyYXZhVG9rZW5FbmNyeXB0aW9uS2V5Jywge1xuICAgICAgZGVzY3JpcHRpb246ICdLTVMga2V5IGZvciBlbmNyeXB0aW5nIFN0cmF2YSBPQXV0aCB0b2tlbnMnLFxuICAgICAgZW5hYmxlS2V5Um90YXRpb246IHRydWUsXG4gICAgfSk7XG5cbiAgICAvLyBDb21tb24gZW52aXJvbm1lbnQgdmFyaWFibGVzXG4gICAgY29uc3QgY29tbW9uRW52aXJvbm1lbnQgPSB7XG4gICAgICBNQUlOX1RBQkxFX05BTUU6IHByb3BzLm1haW5UYWJsZS50YWJsZU5hbWUsXG4gICAgICBLTVNfS0VZX0lEOiB0aGlzLnRva2VuRW5jcnlwdGlvbktleS5rZXlJZCxcbiAgICAgIFNUUkFWQV9DTElFTlRfSUQ6IHByb2Nlc3MuZW52LlNUUkFWQV9DTElFTlRfSUQgfHwgJycsXG4gICAgICBTVFJBVkFfQ0xJRU5UX1NFQ1JFVDogcHJvY2Vzcy5lbnYuU1RSQVZBX0NMSUVOVF9TRUNSRVQgfHwgJycsXG4gICAgICBTVFJBVkFfUkVESVJFQ1RfVVJJOiBwcm9jZXNzLmVudi5TVFJBVkFfUkVESVJFQ1RfVVJJIHx8ICcnLFxuICAgICAgU1RSQVZBX1dFQkhPT0tfVkVSSUZZX1RPS0VOOiBwcm9jZXNzLmVudi5TVFJBVkFfV0VCSE9PS19WRVJJRllfVE9LRU4gfHwgJycsXG4gICAgfTtcblxuICAgIC8vIE9BdXRoIENvbm5lY3QgRnVuY3Rpb25cbiAgICB0aGlzLm9hdXRoQ29ubmVjdEZ1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdPQXV0aENvbm5lY3RGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yNF9YLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgICAgZW50cnk6ICcuLi9zZXJ2aWNlcy9zdHJhdmEtaW50ZWdyYXRpb24tc2VydmljZS9oYW5kbGVycy9vYXV0aC9jb25uZWN0LnRzJyxcbiAgICAgIGVudmlyb25tZW50OiBjb21tb25FbnZpcm9ubWVudCxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydhd3Mtc2RrJ10sXG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIE9BdXRoIENhbGxiYWNrIEZ1bmN0aW9uXG4gICAgdGhpcy5vYXV0aENhbGxiYWNrRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ09BdXRoQ2FsbGJhY2tGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yNF9YLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgICAgZW50cnk6ICcuLi9zZXJ2aWNlcy9zdHJhdmEtaW50ZWdyYXRpb24tc2VydmljZS9oYW5kbGVycy9vYXV0aC9jYWxsYmFjay50cycsXG4gICAgICBlbnZpcm9ubWVudDogY29tbW9uRW52aXJvbm1lbnQsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnYXdzLXNkayddLFxuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBXZWJob29rIEZ1bmN0aW9uXG4gICAgdGhpcy53ZWJob29rRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ1dlYmhvb2tGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yNF9YLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgICAgZW50cnk6ICcuLi9zZXJ2aWNlcy9zdHJhdmEtaW50ZWdyYXRpb24tc2VydmljZS9oYW5kbGVycy93ZWJob29rL3dlYmhvb2sudHMnLFxuICAgICAgZW52aXJvbm1lbnQ6IGNvbW1vbkVudmlyb25tZW50LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ2F3cy1zZGsnXSxcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgcGVybWlzc2lvbnNcbiAgICBwcm9wcy5tYWluVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKHRoaXMub2F1dGhDb25uZWN0RnVuY3Rpb24pO1xuICAgIHByb3BzLm1haW5UYWJsZS5ncmFudFJlYWRXcml0ZURhdGEodGhpcy5vYXV0aENhbGxiYWNrRnVuY3Rpb24pO1xuICAgIHByb3BzLm1haW5UYWJsZS5ncmFudFJlYWRXcml0ZURhdGEodGhpcy53ZWJob29rRnVuY3Rpb24pO1xuXG4gICAgdGhpcy50b2tlbkVuY3J5cHRpb25LZXkuZ3JhbnRFbmNyeXB0RGVjcnlwdCh0aGlzLm9hdXRoQ2FsbGJhY2tGdW5jdGlvbik7XG4gICAgdGhpcy50b2tlbkVuY3J5cHRpb25LZXkuZ3JhbnRFbmNyeXB0RGVjcnlwdCh0aGlzLndlYmhvb2tGdW5jdGlvbik7XG5cbiAgICAvLyBBUEkgR2F0ZXdheSBJbnRlZ3JhdGlvblxuICAgIHRoaXMuc2V0dXBBcGlSb3V0ZXMocHJvcHMuYXBpKTtcbiAgfVxuXG4gIHByaXZhdGUgc2V0dXBBcGlSb3V0ZXMoYXBpOiBhcGlnYXRld2F5LlJlc3RBcGkpOiB2b2lkIHtcbiAgICAvLyAvaW50ZWdyYXRpb25zL3N0cmF2YSByb3V0ZXNcbiAgICBjb25zdCBpbnRlZ3JhdGlvbnNSZXNvdXJjZSA9IGFwaS5yb290LmdldFJlc291cmNlKCdpbnRlZ3JhdGlvbnMnKSB8fCBcbiAgICAgIGFwaS5yb290LmFkZFJlc291cmNlKCdpbnRlZ3JhdGlvbnMnKTtcbiAgICBjb25zdCBzdHJhdmFSZXNvdXJjZSA9IGludGVncmF0aW9uc1Jlc291cmNlLmFkZFJlc291cmNlKCdzdHJhdmEnKTtcblxuICAgIC8vIEdFVCAvaW50ZWdyYXRpb25zL3N0cmF2YS9jb25uZWN0XG4gICAgc3RyYXZhUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ2Nvbm5lY3QnKS5hZGRNZXRob2QoJ0dFVCcsIFxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odGhpcy5vYXV0aENvbm5lY3RGdW5jdGlvbilcbiAgICApO1xuXG4gICAgLy8gR0VUIC9pbnRlZ3JhdGlvbnMvc3RyYXZhL2NhbGxiYWNrXG4gICAgc3RyYXZhUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ2NhbGxiYWNrJykuYWRkTWV0aG9kKCdHRVQnLCBcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHRoaXMub2F1dGhDYWxsYmFja0Z1bmN0aW9uKVxuICAgICk7XG5cbiAgICAvLyBQT1NUIC9pbnRlZ3JhdGlvbnMvc3RyYXZhL3dlYmhvb2sgKHB1YmxpYyBlbmRwb2ludClcbiAgICBjb25zdCB3ZWJob29rUmVzb3VyY2UgPSBzdHJhdmFSZXNvdXJjZS5hZGRSZXNvdXJjZSgnd2ViaG9vaycpO1xuICAgIHdlYmhvb2tSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIFxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odGhpcy53ZWJob29rRnVuY3Rpb24pXG4gICAgKTtcbiAgICB3ZWJob29rUmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih0aGlzLndlYmhvb2tGdW5jdGlvbilcbiAgICApO1xuICB9XG59Il19