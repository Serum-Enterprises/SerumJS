import type {Domain} from "../../Domain";
import type {JSON} from "../../lib/JSON";
import {Validator, type InferValidatorResult, type ValidatorDefinition} from "../Validator";
import {AssertError, DefinitionError} from "../../lib/errors";

export interface ArrayValidatorConstraints {
	readonly min?: number | undefined;
	readonly max?: number | undefined;
	readonly every?: Validator | undefined;
	readonly tuple?: readonly Validator[] | undefined;
}

type TupleElements<TUPLE extends readonly Validator[], EVERY> = {
	-readonly [K in keyof TUPLE]: InferValidatorResult<TUPLE[K]> & EVERY;
};

type ArrayValidatorResult<C extends ArrayValidatorConstraints> =
	C extends { readonly every: infer EVERY extends Validator }
		? C extends { readonly tuple: infer TUPLE extends readonly Validator[] }
			? [
				...TupleElements<TUPLE, InferValidatorResult<EVERY>>,
				...InferValidatorResult<EVERY>[]
			]
			: InferValidatorResult<EVERY>[]
		: C extends { readonly tuple: infer TUPLE extends readonly Validator[] }
			? [...TupleElements<TUPLE, unknown>, ...unknown[]]
			: unknown[];

export class ArrayValidator<
	const C extends ArrayValidatorConstraints = {}
> extends Validator<ArrayValidatorResult<C>> {
	public static fromJSON(
		definition: { type: "array" } & Record<string, JSON>,
		path: string,
		domain: Domain
	): ArrayValidator<ArrayValidatorConstraints> {
		const errors: (DefinitionError | AggregateError)[] = [];
		const constraints: {
			min?: number,
			max?: number,
			every?: Validator,
			tuple?: readonly Validator[]
		} = {};

		// Report invalid Constraints
		for (const key of Object.keys(definition)) {
			if (!["type", "min", "max", "every", "tuple"].includes(key))
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

		// Verify every Constraint
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

		// Verify tuple Constraint
		if (Object.hasOwn(definition, "tuple")) {
			const tuple = definition["tuple"];

			if (!Array.isArray(tuple))
				errors.push(new DefinitionError(
					`Expected ${path}.tuple to be an Array`,
					`${path}.tuple`
				));
			else {
				const tupleValidators: Validator[] = [];

				for (let index = 0; index < tuple.length; index++) {
					try {
						tupleValidators.push(
							domain.fromJSON(tuple[index]!, `${path}.tuple[${index}]`)
						);
					} catch (error) {
						if (error instanceof DefinitionError || error instanceof AggregateError)
							errors.push(error);
						else
							throw error;
					}
				}

				constraints.tuple = tupleValidators;
			}
		}

		// Throw if there are any Errors
		if (errors.length > 0)
			throw new AggregateError(
				errors,
				`Expected ${path} to be a valid ArrayValidatorDefinition`
			);

		return new ArrayValidator(constraints);
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
					`Expected ArrayValidator.constraints.${key} to be a finite Number`
				);
		}

		this.constraints = Object.freeze({
			...constraints,
			...(constraints.tuple !== undefined
				? {tuple: Object.freeze([...constraints.tuple])}
				: {})
		});
	}

	public min<const M extends number>(min: M): ArrayValidator<
		Omit<C, "min"> & { readonly min: M }
	> {
		return new ArrayValidator<
			Omit<C, "min"> & { readonly min: M }
		>({
			...this.constraints,
			min
		});
	}

	public max<const M extends number>(max: M): ArrayValidator<
		Omit<C, "max"> & { readonly max: M }
	> {
		return new ArrayValidator<
			Omit<C, "max"> & { readonly max: M }
		>({
			...this.constraints,
			max
		});
	}

	public every<const E extends Validator>(every: E): ArrayValidator<
		Omit<C, "every"> & { readonly every: E }
	> {
		return new ArrayValidator<
			Omit<C, "every"> & { readonly every: E }
		>({
			...this.constraints,
			every
		});
	}

	public tuple<const T extends readonly Validator[]>(tuple: T): ArrayValidator<
		Omit<C, "tuple"> & { readonly tuple: readonly [...T] }
	> {
		return new ArrayValidator<
			Omit<C, "tuple"> & { readonly tuple: readonly [...T] }
		>({
			...this.constraints,
			tuple: [...tuple]
		});
	}

	public assert(value: unknown, path: string = "value"): asserts value is ArrayValidatorResult<C> {
		if (!Array.isArray(value))
			throw new AssertError(`Expected ${path} to be an Array`, path);

		if (this.constraints.min !== undefined && this.constraints.min > value.length)
			throw new AssertError(`Expected ${path} to contain at least ${this.constraints.min} elements`, path);

		if (this.constraints.max !== undefined && this.constraints.max < value.length)
			throw new AssertError(`Expected ${path} to contain at most ${this.constraints.max} elements`, path);

		if (this.constraints.tuple !== undefined && value.length < this.constraints.tuple.length)
			throw new AssertError(
				`Expected ${path} to contain at least ${this.constraints.tuple.length} elements`,
				path
			);

		const errors: Error[] = [];

		if (this.constraints.every !== undefined) {
			for (let index = 0; index < value.length; index++) {
				try {
					const validator: Validator = this.constraints.every;

					validator.assert(value[index], `${path}[${index}]`);
				} catch (error) {
					if (error instanceof AssertError || error instanceof AggregateError)
						errors.push(error);
					else
						throw error;
				}
			}
		}

		if (this.constraints.tuple !== undefined) {
			for (let index = 0; index < this.constraints.tuple.length; index++) {
				try {
					const validator: Validator = this.constraints.tuple[index]!;

					validator.assert(value[index], `${path}[${index}]`);
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
				`Expected all elements of ${path} to satisfy their constraints`
			);
	}

	public toJSON(): {
		type: "array",
		min?: number,
		max?: number,
		every?: ValidatorDefinition,
		tuple?: ValidatorDefinition[]
	} {
		const result: {
			type: "array",
			min?: number,
			max?: number,
			every?: ValidatorDefinition,
			tuple?: ValidatorDefinition[]
		} = {
			type: "array"
		};

		if (this.constraints.min !== undefined)
			result["min"] = this.constraints.min;

		if (this.constraints.max !== undefined)
			result["max"] = this.constraints.max;

		if (this.constraints.every !== undefined)
			result["every"] = this.constraints.every.toJSON();

		if (this.constraints.tuple !== undefined)
			result["tuple"] = this.constraints.tuple.map((validator) => validator.toJSON());

		return result;
	}
}
