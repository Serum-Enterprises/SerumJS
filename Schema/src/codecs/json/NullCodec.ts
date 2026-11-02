import type {ValidatorCodec, ValidatorDefinition} from "../ValidatorCodec";
import type {Domain} from "../../Domain";
import {DefinitionError} from "../../lib/errors";
import {NullValidator} from "../../validators/json/NullValidator";

export interface NullValidatorDefinition extends ValidatorDefinition {
	type: "null";
}

export const NullCodec = {
	fromJSON(
		definition: {type: "null"} & Record<string, unknown>,
		path: string,
		_domain: Domain
	): NullValidator {
		const errors: (DefinitionError | AggregateError)[] = [];

		for (const key of Object.keys(definition)) {
			if (key !== "type")
				errors.push(new DefinitionError(
					`Unknown Property ${path}.${key}`,
					`${path}.${key}`
				));
		}

		if (errors.length > 0)
			throw new AggregateError(
				errors,
				`Expected ${path} to be a valid NullValidatorDefinition`
			);

		return new NullValidator();
	},
	toJSON(
		_validator: NullValidator,
		_domain: Domain
	): NullValidatorDefinition {
		return {type: "null"};
	}
} satisfies ValidatorCodec<
	NullValidatorDefinition,
	NullValidator
>;
