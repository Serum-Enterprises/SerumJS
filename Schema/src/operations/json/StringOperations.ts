import type {Domain} from "../../Domain";
import {NeverValidator} from "../../validators/core/NeverValidator";
import {
	StringValidator,
	type StringValidatorConstraints
} from "../../validators/json/StringValidator";
import type {ValidatorOperations} from "../ValidatorOperations";

export function normalizeString(
	validator: StringValidator<StringValidatorConstraints>,
	_domain: Domain
): StringValidator<StringValidatorConstraints> | NeverValidator {
	let {min, max} = validator.constraints;
	const equals = validator.constraints.equals;

	if (min !== undefined)
		min = Number.isNaN(min) ? undefined : Math.ceil(min);

	if (max !== undefined)
		max = Number.isNaN(max) ? undefined : Math.floor(max);

	if (equals !== undefined) {
		if (
			(min !== undefined && equals.length < min) ||
			(max !== undefined && equals.length > max)
		)
			return new NeverValidator();

		return new StringValidator({equals});
	}

	if (min !== undefined && min <= 0)
		min = undefined;

	if (max === Infinity)
		max = undefined;

	if (
		min === Infinity ||
		(max !== undefined && max < 0) ||
		(min !== undefined && max !== undefined && min > max)
	)
		return new NeverValidator();

	return new StringValidator({
		...(min !== undefined ? {min} : {}),
		...(max !== undefined ? {max} : {})
	});
}

export function mergeString(
	left: StringValidator<StringValidatorConstraints>,
	right: StringValidator<StringValidatorConstraints>,
	_domain: Domain
): StringValidator<StringValidatorConstraints> | NeverValidator {
	if (
		left.constraints.equals !== undefined &&
		right.constraints.equals !== undefined &&
		left.constraints.equals !== right.constraints.equals
	)
		return new NeverValidator();

	const minimums = [left.constraints.min, right.constraints.min]
		.filter((value): value is number => value !== undefined);
	const maximums = [left.constraints.max, right.constraints.max]
		.filter((value): value is number => value !== undefined);

	return new StringValidator({
		...(minimums.length > 0 ? {min: Math.max(...minimums)} : {}),
		...(maximums.length > 0 ? {max: Math.min(...maximums)} : {}),
		...(left.constraints.equals !== undefined
			? {equals: left.constraints.equals}
			: right.constraints.equals !== undefined
				? {equals: right.constraints.equals}
				: {})
	});
}

export const StringOperations: ValidatorOperations = {
	normalize: [{
		validator: StringValidator,
		normalize: normalizeString
	}],
	merge: [{
		left: StringValidator,
		right: StringValidator,
		merge: mergeString
	}]
};
