import AWS from 'aws-sdk';
export declare function createDynamoClient(region?: string): AWS.DynamoDB;
export declare function createSSM(region?: string): AWS.SSM;
export declare function getSecureJsonParam(path: string): Promise<any>;
