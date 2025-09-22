"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSON = void 0;
var JSON;
(function (JSON) {
    function isNull(value) {
        return value === null;
    }
    JSON.isNull = isNull;
    function isBoolean(value) {
        return typeof value === 'boolean';
    }
    JSON.isBoolean = isBoolean;
    function isNumber(value) {
        // Using Number.isFinite here as NaN, Infinity and -Infinity are not valid JSON Numbers
        return Number.isFinite(value);
    }
    JSON.isNumber = isNumber;
    function isInteger(value) {
        // Using Number.isSafeInteger here as JS Numbers are 64-bit floating point numbers and not all integers can be represented accurately
        return Number.isSafeInteger(value);
    }
    JSON.isInteger = isInteger;
    function isString(value) {
        return typeof value === 'string';
    }
    JSON.isString = isString;
    function isShallowArray(value) {
        return Array.isArray(value);
    }
    JSON.isShallowArray = isShallowArray;
    function isArray(value) {
        return isShallowArray(value) && value.every((v) => isJSON(v));
    }
    JSON.isArray = isArray;
    function isShallowObject(value) {
        // Using Object.prototype.toString.call here as it is the most reliable way to check if something is an Object
        return (Object.prototype.toString.call(value) === '[object Object]');
    }
    JSON.isShallowObject = isShallowObject;
    function isObject(value) {
        return isShallowObject(value) && Object.values(value).every((v) => isJSON(v));
    }
    JSON.isObject = isObject;
    function isPrimitive(value) {
        return isBoolean(value) || isNumber(value) || isString(value);
    }
    JSON.isPrimitive = isPrimitive;
    function isShallowContainer(value) {
        return isShallowArray(value) || isShallowObject(value);
    }
    JSON.isShallowContainer = isShallowContainer;
    function isContainer(value) {
        return isArray(value) || isObject(value);
    }
    JSON.isContainer = isContainer;
    function isShallowJSON(value) {
        return isNull(value) || isPrimitive(value) || isShallowArray(value) || isShallowObject(value);
    }
    JSON.isShallowJSON = isShallowJSON;
    function isJSON(value) {
        return isNull(value) || isPrimitive(value) || isContainer(value);
    }
    JSON.isJSON = isJSON;
    function clone(value) {
        // Using Shallow Checks here as it is expected that value is JSON anyway, and this function is recursive anyway
        if (isShallowObject(value))
            return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clone(v)]));
        else if (isShallowArray(value))
            return value.map((v) => clone(v));
        else
            return value;
    }
    JSON.clone = clone;
    // Compatibility Method for the native JSON.parse
    function parse(value) {
        return globalThis.JSON.parse(value);
    }
    JSON.parse = parse;
    // Compatibility Method for the native JSON.stringify
    function stringify(value) {
        return globalThis.JSON.stringify(value);
    }
    JSON.stringify = stringify;
})(JSON || (exports.JSON = JSON = {}));
