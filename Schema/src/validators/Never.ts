import {Validator, Definition, UnknownDefinition} from '../Validator';
import {AssertError, MergeError} from '../lib/errors';
import type {SchemaDomain} from '../SchemaDomain';

export interface NeverValidatorDefinition extends Definition {
	type: 'never';
}

export class NeverValidator extends Validator<never> {
	public static fromJSON(
		_definition: UnknownDefinition,
		_path: string = 'definition',
		_schemaDomain: SchemaDomain
	): NeverValidator {
		return new NeverValidator();
	}

	public assert(_data: unknown, path: string = 'data'): asserts _data is never {
		throw new AssertError(`Expected never`, path);
	}

	public isSameValidator(other: Validator): other is NeverValidator {
		return this.constructor === other.constructor;
	}

	public clone(): NeverValidator {
		return new NeverValidator() as this;
	}

	public isEqual(other: Validator): other is this {
		return this.isSameValidator(other);
	}

	public merge(other: Validator, path: string = 'validator'): NeverValidator {
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
