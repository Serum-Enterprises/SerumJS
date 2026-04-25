import {JSON} from '@serum-enterprises/json';
import {Validator, Definition, UnknownDefinition} from '../Validator';
import {AssertError, DefinitionError, MergeError} from '../lib/errors';
import {
	InferDefinitionType, InferValidatorReturnType,
	InferListDefinitionType, InferListReturnType
} from '../lib/types';
import type {SchemaDomain} from '../SchemaDomain';
import {NeverValidator} from "./Never";

type ArrayResult<E, T> =
	T extends readonly unknown[]
		? [...{ [K in keyof T]: T[K] & E }, ...E[]]
		: E[];

export interface ArrayValidatorDefinition<
	// Every & Tuple Definitions (as E & T)
	EVERYDEFINITION extends Definition = Definition,
	TUPLEDEFINITION extends readonly Definition[] = readonly Definition[]
> extends Definition {
	type: 'array';
	min?: number;
	max?: number;
	every?: EVERYDEFINITION;
	tuple?: TUPLEDEFINITION;
}

export class ArrayValidator<
	EVERY = unknown,
	TUPLE = unknown,
	EVERYDEFINITION extends Definition = Definition,
	TUPLEDEFINITION extends readonly Definition[] = readonly Definition[],
> extends Validator<ArrayResult<EVERY, TUPLE>> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = 'definition',
		schemaDomain: SchemaDomain
	): ArrayValidator {
		const validator = new ArrayValidator();

		if ('min' in definition) {
			if (!JSON.isNumber(definition['min']))
				throw new DefinitionError(`Expected a Number`, `${path}.min`);

			validator._min = definition['min'];
		}

		if ('max' in definition) {
			if (!JSON.isNumber(definition['max']))
				throw new DefinitionError(`Expected a Number`, `${path}.max`);

			validator._max = definition['max'];
		}

		if ('every' in definition)
			validator._every = schemaDomain.fromJSON(definition['every'], `${path}.every`);

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

			validator._tuple = tupleSchemas;
		}

		return validator;
	}

	protected _min: number | null = null;
	protected _max: number | null = null;
	protected _every: Validator | null = null;
	protected _tuple: (readonly Validator[]) | null = null;

	public min(value: number): this {
		this._min = value;

		return this;
	}

	public max(value: number): this {
		this._max = value;

		return this;
	}

	public every<const V extends Validator>(validator: V): ArrayValidator<InferValidatorReturnType<V>, TUPLE, InferDefinitionType<V>, TUPLEDEFINITION> {
		this._every = validator;

		return this as unknown as ArrayValidator<InferValidatorReturnType<V>, TUPLE, InferDefinitionType<V>, TUPLEDEFINITION>;
	}

	public tuple<const V extends readonly Validator[]>(validators: V): ArrayValidator<EVERY, InferListReturnType<V>, EVERYDEFINITION, InferListDefinitionType<V>> {
		this._tuple = validators;

		return this as unknown as ArrayValidator<EVERY, InferListReturnType<V>, EVERYDEFINITION, InferListDefinitionType<V>>;
	}

	public assert(data: unknown, path: string = 'data'): asserts data is TUPLE {
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

	public isSameValidator(other: Validator): other is ArrayValidator {
		return this.constructor === other.constructor;
	}

	public clone(): this {
		const validator = new ArrayValidator() as this;

		validator._min = this._min;
		validator._max = this._max;
		validator._every = this._every ? this._every.clone() : this._every;
		validator._tuple = this._tuple ? this._tuple.map(v => v.clone()) : this._tuple;

		return validator;
	}

	public isEqual(other: Validator): other is this {
		if (!this.isSameValidator(other))
			return false;

		if (this._min !== other._min)
			return false;

		if (this._max !== other._max)
			return false;

		if (this._every === null !== (other._every === null))
			return false;

		if (this._every !== null && other._every !== null && !this._every.isEqual(other._every))
			return false;

		if (this._tuple === null !== (other._tuple === null))
			return false;

		if (this._tuple !== null && other._tuple !== null) {
			if (this._tuple.length !== other._tuple.length)
				return false;

			for (let index = 0; index < this._tuple.length; index++) {
				const left = this._tuple[index];
				const right = other._tuple[index];

				if (left === undefined || right === undefined)
					return false;

				if (!left.isEqual(right))
					return false;
			}
		}

		return true;
	}

	protected _effectiveMin(): number {
		const tupleMin = this._tuple !== null ? this._tuple.length : 0;

		if (this._min === null)
			return tupleMin;

		return Math.max(this._min, tupleMin);
	}

	protected _effectiveMax(): number | null {
		return this._max;
	}

	protected _isValid(): boolean {
		const min = this._effectiveMin();
		const max = this._effectiveMax();

		if (max !== null && min > max)
			return false;

		return true;
	}

	public normalize(): this | NeverValidator {
		if (!this._isValid())
			return new NeverValidator();

		return this.clone();
	}

	public merge(other: Validator, path: string = 'validator'): ArrayValidator {
		if (!this.isSameValidator(other))
			throw new MergeError(`Conflicting Validator Subclasses`, path, {
				cause: {left: this, right: other}
			});

		const validator = new ArrayValidator();

		if (this._min !== null && other._min !== null)
			validator._min = Math.max(this._min, other._min);
		else
			validator._min = this._min !== null ? this._min : other._min;

		if (this._max !== null && other._max !== null)
			validator._max = Math.min(this._max, other._max);
		else
			validator._max = this._max !== null ? this._max : other._max;

		if (this._every !== null && other._every !== null)
			validator._every = this._every.merge(other._every, `${path}.every`);
		else
			validator._every = this._every !== null
				? this._every.clone()
				: other._every !== null
					? other._every.clone()
					: null;

		if (this._tuple !== null && other._tuple !== null) {
			const length = Math.max(this._tuple.length, other._tuple.length);
			const tuple: Validator[] = [];

			for (let index = 0; index < length; index++) {
				const left = this._tuple[index];
				const right = other._tuple[index];

				if (left !== undefined && right !== undefined)
					tuple[index] = left.merge(right, `${path}.tuple[${index}]`);
				else if (left !== undefined)
					tuple[index] = left.clone();
				else if (right !== undefined)
					tuple[index] = right.clone();
			}

			validator._tuple = tuple;
		}
		else {
			validator._tuple = this._tuple !== null
				? this._tuple.map(v => v.clone())
				: other._tuple !== null
					? other._tuple.map(v => v.clone())
					: null;
		}

		return validator;
	}

	protected override _isSubset(other: Validator): boolean {
		if (!this.isSameValidator(other))
			return false;

		const thisMin = this._effectiveMin();
		const thisMax = this._effectiveMax();
		const otherMin = other._effectiveMin();
		const otherMax = other._effectiveMax();

		if (thisMin < otherMin)
			return false;

		if (otherMax !== null) {
			if (thisMax === null)
				return false;

			if (thisMax > otherMax)
				return false;
		}

		if (other._every !== null) {
			if (this._every !== null) {
				if (!this._every.isSubset(other._every))
					return false;
			}
			else if (this._tuple !== null && thisMax !== null && thisMax <= this._tuple.length) {
				for (const variant of this._tuple) {
					if (!variant.isSubset(other._every))
						return false;
				}
			}
			else {
				return false;
			}
		}

		if (other._tuple !== null) {
			if (this._tuple === null)
				return false;

			if (this._tuple.length < other._tuple.length)
				return false;

			for (let index = 0; index < other._tuple.length; index++) {
				const left = this._tuple[index];
				const right = other._tuple[index];

				if (left === undefined || right === undefined)
					return false;

				if (!left.isSubset(right))
					return false;
			}
		}

		return true;
	}

	public toJSON(): ArrayValidatorDefinition<EVERYDEFINITION, TUPLEDEFINITION> {
		const definition: ArrayValidatorDefinition = {
			type: 'array'
		};

		if (this._min !== null)
			definition.min = this._min;

		if (this._max !== null)
			definition.max = this._max;

		if (this._every !== null)
			definition.every = this._every.toJSON();

		if (this._tuple !== null)
			definition.tuple = this._tuple.map(v => v.toJSON());

		return definition as ArrayValidatorDefinition<EVERYDEFINITION, TUPLEDEFINITION>;
	}
}