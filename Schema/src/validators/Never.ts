import {Validator} from '../Validator';
import {AssertError} from '../lib/errors';
import type {Domain} from '../Domain';
import type {Definition, UnknownDefinition} from "../lib/types";

export interface NeverValidatorDefinition extends Definition {
	type: 'never';
}

export class NeverValidator extends Validator<never> {
	public static fromJSON(
		_definition: UnknownDefinition,
		_path: string = 'definition',
		_domain: Domain
	): NeverValidator {
		return new NeverValidator();
	}

	public assert(_data: unknown, path: string = 'data'): asserts _data is never {
		throw new AssertError(`Expected never`, path);
	}

	public clone(): this {
		return new NeverValidator() as this;
	}

	public toJSON(): NeverValidatorDefinition {
		return {
			type: 'never'
		};
	}
}