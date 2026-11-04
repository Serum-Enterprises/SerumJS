import type {Domain} from "../../Domain";
import type {Validator} from "../../validators/Validator";
import {NeverValidator} from "../../validators/core/NeverValidator";
import {UnknownValidator} from "../../validators/core/UnknownValidator";
import {
	ArrayValidator,
	type ArrayValidatorConstraints
} from "../../validators/json/ArrayValidator";
import type {ValidatorOperations} from "../ValidatorOperations";

export function normalizeArray(
	validator: ArrayValidator<ArrayValidatorConstraints>,
	domain: Domain
): ArrayValidator<ArrayValidatorConstraints> | NeverValidator {
	let {min, max} = validator.constraints;
	let every = validator.constraints.every === undefined
		? undefined
		: domain.normalize(validator.constraints.every);
	let tuple = validator.constraints.tuple?.map(entry => domain.normalize(entry));

	if (min !== undefined)
		min = Number.isNaN(min) ? undefined : Math.ceil(min);

	if (max !== undefined)
		max = Number.isNaN(max) ? undefined : Math.floor(max);

	if (min !== undefined && min <= 0)
		min = undefined;

	if (max === Infinity)
		max = undefined;

	if (min === Infinity || (max !== undefined && max < 0))
		return new NeverValidator();

	if (tuple?.some(entry => entry instanceof NeverValidator))
		return new NeverValidator();

	if (every instanceof NeverValidator) {
		if ((tuple?.length ?? 0) > 0 || (min ?? 0) > 0)
			return new NeverValidator();

		every = undefined;
		tuple = undefined;
		max = 0;
	}
	else if (every instanceof UnknownValidator)
		every = undefined;

	if (every !== undefined && tuple !== undefined) {
		tuple = tuple.map(entry => domain.merge(entry, every!));

		if (tuple.some(entry => entry instanceof NeverValidator))
			return new NeverValidator();
	}

	if (tuple !== undefined && tuple.length === 0)
		tuple = undefined;

	const tupleLength = tuple?.length ?? 0;

	if (max !== undefined && max < tupleLength)
		return new NeverValidator();

	if (min !== undefined && min <= tupleLength)
		min = undefined;

	if (min !== undefined && max !== undefined && min > max)
		return new NeverValidator();

	return new ArrayValidator({
		...(min !== undefined ? {min} : {}),
		...(max !== undefined ? {max} : {}),
		...(every !== undefined ? {every} : {}),
		...(tuple !== undefined ? {tuple} : {})
	});
}

export function mergeArray(
	left: ArrayValidator<ArrayValidatorConstraints>,
	right: ArrayValidator<ArrayValidatorConstraints>,
	domain: Domain
): ArrayValidator<ArrayValidatorConstraints> {
	const minimums = [left.constraints.min, right.constraints.min]
		.filter((value): value is number => value !== undefined);
	const maximums = [left.constraints.max, right.constraints.max]
		.filter((value): value is number => value !== undefined);
	let every: Validator | undefined;

	if (left.constraints.every !== undefined && right.constraints.every !== undefined)
		every = domain.merge(left.constraints.every, right.constraints.every);
	else
		every = left.constraints.every ?? right.constraints.every;

	const leftTuple = left.constraints.tuple ?? [];
	const rightTuple = right.constraints.tuple ?? [];
	const tupleLength = Math.max(leftTuple.length, rightTuple.length);
	const tuple: Validator[] = [];

	for (let index = 0; index < tupleLength; index++) {
		const leftEntry = leftTuple[index];
		const rightEntry = rightTuple[index];

		if (leftEntry !== undefined && rightEntry !== undefined)
			tuple.push(domain.merge(leftEntry, rightEntry));
		else
			tuple.push((leftEntry ?? rightEntry)!);
	}

	return new ArrayValidator({
		...(minimums.length > 0 ? {min: Math.max(...minimums)} : {}),
		...(maximums.length > 0 ? {max: Math.min(...maximums)} : {}),
		...(every !== undefined ? {every} : {}),
		...(tuple.length > 0 ? {tuple} : {})
	});
}

export const ArrayOperations: ValidatorOperations = {
	normalize: [{
		validator: ArrayValidator,
		normalize: normalizeArray
	}],
	merge: [{
		left: ArrayValidator,
		right: ArrayValidator,
		merge: mergeArray
	}]
};
