import {Validator} from '../Validator';
import {AssertError, MergeError} from '../lib/errors';
import type {Domain} from '../Domain';
import {Definition, UnknownDefinition, JSON, isJSON} from "../lib/types";

export interface JSONValidatorDefinition extends Definition {
	type: 'json'
}

export class JSONValidator extends Validator<JSON> {
	public static fromJSON(
		_definition: UnknownDefinition,
		_path: string = 'definition',
		_schemaDomain: Domain
	): JSONValidator {
		return new JSONValidator();
	}

	public assert(data: unknown, path: string = 'data'): asserts data is JSON {
		if (!isJSON(data))
			throw new AssertError(`Expected valid JSON`, path);
	}

	public isEqual(other: Validator): other is this {
		return this.isSameValidator(other);
	}

	public clone(): this {
		return new JSONValidator() as this;
	}

	protected _merge(other: Validator, path: string = 'validator'): JSONValidator {
		if (!this.isSameValidator(other))
			throw new MergeError(`Conflicting Validator Subclasses`, path, {cause: {left: this, right: other}});

		return new JSONValidator() as this;
	}

	public normalize(): Validator {
		return this.clone();
	}

	protected _isSubset(other: Validator): boolean {
		return this.isSameValidator(other);
	}

	public toJSON(): JSONValidatorDefinition {
		return {
			type: 'json'
		};
	}
}
