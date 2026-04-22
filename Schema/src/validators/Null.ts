import {JSON} from '@serum-enterprises/json';
import {Validator, Definition, UnknownDefinition} from '../Validator';
import {AssertError} from '../lib/errors';
import type {SchemaDomain} from '../SchemaDomain';

export interface NullValidatorDefinition extends Definition {
	type: 'null'
}

export class NullValidator<T = unknown> extends Validator<T> {
	public static fromJSON(
		_definition: UnknownDefinition,
		_path: string = 'definition',
		_schemaDomain: SchemaDomain
	): NullValidator {
		return new NullValidator();
	}

	public assert(data: unknown, path: string = 'data'): asserts data is T {
		if (!JSON.isNull(data))
			throw new AssertError(`Expected null`, path);
	}

	public isEqual(other: Validator): other is this {
		return this.isSameSubclass(other);
	}

	public override normalize(): this {
		return super.normalize() as this;
	}

	public clone(): this {
		return new NullValidator() as this;
	}

	public toJSON(): NullValidatorDefinition {
		return {
			type: 'null'
		};
	}
}
