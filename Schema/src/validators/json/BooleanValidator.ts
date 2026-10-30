import {Validator} from "../Validator";
import {AssertError} from "../../lib/errors";

interface BooleanValidatorConstraints {
	readonly equals?: boolean;
}

type BooleanValidatorResult<C extends BooleanValidatorConstraints> = C extends {
	readonly equals: infer E extends boolean;
} ? E : boolean;

export class BooleanValidator<
	const C extends BooleanValidatorConstraints = {}
> extends Validator<BooleanValidatorResult<C>> {
	public constructor(
		public readonly constraints: C
	) {
		super();
	}

	public assert(value: unknown, path: string = "value"): asserts value is BooleanValidatorResult<C> {
		if (typeof value !== "boolean")
			throw new AssertError(`Expected ${path} to be a Boolean`, path);

		if (this.constraints.equals !== undefined && this.constraints.equals !== value)
			throw new AssertError(`Expected ${path} to be ${this.constraints.equals}`, path);
	}
}