import {Validator} from "../Validator";
import {AssertError} from "../../lib/errors";

export interface BooleanValidatorConstraints {
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
		this.constraints = Object.freeze({...constraints});
	}

	public equals<const E extends boolean>(equals: E): BooleanValidator<{
		readonly equals: E
	}> {
		return new BooleanValidator<{ readonly equals: E }>({equals});
	}

	public assert(value: unknown, path: string = "value"): asserts value is BooleanValidatorResult<C> {
		if (typeof value !== "boolean")
			throw new AssertError(`Expected ${path} to be a Boolean`, path);

		if (this.constraints.equals !== undefined && this.constraints.equals !== value)
			throw new AssertError(`Expected ${path} to be ${this.constraints.equals}`, path);
	}

	public toJSON(): {
		type: "boolean",
		equals?: boolean
	} {
		const result: {
			type: "boolean",
			equals?: boolean
		} = {
			type: "boolean"
		};

		if (this.constraints.equals !== undefined)
			result["equals"] = this.constraints.equals;

		return result;
	}
}
