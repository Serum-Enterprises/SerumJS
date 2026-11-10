import type {Domain} from "../../Domain";
import type {JSON} from "../../lib/JSON";
import {Validator} from "../Validator";
import {DefinitionError} from "../../lib/errors";

export class UnknownValidator extends Validator {
	public static readonly type = "unknown";

	public static fromJSON(
		definition: {type: "unknown"} & Record<string, JSON>,
		path: string,
		_domain: Domain
	): UnknownValidator {
		const errors: DefinitionError[] = [];

		// Report invalid Constraints
		for (const key of Object.keys(definition)) {
			if (key !== "type")
				errors.push(new DefinitionError(
					`Unknown Property ${path}.${key}`,
					`${path}.${key}`
				));
		}

		// Throw if there are any Errors
		if (errors.length > 0)
			throw new AggregateError(
				errors,
				`Expected ${path} to be a valid UnknownValidatorDefinition`
			);

		return new UnknownValidator();
	}

	public override assert(_value: unknown, _path: string = "value"): asserts _value is unknown {}

	public toJSON(): { type: "unknown" } {
		return {type: "unknown"};
	}
}
