import type {ValidatorDefinition} from "../ValidatorCodec";
import type {Domain} from "../../Domain";
import {NeverValidator} from "../../validators/core/NeverValidator";
import {DefinitionError} from "../../lib/errors";

export interface NeverValidatorDefinition extends ValidatorDefinition {
	type: "never";
}

export function fromJSON(
	definition: { type: "never" } & Record<string, unknown>,
	path: string,
	_domain: Domain
): NeverValidator {
	const errors: (DefinitionError | AggregateError)[] = [];

	for (const key of Object.keys(definition)) {
		if (key !== "type")
			errors.push(new DefinitionError(
				`Unknown Property ${path}.${key}`,
				`${path}.${key}`
			));
	}

	if (errors.length > 0)
		throw new AggregateError(errors, `Expected ${path} to be a valid NeverValidatorDefinition`);

	return new NeverValidator();
}

export function toJSON(
	_validator: NeverValidator,
	_domain: Domain
): NeverValidatorDefinition {
	return {type: "never"};
}
