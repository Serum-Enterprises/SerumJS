import type {Validator} from '../validators/Validator';

export type ApplyNullability<T, N extends boolean> =
	N extends true ? T | null : Exclude<T, null>;

export interface Definition {
	type: string;
}

export type InferValidatorReturnType<V> = V extends Validator<infer T> ? T : unknown;

export type InferDefinitionType<V> = V extends { toJSON(): infer D } ? D : never;

export class AssertError extends Error {}

export class DefinitionError extends Error {}