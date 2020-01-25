import AWS from 'aws-sdk';
/**
 * Using '!' asserts we know property will not be null (strictPropertyInitialization)
 */
export declare class UrlEntry {
    id: number;
    createdAt: Date;
    url: string;
}
/**
 * Access layer built on DynamoDb
 */
export default class Urls {
    private mapper;
    private dbc;
    constructor(client: AWS.DynamoDB);
    getNextCounter(): Promise<number>;
    /**
     * Creates a URL entry with unique ID. Returns ID.
     * Does not check if URL is unique.
     */
    create(url: string): Promise<number>;
    /**
     * Looks up url entry by id
     */
    get(id: number): Promise<UrlEntry | undefined>;
    delete(id: number): Promise<void>;
}
export declare function getUrlsDatabase(): Urls;
