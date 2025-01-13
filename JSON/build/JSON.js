"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNull = isNull;
exports.isBoolean = isBoolean;
exports.isNumber = isNumber;
exports.isInteger = isInteger;
exports.isString = isString;
exports.isShallowArray = isShallowArray;
exports.isArray = isArray;
exports.isShallowObject = isShallowObject;
exports.isObject = isObject;
exports.isPrimitive = isPrimitive;
exports.isShallowContainer = isShallowContainer;
exports.isContainer = isContainer;
exports.isShallowJSON = isShallowJSON;
exports.isJSON = isJSON;
exports.clone = clone;
exports.parse = parse;
exports.stringify = stringify;
function isNull(value) {
    return value === null;
}
function isBoolean(value) {
    return typeof value === 'boolean';
}
function isNumber(value) {
    // Using Number.isFinite here as NaN, Infinity and -Infinity are not valid JSON Numbers
    return Number.isFinite(value);
}
function isInteger(value) {
    // Using Number.isSafeInteger here as JS Numbers are 64-bit floating point numbers and not all integers can be represented accurately
    return Number.isSafeInteger(value);
}
function isString(value) {
    return typeof value === 'string';
}
function isShallowArray(value) {
    return Array.isArray(value);
}
function isArray(value) {
    return isShallowArray(value) && value.every((v) => isJSON(v));
}
function isShallowObject(value) {
    // Using Object.prototype.toString.call here as it is the most reliable way to check if something is an Object
    return (Object.prototype.toString.call(value) === '[object Object]');
}
function isObject(value) {
    return isShallowObject(value) && Object.values(value).every((v) => isJSON(v));
}
function isPrimitive(value) {
    return isBoolean(value) || isNumber(value) || isString(value);
}
function isShallowContainer(value) {
    return isShallowArray(value) || isShallowObject(value);
}
function isContainer(value) {
    return isArray(value) || isObject(value);
}
function isShallowJSON(value) {
    return isNull(value) || isPrimitive(value) || isShallowArray(value) || isShallowObject(value);
}
function isJSON(value) {
    return isNull(value) || isPrimitive(value) || isContainer(value);
}
function clone(value) {
    // Using Shallow Checks here as it is expected that value is JSON anyway, and this function is recursive anyway
    if (isShallowObject(value))
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clone(v)]));
    else if (isShallowArray(value))
        return value.map((v) => clone(v));
    else
        return value;
}
// Compatibility Method for the native JSON.parse
function parse(value) {
    return globalThis.JSON.parse(value);
}
// Compatibility Method for the native JSON.stringify
function stringify(value) {
    return globalThis.JSON.stringify(value);
}
