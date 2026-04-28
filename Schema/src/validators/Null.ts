import {Validator} from '../Validator';
import {AssertError, MergeError} from '../lib/errors';
import type {Domain} from '../Domain';
import {JSONValidator} from './JSON';
import {Definition, UnknownDefinition} from "../lib/types";

export interface NullValidatorDefinition extends Definition {
	type: 'null'
}

export class NullValidator extends Validator<null> {
	public static fromJSON(
		_definition: UnknownDefinition,
		_path: string = 'definition',
		_schemaDomain: Domain
	): NullValidator {
		return new NullValidator();
	}

	public assert(data: unknown, path: string = 'data'): asserts data is null {
		if (data !== null)
			throw new AssertError(`Expected null`, path);
	}

	public isEqual(other: Validator): other is this {
		return this.isSameValidator(other);
	}

	public clone(): this {
		return new NullValidator() as this;
	}

	protected _merge(other: Validator, path: string = 'validator'): NullValidator {
		if (!this.isSameValidator(other))
			throw new MergeError(`Conflicting Validator Subclasses`, path, {cause: {left: this, right: other}});

		return new NullValidator() as this;
	}

	public normalize(): Validator {
		return this.clone();
	}

	protected _isSubset(other: Validator): boolean {
		return this.isSameValidator(other) || other instanceof JSONValidator;
	}

	public toJSON(): NullValidatorDefinition {
		return {
			type: 'null'
		};
	}
}
