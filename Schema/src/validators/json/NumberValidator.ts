import {Validator} from "../Validator";
import {AssertError} from "../../lib/errors";

export interface NumberValidatorConstraints {
	readonly integer?: boolean;
	readonly min?: number;
	readonly max?: number;
	readonly equals?: number;
}

type NumberValidatorResult<C extends NumberValidatorConstraints> = C extends {
	readonly equals: infer E extends number;
} ? E : number;

export class NumberValidator<
	const C extends NumberValidatorConstraints = {}
> extends Validator<NumberValidatorResult<C>> {
	public constructor(
		public readonly constraints: C
	) {
		super();
	}

	public integer(): NumberValidator<
		NumberValidatorConstraints & Omit<C, "integer"> & {readonly integer: true}
	>;
	public integer<const I extends boolean>(integer: I): NumberValidator<
		NumberValidatorConstraints & Omit<C, "integer"> & {readonly integer: I}
	>;
	public integer(integer: boolean = true): NumberValidator<
		NumberValidatorConstraints & Omit<C, "integer"> & {readonly integer: boolean}
	> {
		return new NumberValidator<
			NumberValidatorConstraints & Omit<C, "integer"> & {readonly integer: boolean}
		>({
			...this.constraints,
			integer
		});
	}

	public min<const M extends number>(min: M): NumberValidator<
		NumberValidatorConstraints & Omit<C, "min"> & {readonly min: M}
	> {
		return new NumberValidator<
			NumberValidatorConstraints & Omit<C, "min"> & {readonly min: M}
		>({
			...this.constraints,
			min
		});
	}

	public max<const M extends number>(max: M): NumberValidator<
		NumberValidatorConstraints & Omit<C, "max"> & {readonly max: M}
	> {
		return new NumberValidator<
			NumberValidatorConstraints & Omit<C, "max"> & {readonly max: M}
		>({
			...this.constraints,
			max
		});
	}

	public equals<const E extends number>(equals: E): NumberValidator<
		NumberValidatorConstraints & Omit<C, "equals"> & {readonly equals: E}
	> {
		return new NumberValidator<
			NumberValidatorConstraints & Omit<C, "equals"> & {readonly equals: E}
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

		if (this.constraints.min !== undefined && this.constraints.min > value)
			throw new AssertError(`Expected ${path} to be at least ${this.constraints.min}`, path);

		if (this.constraints.max !== undefined && this.constraints.max < value)
			throw new AssertError(`Expected ${path} to be at most ${this.constraints.max}`, path);

		if (this.constraints.equals !== undefined && this.constraints.equals !== value)
			throw new AssertError(`Expected ${path} to be ${this.constraints.equals}`, path);
	}
}
