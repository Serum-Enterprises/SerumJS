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

	public clone(): this {
		return new NeverValidator() as this;
	}

	public isEqual(other: Validator): other is this {
		return this.constructor === other.constructor;
	}

	public merge(other: Validator, path: string = 'validator'): NeverValidator {
		if (this.constructor !== other.constructor)
			throw new MergeError(`Conflicting Validator Subclasses`, path, {cause: {left: this, right: other}});

		return new NeverValidator() as this;
	}

	public normalize(): this {
		return new NeverValidator() as this;
	}

	public isSubset(_other: Validator): boolean {
		return true;
	}

	public toJSON(): NeverValidatorDefinition {
		return {
			type: 'never'
		};
	}
}
