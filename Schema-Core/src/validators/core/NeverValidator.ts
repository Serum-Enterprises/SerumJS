import {Validator} from "../Validator";
import {AssertError} from "../../lib/errors";

export class NeverValidator extends Validator<never> {
	public assert(_value: unknown, path: string = "value"): asserts _value is never {
		throw new AssertError(`Expected ${path} to not exist`, path);
	}

	public toJSON(): { type: "never" } {
		return {type: "never"};
	}
}
