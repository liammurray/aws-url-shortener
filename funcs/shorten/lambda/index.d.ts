import { APIGatewayEvent } from 'aws-lambda';
/**
 * Lambda CRUD entry point
 */
export declare function urlHandler(event: APIGatewayEvent): Promise<any> | {
    statusCode: number;
    headers: {
        [key: string]: string;
    };
};
export declare function createShortUrlEntry(event: APIGatewayEvent): Promise<{
    statusCode: number;
    headers: {
        [key: string]: string;
    };
} | {
    body: string;
    statusCode: number;
    headers: {
        [key: string]: string;
    };
}>;
export declare function redirect(event: APIGatewayEvent): Promise<{
    statusCode: number;
    headers: {
        [key: string]: string;
    };
}>;
