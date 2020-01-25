export declare const logger: any;
export declare function envStr(key: string): string;
export declare function flatMap<A, T>(arr: A[], mapper: (param: A) => T[]): T[];
export declare function arnSlice(arn: string, start?: number | undefined, end?: number | undefined): string;
/**
 * Parses 'resourcetype/resource' or 'resource' (but not resourcetype:resource)
 * https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html#genref-arns
 */
export declare type ArnResource = {
    type: string | undefined;
    resource: string;
};
export declare function arnResource(arn: string): ArnResource;
export declare function nameFromArn(arn: string): string;
