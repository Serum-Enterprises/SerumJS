import {JSON} from '@serum-enterprises/json';
import {Validator, Definition, UnknownDefinition} from '../Validator';
import {AssertError, MergeError} from '../lib/errors';
import type {SchemaDomain} from '../SchemaDomain';

export interface NullValidatorDefinition extends Definition {
	type: 'null'
}

export class NullValidator extends Validator<null> {
	public static fromJSON(
		_definition: UnknownDefinition,
		_path: string = 'definition',
		_schemaDomain: SchemaDomain
	): NullValidator {
		return new NullValidator();
	}

	public assert(data: unknown, path: string = 'data'): asserts data is null {
		if (!JSON.isNull(data))
			throw new AssertError(`Expected null`, path);
	}

	public clone(): this {
		return new NullValidator() as this;
	}

	public isEqual(other: Validator): other is this {
		return this.constructor === other.constructor;
	}

	public merge(other: Validator, path: string = 'validator'): NullValidator {
		if (this.constructor !== other.constructor)
			throw new MergeError(`Conflicting Validator Subclasses`, path, {cause: {left: this, right: other}});

		return new NullValidator() as this;
	}

	public normalize(): this {
		return new NullValidator() as this;
	}

	public isSubset(other: Validator): boolean {
		return this.constructor === other.constructor;
	}

	public toJSON(): NullValidatorDefinition {
		return {
			type: 'null'
		};
	}
}
