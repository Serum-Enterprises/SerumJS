import type {Validator, ValidatorClass} from '../Validator';

export interface Definition {
	type: string;
}

export type UnknownDefinition = Definition & Record<string, unknown>;

export type InferDefinitionType<V> = V extends { toJSON(): infer D } ? D : never;

export type InferValidatorInstanceType<C> = C extends ValidatorClass<infer V> ? V : never;

export type InferValidatorReturnType<V> = V extends Validator<infer T> ? T : unknown;

export type InferListDefinitionType<T extends readonly Validator[]> = {
	[K in keyof T]: InferDefinitionType<T[K]>;
};