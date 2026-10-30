import {Validator, ValidatorDefinition} from "../Validator";
import {AssertError} from "../../lib/errors";

export interface NullValidatorDefinition extends ValidatorDefinition {
	type: "null";
}

export class NullValidator extends Validator<null> {
	public assert(value: unknown, path: string = "value"): asserts value is null {
		if (value !== null)
			throw new AssertError(`Expected ${path} to be Null`, path);
	}

	public toJSON(): NullValidatorDefinition {
		return {
			type: "null"
		}
	}
}
