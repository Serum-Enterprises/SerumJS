import type {ValidatorDefinition} from "../ValidatorCodec";
import type {Domain} from "../../Domain";
import {DefinitionError} from "../../lib/errors";
import {
	StringValidator,
	type StringValidatorConstraints
} from "../../validators/json/StringValidator";

export interface StringValidatorDefinition extends ValidatorDefinition {
	type: "string";
	min?: number;
	max?: number;
	equals?: string;
}

export const StringCodec = {
	type: "string",
	validator: StringValidator,

	fromJSON(
		definition: {type: "string"} & Record<string, unknown>,
		path: string,
		_domain: Domain
	): StringValidator<StringValidatorConstraints> {
		const errors: (DefinitionError | AggregateError)[] = [];
		const constraints: {
			min?: number;
			max?: number;
			equals?: string;
		} = {};

		for (const key of Object.keys(definition)) {
			if (!["type", "min", "max", "equals"].includes(key))
				errors.push(new DefinitionError(
					`Unknown Property ${path}.${key}`,
					`${path}.${key}`
				));
		}

		if (Object.hasOwn(definition, "min")) {
			const min = definition["min"];

			if (typeof min !== "number" || !Number.isFinite(min))
				errors.push(new DefinitionError(
					`Expected ${path}.min to be a finite Number`,
					`${path}.min`
				));
			else
				constraints.min = min;
		}

		if (Object.hasOwn(definition, "max")) {
			const max = definition["max"];

			if (typeof max !== "number" || !Number.isFinite(max))
				errors.push(new DefinitionError(
					`Expected ${path}.max to be a finite Number`,
					`${path}.max`
				));
			else
				constraints.max = max;
		}

		if (Object.hasOwn(definition, "equals")) {
			const equals = definition["equals"];

			if (typeof equals !== "string")
				errors.push(new DefinitionError(
					`Expected ${path}.equals to be a String`,
					`${path}.equals`
				));
			else
				constraints.equals = equals;
		}

		if (errors.length > 0)
			throw new AggregateError(
				errors,
				`Expected ${path} to be a valid StringValidatorDefinition`
			);

		return new StringValidator(constraints);
	},

	toJSON(
		validator: StringValidator<StringValidatorConstraints>,
		_domain: Domain
	): StringValidatorDefinition {
		return {
			type: "string",
			...(validator.constraints.min !== undefined
				? {min: validator.constraints.min}
				: {}),
			...(validator.constraints.max !== undefined
				? {max: validator.constraints.max}
				: {}),
			...(validator.constraints.equals !== undefined
				? {equals: validator.constraints.equals}
				: {})
		};
	}
};