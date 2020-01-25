"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_var_1 = __importDefault(require("env-var"));
const bunyan_1 = require("bunyan");
exports.logger = bunyan_1.createLogger({
    name: envStr('SERVICE_NAME'),
});
function envStr(key) {
    return env_var_1.default
        .get(key)
        .required()
        .asString();
}
exports.envStr = envStr;
function flatMap(arr, mapper) {
    const out = [];
    return arr.reduce((prev, x) => prev.concat(mapper(x)), out);
}
exports.flatMap = flatMap;
function arnSlice(arn, start, end) {
    if (arn == null)
        return '';
    return arn
        .split(':')
        .slice(start, end)
        .join(':');
}
exports.arnSlice = arnSlice;
function arnResource(arn) {
    // task-definition/mock-appserver_latest:37
    // targetgroup/alb-group-ecs-appserver-test/8d3735eb21928f06
    const tail = arnSlice(arn, 5);
    const delim = tail.indexOf('/');
    if (delim === -1) {
        // resource only
        return { type: undefined, resource: tail };
    }
    return { type: tail.slice(0, delim), resource: tail.slice(delim + 1) };
}
exports.arnResource = arnResource;
function nameFromArn(arn) {
    return arnResource(arn).resource;
}
exports.nameFromArn = nameFromArn;
//# sourceMappingURL=util.js.map