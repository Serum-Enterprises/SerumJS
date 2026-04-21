import {JSON} from '@serum-enterprises/json';
import {Option} from '@serum-enterprises/option';
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

			validatorInstance._equals = Option.Some(definition['equals']);
		}

		return validatorInstance;
	}

	protected _equals: Option<JSON.String> = Option.None();

	public equals<const V extends string>(value: V): StringValidator<V> {
		this._equals = Option.Some(value);

		return this as unknown as StringValidator<V>;
	}

	public assert(data: unknown, path: string = 'data'): asserts data is T {
		if (!JSON.isString(data))
			throw new AssertError(`Expected a String`, path);

		if (this._min.isSome() && this._min.value > data.length)
			throw new AssertError(`Expected at least ${this._min.value} characters`, path);

		if (this._max.isSome() && this._max.value < data.length)
			throw new AssertError(`Expected at most ${this._max.value} characters`, path);

		if (this._equals.isSome() && this._equals.value !== data)
			throw new AssertError(`Expected ${this._equals.value}`, path);
	}

	private _isStringValidator(other: Validator): other is StringValidator {
		return this.constructor === other.constructor;
	}

	public isEqual(other: Validator): other is this {
		if (!this._isStringValidator(other))
			return false;

		return this._min.equals(other._min) &&
			this._max.equals(other._max) &&
			this._equals.equals(other._equals);
	}

	protected isValid(): boolean {
		if (this._min.isSome() && this._max.isSome() && this._min.value > this._max.value)
			return false;

		if (this._equals.isSome()) {
			if (this._min.isSome() && this._min.value > this._equals.value.length)
				return false;

			if (this._max.isSome() && this._max.value < this._equals.value.length)
				return false;
		}

		if (this._min.isSome() && this._max.isSome() && Math.ceil(this._min.value) > Math.floor(this._max.value))
			return false;

		return true;
	}

	public override normalize(): this | NeverValidator {
		if (!this.isValid())
			return new NeverValidator();

		const validator = new StringValidator() as this;

		validator._min = this._min.map(v => v);
		validator._max = this._max.map(v => v);
		validator._equals = this._equals.map(v => v);

		return validator;
	}

	public toJSON(): StringValidatorDefinition {
		const definition: StringValidatorDefinition = {
			type: 'string',
			...BoundaryHelper.toJSON({min: this._min, max: this._max})
		};

		if (this._min.isSome())
			definition['min'] = this._min.value;

		if (this._max.isSome())
			definition['max'] = this._max.value;

		if (this._equals.isSome())
			definition['equals'] = this._equals.value;

		return definition;
	}
}