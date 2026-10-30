import {Validator, type InferValidatorResult, ValidatorDefinition} from "../Validator";
import {AssertError} from "../../lib/errors";

export interface ObjectValidatorDefinition extends ValidatorDefinition {
	type: "object"
	min?: number;
	max?: number;
	every?: ValidatorDefinition;
	shape?: Record<string, ValidatorDefinition>;
	exact?: boolean;
}

interface ObjectValidatorConstraints {
	readonly min?: number;
	readonly max?: number;
	readonly every?: Validator;
	readonly shape?: Readonly<Record<string, Validator>>;
	readonly exact?: boolean;
}

type ShapeValidatorResult<
	SHAPE extends Readonly<Record<string, Validator>>,
	EVERY = unknown
> = {
	-readonly [K in keyof SHAPE]: InferValidatorResult<SHAPE[K]> & EVERY;
};

type ObjectValidatorResult<C extends ObjectValidatorConstraints> =
	C extends {
		readonly shape: infer SHAPE extends Readonly<Record<string, Validator>>;
	}
		? C extends {readonly every: infer EVERY extends Validator}
			? C extends {readonly exact: true}
				? ShapeValidatorResult<SHAPE, InferValidatorResult<EVERY>>
				: ShapeValidatorResult<SHAPE, InferValidatorResult<EVERY>> &
					Record<string, InferValidatorResult<EVERY>>
			: C extends {readonly exact: true}
				? ShapeValidatorResult<SHAPE>
				: ShapeValidatorResult<SHAPE> & Record<string, unknown>
		: C extends {readonly every: infer EVERY extends Validator}
			? C extends {readonly exact: true}
				? Record<string, never>
				: Record<string, InferValidatorResult<EVERY>>
			: C extends {readonly exact: true}
				? Record<string, never>
				: Record<string, unknown>;

export class ObjectValidator<
	const C extends ObjectValidatorConstraints = {}
> extends Validator<ObjectValidatorResult<C>> {
	public constructor(
		public readonly constraints: C
	) {
		super();
	}

	public assert(value: unknown, path: string = "value"): asserts value is ObjectValidatorResult<C> {
		if (!((value: unknown): value is Record<string, unknown> => {
			if (typeof value !== "object" || value === null)
				return false;

			const prototype = Object.getPrototypeOf(value);

			return prototype === Object.prototype || prototype === null;
		})(value))
			throw new AssertError(`Expected ${path} to be an Object`, path);

		const keys = Object.keys(value);

		if (this.constraints.min !== undefined && keys.length < this.constraints.min)
			throw new AssertError(
				`Expected ${path} to contain at least ${this.constraints.min} properties`,
				path
			);

		if (this.constraints.max !== undefined && keys.length > this.constraints.max)
			throw new AssertError(
				`Expected ${path} to contain at most ${this.constraints.max} properties`,
				path
			);

		const errors: Error[] = [];

		if (this.constraints.shape !== undefined) {
			for (const [key, shapeValidator] of Object.entries(this.constraints.shape)) {
				if (!Object.hasOwn(value, key)) {
					errors.push(new AssertError(
						`Expected ${path}.${key} to be present`,
						`${path}.${key}`
					));
					continue;
				}

				try {
					const validator: Validator = shapeValidator;

					validator.assert(value[key], `${path}.${key}`);
				} catch (error) {
					if (error instanceof AssertError || error instanceof AggregateError)
						errors.push(error);
					else
						throw error;
				}
			}
		}

		if (this.constraints.exact) {
			for (const key of keys) {
				if (!this.constraints.shape || !Object.hasOwn(this.constraints.shape, key))
					errors.push(new AssertError(
						`Expected ${path}.${key} not to be present`,
						`${path}.${key}`
					));
			}
		}

		if (this.constraints.every !== undefined) {
			for (const [key, entry] of Object.entries(value)) {
				if (
					this.constraints.exact &&
					(!this.constraints.shape || !Object.hasOwn(this.constraints.shape, key))
				)
					continue;

				try {
					const validator: Validator = this.constraints.every;

					validator.assert(entry, `${path}.${key}`);
				} catch (error) {
					if (error instanceof AssertError || error instanceof AggregateError)
						errors.push(error);
					else
						throw error;
				}
			}
		}

		if (errors.length > 0)
			throw new AggregateError(
				errors,
				`Expected all properties of ${path} to satisfy their constraints`
			);
	}

	public toJSON(): ObjectValidatorDefinition {
		const result: ObjectValidatorDefinition = {
			type: "object"
		};

		if (this.constraints.min !== undefined)
			result["min"] = this.constraints.min;

		if (this.constraints.max !== undefined)
			result["max"] = this.constraints.max;

		if (this.constraints.every !== undefined)
			result["every"] = this.constraints.every.toJSON();

		if(this.constraints.shape !== undefined)
			result["shape"] = Object.fromEntries(Object.entries(this.constraints.shape).map(([key, value]) => {
				return [key, value.toJSON()];
			}))

		if (this.constraints.exact)
			result["exact"] = this.constraints.exact;

		return result;
	}
}