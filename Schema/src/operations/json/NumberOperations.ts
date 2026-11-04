import type {Domain} from "../../Domain";
import {NeverValidator} from "../../validators/core/NeverValidator";
import {
	NumberValidator,
	type NumberValidatorConstraints
} from "../../validators/json/NumberValidator";
import type {ValidatorOperations} from "../ValidatorOperations";

export function normalizeNumber(
	validator: NumberValidator<NumberValidatorConstraints>,
	_domain: Domain
): NumberValidator<NumberValidatorConstraints> | NeverValidator {
	let {min, max} = validator.constraints;
	const integer = validator.constraints.integer === true;
	const equals = validator.constraints.equals;

	if (min !== undefined && Number.isNaN(min))
		min = undefined;

	if (max !== undefined && Number.isNaN(max))
		max = undefined;

	if (equals !== undefined) {
		if (
			Number.isNaN(equals) ||
			(integer && !Number.isSafeInteger(equals)) ||
			(min !== undefined && equals < min) ||
			(max !== undefined && equals > max)
		)
			return new NeverValidator();

		return new NumberValidator({equals});
	}

	if (integer) {
		if (min !== undefined)
			min = Math.ceil(min);

		if (max !== undefined)
			max = Math.floor(max);

		if (
			(min !== undefined && min > Number.MAX_SAFE_INTEGER) ||
			(max !== undefined && max < Number.MIN_SAFE_INTEGER)
		)
			return new NeverValidator();

		if (min !== undefined && min <= Number.MIN_SAFE_INTEGER)
			min = undefined;

		if (max !== undefined && max >= Number.MAX_SAFE_INTEGER)
			max = undefined;
	}
	else {
		if (min === -Infinity)
			min = undefined;

		if (max === Infinity)
			max = undefined;
	}

	if (min !== undefined && max !== undefined && min > max)
		return new NeverValidator();

	if (min !== undefined && max !== undefined && min === max)
		return new NumberValidator({equals: min});

	return new NumberValidator({
		...(integer ? {integer: true} : {}),
		...(min !== undefined ? {min} : {}),
		...(max !== undefined ? {max} : {})
	});
}

export function mergeNumber(
	left: NumberValidator<NumberValidatorConstraints>,
	right: NumberValidator<NumberValidatorConstraints>,
	_domain: Domain
): NumberValidator<NumberValidatorConstraints> | NeverValidator {
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

	return new NumberValidator({
		...(left.constraints.integer || right.constraints.integer
			? {integer: true}
			: {}),
		...(minimums.length > 0 ? {min: Math.max(...minimums)} : {}),
		...(maximums.length > 0 ? {max: Math.min(...maximums)} : {}),
		...(left.constraints.equals !== undefined
			? {equals: left.constraints.equals}
			: right.constraints.equals !== undefined
				? {equals: right.constraints.equals}
				: {})
	});
}

export const NumberOperations: ValidatorOperations = {
	normalize: [{
		validator: NumberValidator,
		normalize: normalizeNumber
	}],
	merge: [{
		left: NumberValidator,
		right: NumberValidator,
		merge: mergeNumber
	}]
};
