import type {Domain} from "../../Domain";
import type {Validator} from "../../validators/Validator";
import {NeverValidator} from "../../validators/core/NeverValidator";
import type {ValidatorOperations} from "../ValidatorOperations";

export function normalizeNever(
	validator: NeverValidator,
	_domain: Domain
): NeverValidator {
	return validator;
}

export function mergeNever(
	_left: NeverValidator,
	_right: Validator,
	_domain: Domain
): NeverValidator {
	return new NeverValidator();
}

export const NeverOperations: ValidatorOperations = {
	normalize: [{
		validator: NeverValidator,
		normalize: normalizeNever
	}]
};
