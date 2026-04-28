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

interface ArrayValidatorRules {
	min: number | null;
	max: number | null;
	every: Validator | null;
	tuple: (readonly Validator[]) | null;
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
		const rules: ArrayValidatorRules = {
			min: null,
			max: null,
			every: null,
			tuple: []
		}

		if ('min' in definition) {
			if (!JSON.isNumber(definition['min']))
				throw new DefinitionError(`Expected a Number`, `${path}.min`);

			rules.min = definition['min'];
		}

		if ('max' in definition) {
			if (!JSON.isNumber(definition['max']))
				throw new DefinitionError(`Expected a Number`, `${path}.max`);

			rules.max = definition['max'];
		}

		if ('every' in definition)
			rules.every = schemaDomain.fromJSON(definition['every'], `${path}.every`);

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

			rules.tuple = tupleSchemas;
		}

		return new ArrayValidator(rules);
	}

	public constructor(
		public readonly rules:  Readonly<ArrayValidatorRules> = {min: null, max: null, every: null, tuple: null}
	) {super();}

	public min(min: number): ArrayValidator<EVERY, TUPLE, EVERYDEFINITION, TUPLEDEFINITION> {
		return new ArrayValidator<EVERY, TUPLE, EVERYDEFINITION, TUPLEDEFINITION>({...this.rules, min});
	}

	public max(max: number): ArrayValidator<EVERY, TUPLE, EVERYDEFINITION, TUPLEDEFINITION> {
		return new ArrayValidator<EVERY, TUPLE, EVERYDEFINITION, TUPLEDEFINITION>({...this.rules, max});
	}

	public every<const V extends Validator>(every: V): ArrayValidator<InferValidatorReturnType<V>, TUPLE, InferDefinitionType<V>, TUPLEDEFINITION> {
		return new ArrayValidator<InferValidatorReturnType<V>, TUPLE, InferDefinitionType<V>, TUPLEDEFINITION>({...this.rules, every});
	}

	public tuple<const V extends readonly Validator[]>(tuple: V): ArrayValidator<EVERY, InferListReturnType<V>, EVERYDEFINITION, InferListDefinitionType<V>> {
		return new ArrayValidator<EVERY, InferListReturnType<V>, EVERYDEFINITION, InferListDefinitionType<V>>({...this.rules, tuple});
	}

	public assert(data: unknown, path: string = 'data'): asserts data is TUPLE {
		if (!JSON.isShallowArray(data))
			throw new AssertError(`Expected an Array`, path);

		if (this.rules.min !== null && this.rules.min > data.length)
			throw new AssertError(`Expected at least ${this.rules.min} elements`, path);

		if (this.rules.max !== null && this.rules.max < data.length)
			throw new AssertError(`Expected at most ${this.rules.max} elements`, path);

		const errors: AssertError[] = [];

		if (this.rules.every !== null) {
			const validator: Validator = this.rules.every;

			data.forEach((value, index) => {
				try {
					validator.assert(value, `${path}[${index}]`);
				} catch (e) {
					errors.push(e instanceof Error ? e : new Error(String(e), {cause: e}));
				}
			});
		}

		if (this.rules.tuple !== null) {
			if (data.length < this.rules.tuple.length)
				throw new AssertError(`Expected at least ${this.rules.tuple.length} elements`, path);

			this.rules.tuple.forEach((validator: Validator, index) => {
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

	public clone(): ArrayValidator<EVERY, TUPLE, EVERYDEFINITION, TUPLEDEFINITION> {
		return new ArrayValidator<EVERY, TUPLE, EVERYDEFINITION, TUPLEDEFINITION>({
			...this.rules,
			every: this.rules.every ? this.rules.every.clone() : this.rules.every,
			tuple: this.rules.tuple ? this.rules.tuple.map(v => v.clone()) : this.rules.tuple
		});
	}

	public isEqual(other: Validator): other is this {
		if (!this.isSameValidator(other))
			return false;

		if (this.rules.min !== other.rules.min)
			return false;

		if (this.rules.max !== other.rules.max)
			return false;

		if (this.rules.every === null !== (other.rules.every === null))
			return false;

		if (this.rules.every !== null && other.rules.every !== null && !this.rules.every.isEqual(other.rules.every))
			return false;

		if (this.rules.tuple === null !== (other.rules.tuple === null))
			return false;

		if (this.rules.tuple !== null && other.rules.tuple !== null) {
			if (this.rules.tuple.length !== other.rules.tuple.length)
				return false;

			for (let index = 0; index < this.rules.tuple.length; index++) {
				const left = this.rules.tuple[index];
				const right = other.rules.tuple[index];

				if (left === undefined || right === undefined)
					return false;

				if (!left.isEqual(right))
					return false;
			}
		}

		return true;
	}

	public merge(other: Validator, path: string = 'validator'): ArrayValidator {
		if (!this.isSameValidator(other))
			throw new MergeError(`Conflicting Validator Subclasses`, path, {
				cause: {left: this, right: other}
			});

		const rules: ArrayValidatorRules = {
			min: null,
			max: null,
			every: null,
			tuple: []
		}

		if (this.rules.min !== null && other.rules.min !== null)
			rules.min = Math.max(this.rules.min, other.rules.min);
		else
			rules.min = this.rules.min !== null ? this.rules.min : other.rules.min;

		if (this.rules.max !== null && other.rules.max !== null)
			rules.max = Math.min(this.rules.max, other.rules.max);
		else
			rules.max = this.rules.max !== null ? this.rules.max : other.rules.max;

		if (this.rules.every !== null && other.rules.every !== null)
			rules.every = this.rules.every.merge(other.rules.every, `${path}.every`);
		else
			rules.every = this.rules.every !== null
				? this.rules.every.clone()
				: other.rules.every !== null
					? other.rules.every.clone()
					: null;

		if (this.rules.tuple !== null && other.rules.tuple !== null) {
			const length = Math.max(this.rules.tuple.length, other.rules.tuple.length);
			const tuple: Validator[] = [];

			for (let index = 0; index < length; index++) {
				const left = this.rules.tuple[index];
				const right = other.rules.tuple[index];

				if (left !== undefined && right !== undefined)
					tuple[index] = left.merge(right, `${path}.tuple[${index}]`);
				else if (left !== undefined)
					tuple[index] = left.clone();
				else if (right !== undefined)
					tuple[index] = right.clone();
			}

			rules.tuple = tuple;
		}
		else {
			rules.tuple = this.rules.tuple !== null
				? this.rules.tuple.map(v => v.clone())
				: other.rules.tuple !== null
					? other.rules.tuple.map(v => v.clone())
					: null;
		}

		return new ArrayValidator(rules);
	}

	protected _effectiveMin(): number {
		const tupleMin = this.rules.tuple !== null ? this.rules.tuple.length : 0;

		if (this.rules.min === null)
			return tupleMin;

		return Math.max(this.rules.min, tupleMin);
	}

	protected _effectiveMax(): number | null {
		return this.rules.max;
	}

	protected _isValid(): boolean {
		const min = this._effectiveMin();
		const max = this._effectiveMax();

		if (max !== null && min > max)
			return false;

		return true;
	}

	public normalize(): Validator {
		if (!this._isValid())
			return new NeverValidator();

		return this.clone();
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

		if (other.rules.every !== null) {
			if (this.rules.every !== null) {
				if (!this.rules.every.isSubset(other.rules.every))
					return false;
			}
			else if (this.rules.tuple !== null && thisMax !== null && thisMax <= this.rules.tuple.length) {
				for (const variant of this.rules.tuple) {
					if (!variant.isSubset(other.rules.every))
						return false;
				}
			}
			else {
				return false;
			}
		}

		if (other.rules.tuple !== null) {
			if (this.rules.tuple === null)
				return false;

			if (this.rules.tuple.length < other.rules.tuple.length)
				return false;

			for (let index = 0; index < other.rules.tuple.length; index++) {
				const left = this.rules.tuple[index];
				const right = other.rules.tuple[index];

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

		if (this.rules.min !== null)
			definition.min = this.rules.min;

		if (this.rules.max !== null)
			definition.max = this.rules.max;

		if (this.rules.every !== null)
			definition.every = this.rules.every.toJSON();

		if (this.rules.tuple !== null)
			definition.tuple = this.rules.tuple.map(v => v.toJSON());

		return definition as ArrayValidatorDefinition<EVERYDEFINITION, TUPLEDEFINITION>;
	}
}