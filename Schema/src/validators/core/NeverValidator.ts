import {Validator, ValidatorDefinition} from "../Validator";
import {AssertError} from "../../lib/errors";

export interface NeverValidatorDefinition extends ValidatorDefinition {
	type: "never";
}

export class NeverValidator extends Validator<never> {
	public assert(_value: unknown, path: string = "value"): asserts _value is never {
		throw new AssertError(`Expected ${path} not to exist`, path);
	}

	public toJSON(): NeverValidatorDefinition {
		return {type: "never"};
	}
}
