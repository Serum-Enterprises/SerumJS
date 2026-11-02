import type {ValidatorDefinition} from "../ValidatorCodec";
import type {Domain} from "../../Domain";
import {DefinitionError} from "../../lib/errors";
import type {Validator} from "../../validators/Validator";
import {
	IntersectValidator,
	type IntersectValidatorConstraints
} from "../../validators/core/IntersectValidator";

export interface IntersectValidatorDefinition extends ValidatorDefinition {
	type: "intersect";
	variants: [ValidatorDefinition, ...ValidatorDefinition[]];
}

export function fromJSON(
	definition: { type: "intersect" } & Record<string, unknown>,
	path: string,
	domain: Domain
): IntersectValidator<IntersectValidatorConstraints> {
	const errors: (DefinitionError | AggregateError)[] = [];

	for (const key of Object.keys(definition)) {
		if (!["type", "variants"].includes(key))
			errors.push(new DefinitionError(
				`Unknown Property ${path}.${key}`,
				`${path}.${key}`
			));
	}

	if (!Array.isArray(definition["variants"])) {
		errors.push(new DefinitionError(
			`Expected ${path}.variants to be an Array`,
			`${path}.variants`
		));

		throw new AggregateError(errors, `Expected ${path} to be a valid IntersectValidatorDefinition`);
	}

	if (definition["variants"].length < 1) {
		errors.push(new DefinitionError(
			`Expected ${path}.variants to contain at least one ValidatorDefinition`,
			`${path}.variants`
		));

		throw new AggregateError(errors, `Expected ${path} to be a valid IntersectValidatorDefinition`);
	}

	const variants: Validator[] = [];

	for (let i = 0; i < definition["variants"].length; i++) {
		try {
			variants.push(domain.fromJSON(definition["variants"][i], `${path}.variants[${i}]`));
		} catch (error) {
			if (error instanceof DefinitionError || error instanceof AggregateError)
				errors.push(error);
			else
				throw error;
		}
	}

	if (errors.length > 0)
		throw new AggregateError(errors, `Expected ${path} to be a valid IntersectValidatorDefinition`);

	return new IntersectValidator({variants: variants as [Validator, ...Validator[]]});
}

export function toJSON(
	validator: IntersectValidator<IntersectValidatorConstraints>,
	domain: Domain
): IntersectValidatorDefinition {
	const [first, ...remaining] = validator.constraints.variants;

	return {
		type: "intersect",
		variants: [
			domain.toJSON(first),
			...remaining.map(variant => domain.toJSON(variant))
		]
	};
}
