export type Null = null;
export type Boolean = boolean;
export type Number = number;
export type Integer = number;
export type String = string;
export type Array = JSON[];
export type ShallowArray = unknown[];
export type Object = {
    [key: string]: JSON;
};
export type ShallowObject = {
    [key: string]: unknown;
};
export type Primitive = Boolean | Number | String;
export type Container = Array | Object;
export type JSON = Null | Primitive | Container;
export declare function isNull(value: unknown): value is Null;
export declare function isBoolean(value: unknown): value is Boolean;
export declare function isNumber(value: unknown): value is Number;
export declare function isInteger(value: unknown): value is Integer;
export declare function isString(value: unknown): value is String;
export declare function isShallowArray(value: unknown): value is ShallowArray;
export declare function isArray(value: unknown): value is Array;
export declare function isShallowObject(value: unknown): value is ShallowObject;
export declare function isObject(value: unknown): value is Object;
export declare function isPrimitive(value: unknown): value is Primitive;
export declare function isShallowContainer(value: unknown): value is unknown[] | {
    [key: string]: unknown;
};
export declare function isContainer(value: unknown): value is Container;
export declare function isShallowJSON(value: unknown): value is Null | Boolean | Number | String | unknown[] | {
    [key: string]: unknown;
};
export declare function isJSON(value: unknown): value is JSON;
export declare function clone<T extends JSON = JSON>(value: T): T;
export declare function parse(value: string): JSON;
export declare function stringify(value: JSON): string;
