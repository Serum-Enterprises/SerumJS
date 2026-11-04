import type {Domain} from "../Domain";
import type {Validator} from "../validators/Validator";

export type ValidatorConstructor<V extends Validator = Validator> =
	abstract new (...args: any[]) => V;

export interface NormalizeOperation<V extends Validator = Validator> {
	readonly validator: ValidatorConstructor<V>;
	normalize(validator: V, domain: Domain): Validator;
}

export interface MergeOperation<
	L extends Validator = Validator,
	R extends Validator = Validator
> {
	readonly left: ValidatorConstructor<L>;
	readonly right: ValidatorConstructor<R>;
	merge(left: L, right: R, domain: Domain): Validator;
}

export interface ValidatorOperations {
	readonly normalize?: readonly NormalizeOperation<any>[];
	readonly merge?: readonly MergeOperation<any, any>[];
}
