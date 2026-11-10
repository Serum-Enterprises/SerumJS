import type {Domain} from "../../Domain";
import type {JSON} from "../../lib/JSON";
import {Validator} from "../Validator";
import {AssertError, DefinitionError} from "../../lib/errors";

export class NullValidator extends Validator<null> {
	public static fromJSON(
		definition: {type: "null"} & Record<string, JSON>,
		path: string,
		_domain: Domain
	): NullValidator {
		const errors: DefinitionError[] = [];

		// Report invalid Constraints
		for (const key of Object.keys(definition)) {
			if (key !== "type")
				errors.push(new DefinitionError(
					`Unknown Constraint ${path}.${key}`,
					`${path}.${key}`
				));
		}

		// Throw if there are any Errors
		if (errors.length > 0)
			throw new AggregateError(
				errors,
				`Expected ${path} to be a valid NullValidatorDefinition`
			);

		return new NullValidator();
	}

	public assert(value: unknown, path: string = "value"): asserts value is null {
		if (value !== null)
			throw new AssertError(`Expected ${path} to be Null`, path);
	}

	public toJSON(): { type: "null" } {
		return {type: "null"};
	}
}
