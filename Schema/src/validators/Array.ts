import {JSON} from '@serum-enterprises/json';
import {Option} from '@serum-enterprises/option';
import {Validator, Definition, UnknownDefinition} from '../Validator';
import {AssertError, DefinitionError} from '../lib/errors';
import {
	InferDefinitionType, InferValidatorReturnType,
	InferListDefinitionType, InferListReturnType
} from '../lib/types';
import type {SchemaDomain} from '../SchemaDomain';
import {BoundaryValidator, BoundaryDefinition} from './BoundaryValidator';
import * as BoundaryHelper from './BoundaryValidator';

type ArrayResult<E, T> =
	T extends readonly unknown[]
		? [...{ [K in keyof T]: T[K] & E }, ...E[]]
		: E[];

export interface ArrayValidatorDefinition<
	// Every & Tuple Definitions (as E & T)
	E extends Definition = Definition,
	T extends readonly Definition[] = readonly Definition[]
> extends Definition, BoundaryDefinition {
	type: 'array';
	every?: E;
	tuple?: T;
}

export class ArrayValidator<
	// Every and Tuple Types (as E & T)
	E = unknown,
	T = unknown,
	// Every & Tuple Definitions (as ED & TD)
	ED extends Definition = Definition,
	TD extends readonly Definition[] = readonly Definition[],
> extends BoundaryValidator<ArrayResult<E, T>> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = 'definition',
		schemaDomain: SchemaDomain
	): ArrayValidator {
		const validatorInstance = new ArrayValidator();
		const {max, min} = BoundaryHelper.fromJSON(definition, path);

		validatorInstance._min = min;
		validatorInstance._max = max;

		if ('every' in definition)
			validatorInstance._every = Option.Some(schemaDomain.fromJSON(definition['every'], `${path}.every`));

		if ('tuple' in definition) {
			if (!JSON.isShallowArray(definition['tuple']))
				throw new DefinitionError(`Expected an Array`, `${path}.tuple`);

			const tupleSchemas: Validator[] = [];
			const errors: DefinitionError[] = [];

			definition['tuple'].forEach((tupleDef, index) => {
				try {
					tupleSchemas.push(schemaDomain.fromJSON(tupleDef, `${path}.tuple[${index}]`));
				} catch (e) {
					errors.push(e instanceof Error ? e : new Error(String(e), {cause: e}));
				}
			});

			if (errors.length > 0)
				throw new AggregateError(errors);

			validatorInstance._tuple = Option.Some(tupleSchemas);
		}

		return validatorInstance;
	}

	protected _every: Option<Validator> = Option.None();
	protected _tuple: Option<readonly Validator[]> = Option.None();

	public every<const V extends Validator>(validator: V): ArrayValidator<InferValidatorReturnType<V>, T, InferDefinitionType<V>, TD> {
		this._every = Option.Some(validator);

		return this as unknown as ArrayValidator<InferValidatorReturnType<V>, T, InferDefinitionType<V>, TD>;
	}

	public tuple<const V extends readonly Validator[]>(validators: V): ArrayValidator<E, InferListReturnType<V>, ED, InferListDefinitionType<V>> {
		this._tuple = Option.Some(validators);

		return this as unknown as ArrayValidator<E, InferListReturnType<V>, ED, InferListDefinitionType<V>>;
	}

	public assert(data: unknown, path: string = 'data'): asserts data is T {
		if (!JSON.isShallowArray(data))
			throw new AssertError(`Expected an Array`, path);

		if (this._min.isSome() && this._min.value > data.length)
			throw new AssertError(`Expected at least ${this._min.value} elements`, path);

		if (this._max.isSome() && this._max.value < data.length)
			throw new AssertError(`Expected at most ${this._max.value} elements`, path);

		const errors: AssertError[] = [];

		if (this._every.isSome()) {
			const validator: Validator = this._every.value;

			data.forEach((value, index) => {
				try {
					validator.assert(value, `${path}[${index}]`);
				} catch (e) {
					errors.push(e instanceof Error ? e : new Error(String(e), {cause: e}));
				}
			});
		}

		if (this._tuple.isSome()) {
			if (data.length < this._tuple.value.length)
				throw new AssertError(`Expected at least ${this._tuple.value.length} elements`, path);

			this._tuple.value.forEach((validator: Validator, index) => {
				try {
					validator.assert(data[index], `${path}[${index}]`);
				} catch (e) {
					errors.push(e instanceof Error ? e : new Error(String(e), {cause: e}));
				}
			});
		}

		if (errors.length > 0)
			throw new AggregateError(errors);
	}

	private _isArrayValidator(other: Validator): other is ArrayValidator {
		return this.constructor === other.constructor;
	}

	public isEqual(other: Validator): other is this {
		if(!this._isArrayValidator(other))
			return false;

		return this._min.equals(other._min)
			&& this._max.equals(other._max)
			&& this._every.equals(other._every, (a, b) => {
				if (a.constructor !== b.constructor)
					return false;

				return a.isEqual(b);
			})
			&& this._tuple.equals(other._tuple, (a, b) => {
				if (a.length !== b.length)
					return false;

				return a.every((left, index) => {
					const right = b[index];

					if(!right)
						return false;

					if(left.constructor !== right.constructor)
						return false;

					return left.isEqual(right);
				})
			});
	}

	public toJSON(): ArrayValidatorDefinition<ED, TD> {
		const definition: ArrayValidatorDefinition = {
			type: 'array',
			...BoundaryHelper.toJSON({min: this._min, max: this._max})
		};

		if (this._every.isSome())
			definition.every = this._every.value.toJSON();

		if (this._tuple.isSome())
			definition.tuple = this._tuple.value.map(validator => validator.toJSON());

		return definition as ArrayValidatorDefinition<ED, TD>;
	}
}