export type JSON = JSON.JSON;
export declare namespace JSON {
    type Null = null;
    type Boolean = boolean;
    type Number = number;
    type Integer = number;
    type String = string;
    type Array = JSON[];
    type ShallowArray = unknown[];
    type Object = {
        [key: string]: JSON;
    };
    type ShallowObject = {
        [key: string]: unknown;
    };
    type Primitive = Boolean | Number | String;
    type Container = Array | Object;
    type JSON = Null | Primitive | Container;
    function isNull(value: unknown): value is Null;
    function isBoolean(value: unknown): value is Boolean;
    function isNumber(value: unknown): value is Number;
    function isInteger(value: unknown): value is Integer;
    function isString(value: unknown): value is String;
    function isShallowArray(value: unknown): value is ShallowArray;
    function isArray(value: unknown): value is Array;
    function isShallowObject(value: unknown): value is ShallowObject;
    function isObject(value: unknown): value is Object;
    function isPrimitive(value: unknown): value is Primitive;
    function isShallowContainer(value: unknown): value is unknown[] | {
        [key: string]: unknown;
    };
    function isContainer(value: unknown): value is Container;
    function isShallowJSON(value: unknown): value is Null | Boolean | Number | String | unknown[] | {
        [key: string]: unknown;
    };
    function isJSON(value: unknown): value is JSON;
    function clone<T extends JSON = JSON>(value: T): T;
    function parse(value: string): JSON;
    function stringify(value: JSON): string;
}
