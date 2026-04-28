import type {Validator} from '../Validator';

export interface Definition {
	type: string;
}

export type UnknownDefinition = Definition & Record<string, unknown>;

export type InferDefinitionType<V> = V extends { toJSON(): infer D } ? D : never;
export type InferValidatorReturnType<V> = V extends Validator<infer T> ? T : unknown;

export type InferListDefinitionType<T extends readonly Validator[]> = {
	[K in keyof T]: InferDefinitionType<T[K]>;
};
export type InferListReturnType<T> = T extends readonly Validator[] ?
	{ [K in keyof T]: InferValidatorReturnType<T[K]> } :
	unknown;

export type InferObjectDefinitionType<T extends { [key: string]: Validator }> = {
	[K in keyof T]: InferDefinitionType<T[K]>
}
export type InferObjectReturnType<T> = T extends { [key: string]: Validator } ?
	{ [K in keyof T]: InferValidatorReturnType<T[K]> } :
	unknown;

export type JSON = null | boolean | number | string | JSON[] | { [key: string]: JSON };

export function isJSON(value: unknown): value is JSON {
	if(value === null || typeof value === 'boolean' || Number.isFinite(value) || typeof value === 'string')
		return true;

	if(Array.isArray(value))
		return value.every(isJSON);

	if(Object.prototype.toString.call(value) === '[object Object]')
		return Object.entries(value as {[key: string]: unknown}).every(([_, value]) => isJSON(value));

	return false;
}