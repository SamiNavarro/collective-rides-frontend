import { Construct } from 'constructs';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { RestApi, Authorizer } from 'aws-cdk-lib/aws-apigateway';
export interface RideServiceProps {
    api: RestApi;
    authorizer: Authorizer;
    mainTable: Table;
    environment: string;
}
export declare class RideService extends Construct {
    constructor(scope: Construct, id: string, props: RideServiceProps);
}
