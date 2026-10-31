import {Validator} from "../Validator";
import {AssertError} from "../../lib/errors";

export interface StringValidatorConstraints {
	readonly min?: number;
	readonly max?: number;
	readonly equals?: string;
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
	}

	public min<const M extends number>(min: M): StringValidator<
		StringValidatorConstraints & Omit<C, "min"> & {readonly min: M}
	> {
		return new StringValidator<
			StringValidatorConstraints & Omit<C, "min"> & {readonly min: M}
		>({
			...this.constraints,
			min
		});
	}

	public max<const M extends number>(max: M): StringValidator<
		StringValidatorConstraints & Omit<C, "max"> & {readonly max: M}
	> {
		return new StringValidator<
			StringValidatorConstraints & Omit<C, "max"> & {readonly max: M}
		>({
			...this.constraints,
			max
		});
	}

	public equals<const E extends string>(equals: E): StringValidator<
		StringValidatorConstraints & Omit<C, "equals"> & {readonly equals: E}
	> {
		return new StringValidator<
			StringValidatorConstraints & Omit<C, "equals"> & {readonly equals: E}
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
}
