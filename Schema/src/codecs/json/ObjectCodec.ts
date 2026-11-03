import type {ValidatorDefinition} from "../ValidatorCodec";
import type {Domain} from "../../Domain";
import {DefinitionError} from "../../lib/errors";
import type {Validator} from "../../validators/Validator";
import {
	ObjectValidator,
	type ObjectValidatorConstraints
} from "../../validators/json/ObjectValidator";

export interface ObjectValidatorDefinition extends ValidatorDefinition {
	type: "object";
	min?: number;
	max?: number;
	every?: ValidatorDefinition;
	shape?: Record<string, ValidatorDefinition>;
	exact?: boolean;
}

export const ObjectCodec = {
	type: "object",
	validator: ObjectValidator,

	fromJSON(
		definition: {type: "object"} & Record<string, unknown>,
		path: string,
		domain: Domain
	): ObjectValidator<ObjectValidatorConstraints> {
		const errors: (DefinitionError | AggregateError)[] = [];
		const constraints: {
			min?: number;
			max?: number;
			every?: Validator;
			shape?: Readonly<Record<string, Validator>>;
			exact?: boolean;
		} = {};

		for (const key of Object.keys(definition)) {
			if (!["type", "min", "max", "every", "shape", "exact"].includes(key))
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

		if (Object.hasOwn(definition, "shape")) {
			const shape = definition["shape"];

			if (!((value: unknown): value is Record<string, unknown> => {
				if (typeof value !== "object" || value === null)
					return false;

				const prototype = Object.getPrototypeOf(value);

				return prototype === Object.prototype || prototype === null;
			})(shape))
				errors.push(new DefinitionError(
					`Expected ${path}.shape to be an Object`,
					`${path}.shape`
				));
			else {
				const shapeValidators: [string, Validator][] = [];

				for (const [key, validator] of Object.entries(shape)) {
					try {
						shapeValidators.push([
							key,
							domain.fromJSON(validator, `${path}.shape.${key}`)
						]);
					} catch (error) {
						if (error instanceof DefinitionError || error instanceof AggregateError)
							errors.push(error);
						else
							throw error;
					}
				}

				constraints.shape = Object.fromEntries(shapeValidators);
			}
		}

		if (Object.hasOwn(definition, "exact")) {
			const exact = definition["exact"];

			if (typeof exact !== "boolean")
				errors.push(new DefinitionError(
					`Expected ${path}.exact to be a Boolean`,
					`${path}.exact`
				));
			else
				constraints.exact = exact;
		}

		if (errors.length > 0)
			throw new AggregateError(
				errors,
				`Expected ${path} to be a valid ObjectValidatorDefinition`
			);

		return new ObjectValidator(constraints);
	},

	toJSON(
		validator: ObjectValidator<ObjectValidatorConstraints>,
		domain: Domain
	): ObjectValidatorDefinition {
		return {
			type: "object",
			...(validator.constraints.min !== undefined
				? {min: validator.constraints.min}
				: {}),
			...(validator.constraints.max !== undefined
				? {max: validator.constraints.max}
				: {}),
			...(validator.constraints.every !== undefined
				? {every: domain.toJSON(validator.constraints.every)}
				: {}),
			...(validator.constraints.shape !== undefined
				? {
					shape: Object.fromEntries(
						Object.entries(validator.constraints.shape).map(([key, shapeValidator]) => {
							return [key, domain.toJSON(shapeValidator)];
						})
					)
				}
				: {}),
			...(validator.constraints.exact !== undefined
				? {exact: validator.constraints.exact}
				: {})
		};
	}
};