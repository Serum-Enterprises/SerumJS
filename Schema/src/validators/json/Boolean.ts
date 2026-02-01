import {JSON} from '../../util/JSON';
import type {Registry} from '../../Registry';
import {Validator} from '../Validator';
import {Definition, ApplyNullability, AssertError, DefinitionError} from '../../util';
import {Option} from '../../util/Option';

export interface BooleanValidatorDefinition extends Definition {
	type: 'boolean';
	nullable?: boolean;
	equals?: boolean;
}

export class BooleanValidator<
	T extends JSON.Boolean = JSON.Boolean,
	N extends boolean = false
> extends Validator<ApplyNullability<T, N>> {
	public static override fromJSON(
		definition: Definition & { [key: string]: unknown },
		path: string = 'definition',
		_registry: Registry
	): Validator {
		const validatorInstance = new BooleanValidator();

		if ('nullable' in definition) {
			if (!JSON.isBoolean(definition['nullable']))
				throw new DefinitionError(`Expected ${path}.nullable to be a Boolean`);

			validatorInstance.nullable(definition['nullable']);
		}

		if ('equals' in definition) {
			if (!JSON.isBoolean(definition['equals']))
				throw new DefinitionError(`Expected ${path}.equals to be a Boolean`);

			validatorInstance.equals(definition['equals']);
		}

		return validatorInstance;
	}

	public constructor(
		protected _nullable: Option<null> = Option.None(),
		protected _equals: Option<boolean> = Option.None()
	) {
		super();
	}

	public nullable<const F extends boolean = true>(flag?: F): BooleanValidator<T, F> {
		this._nullable = flag ?? true ? Option.Some(null) : Option.None();

		return this as unknown as BooleanValidator<T, F>;
	}

	public equals<const V extends boolean>(value: V): BooleanValidator<V, N> {
		this._equals = Option.Some(value);

		return this as unknown as BooleanValidator<V, N>;
	}

	public override assert(data: unknown, path: string = 'data'): asserts data is ApplyNullability<T, N> {
		if (JSON.isBoolean(data)) {
			if (this._equals.isSome() && this._equals.value !== data)
				throw new AssertError(`Expected ${path} to be ${this._equals.value}${this._nullable.isSome() ? '' : ' or Null'}`);
		}
		else if (!(this._nullable.isSome() && JSON.isNull(data)))
			throw new AssertError(`Expected ${path} to be a Boolean${this._nullable.isSome() ? '' : ' or Null'}`);
	}

	public override toJSON(): BooleanValidatorDefinition {
		const definition: BooleanValidatorDefinition = {
			type: 'boolean'
		};

		if (this._nullable.isSome())
			definition['nullable'] = true;

		if (this._equals.isSome())
			definition['equals'] = this._equals.value;

		return definition;
	}
}