import type {Domain} from "../../Domain";
import type {Validator} from "../../validators/Validator";
import {UnknownValidator} from "../../validators/core/UnknownValidator";
import type {ValidatorOperations} from "../ValidatorOperations";

export function normalizeUnknown(
	validator: UnknownValidator,
	_domain: Domain
): UnknownValidator {
	return validator;
}

export function mergeUnknown(
	_left: UnknownValidator,
	right: Validator,
	_domain: Domain
): Validator {
	return right;
}

export const UnknownOperations: ValidatorOperations = {
	normalize: [{
		validator: UnknownValidator,
		normalize: normalizeUnknown
	}]
};
