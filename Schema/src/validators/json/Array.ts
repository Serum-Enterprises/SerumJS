import {JSON} from '../../util/JSON';
import type {Registry} from '../../Registry';
import {Validator} from '../Validator';
import {
	Definition, ApplyNullability,
	InferDefinitionType, InferValidatorReturnType,
	InferListDefinitionType, InferListReturnType,
	AssertError, DefinitionError
} from '../../util';
import {Option} from "../../util/Option";

type ArrayResult<E, T> =
	T extends readonly unknown[]
		? [...{ [K in keyof T]: T[K] & E }, ...E[]]
		: E[];

export interface ArrayValidatorDefinition<
	E extends Definition = Definition,
	T extends readonly Definition[] = readonly Definition[]
> extends Definition {
	type: 'array';
	nullable?: boolean;
	min?: number;
	max?: number;
	every?: E;
	tuple?: T;
}

export class ArrayValidator<
	// E & T are the Every and Tuple Return Types
	E = unknown,
	T = unknown,
	// EV & TV are the Every and Tuple Definitions
	ED extends Definition = Definition,
	TD extends readonly Definition[] = readonly Definition[],
	// N is the Nullable Flag
	N extends boolean = false
> extends Validator<ApplyNullability<ArrayResult<E, T>, N>> {
	public static override fromJSON(
		definition: Definition & { [key: string]: unknown },
		path: string = 'definition',
		registry: Registry
	): Validator {
		const validatorInstance = new ArrayValidator();

		if ('nullable' in definition) {
			if (!JSON.isBoolean(definition['nullable']))
				throw new DefinitionError(`Expected ${path}.nullable to be a Boolean`);

			validatorInstance.nullable(definition['nullable']);
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

		if ('every' in definition) {
			if (!JSON.isObject(definition['every']))
				throw new DefinitionError(`Expected ${path}.every to be an Object`);

			validatorInstance.every(
				registry.fromJSON(definition['every'], `${path}.every`) as Validator
			);
		}

		if ('tuple' in definition) {
			if (!JSON.isShallowArray(definition['tuple']))
				throw new DefinitionError(`Expected ${path}.tuple to be an Array`);

			const tupleSchemas: Validator[] = [];
			const errors: DefinitionError[] = [];

			definition['tuple'].forEach((tupleDef, index) => {
				try {
					tupleSchemas.push(registry.fromJSON(tupleDef, `${path}.tuple[${index}]`));
				} catch (e) {
					if (!(e instanceof DefinitionError))
						throw new DefinitionError(`Fatal Error: Undefined Error thrown by Domain.fromJSON at ${path}`);

					errors.push(e);
				}
			});

			if (errors.length > 0)
				throw new DefinitionError(`Multiple Definition Errors detected at ${path} (see cause)`, {cause: errors});

			validatorInstance.tuple(tupleSchemas);
		}

		return validatorInstance;
	}

	public constructor(
		protected _nullable: Option<null> = Option.None(),
		protected _every: Option<Validator> = Option.None(),
		protected _tuple: Option<readonly Validator[]> = Option.None(),
		protected _min: Option<number> = Option.None(),
		protected _max: Option<number> = Option.None(),
	) {
		super();
	}

	public nullable<const F extends boolean = true>(flag?: F): ArrayValidator<E, T, ED, TD, F> {
		this._nullable = (flag ?? true) ? Option.Some(null) : Option.None();

		return this as any;
	}

	public min(value: number): this {
		this._min = Option.Some(value);
		return this;
	}

	public max(value: number): this {
		this._max = Option.Some(value);
		return this;
	}

	public every<const V extends Validator>(validator: V): ArrayValidator<
		InferValidatorReturnType<V>,
		T,
		InferDefinitionType<V>,
		TD,
		N
	> {
		this._every = Option.Some(validator);

		return this as any;
	}

	/**
	 * Applies ONLY to prefix indices [0..validators.length - 1]
	 * If every() is set, prefix elements are effectively `T[i] & E`.
	 */
	public tuple<const V extends readonly Validator[]>(
		validators: V
	): ArrayValidator<
		E,
		InferListReturnType<V>,
		ED,
		InferListDefinitionType<V>,
		N
	> {
		this._tuple = Option.Some(validators);
		return this as any;
	}

	public override assert(
		data: unknown,
		path: string = 'data'
	): asserts data is ApplyNullability<ArrayResult<E, T>, N> {
		if (JSON.isShallowArray(data)) {
			if (this._min.isSome() && this._min.value > data.length)
				throw new AssertError(`Expected ${path} to be at least ${this._min.value} Elements long`);

			if (this._max.isSome() && this._max.value < data.length)
				throw new AssertError(`Expected ${path} to be at most ${this._max.value} Elements long`);

			const errors: AssertError[] = [];

			if (this._every.isSome()) {
				const validator: Validator = this._every.value;

				data.forEach((value, index) => {
					try {
						validator.assert(value, `${path}[${index}]`);
					} catch (e) {
						if (!(e instanceof AssertError))
							throw new AssertError(`Fatal Error: Undefined Error thrown by an Assert Method at ${path}[${index}]`);

						errors.push(e);
					}
				});
			}

			if (this._tuple.isSome()) {
				if(data.length < this._tuple.value.length)
					throw new AssertError(`Expected ${path} to be at least ${this._tuple.value.length} Elements long (Tuple Constraint)`);

				this._tuple.value.forEach((validator: Validator, index) => {
					try {
						validator.assert(data[index], `${path}[${index}]`);
					} catch (e) {
						if (!(e instanceof AssertError))
							throw new AssertError(`Fatal Error: Undefined Error thrown by an Assert Method at ${path}[${index}]`);

						errors.push(e);
					}
				});
			}

			if (errors.length > 0)
				throw new AssertError(`Multiple Errors while asserting ${path} (see cause)`, {cause: errors});
		}

		if (!(JSON.isNull(data) && this._nullable.isSome()))
			throw new AssertError(`Expected ${path} to be an Array${this._nullable.isSome() ? ' or Null' : ''}`);
	}

	public override toJSON(): ArrayValidatorDefinition<ED, TD> {
		const definition: ArrayValidatorDefinition = {type: 'array'};

		if (this._nullable.isSome())
			definition.nullable = true;

		if (this._min.isSome())
			definition.min = this._min.value;

		if (this._max.isSome())
			definition.max = this._max.value;

		if (this._every.isSome())
			definition.every = this._every.value.toJSON();

		if (this._tuple.isSome())
			definition.tuple = this._tuple.value.map(validator => validator.toJSON());

		return definition as ArrayValidatorDefinition<ED, TD>;
	}
}