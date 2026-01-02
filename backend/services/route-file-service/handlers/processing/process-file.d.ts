import { APIGatewayProxyEvent, APIGatewayProxyResult, S3Event } from 'aws-lambda';
export declare const handler: (event: APIGatewayProxyEvent | S3Event) => Promise<APIGatewayProxyResult | void>;
