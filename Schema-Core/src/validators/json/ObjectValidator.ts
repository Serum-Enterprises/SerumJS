import type {Domain} from "../../Domain";
import type {JSON} from "../../lib/JSON";
import {Validator, type InferValidatorResult, type ValidatorDefinition} from "../Validator";
import {AssertError, DefinitionError} from "../../lib/errors";

export interface ObjectValidatorConstraints {
	readonly min?: number | undefined;
	readonly max?: number | undefined;
	readonly every?: Validator | undefined;
	readonly shape?: Readonly<Record<string, Validator>> | undefined;
	readonly exact?: boolean | undefined;
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
	public static fromJSON(
		definition: {type: "object"} & Record<string, JSON>,
		path: string,
		domain: Domain
	): ObjectValidator<ObjectValidatorConstraints> {
		const errors: (DefinitionError | AggregateError)[] = [];
		const constraints: {
			min?: number,
			max?: number,
			every?: Validator,
			shape?: Readonly<Record<string, Validator>>,
			exact?: boolean
		} = {};

		// Report invalid Constraints
		for (const key of Object.keys(definition)) {
			if (!["type", "min", "max", "every", "shape", "exact"].includes(key))
				errors.push(new DefinitionError(
					`Unknown Property ${path}.${key}`,
					`${path}.${key}`
				));
		}

		// Verify min and max Constraints
		for (const key of ["min", "max"] as const) {
			if (!Object.hasOwn(definition, key))
				continue;

			const value = definition[key];

			if (typeof value !== "number" || !Number.isFinite(value))
				errors.push(new DefinitionError(
					`Expected ${path}.${key} to be a finite Number`,
					`${path}.${key}`
				));
			else
				constraints[key] = value;
		}

		if (Object.hasOwn(definition, "every")) {
			try {
				constraints.every = domain.fromJSON(
					definition["every"]!,
					`${path}.every`
				);
			} catch (error) {
				if (error instanceof DefinitionError || error instanceof AggregateError)
					errors.push(error);
				else
					throw error;
			}
		}

		// Verify shape Constraint
		if (Object.hasOwn(definition, "shape")) {
			const shape = definition["shape"];

			if (!((value: unknown): value is Record<string, JSON> => {
				if (typeof value !== "object" || value === null)
					return false;

				const prototype = Object.getPrototypeOf(value);

				return prototype === Object.prototype || prototype === null;
			})(shape))
				errors.push(new DefinitionError(
					`Expected ${path}.shape to be an Object`,
					`${path}.shape`
				));
			else {
				const shapeValidators: [string, Validator][] = [];

				for (const [key, validatorDefinition] of Object.entries(shape)) {
					try {
						shapeValidators.push([
							key,
							domain.fromJSON(validatorDefinition, `${path}.shape.${key}`)
						]);
					} catch (error) {
						if (error instanceof DefinitionError || error instanceof AggregateError)
							errors.push(error);
						else
							throw error;
					}
				}

				constraints.shape = Object.fromEntries(shapeValidators);
			}
		}

		// Verify exact Constraint
		if (Object.hasOwn(definition, "exact")) {
			const exact = definition["exact"];

			if (typeof exact !== "boolean")
				errors.push(new DefinitionError(
					`Expected ${path}.exact to be a Boolean`,
					`${path}.exact`
				));
			else
				constraints.exact = exact;
		}

		// Throw if there are any Errors
		if (errors.length > 0)
			throw new AggregateError(
				errors,
				`Expected ${path} to be a valid ObjectValidatorDefinition`
			);

		return new ObjectValidator(constraints);
	}

	public constructor(
		public readonly constraints: C
	) {
		super();

		// Verify min and max Constraints
		for (const key of ["min", "max"] as const) {
			const value = constraints[key];

			if (value !== undefined && !Number.isFinite(value))
				throw new TypeError(
					`Expected ObjectValidator.constraints.${key} to be a finite Number`
				);
		}

		this.constraints = Object.freeze({
			...constraints,
			...(constraints.shape !== undefined
				? {shape: Object.freeze({...constraints.shape})}
				: {})
		});
	}

	public min<const M extends number>(min: M): ObjectValidator<
		Omit<C, "min"> & {readonly min: M}
	> {
		return new ObjectValidator<
			Omit<C, "min"> & {readonly min: M}
		>({
			...this.constraints,
			min
		});
	}

	public max<const M extends number>(max: M): ObjectValidator<
		Omit<C, "max"> & {readonly max: M}
	> {
		return new ObjectValidator<
			Omit<C, "max"> & {readonly max: M}
		>({
			...this.constraints,
			max
		});
	}

	public every<const E extends Validator>(every: E): ObjectValidator<
		Omit<C, "every"> & {readonly every: E}
	> {
		return new ObjectValidator<
			Omit<C, "every"> & {readonly every: E}
		>({
			...this.constraints,
			every
		});
	}

	public shape<const S extends Readonly<Record<string, Validator>>>(shape: S): ObjectValidator<
		Omit<C, "shape"> & {readonly shape: Readonly<S>}
	> {
		return new ObjectValidator<
			Omit<C, "shape"> & {readonly shape: Readonly<S>}
		>({
			...this.constraints,
			shape: {...shape}
		});
	}

	public exact(): ObjectValidator<
		Omit<C, "exact"> & {readonly exact: true}
	>;
	public exact<const E extends boolean>(exact: E): ObjectValidator<
		Omit<C, "exact"> & {readonly exact: E}
	>;
	public exact(exact: boolean = true): ObjectValidator<
		Omit<C, "exact"> & {readonly exact: boolean}
	> {
		return new ObjectValidator<
			Omit<C, "exact"> & {readonly exact: boolean}
		>({
			...this.constraints,
			exact
		});
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
				if (!Object.prototype.propertyIsEnumerable.call(value, key)) {
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

	public toJSON(): {
		type: "object",
		min?: number,
		max?: number,
		every?: ValidatorDefinition,
		shape?: Record<string, ValidatorDefinition>,
		exact?: boolean
	} {
		const result: {
			type: "object",
			min?: number,
			max?: number,
			every?: ValidatorDefinition,
			shape?: Record<string, ValidatorDefinition>,
			exact?: boolean
		} = {
			type: "object"
		};

		if (this.constraints.min !== undefined)
			result["min"] = this.constraints.min;

		if (this.constraints.max !== undefined)
			result["max"] = this.constraints.max;

		if (this.constraints.every !== undefined)
			result["every"] = this.constraints.every.toJSON();

		if (this.constraints.shape !== undefined)
			result["shape"] = Object.fromEntries(
				Object.entries(this.constraints.shape).map(([key, validator]) => [
					key,
					validator.toJSON()
				])
			);

		if (this.constraints.exact !== undefined)
			result["exact"] = this.constraints.exact;

		return result;
	}
}
