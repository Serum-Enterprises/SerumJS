import type {Validator} from "../validators/Validator";
import type {Domain} from "../Domain";

export interface ValidatorDefinition {
	type: string;
}

export type ValidatorConstructor = abstract new (...args: any[]) => Validator;

export interface Codec {
	readonly type: string;
	readonly validator: ValidatorConstructor;

	fromJSON(
		definition: Record<string, unknown>,
		path: string,
		domain: Domain
	): Validator;

	toJSON(
		validator: Validator,
		domain: Domain
	): ValidatorDefinition;
}
