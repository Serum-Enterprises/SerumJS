import type {Domain} from "../../Domain";
import type {Validator} from "../../validators/Validator";
import {
	IntersectValidator,
	type IntersectValidatorConstraints
} from "../../validators/core/IntersectValidator";
import {NeverValidator} from "../../validators/core/NeverValidator";
import {UnknownValidator} from "../../validators/core/UnknownValidator";
import type {ValidatorOperations} from "../ValidatorOperations";

function flattenIntersect(
	validator: IntersectValidator<IntersectValidatorConstraints>
): Validator[] {
	const variants: Validator[] = [];

	for (const variant of validator.constraints.variants) {
		if (variant instanceof IntersectValidator)
			variants.push(...flattenIntersect(variant));
		else
			variants.push(variant);
	}

	return variants;
}

export function normalizeIntersect(
	validator: IntersectValidator<IntersectValidatorConstraints>,
	domain: Domain
): Validator {
	const variants = flattenIntersect(validator);

	if (variants.length === 0)
		return new UnknownValidator();

	let result: Validator = new UnknownValidator();

	for (const variant of variants) {
		result = domain.merge(result, variant);

		if (result instanceof NeverValidator)
			return result;
	}

	return result;
}

export const IntersectOperations: ValidatorOperations = {
	normalize: [{
		validator: IntersectValidator,
		normalize: normalizeIntersect
	}]
};
