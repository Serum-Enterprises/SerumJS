import {JSON} from '@serum-enterprises/json';
import {Option} from '@serum-enterprises/option';
import {Validator} from '../Validator';
import {fromJSON} from '../lib/fromJSON';
import {AssertError, DefinitionError} from '../lib/util';
import {JSONValidator} from './JSON';
import {Definition, ArrayValidatorDefinition} from '../Definitions';

export class ArrayValidator<
	T = unknown,
	// EV & TV are the Every and Tuple Definitions
	ED extends Definition = Definition,
	TD extends readonly Definition[] = readonly Definition[],
> extends Validator<T> {
	public static fromJSON(
		definition: Definition & { [key: string]: unknown },
		path: string = 'definition'
	): ArrayValidator {
		const validatorInstance = new ArrayValidator();

		if ('nullable' in definition) {
			if (!JSON.isBoolean(definition['nullable']))
				throw new DefinitionError(`Expected ${path}.nullable to be a Boolean`);

			if(definition['nullable'])
				validatorInstance._nullable = Option.Some(null);
		}

		if ('min' in definition) {
			if (!JSON.isNumber(definition['min']))
				throw new DefinitionError(`Expected ${path}.min to be a Number`);

			validatorInstance._min = Option.Some(definition['min']);
		}

		if ('max' in definition) {
			if (!JSON.isNumber(definition['max']))
				throw new DefinitionError(`Expected ${path}.max to be a Number`);

			validatorInstance._max = Option.Some(definition['max']);
		}

		if ('every' in definition)
			validatorInstance._every = Option.Some(fromJSON(definition['every'], `${path}.every`));

		if ('tuple' in definition) {
			if (!JSON.isShallowArray(definition['tuple']))
				throw new DefinitionError(`Expected ${path}.tuple to be an Array`);

			const tupleSchemas: Validator[] = [];
			const errors: DefinitionError[] = [];

			definition['tuple'].forEach((tupleDef, index) => {
				try {
					tupleSchemas.push(fromJSON(tupleDef, `${path}.tuple[${index}]`));
				} catch (e) {
					if (!(e instanceof DefinitionError))
						throw new DefinitionError(`Fatal Error: Undefined Error thrown by Domain.fromJSON at ${path}`);

					errors.push(e);
				}
			});

			if (errors.length > 0)
				throw new DefinitionError(`Multiple Definition Errors detected at ${path} (see cause)`, {cause: errors});

			validatorInstance._tuple = Option.Some(tupleSchemas);
		}

		return validatorInstance;
	}

	protected _nullable: Option<null> = Option.None();
	protected _every: Option<Validator> = Option.None();
	protected _tuple: Option<readonly Validator[]> = Option.None();
	protected _min: Option<number> = Option.None();
	protected _max: Option<number> = Option.None();

	public assert(data: unknown, path: string = 'data'): asserts data is T {
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
				if (data.length < this._tuple.value.length)
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
		else if(JSON.isNull(data)) {
			if(!this._nullable.isSome())
				throw new AssertError(`Expected ${path} to be an Array${this._nullable.isSome() ? ' or Null' : ''}`);
		}
		else
			throw new AssertError(`Expected ${path} to be an Array${this._nullable.isSome() ? ' or Null' : ''}`);
	}

	public isSubset(other: Validator): boolean {
		if(other instanceof JSONValidator)
			return true;

		if (!(other instanceof ArrayValidator))
			return false;

		if (this._nullable.isSome() && !other._nullable.isSome())
			return false;

		const thisTupleLen = this._tuple.isSome() ? this._tuple.value.length : 0;
		const otherTupleLen = other._tuple.isSome() ? other._tuple.value.length : 0;

		const thisMin = this._min.isSome() ? this._min.value : 0;
		const otherMin = other._min.isSome() ? other._min.value : 0;

		const thisMax = this._max.isSome() ? this._max.value : Infinity;
		const otherMax = other._max.isSome() ? other._max.value : Infinity;

		const thisEffectiveMin = Math.max(thisMin, thisTupleLen);
		const otherEffectiveMin = Math.max(otherMin, otherTupleLen);

		if (thisEffectiveMin < otherEffectiveMin)
			return false;

		if (thisMax > otherMax)
			return false;

		// Helper: this index constraints are the intersection of (every, tuple[i])
		// To soundly prove (A_every ∩ A_tuple[i]) ⊆ Target, it's sufficient that
		// at least one conjunct is itself a subset of Target (false negatives allowed).
		const indexConjuncts = (i: number): Validator[] => {
			const conjuncts: Validator[] = [];

			if (this._every.isSome())
				conjuncts.push(this._every.value);

			if (this._tuple.isSome() && i < this._tuple.value.length)
				conjuncts.push(this._tuple.value[i]!);

			return conjuncts;
		};

		const conjunctsSubset = (conjuncts: Validator[], target: Validator): boolean => {
			// If we have no constraint at all, we accept "anything" at that position,
			// so we can only be a subset if the target also accepts anything — we
			// cannot prove that here, so be conservative.
			if (conjuncts.length === 0)
				return false;

			return conjuncts.some(c => c.isSubset(target));
		};

		if (other._tuple.isSome()) {
			for (let i = 0; i < other._tuple.value.length; i++) {
				const aConj = indexConjuncts(i);

				if (!conjunctsSubset(aConj, other._tuple.value[i]!))
					return false;

				if (other._every.isSome() && !conjunctsSubset(aConj, other._every.value))
					return false;
			}
		}

		return !(other._every.isSome() && (thisMax === Infinity ? true : thisMax > Math.max(thisTupleLen, otherTupleLen)) && (!this._every.isSome() || !this._every.value.isSubset(other._every.value)));
	}

	public toJSON(): ArrayValidatorDefinition<ED, TD> {
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