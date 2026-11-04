import type {Domain} from "../../Domain";
import {NullValidator} from "../../validators/json/NullValidator";
import type {ValidatorOperations} from "../ValidatorOperations";

export function normalizeNull(
	validator: NullValidator,
	_domain: Domain
): NullValidator {
	return validator;
}

export function mergeNull(
	_left: NullValidator,
	_right: NullValidator,
	_domain: Domain
): NullValidator {
	return new NullValidator();
}

export const NullOperations: ValidatorOperations = {
	normalize: [{
		validator: NullValidator,
		normalize: normalizeNull
	}],
	merge: [{
		left: NullValidator,
		right: NullValidator,
		merge: mergeNull
	}]
};
