import {JSON} from '@serum-enterprises/json';
import {Validator, Definition, UnknownDefinition} from '../Validator';
import {AssertError, DefinitionError} from '../lib/errors';
import type {SchemaDomain} from '../SchemaDomain';
import {NeverValidator} from "./Never";
import {BoundaryValidator, BoundaryDefinition} from './BoundaryValidator';
import * as BoundaryHelper from './BoundaryValidator';

export interface StringValidatorDefinition extends Definition, BoundaryDefinition {
	type: 'string';
	equals?: string;
}

export class StringValidator<T = unknown> extends BoundaryValidator<T> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = 'definition',
		_schemaDomain: SchemaDomain
	): StringValidator {
		const validatorInstance = new StringValidator();
		const {max, min} = BoundaryHelper.fromJSON(definition, path);

		validatorInstance._min = min;
		validatorInstance._max = max;

		if ('equals' in definition) {
			if (!JSON.isString(definition['equals']))
				throw new DefinitionError(`Expected a String`, `${path}.equals`);

			validatorInstance._equals = definition['equals'];
		}

		return validatorInstance;
	}

	protected _equals: string | null = null;

	public equals<const V extends string>(value: V): StringValidator<V> {
		this._equals = value;

		return this as unknown as StringValidator<V>;
	}

	public assert(data: unknown, path: string = 'data'): asserts data is T {
		if (!JSON.isString(data))
			throw new AssertError(`Expected a String`, path);

		if (this._min !== null && this._min > data.length)
			throw new AssertError(`Expected at least ${this._min} characters`, path);

		if (this._max !== null && this._max < data.length)
			throw new AssertError(`Expected at most ${this._max} characters`, path);

		if (this._equals !== null && this._equals !== data)
			throw new AssertError(`Expected ${this._equals}`, path);
	}

	public isEqual(other: Validator): other is this {
		if (!this.isSameSubclass(other))
			return false;

		return this._min === other._min &&
			this._max === other._max &&
			this._equals === other._equals;
	}

	protected isValid(): boolean {
		if (this._min !== null && this._max !== null && this._min > this._max)
			return false;

		if (this._equals !== null) {
			if (this._min !== null && this._min > this._equals.length)
				return false;

			if (this._max !== null && this._max < this._equals.length)
				return false;
		}

		if (this._min !== null && this._max !== null && Math.ceil(this._min) > Math.floor(this._max))
			return false;

		return true;
	}

	public override normalize(): this | NeverValidator {
		if (!this.isValid())
			return new NeverValidator();

		return this.clone();
	}

	public clone(): this {
		const validator = new StringValidator() as this;

		validator._min = this._min;
		validator._max = this._max;
		validator._equals = this._equals;

		return validator;
	}

	public toJSON(): StringValidatorDefinition {
		const definition: StringValidatorDefinition = {
			type: 'string',
			...BoundaryHelper.toJSON({min: this._min, max: this._max})
		};

		if (this._equals !== null)
			definition['equals'] = this._equals;

		return definition;
	}
}