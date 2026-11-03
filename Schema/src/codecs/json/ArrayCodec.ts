import type {ValidatorDefinition} from "../ValidatorCodec";
import type {Domain} from "../../Domain";
import {DefinitionError} from "../../lib/errors";
import type {Validator} from "../../validators/Validator";
import {
	ArrayValidator,
	type ArrayValidatorConstraints
} from "../../validators/json/ArrayValidator";

export interface ArrayValidatorDefinition extends ValidatorDefinition {
	type: "array";
	min?: number;
	max?: number;
	every?: ValidatorDefinition;
	tuple?: ValidatorDefinition[];
}

export const ArrayCodec = {
	type: "array",
	validator: ArrayValidator,

	fromJSON(
		definition: { type: "array" } & Record<string, unknown>,
		path: string,
		domain: Domain
	): ArrayValidator<ArrayValidatorConstraints> {
		const errors: (DefinitionError | AggregateError)[] = [];
		const constraints: {
			min?: number;
			max?: number;
			every?: Validator;
			tuple?: readonly Validator[];
		} = {};

		for (const key of Object.keys(definition)) {
			if (!["type", "min", "max", "every", "tuple"].includes(key))
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

		if (Object.hasOwn(definition, "every")) {
			try {
				constraints.every = domain.fromJSON(
					definition["every"],
					`${path}.every`
				);
			} catch (error) {
				if (error instanceof DefinitionError || error instanceof AggregateError)
					errors.push(error);
				else
					throw error;
			}
		}

		if (Object.hasOwn(definition, "tuple")) {
			const tuple = definition["tuple"];

			if (!Array.isArray(tuple))
				errors.push(new DefinitionError(
					`Expected ${path}.tuple to be an Array`,
					`${path}.tuple`
				));
			else {
				const tupleValidators: Validator[] = [];

				for (let i = 0; i < tuple.length; i++) {
					try {
						tupleValidators.push(domain.fromJSON(tuple[i], `${path}.tuple[${i}]`));
					} catch (error) {
						if (error instanceof DefinitionError || error instanceof AggregateError)
							errors.push(error);
						else
							throw error;
					}
				}

				constraints.tuple = tupleValidators;
			}
		}

		if (errors.length > 0)
			throw new AggregateError(
				errors,
				`Expected ${path} to be a valid ArrayValidatorDefinition`
			);

		return new ArrayValidator(constraints);
	},

	toJSON(
		validator: ArrayValidator<ArrayValidatorConstraints>,
		domain: Domain
	): ArrayValidatorDefinition {
		return {
			type: "array",
			...(validator.constraints.min !== undefined
				? {min: validator.constraints.min}
				: {}),
			...(validator.constraints.max !== undefined
				? {max: validator.constraints.max}
				: {}),
			...(validator.constraints.every !== undefined
				? {every: domain.toJSON(validator.constraints.every)}
				: {}),
			...(validator.constraints.tuple !== undefined
				? {
					tuple: validator.constraints.tuple.map(variant => {
						return domain.toJSON(variant);
					})
				}
				: {})
		};
	}
};
