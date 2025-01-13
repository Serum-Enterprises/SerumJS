export type Null = null;
export type Boolean = boolean;
export type Number = number;
export type Integer = number;
export type String = string;
export type Array = JSON[];
export type ShallowArray = unknown[];
export type Object = { [key: string]: JSON };
export type ShallowObject = { [key: string]: unknown };
export type Primitive = Boolean | Number | String;
export type Container = Array | Object;
export type JSON = Null | Primitive | Container;

export function isNull(value: unknown): value is Null {
	return value === null;
}

export function isBoolean(value: unknown): value is Boolean {
	return typeof value === 'boolean';
}

export function isNumber(value: unknown): value is Number {
	// Using Number.isFinite here as NaN, Infinity and -Infinity are not valid JSON Numbers
	return Number.isFinite(value);
}

export function isInteger(value: unknown): value is Integer {
	// Using Number.isSafeInteger here as JS Numbers are 64-bit floating point numbers and not all integers can be represented accurately
	return Number.isSafeInteger(value);
}

export function isString(value: unknown): value is String {
	return typeof value === 'string';
}

export function isShallowArray(value: unknown): value is ShallowArray {
	return Array.isArray(value);
}

export function isArray(value: unknown): value is Array {
	return isShallowArray(value) && value.every((v) => isJSON(v));
}

export function isShallowObject(value: unknown): value is ShallowObject {
	// Using Object.prototype.toString.call here as it is the most reliable way to check if something is an Object
	return (Object.prototype.toString.call(value) === '[object Object]');
}

export function isObject(value: unknown): value is Object {
	return isShallowObject(value) && Object.values(value).every((v) => isJSON(v));
}

export function isPrimitive(value: unknown): value is Primitive {
	return isBoolean(value) || isNumber(value) || isString(value);
}

export function isShallowContainer(value: unknown): value is unknown[] | { [key: string]: unknown } {
	return isShallowArray(value) || isShallowObject(value);
}

export function isContainer(value: unknown): value is Container {
	return isArray(value) || isObject(value);
}

export function isShallowJSON(value: unknown): value is Null | Boolean | Number | String | unknown[] | { [key: string]: unknown } {
	return isNull(value) || isPrimitive(value) || isShallowArray(value) || isShallowObject(value);
}

export function isJSON(value: unknown): value is JSON {
	return isNull(value) || isPrimitive(value) || isContainer(value);
}

export function clone<T extends JSON = JSON>(value: T): T {
	// Using Shallow Checks here as it is expected that value is JSON anyway, and this function is recursive anyway
	if (isShallowObject(value))
		return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clone(v as JSON)])) as T;
	else if (isShallowArray(value))
		return value.map((v) => clone(v)) as T;
	else
		return value;
}

// Compatibility Method for the native JSON.parse
export function parse(value: string): JSON {
	return globalThis.JSON.parse(value);
}

// Compatibility Method for the native JSON.stringify
export function stringify(value: JSON): string {
	return globalThis.JSON.stringify(value);
}