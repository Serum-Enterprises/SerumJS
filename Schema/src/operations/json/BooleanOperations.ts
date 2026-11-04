import type {Domain} from "../../Domain";
import {NeverValidator} from "../../validators/core/NeverValidator";
import {
	BooleanValidator,
	type BooleanValidatorConstraints
} from "../../validators/json/BooleanValidator";
import type {ValidatorOperations} from "../ValidatorOperations";

export function normalizeBoolean(
	validator: BooleanValidator<BooleanValidatorConstraints>,
	_domain: Domain
): BooleanValidator<BooleanValidatorConstraints> {
	if (validator.constraints.equals === undefined)
		return new BooleanValidator({});

	return new BooleanValidator({equals: validator.constraints.equals});
}

export function mergeBoolean(
	left: BooleanValidator<BooleanValidatorConstraints>,
	right: BooleanValidator<BooleanValidatorConstraints>,
	_domain: Domain
): BooleanValidator<BooleanValidatorConstraints> | NeverValidator {
	if (
		left.constraints.equals !== undefined &&
		right.constraints.equals !== undefined &&
		left.constraints.equals !== right.constraints.equals
	)
		return new NeverValidator();

	return new BooleanValidator({
		...left.constraints,
		...right.constraints
	});
}

export const BooleanOperations: ValidatorOperations = {
	normalize: [{
		validator: BooleanValidator,
		normalize: normalizeBoolean
	}],
	merge: [{
		left: BooleanValidator,
		right: BooleanValidator,
		merge: mergeBoolean
	}]
};
