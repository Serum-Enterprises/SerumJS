import {Validator} from "../Validator";
import {AssertError} from "../../lib/errors";

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
	public constructor(
		public readonly constraints: C
	) {
		super();

		for (const key of ["min", "max"] as const) {
			const value = constraints[key];

			if (value !== undefined && (!Number.isSafeInteger(value) || value < 0))
				throw new TypeError(
					`Expected StringValidator.constraints.${key} to be a non-negative safe Integer`
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
