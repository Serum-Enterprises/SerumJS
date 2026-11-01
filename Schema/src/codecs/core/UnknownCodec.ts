import {type ValidatorDefinition} from "../ValidatorCodec";
import type {Domain} from "../../Domain";
import {UnknownValidator} from "../../validators/core/UnknownValidator";
import {DefinitionError} from "../../lib/errors";

export interface UnknownValidatorDefinition extends ValidatorDefinition {
	type: "unknown";
}

export function fromJSON(
	definition: { type: "unknown" } & Record<string, unknown>,
	path: string,
	_domain: Domain
): UnknownValidator {
	const errors: (DefinitionError | AggregateError)[] = [];

	for (const key of Object.keys(definition)) {
		if (key !== "type")
			errors.push(new DefinitionError(
				`Unknown Property ${path}.${key}`,
				`${path}.${key}`
			));
	}

	if (errors.length > 0)
		throw new AggregateError(errors, `Expected ${path} to be a valid UnknownValidatorDefinition`);

	return new UnknownValidator();
}

export function toJSON(
	_validator: UnknownValidator,
	_domain: Domain
): UnknownValidatorDefinition {
	return {type: "unknown"};
}
