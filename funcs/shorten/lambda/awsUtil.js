"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const util_1 = require("./util");
//
// Generic AWS SDK utils
//
function ensureRegion(region) {
    return region || util_1.envStr('AWS_REGION');
}
function createDynamoClient(region) {
    let ep;
    if (process.env.AWS_SAM_LOCAL == 'true') {
        ep = {
            endpoint: process.env.LOCAL_DDB_ENDPOINT,
        };
    }
    return new aws_sdk_1.default.DynamoDB({
        apiVersion: '2012-08-10',
        region: ensureRegion(region),
        ...ep,
    });
}
exports.createDynamoClient = createDynamoClient;
function createSSM(region) {
    return new aws_sdk_1.default.SSM({ apiVersion: '2014-11-06', region: ensureRegion(region) });
}
exports.createSSM = createSSM;
const ssmClient = createSSM();
async function getSecureJsonParam(path) {
    const res = await ssmClient.getParameter({ Name: path, WithDecryption: true }).promise();
    if (res && res.Parameter && res.Parameter.Value && res.Parameter.Type === 'SecureString') {
        return JSON.parse(res.Parameter.Value);
    }
    throw new Error(`Failed to lookup parameter ${path}`);
}
exports.getSecureJsonParam = getSecureJsonParam;
//# sourceMappingURL=awsUtil.js.map