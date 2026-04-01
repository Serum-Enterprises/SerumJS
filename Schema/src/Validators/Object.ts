import {JSON} from '@serum-enterprises/json';
import {Option} from '@serum-enterprises/option';
import {Validator} from '../Validator';
import {fromJSON} from '../lib/fromJSON';
import {AssertError, DefinitionError} from '../lib/util';
import {JSONValidator} from './JSON';
import {Definition, ObjectValidatorDefinition} from '../Definitions';

export class ObjectValidator<
	T = unknown,
	// TD & SD are the Every (Type) and Shape definitions
	TD extends Definition = Definition,
	SD extends { [key: string]: Definition } = { [key: string]: Definition }
> extends Validator<T> {
	public static fromJSON(
		definition: Definition & { [key: string]: unknown },
		path: string = "definition"
	): ObjectValidator {
		const validatorInstance = new ObjectValidator();

		if ("nullable" in definition) {
			if (!JSON.isBoolean(definition["nullable"]))
				throw new DefinitionError(`Expected ${path}.nullable to be a Boolean`);

			if (definition['nullable'])
				validatorInstance._nullable = Option.Some(null);
		}

		if ("exact" in definition) {
			if (!JSON.isBoolean(definition["exact"]))
				throw new DefinitionError(`Expected ${path}.exact to be a Boolean`);

			if (definition['exact'])
				validatorInstance._exact = Option.Some(null);
		}

		if ("min" in definition) {
			if (!JSON.isNumber(definition["min"]))
				throw new DefinitionError(`Expected ${path}.min to be a Number`);

			validatorInstance._min = Option.Some(definition['min']);
		}

		if ("max" in definition) {
			if (!JSON.isNumber(definition["max"]))
				throw new DefinitionError(`Expected ${path}.max to be a Number`);

			validatorInstance._max = Option.Some(definition['max']);
		}

		if ("every" in definition)
			validatorInstance._every = Option.Some(fromJSON(definition['every'], `${path}.every`));

		if ("shape" in definition) {
			if (!JSON.isShallowObject(definition["shape"]))
				throw new DefinitionError(`Expected ${path}.shape to be an Object`);

			const shape: { [key: string]: Validator } = {};
			const errors: DefinitionError[] = [];

			for (const [key, value] of Object.entries(definition["shape"])) {
				try {
					shape[key] = fromJSON(value, `${path}.shape.${key}`);
				} catch (e) {
					if (!(e instanceof DefinitionError))
						throw new DefinitionError(`Fatal Error: Undefined Error thrown by Domain.fromJSON at ${path}.shape.${key}`);

					errors.push(e);
				}
			}

			if (errors.length > 0) {
				throw new DefinitionError(`Multiple Definition Errors detected at ${path}.shape (see cause)`, {cause: errors});
			}

			validatorInstance._shape = Option.Some(shape);
		}

		return validatorInstance;
	}

	protected _nullable: Option<null> = Option.None();
	protected _min: Option<number> = Option.None();
	protected _max: Option<number> = Option.None();
	protected _every: Option<Validator> = Option.None();
	protected _shape: Option<{ [key: string]: Validator }> = Option.None();
	protected _exact: Option<null> = Option.None();

	public assert(data: unknown, path: string = "data"): asserts data is T {
		if (JSON.isShallowObject(data)) {
			const keys = Object.keys(data);

			if (this._min.isSome() && keys.length < this._min.value)
				throw new AssertError(`Expected ${path} to have at least ${this._min.value} Properties`);

			if (this._max.isSome() && keys.length > this._max.value)
				throw new AssertError(`Expected ${path} to have at most ${this._max.value} Properties`);

			const errors: AssertError[] = [];

			if (this._shape.isSome()) {
				for (const key of Object.keys(this._shape.value)) {
					try {
						const validator: Validator = this._shape.value[key]!;

						validator.assert(data[key], `${path}.${key}`);
					} catch (e) {
						if (!(e instanceof AssertError))
							throw new AssertError(`Fatal Error: Undefined Error thrown by an Assert Method at ${path}.${key}`);

						errors.push(e);
					}
				}

				if (this._exact.isSome()) {
					for (const key of keys) {
						if (!(key in this._shape.value)) {
							errors.push(new AssertError(`Unexpected property ${path}.${key}`));
						}
					}
				}
			}

			if (this._every.isSome()) {
				const validator: Validator = this._every.value;

				for (const key of keys) {
					try {
						validator.assert(data[key], `${path}.${key}`);
					} catch (e) {
						if (!(e instanceof AssertError))
							throw new AssertError(`Fatal Error: Undefined Error thrown by an Assert Method at ${path}.${key}`);

						errors.push(e);
					}
				}
			}

			if (errors.length > 0)
				throw new AssertError(`Multiple Errors while asserting ${path} (see cause)`, {cause: errors});
		}
		else if (JSON.isNull(data)) {
			if (!this._nullable.isSome())
				throw new AssertError(`Expected ${path} to be an Object${this._nullable.isSome() ? ' or Null' : ''}`);
		}
		else
			throw new AssertError(`Expected ${path} to be an Object${this._nullable.isSome() ? ' or Null' : ''}`);
	}

	public isSubset(other: Validator): boolean {
		if (other instanceof JSONValidator)
			return true;

		// Must be the same validator type
		if (!(other instanceof ObjectValidator))
			return false;

		// ---- 1) Nullability ----
		// If this allows null, the other must allow null as well
		if (this._nullable.isSome() && !other._nullable.isSome())
			return false;

		// ---- 2) Min / Max (property count) ----
		// For subset: this must be at least as strict as other.
		const thisMin = this._min.isSome() ? this._min.value : 0;
		const otherMin = other._min.isSome() ? other._min.value : 0;
		if (thisMin < otherMin)
			return false;

		const thisMax = this._max.isSome() ? this._max.value : Number.POSITIVE_INFINITY;
		const otherMax = other._max.isSome() ? other._max.value : Number.POSITIVE_INFINITY;
		if (thisMax > otherMax)
			return false;

		// ---- 3) Shape requirements ----
		// If other requires certain keys (shape), this must also require them, and be compatible per key.
		if (other._shape.isSome()) {
			if (!this._shape.isSome())
				return false;

			const thisShape = this._shape.value;
			const otherShape = other._shape.value;

			for (const key of Object.keys(otherShape)) {
				if (!(key in thisShape))
					return false;

				const a = thisShape[key]!;
				const b = otherShape[key]!;
				if (!a.isSubset(b))
					return false;
			}
		}

		// ---- 4) Exactness ----
		// If other is exact, then this must be exact AND must have the exact same key set as other.shape.
		if (other._exact.isSome()) {
			if (!this._exact.isSome())
				return false;

			if (!other._shape.isSome() || !this._shape.isSome())
				return false;

			const aKeys = Object.keys(this._shape.value).sort();
			const bKeys = Object.keys(other._shape.value).sort();

			if (aKeys.length !== bKeys.length)
				return false;

			for (let i = 0; i < aKeys.length; i++) {
				if (aKeys[i] !== bKeys[i])
					return false;
			}
		}

		// ---- 5) "every" constraint ----
		// If other has an "every" constraint, all values in any object accepted by this must satisfy it.
		if (other._every.isSome()) {
			const bEvery = other._every.value;

			// All *possible* properties accepted by this must be constrained to bEvery.
			// If this can accept arbitrary keys (not exact), then we need this.every ⊆ bEvery.
			if (!this._exact.isSome()) {
				if (!this._every.isSome())
					return false;

				if (!this._every.value.isSubset(bEvery))
					return false;
			}

			// Additionally, any explicitly shaped properties must also imply bEvery.
			// (Even if this.every exists, shape validators might allow values outside bEvery.)
			if (this._shape.isSome()) {
				for (const [_, v] of Object.entries(this._shape.value)) {
					if (!v.isSubset(bEvery))
						return false;
				}
			}

			// If this is exact and has a shape, then there are no unknown keys;
			// the per-shape check above is sufficient (and this.every is optional).
			if (this._exact.isSome() && !this._shape.isSome()) {
				// Exact without shape is effectively meaningless for bounding keys,
				// so conservatively require this.every in that case.
				if (!this._every.isSome())
					return false;

				if (!this._every.value.isSubset(bEvery))
					return false;
			}
		}

		// If other has no "every", this can be stricter or looser on value-types freely (as long as above holds).

		return true;
	}

	public toJSON(): ObjectValidatorDefinition<TD, SD> {
		const schema: ObjectValidatorDefinition = {type: "object"};

		if (this._nullable.isSome())
			schema.nullable = true;

		if (this._exact.isSome())
			schema.exact = true;

		if (this._min.isSome())
			schema.min = this._min.value;

		if (this._max.isSome())
			schema.max = this._max.value;

		if (this._every.isSome())
			schema.every = this._every.value.toJSON();

		if (this._shape.isSome()) {
			schema.shape = Object.fromEntries(
				Object.entries(this._shape.value).map(([k, s]) => [k, s.toJSON()])
			) as any;
		}

		return schema as ObjectValidatorDefinition<TD, SD>;
	}
}