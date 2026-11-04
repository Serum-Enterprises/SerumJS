import type {Domain} from "../../Domain";
import type {Validator} from "../../validators/Validator";
import {NeverValidator} from "../../validators/core/NeverValidator";
import {UnknownValidator} from "../../validators/core/UnknownValidator";
import {
	ObjectValidator,
	type ObjectValidatorConstraints
} from "../../validators/json/ObjectValidator";
import type {ValidatorOperations} from "../ValidatorOperations";

function hasSameKeys(
	left: Readonly<Record<string, Validator>>,
	right: Readonly<Record<string, Validator>>
): boolean {
	const leftKeys = Object.keys(left);
	const rightKeys = Object.keys(right);

	return leftKeys.length === rightKeys.length && leftKeys.every(key => {
		return Object.hasOwn(right, key);
	});
}

export function normalizeObject(
	validator: ObjectValidator<ObjectValidatorConstraints>,
	domain: Domain
): ObjectValidator<ObjectValidatorConstraints> | NeverValidator {
	let {min, max} = validator.constraints;
	const exact = validator.constraints.exact === true;
	let every = validator.constraints.every === undefined
		? undefined
		: domain.normalize(validator.constraints.every);
	let shape = validator.constraints.shape === undefined
		? undefined
		: Object.fromEntries(
			Object.entries(validator.constraints.shape).map(([key, entry]) => {
				return [key, domain.normalize(entry)];
			})
		);

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

	if (shape !== undefined && Object.values(shape).some(entry => {
		return entry instanceof NeverValidator;
	}))
		return new NeverValidator();

	if (every instanceof NeverValidator) {
		if (Object.keys(shape ?? {}).length > 0 || (min ?? 0) > 0)
			return new NeverValidator();

		return new ObjectValidator({exact: true});
	}

	if (every instanceof UnknownValidator)
		every = undefined;

	if (every !== undefined && shape !== undefined) {
		shape = Object.fromEntries(Object.entries(shape).map(([key, entry]) => {
			return [key, domain.merge(entry, every!)];
		}));

		if (Object.values(shape).some(entry => entry instanceof NeverValidator))
			return new NeverValidator();
	}

	const shapeLength = Object.keys(shape ?? {}).length;

	if (max !== undefined && max < shapeLength)
		return new NeverValidator();

	if (exact) {
		if (min !== undefined && min > shapeLength)
			return new NeverValidator();

		min = undefined;
		max = undefined;
		every = undefined;
	}
	else if (min !== undefined && min <= shapeLength)
		min = undefined;

	if (min !== undefined && max !== undefined && min > max)
		return new NeverValidator();

	if (shapeLength === 0)
		shape = undefined;

	return new ObjectValidator({
		...(min !== undefined ? {min} : {}),
		...(max !== undefined ? {max} : {}),
		...(every !== undefined ? {every} : {}),
		...(shape !== undefined ? {shape} : {}),
		...(exact ? {exact: true} : {})
	});
}

export function mergeObject(
	left: ObjectValidator<ObjectValidatorConstraints>,
	right: ObjectValidator<ObjectValidatorConstraints>,
	domain: Domain
): ObjectValidator<ObjectValidatorConstraints> | NeverValidator {
	const leftShape = left.constraints.shape ?? {};
	const rightShape = right.constraints.shape ?? {};
	const leftExact = left.constraints.exact === true;
	const rightExact = right.constraints.exact === true;

	if (
		(leftExact && Object.keys(rightShape).some(key => !Object.hasOwn(leftShape, key))) ||
		(rightExact && Object.keys(leftShape).some(key => !Object.hasOwn(rightShape, key))) ||
		(leftExact && rightExact && !hasSameKeys(leftShape, rightShape))
	)
		return new NeverValidator();

	const shapeEntries: [string, Validator][] = [];

	for (const key of new Set([...Object.keys(leftShape), ...Object.keys(rightShape)])) {
		const leftEntry = leftShape[key];
		const rightEntry = rightShape[key];

		shapeEntries.push([
			key,
			leftEntry !== undefined && rightEntry !== undefined
				? domain.merge(leftEntry, rightEntry)
				: (leftEntry ?? rightEntry)!
		]);
	}

	let every: Validator | undefined;

	if (left.constraints.every !== undefined && right.constraints.every !== undefined)
		every = domain.merge(left.constraints.every, right.constraints.every);
	else
		every = left.constraints.every ?? right.constraints.every;

	const minimums = [left.constraints.min, right.constraints.min]
		.filter((value): value is number => value !== undefined);
	const maximums = [left.constraints.max, right.constraints.max]
		.filter((value): value is number => value !== undefined);

	return new ObjectValidator({
		...(minimums.length > 0 ? {min: Math.max(...minimums)} : {}),
		...(maximums.length > 0 ? {max: Math.min(...maximums)} : {}),
		...(every !== undefined ? {every} : {}),
		...(shapeEntries.length > 0 ? {shape: Object.fromEntries(shapeEntries)} : {}),
		...(leftExact || rightExact ? {exact: true} : {})
	});
}

export const ObjectOperations: ValidatorOperations = {
	normalize: [{
		validator: ObjectValidator,
		normalize: normalizeObject
	}],
	merge: [{
		left: ObjectValidator,
		right: ObjectValidator,
		merge: mergeObject
	}]
};
