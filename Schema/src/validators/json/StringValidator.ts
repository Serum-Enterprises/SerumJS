import {Validator, ValidatorDefinition} from "../Validator";
import {AssertError} from "../../lib/errors";

export interface StringValidatorDefinition extends ValidatorDefinition {
	type: "string";
	min?: number;
	max?: number;
	equals?: string;
}

interface StringValidatorConstraints {
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

	public toJSON(): StringValidatorDefinition {
		const result: StringValidatorDefinition = {
			type: "string"
		};

		if (this.constraints.min !== undefined)
			result["min"] = this.constraints.min;

		if (this.constraints.max !== undefined)
			result["max"] = this.constraints.max;

		if (this.constraints.equals !== undefined)
			result["equals"] = this.constraints.equals;

		return result;
	}
}