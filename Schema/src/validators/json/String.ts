import {JSON} from '../../util/JSON';
import type {Registry} from '../../Registry';
import {Validator} from '../Validator';
import {Definition, ApplyNullability, AssertError, DefinitionError} from '../../util';
import {Option} from '../../util/Option';

export interface StringValidatorDefinition extends Definition {
	type: 'string';
	nullable?: boolean;
	equals?: JSON.String;
	min?: number;
	max?: number;
}

export class StringValidator<
	T extends JSON.String = JSON.String,
	N extends boolean = false
> extends Validator<ApplyNullability<T, N>> {
	public static override fromJSON(
		definition: Definition & { [key: string]: unknown },
		path: string = 'schema',
		_registry: Registry
	): Validator {
		const validatorInstance = new StringValidator();

		if ('nullable' in definition) {
			if (!JSON.isBoolean(definition['nullable']))
				throw new DefinitionError(`Expected ${path}.nullable to be a Boolean`);

			validatorInstance.nullable(definition['nullable']);
		}

		if ('equals' in definition) {
			if (!JSON.isString(definition['equals']))
				throw new DefinitionError(`Expected ${path}.equals to be a String`);

			validatorInstance.equals(definition['equals']);
		}

		if ('min' in definition) {
			if (!JSON.isNumber(definition['min']))
				throw new DefinitionError(`Expected ${path}.min to be a Number`);

			validatorInstance.min(definition['min']);
		}

		if ('max' in definition) {
			if (!JSON.isNumber(definition['max']))
				throw new DefinitionError(`Expected ${path}.max to be a Number`);

			validatorInstance.max(definition['max']);
		}

		return validatorInstance;
	}

	public constructor(
		protected _nullable: Option<null> = Option.None(),
		protected _equals: Option<JSON.String> = Option.None(),
		protected _min: Option<number> = Option.None(),
		protected _max: Option<number> = Option.None()
	) {
		super();
	}

	public nullable<const F extends boolean = true>(flag?: F): StringValidator<T, F> {
		this._nullable = (flag ?? true) ? Option.Some(null) : Option.None();

		return this as any;
	}

	public equals<const V extends string>(value: V): StringValidator<V, N> {
		this._equals = Option.Some(value);

		return this as any;
	}

	public min(value: number): this {
		this._min = Option.Some(value);

		return this as any;
	}

	public max(value: number): this {
		this._max = Option.Some(value);

		return this as any;
	}

	public assert(data: unknown, path: string = 'data'): asserts data is ApplyNullability<T, N> {
		if (JSON.isString(data)) {
			if (this._equals.isSome() && this._equals.value !== data)
				throw new AssertError(`Expected ${path} to be ${this._equals.value}`);

			if (this._min.isSome() && this._min.value > data.length)
				throw new AssertError(`Expected ${path} to be at least ${this._min.value} characters long`);

			if (this._max.isSome() && this._max.value < data.length)
				throw new AssertError(`Expected ${path} to be at most ${this._max.value} characters long`);
		}
		else if (!(this._nullable.isSome() && JSON.isNull(data)))
			throw new AssertError(`Expected ${path} to be a String${this._nullable.isSome() ? ' or Null' : ''}`);
	}

	public toJSON(): StringValidatorDefinition {
		const definition: StringValidatorDefinition = {
			type: 'string'
		};

		if (this._nullable.isSome())
			definition['nullable'] = true;

		if (this._equals.isSome())
			definition['equals'] = this._equals.value;

		if (this._min.isSome())
			definition['min'] = this._min.value;

		if (this._max.isSome())
			definition['max'] = this._max.value;

		return definition;
	}
}