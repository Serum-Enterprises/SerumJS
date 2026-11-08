import {Validator} from "../Validator";

export class UnknownValidator extends Validator {
	public override assert(_value: unknown, _path: string = "value"): asserts _value is unknown {}

	public toJSON(): { type: "unknown" } {
		return {type: "unknown"};
	}
}