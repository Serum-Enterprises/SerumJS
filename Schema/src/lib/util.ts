import type {Validator} from '../Validator';

export type ApplyNullability<T, N extends boolean> =
	N extends true ? T | null : Exclude<T, null>;

export interface Definition {
	type: string;
}

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

export class AssertError extends Error {}

export class DefinitionError extends Error {}