"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const util_1 = require("./util");
const awsUtil_1 = require("./awsUtil");
const dynamodb_data_mapper_1 = require("@aws/dynamodb-data-mapper");
const dynamodb_data_mapper_annotations_1 = require("@aws/dynamodb-data-mapper-annotations");
// import { MathematicalExpression, FunctionExpression, UpdateExpression } from '@aws/dynamodb-expressions'
const lodash_get_1 = __importDefault(require("lodash.get"));
const urlEntriesTableName = util_1.envStr('TABLE_NAME_URL_ENTRIES');
/**
 * Using '!' asserts we know property will not be null (strictPropertyInitialization)
 */
let UrlEntry = class UrlEntry {
};
__decorate([
    dynamodb_data_mapper_annotations_1.hashKey(),
    __metadata("design:type", Number)
], UrlEntry.prototype, "id", void 0);
__decorate([
    dynamodb_data_mapper_annotations_1.attribute({ defaultProvider: () => new Date() }),
    __metadata("design:type", Date)
], UrlEntry.prototype, "createdAt", void 0);
__decorate([
    dynamodb_data_mapper_annotations_1.attribute(),
    __metadata("design:type", String)
], UrlEntry.prototype, "url", void 0);
UrlEntry = __decorate([
    dynamodb_data_mapper_annotations_1.table(urlEntriesTableName)
], UrlEntry);
exports.UrlEntry = UrlEntry;
// We use id 0 as counter (and url stores counter)
// Update item performs upsert
const ID_COUNTER = 0;
const INIT_COUNTER_VALUE = 1000;
/**
 * Access layer built on DynamoDb
 */
class Urls {
    constructor(client) {
        this.mapper = new dynamodb_data_mapper_1.DataMapper({ client });
        this.dbc = new aws_sdk_1.default.DynamoDB.DocumentClient({ service: client });
    }
    async getNextCounter() {
        // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property
        const res = await this.dbc
            .update({
            TableName: urlEntriesTableName,
            Key: { id: ID_COUNTER },
            UpdateExpression: 'SET #val = if_not_exists(#val, :dv) + :incr',
            ExpressionAttributeNames: { '#val': 'url' },
            ExpressionAttributeValues: { ':incr': 1, ':dv': INIT_COUNTER_VALUE },
            ReturnValues: 'UPDATED_NEW',
        })
            .promise();
        const counter = lodash_get_1.default(res, 'Attributes.url');
        if (!counter) {
            throw new Error('Failed to get counter');
        }
        return parseInt(counter);
    }
    // Seems support for func expression as argument not supported in 0.7.3 (not published yet)
    // async getNextCounterX(): Promise<number> {
    //   const expr = new UpdateExpression()
    //   const lhs = new FunctionExpression('if_not_exists', INIT_COUNTER_VALUE)
    //   expr.set('url', new MathematicalExpression(lhs, '+', 1))
    //   const entry = await this.mapper.executeUpdateExpression(expr, { id: ID_COUNTER }, UrlEntry)
    //   return parseInt(entry.url)
    // }
    /**
     * Creates a URL entry with unique ID. Returns ID.
     * Does not check if URL is unique.
     */
    async create(url) {
        util_1.logger.info({ url }, 'create');
        const entry = new UrlEntry();
        entry.id = await this.getNextCounter();
        entry.url = url;
        util_1.logger.info({ entry }, 'Adding entry');
        await this.mapper.put(entry);
        return entry.id;
    }
    /**
     * Looks up url entry by id
     */
    async get(id) {
        const entry = new UrlEntry();
        entry.id = id;
        try {
            return await this.mapper.get(entry);
        }
        catch (err) {
            // ItemNotFoundException
            util_1.logger.info({ err }, 'get');
        }
    }
    async delete(id) {
        const entry = new UrlEntry();
        entry.id = id;
        try {
            await this.mapper.delete(entry);
        }
        catch (err) {
            util_1.logger.info({ err }, 'delete');
        }
    }
}
exports.default = Urls;
let urls;
function getUrlsDatabase() {
    if (!urls) {
        urls = new Urls(awsUtil_1.createDynamoClient());
    }
    return urls;
}
exports.getUrlsDatabase = getUrlsDatabase;
//# sourceMappingURL=urls.js.map