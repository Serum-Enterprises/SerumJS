import {Validator, ValidatorDefinition} from "../Validator";

export interface UnknownValidatorDefinition extends ValidatorDefinition {
	type: "unknown";
}

export class UnknownValidator extends Validator<unknown> {
	public assert(_value: unknown, _path: string = "value"): asserts _value is unknown {}

	public toJSON(): UnknownValidatorDefinition {
		return {type: "unknown"};
	}
}
