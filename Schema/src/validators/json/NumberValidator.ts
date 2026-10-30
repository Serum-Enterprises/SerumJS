import {Validator} from "../Validator";
import {AssertError} from "../../lib/errors";

interface NumberValidatorConstraints {
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