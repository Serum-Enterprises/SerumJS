import {Validator} from '../Validator';
import {AssertError, MergeError} from '../lib/errors';
import type {Domain} from '../Domain';
import {Definition, UnknownDefinition} from "../lib/types";

export interface NeverValidatorDefinition extends Definition {
	type: 'never';
}

export class NeverValidator extends Validator<never> {
	public static fromJSON(
		_definition: UnknownDefinition,
		_path: string = 'definition',
		_schemaDomain: Domain
	): NeverValidator {
		return new NeverValidator();
	}

	public assert(_data: unknown, path: string = 'data'): asserts _data is never {
		throw new AssertError(`Expected never`, path);
	}

	public isEqual(other: Validator): other is this {
		return this.isSameValidator(other);
	}

	public clone(): this {
		return new NeverValidator() as this;
	}

	protected _merge(other: Validator, path: string = 'validator'): NeverValidator {
		if (this.isSameValidator(other))
			throw new MergeError(`Conflicting Validator Subclasses`, path, {cause: {left: this, right: other}});

		return new NeverValidator() as this;
	}

	public normalize(): Validator {
		return this.clone();
	}

	protected _isSubset(_other: Validator): boolean {
		return true;
	}

	public toJSON(): NeverValidatorDefinition {
		return {
			type: 'never'
		};
	}
}
