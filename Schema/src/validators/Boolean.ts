import {JSON} from '@serum-enterprises/json';
import {Validator, Definition, UnknownDefinition} from '../Validator';
import {AssertError, DefinitionError} from '../lib/errors';
import type {SchemaDomain} from '../SchemaDomain';

export interface BooleanValidatorDefinition extends Definition {
	type: 'boolean';
	equals?: boolean;
}

export class BooleanValidator<T = unknown> extends Validator<T> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = 'definition',
		_schemaDomain: SchemaDomain
	): BooleanValidator {
		const validatorInstance = new BooleanValidator();

		if ('equals' in definition) {
			if (!JSON.isBoolean(definition['equals']))
				throw new DefinitionError(`Expected a Boolean`, `${path}.equals`);

			validatorInstance._equals = definition['equals'];
		}

		return validatorInstance;
	}

	protected _equals: boolean | null = null;

	public equals<const V extends boolean>(value: V): BooleanValidator<V> {
		this._equals = value;

		return this as unknown as BooleanValidator<V>;
	}

	public assert(data: unknown, path: string = 'data'): asserts data is T {
		if (!JSON.isBoolean(data))
			throw new AssertError(`Expected a Boolean`, path);

		if (this._equals !== null && this._equals !== data)
			throw new AssertError(`Expected ${this._equals}`, path);
	}

	private _isBooleanValidator(other: Validator): other is BooleanValidator {
		return this.constructor === other.constructor;
	}

	public isEqual(other: Validator): other is this {
		if(!this._isBooleanValidator(other))
			return false;

		return this._equals === other._equals;
	}

	public override normalize(): this {
		const validator = new BooleanValidator();

		validator._equals = this._equals;

		return validator as this;
	}

	public clone(): this {
		const validator = new BooleanValidator() as this;

		validator._equals = this._equals;

		return validator;
	}

	public toJSON(): BooleanValidatorDefinition {
		const definition: BooleanValidatorDefinition = {
			type: 'boolean'
		};

		if (this._equals !== null)
			definition['equals'] = this._equals;

		return definition;
	}
}