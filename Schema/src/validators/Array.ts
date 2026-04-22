import {JSON} from '@serum-enterprises/json';
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
			validatorInstance._every = schemaDomain.fromJSON(definition['every'], `${path}.every`);

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

			validatorInstance._tuple = tupleSchemas;
		}

		return validatorInstance;
	}

	protected _every: Validator | null = null;
	protected _tuple: (readonly Validator[]) | null = null;

	public every<const V extends Validator>(validator: V): ArrayValidator<InferValidatorReturnType<V>, T, InferDefinitionType<V>, TD> {
		this._every = validator;

		return this as unknown as ArrayValidator<InferValidatorReturnType<V>, T, InferDefinitionType<V>, TD>;
	}

	public tuple<const V extends readonly Validator[]>(validators: V): ArrayValidator<E, InferListReturnType<V>, ED, InferListDefinitionType<V>> {
		this._tuple = validators;

		return this as unknown as ArrayValidator<E, InferListReturnType<V>, ED, InferListDefinitionType<V>>;
	}

	public assert(data: unknown, path: string = 'data'): asserts data is T {
		if (!JSON.isShallowArray(data))
			throw new AssertError(`Expected an Array`, path);

		if (this._min !== null && this._min > data.length)
			throw new AssertError(`Expected at least ${this._min} elements`, path);

		if (this._max !== null && this._max < data.length)
			throw new AssertError(`Expected at most ${this._max} elements`, path);

		const errors: AssertError[] = [];

		if (this._every !== null) {
			const validator: Validator = this._every;

			data.forEach((value, index) => {
				try {
					validator.assert(value, `${path}[${index}]`);
				} catch (e) {
					errors.push(e instanceof Error ? e : new Error(String(e), {cause: e}));
				}
			});
		}

		if (this._tuple !== null) {
			if (data.length < this._tuple.length)
				throw new AssertError(`Expected at least ${this._tuple.length} elements`, path);

			this._tuple.forEach((validator: Validator, index) => {
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

	public isEqual(other: Validator): other is this {
		if (!this.isSameSubclass(other))
			return false;

		let result = true;

		result &&= this._min === other._min && this._max === other._max;

		if (this._every === null || other._every === null)
			result &&= this._every === other._every;
		else
			result &&= this._every.isEqual(other._every);

		if (this._tuple === null || other._tuple === null) {
			result &&= this._tuple === other._tuple;
		} else {
			const otherTuple = other._tuple;

			result &&= this._tuple.length === otherTuple.length;

			for (let index = 0; index < this._tuple.length && result; index++) {
				const left = this._tuple[index];
				const right = otherTuple[index];

				result &&= right !== undefined && left !== undefined && left.isEqual(right);
			}
		}
		return result;
	}

	public clone(): this {
		const validator = new ArrayValidator() as this;

		validator._min = this._min;
		validator._max = this._max;
		validator._every = this._every ? this._every.clone() : this._every;
		validator._tuple = this._tuple ? this._tuple.map(v => v.clone()) : this._tuple;

		return validator;
	}

	public toJSON(): ArrayValidatorDefinition<ED, TD> {
		const definition: ArrayValidatorDefinition = {
			type: 'array',
			...BoundaryHelper.toJSON({min: this._min, max: this._max})
		};

		if (this._every !== null)
			definition.every = this._every.toJSON();

		if (this._tuple !== null)
			definition.tuple = this._tuple.map(v => v.toJSON());

		return definition as ArrayValidatorDefinition<ED, TD>;
	}
}