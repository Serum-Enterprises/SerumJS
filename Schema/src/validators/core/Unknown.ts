import {Validator} from "../Validator";
import type {Domain} from "../../Domain";
import type {Definition, UnknownDefinition} from "../../lib/types";

export interface UnknownValidatorDefinition extends Definition {
	type: "unknown";
}

export class UnknownValidator extends Validator {
	public static fromJSON(
		_definition: UnknownDefinition,
		_path: string = "definition",
		_domain: Domain
	): UnknownValidator {
		return new UnknownValidator();
	}

	public assert(_data: unknown, _path: string = "data"): asserts _data is unknown { }

	public clone(): this {
		return new UnknownValidator() as this;
	}

	public toJSON(): UnknownValidatorDefinition {
		return {
			type: "unknown"
		};
	}
}