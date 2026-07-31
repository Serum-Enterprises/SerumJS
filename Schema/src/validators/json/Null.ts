import {Definition, UnknownDefinition} from "../../lib/types";
import {Validator} from "../Validator";
import type {Domain} from "../../Domain";
import {AssertError} from "../../lib/errors";

export interface NullValidatorDefinition extends Definition {
	type: "null"
}

export class NullValidator extends Validator<null> {
	public static fromJSON(
		_definition: UnknownDefinition,
		_path: string = "definition",
		_schemaDomain: Domain
	): NullValidator {
		return new NullValidator();
	}

	public assert(data: unknown, path: string = "data"): asserts data is null {
		if (data !== null)
			throw new AssertError("Expected null", path);
	}

	public clone(): this {
		return new NullValidator() as this;
	}

	public toJSON(): NullValidatorDefinition {
		return {
			type: "null"
		};
	}
}
