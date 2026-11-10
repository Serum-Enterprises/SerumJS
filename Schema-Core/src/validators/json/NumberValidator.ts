import type {Domain} from "../../Domain";
import type {JSON} from "../../lib/JSON";
import {Validator} from "../Validator";
import {AssertError, DefinitionError} from "../../lib/errors";

export interface NumberValidatorConstraints {
	readonly integer?: boolean | undefined;
	readonly min?: number | undefined;
	readonly max?: number | undefined;
	readonly equals?: number | undefined;
}

type NumberValidatorResult<C extends NumberValidatorConstraints> = C extends {
	readonly equals: infer E extends number;
} ? E : number;

export class NumberValidator<
	const C extends NumberValidatorConstraints = {}
> extends Validator<NumberValidatorResult<C>> {
	public static readonly type = "number";

	public static fromJSON(
		definition: {type: "number"} & Record<string, JSON>,
		path: string,
		_domain: Domain
	): NumberValidator<NumberValidatorConstraints> {
		const errors: DefinitionError[] = [];
		const constraints: {
			integer?: boolean,
			min?: number,
			max?: number,
			equals?: number
		} = {};

		// Report invalid Constraints
		for (const key of Object.keys(definition)) {
			if (!["type", "integer", "min", "max", "equals"].includes(key))
				errors.push(new DefinitionError(
					`Unknown Property ${path}.${key}`,
					`${path}.${key}`
				));
		}

		// Verify integer Constraint
		if (Object.hasOwn(definition, "integer")) {
			const integer = definition["integer"];

			if (typeof integer !== "boolean")
				errors.push(new DefinitionError(
					`Expected ${path}.integer to be a Boolean`,
					`${path}.integer`
				));
			else
				constraints.integer = integer;
		}

		// Verify min, max and equals Constraints
		for (const key of ["min", "max", "equals"] as const) {
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

		// Throw if there are any Errors
		if (errors.length > 0)
			throw new AggregateError(
				errors,
				`Expected ${path} to be a valid NumberValidatorDefinition`
			);

		return new NumberValidator(constraints);
	}

	public constructor(
		public readonly constraints: C
	) {
		super();

		// Verify min, max and equals Constraints
		for (const key of ["min", "max", "equals"] as const) {
			const value = constraints[key];

			if (value !== undefined && !Number.isFinite(value))
				throw new TypeError(
					`Expected NumberValidator.constraints.${key} to be a finite Number`
				);
		}

		this.constraints = Object.freeze({...constraints});
	}

	public integer(): NumberValidator<
		Omit<C, "integer"> & {readonly integer: true}
	>;
	public integer<const I extends boolean>(integer: I): NumberValidator<
		Omit<C, "integer"> & {readonly integer: I}
	>;
	public integer(integer: boolean = true): NumberValidator<
		Omit<C, "integer"> & {readonly integer: boolean}
	> {
		return new NumberValidator<
			Omit<C, "integer"> & {readonly integer: boolean}
		>({
			...this.constraints,
			integer
		});
	}

	public min<const M extends number>(min: M): NumberValidator<
		Omit<C, "min"> & {readonly min: M}
	> {
		return new NumberValidator<
			Omit<C, "min"> & {readonly min: M}
		>({
			...this.constraints,
			min
		});
	}

	public max<const M extends number>(max: M): NumberValidator<
		Omit<C, "max"> & {readonly max: M}
	> {
		return new NumberValidator<
			Omit<C, "max"> & {readonly max: M}
		>({
			...this.constraints,
			max
		});
	}

	public equals<const E extends number>(equals: E): NumberValidator<
		Omit<C, "equals"> & {readonly equals: E}
	> {
		return new NumberValidator<
			Omit<C, "equals"> & {readonly equals: E}
		>({
			...this.constraints,
			equals
		});
	}

	public assert(value: unknown, path: string = "value"): asserts value is NumberValidatorResult<C> {
		if (typeof value !== "number")
			throw new AssertError(`Expected ${path} to be a Number`, path);

		if (this.constraints.integer && !Number.isSafeInteger(value))
			throw new AssertError(`Expected ${path} to be an Integer`, path);

		if (this.constraints.min !== undefined && !(value >= this.constraints.min))
			throw new AssertError(`Expected ${path} to be at least ${this.constraints.min}`, path);

		if (this.constraints.max !== undefined && !(value <= this.constraints.max))
			throw new AssertError(`Expected ${path} to be at most ${this.constraints.max}`, path);

		if (this.constraints.equals !== undefined && this.constraints.equals !== value)
			throw new AssertError(`Expected ${path} to be ${this.constraints.equals}`, path);
	}

	public toJSON(): {
		type: "number",
		integer?: boolean,
		min?: number,
		max?: number,
		equals?: number
	} {
		const result: {
			type: "number",
			integer?: boolean,
			min?: number,
			max?: number,
			equals?: number
		} = {
			type: "number"
		};

		if(this.constraints.integer !== undefined)
			result["integer"] = this.constraints.integer;

		if(this.constraints.min !== undefined)
			result["min"] = this.constraints.min;

		if(this.constraints.max !== undefined)
			result["max"] = this.constraints.max;

		if(this.constraints.equals !== undefined)
			result["equals"] = this.constraints.equals;

		return result;
	}
}
