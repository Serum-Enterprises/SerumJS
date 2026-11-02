import type {ValidatorDefinition} from "../ValidatorCodec";
import type {Domain} from "../../Domain";
import {DefinitionError} from "../../lib/errors";
import {
	NumberValidator,
	type NumberValidatorConstraints
} from "../../validators/json/NumberValidator";

export interface NumberValidatorDefinition extends ValidatorDefinition {
	type: "number";
	integer?: boolean;
	min?: number;
	max?: number;
	equals?: number;
}

export function fromJSON(
	definition: {type: "number"} & Record<string, unknown>,
	path: string,
	_domain: Domain
): NumberValidator<NumberValidatorConstraints> {
	const errors: (DefinitionError | AggregateError)[] = [];
	const constraints: {
		integer?: boolean;
		min?: number;
		max?: number;
		equals?: number;
	} = {};

	for (const key of Object.keys(definition)) {
		if (!["type", "integer", "min", "max", "equals"].includes(key))
			errors.push(new DefinitionError(
				`Unknown Property ${path}.${key}`,
				`${path}.${key}`
			));
	}

	if (Object.hasOwn(definition, "integer")) {
		const integer = definition["integer"];

		if (typeof integer !== "boolean")
			errors.push(new DefinitionError(
				`Expected ${path}.integer to be a Boolean`,
				`${path}.integer`
			));
		else
			constraints.integer = integer;
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

		if (typeof equals !== "number" || !Number.isFinite(equals))
			errors.push(new DefinitionError(
				`Expected ${path}.equals to be a finite Number`,
				`${path}.equals`
			));
		else
			constraints.equals = equals;
	}

	if (errors.length > 0)
		throw new AggregateError(
			errors,
			`Expected ${path} to be a valid NumberValidatorDefinition`
		);

	return new NumberValidator(constraints);
}

export function toJSON(
	validator: NumberValidator<NumberValidatorConstraints>,
	_domain: Domain
): NumberValidatorDefinition {
	return {
		type: "number",
		...(validator.constraints.integer !== undefined
			? {integer: validator.constraints.integer}
			: {}),
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
