import type {ValidatorCodec, ValidatorDefinition} from "../ValidatorCodec";
import type {Domain} from "../../Domain";
import {DefinitionError} from "../../lib/errors";
import {
	BooleanValidator,
	type BooleanValidatorConstraints
} from "../../validators/json/BooleanValidator";

export interface BooleanValidatorDefinition extends ValidatorDefinition {
	type: "boolean";
	equals?: boolean;
}

export const BooleanCodec = {
	fromJSON(
		definition: {type: "boolean"} & Record<string, unknown>,
		path: string,
		_domain: Domain
	): BooleanValidator<BooleanValidatorConstraints> {
		const errors: (DefinitionError | AggregateError)[] = [];

		for (const key of Object.keys(definition)) {
			if (!["type", "equals"].includes(key))
				errors.push(new DefinitionError(
					`Unknown Property ${path}.${key}`,
					`${path}.${key}`
				));
		}

		const equals = definition["equals"];
		const constraints: {equals?: boolean} = {};

		if (Object.hasOwn(definition, "equals")) {
			if (typeof equals !== "boolean")
				errors.push(new DefinitionError(
					`Expected ${path}.equals to be a Boolean`,
					`${path}.equals`
				));
			else
				constraints.equals = equals;
		}

		if (errors.length > 0)
			throw new AggregateError(
				errors,
				`Expected ${path} to be a valid BooleanValidatorDefinition`
			);

		return new BooleanValidator(constraints);
	},
	toJSON(
		validator: BooleanValidator<BooleanValidatorConstraints>,
		_domain: Domain
	): BooleanValidatorDefinition {
		return {
			type: "boolean",
			...(validator.constraints.equals !== undefined
				? {equals: validator.constraints.equals}
				: {})
		};
	}
} satisfies ValidatorCodec<
	BooleanValidatorDefinition,
	BooleanValidator<BooleanValidatorConstraints>
>;
