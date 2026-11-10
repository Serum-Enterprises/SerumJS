import type {Domain} from "../../Domain";
import type {JSON} from "../../lib/JSON";
import {Validator} from "../Validator";
import {AssertError, DefinitionError} from "../../lib/errors";

export class NeverValidator extends Validator<never> {
	public static readonly type = "never";

	public static fromJSON(
		definition: {type: "never"} & Record<string, JSON>,
		path: string,
		_domain: Domain
	): NeverValidator {
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
				`Expected ${path} to be a valid NeverValidatorDefinition`
			);

		return new NeverValidator();
	}

	public assert(_value: unknown, path: string = "value"): asserts _value is never {
		throw new AssertError(`Expected ${path} to not exist`, path);
	}

	public toJSON(): { type: "never" } {
		return {type: "never"};
	}
}
