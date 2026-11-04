import type {Domain} from "../../Domain";
import type {Validator} from "../../validators/Validator";
import {NeverValidator} from "../../validators/core/NeverValidator";
import {UnknownValidator} from "../../validators/core/UnknownValidator";
import {
	UnionValidator,
	type UnionValidatorConstraints
} from "../../validators/core/UnionValidator";
import type {ValidatorOperations} from "../ValidatorOperations";

function appendNormalized(
	variants: Validator[],
	validator: Validator,
	domain: Domain
): void {
	const normalized = domain.normalize(validator);

	if (normalized instanceof UnionValidator) {
		for (const variant of normalized.constraints.variants)
			appendNormalized(variants, variant, domain);
	}
	else if (!(normalized instanceof NeverValidator))
		variants.push(normalized);
}

export function normalizeUnion(
	validator: UnionValidator<UnionValidatorConstraints>,
	domain: Domain
): Validator {
	const variants: Validator[] = [];

	for (const variant of validator.constraints.variants)
		appendNormalized(variants, variant, domain);

	if (variants.some(variant => variant instanceof UnknownValidator))
		return new UnknownValidator();

	const deduplicated = variants.filter((variant, index) => {
		return variants.indexOf(variant) === index;
	});

	if (deduplicated.length === 0)
		return new NeverValidator();

	if (deduplicated.length === 1)
		return deduplicated[0]!;

	return new UnionValidator({
		variants: deduplicated as [Validator, ...Validator[]]
	});
}

export function mergeUnion(
	left: UnionValidator<UnionValidatorConstraints>,
	right: Validator,
	domain: Domain
): Validator {
	return new UnionValidator({
		variants: left.constraints.variants.map(variant => {
			return domain.merge(variant, right);
		}) as [Validator, ...Validator[]]
	});
}

export const UnionOperations: ValidatorOperations = {
	normalize: [{
		validator: UnionValidator,
		normalize: normalizeUnion
	}]
};
