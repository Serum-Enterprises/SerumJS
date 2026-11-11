import type {JSON} from "@serum-enterprises/json";
import type {Domain} from "../../Domain";
import {Validator} from "../Validator";
import {AssertError, DefinitionError} from "../../lib/errors";

export interface StringValidatorConstraints {
	readonly min?: number | undefined;
	readonly max?: number | undefined;
	readonly equals?: string | undefined;
}

type StringValidatorResult<C extends StringValidatorConstraints> = C extends {
	readonly equals: infer E extends string;
} ? E : string;

export class StringValidator<
	const C extends StringValidatorConstraints = {}
> extends Validator<StringValidatorResult<C>> {
	public static readonly type = "string";

	public static fromJSON(
		definition: {type: "string"} & Record<string, JSON>,
		path: string,
		_domain: Domain
	): StringValidator<StringValidatorConstraints> {
		const errors: DefinitionError[] = [];
		const constraints: {
			min?: number,
			max?: number,
			equals?: string
		} = {};

		// Report invalid Constraints
		for (const key of Object.keys(definition)) {
			if (!["type", "min", "max", "equals"].includes(key))
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

		// Verify equals Constraint
		if (Object.hasOwn(definition, "equals")) {
			const equals = definition["equals"];

			if (typeof equals !== "string")
				errors.push(new DefinitionError(
					`Expected ${path}.equals to be a String`,
					`${path}.equals`
				));
			else
				constraints.equals = equals;
		}

		// Throw if there are any Errors
		if (errors.length > 0)
			throw new AggregateError(
				errors,
				`Expected ${path} to be a valid StringValidatorDefinition`
			);

		return new StringValidator(constraints);
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
					`Expected StringValidator.constraints.${key} to be a finite Number`
				);
		}

		this.constraints = Object.freeze({...constraints});
	}

	public min<const M extends number>(min: M): StringValidator<
		Omit<C, "min"> & {readonly min: M}
	> {
		return new StringValidator<
			Omit<C, "min"> & {readonly min: M}
		>({
			...this.constraints,
			min
		});
	}

	public max<const M extends number>(max: M): StringValidator<
		Omit<C, "max"> & {readonly max: M}
	> {
		return new StringValidator<
			Omit<C, "max"> & {readonly max: M}
		>({
			...this.constraints,
			max
		});
	}

	public equals<const E extends string>(equals: E): StringValidator<
		Omit<C, "equals"> & {readonly equals: E}
	> {
		return new StringValidator<
			Omit<C, "equals"> & {readonly equals: E}
		>({
			...this.constraints,
			equals
		});
	}

	public assert(value: unknown, path: string = "value"): asserts value is StringValidatorResult<C> {
		if (typeof value !== "string")
			throw new AssertError(`Expected ${path} to be a String`, path);

		if (this.constraints.min !== undefined && this.constraints.min > value.length)
			throw new AssertError(`Expected ${path} to be at least ${this.constraints.min} characters long`, path);

		if (this.constraints.max !== undefined && this.constraints.max < value.length)
			throw new AssertError(`Expected ${path} to be at most ${this.constraints.max} characters long`, path);

		if (this.constraints.equals !== undefined && this.constraints.equals !== value)
			throw new AssertError(`Expected ${path} to be "${this.constraints.equals}"`, path);
	}

	public toJSON(): {
		type: "string",
		min?: number,
		max?: number,
		equals?: string
	} {
		const result: {
			type: "string",
			min?: number,
			max?: number,
			equals?: string
		} = {
			type: "string"
		};

		if(this.constraints.min !== undefined)
			result["min"] = this.constraints.min;

		if(this.constraints.max !== undefined)
			result["max"] = this.constraints.max;

		if(this.constraints.equals !== undefined)
			result["equals"] = this.constraints.equals;

		return result;
	}
}
