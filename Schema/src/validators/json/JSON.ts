import {JSON} from "@serum-enterprises/json";
import type {Definition, UnknownDefinition} from "../../lib/types";
import {Validator} from "../Validator";
import type {Domain} from "../../Domain";
import {AssertError} from "../../lib/errors";

export interface JSONValidatorDefinition extends Definition {
	type: "json"
}

export class JSONValidator extends Validator<JSON.JSON> {
	public static fromJSON(
		_definition: UnknownDefinition,
		_path: string = "definition",
		_schemaDomain: Domain
	): JSONValidator {
		return new JSONValidator();
	}

	public assert(data: unknown, path: string = "data"): asserts data is JSON.JSON {
		if (!JSON.isJSON(data))
			throw new AssertError("Expected valid JSON", path);
	}

	public clone(): this {
		return new JSONValidator() as this;
	}

	public toJSON(): JSONValidatorDefinition {
		return {
			type: "json"
		};
	}
}
