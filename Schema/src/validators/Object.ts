import {JSON} from '@serum-enterprises/json';
import {Option} from '@serum-enterprises/option';
import {Validator} from '../Validator';
import {
	Definition, ApplyNullability,
	InferDefinitionType, InferValidatorReturnType,
	InferObjectDefinitionType, InferObjectReturnType,
	AssertError, DefinitionError
} from '../lib/util';
import {JSONValidator} from './JSON';

type ObjectResult<T, S, E extends boolean> =
	S extends { [key: string]: unknown }
		? E extends true
			? { [K in keyof S]: S[K] & T }
			: { [K in keyof S]: S[K] & T } & { [key: string]: T }
		: { [key: string]: T };

export interface ObjectValidatorDefinition<
	TD extends Definition = Definition,
	SD extends { [key: string]: Definition } = { [key: string]: Definition }
> extends Definition {
	type: 'object';
	nullable?: boolean;
	exact?: boolean;
	min?: number;
	max?: number;
	every?: TD;
	shape?: SD;
}

export class ObjectValidator<
	// T & S are the Every (Type) and Shape return types
	T = unknown,
	S = unknown,
	// TD & SD are the Every (Type) and Shape definitions
	TD extends Definition = Definition,
	SD extends { [key: string]: Definition } = { [key: string]: Definition },
	// N is nullable
	N extends boolean = false,
	// E is exact (no extra props when shape is set)
	E extends boolean = false
> extends Validator<ObjectResult<T, S, E>> {
	public static override fromJSON(
		definition: Definition & { [key: string]: unknown },
		path: string = "definition"
	): Validator {
		const validatorInstance = new ObjectValidator();

		if ("nullable" in definition) {
			if (!JSON.isBoolean(definition["nullable"]))
				throw new DefinitionError(`Expected ${path}.nullable to be a Boolean`);

			validatorInstance.nullable(definition["nullable"]);
		}

		if ("exact" in definition) {
			if (!JSON.isBoolean(definition["exact"]))
				throw new DefinitionError(`Expected ${path}.exact to be a Boolean`);

			validatorInstance.exact(definition["exact"], `${path}.exact`);
		}

		if ("min" in definition) {
			if (!JSON.isNumber(definition["min"]))
				throw new DefinitionError(`Expected ${path}.min to be a Number`);

			validatorInstance.min(definition["min"], `${path}.min`);
		}

		if ("max" in definition) {
			if (!JSON.isNumber(definition["max"]))
				throw new DefinitionError(`Expected ${path}.max to be a Number`);

			validatorInstance.max(definition["max"], `${path}.max`);
		}

		if ("every" in definition) {
			validatorInstance.every(super.fromJSON(definition['every'], `${path}.every`));
		}

		if ("shape" in definition) {
			if (!JSON.isShallowObject(definition["shape"]))
				throw new DefinitionError(`Expected ${path}.shape to be an Object`);

			const shape: { [key: string]: Validator } = {};
			const errors: DefinitionError[] = [];

			for (const [key, value] of Object.entries(definition["shape"])) {
				try {
					shape[key] = super.fromJSON(value, `${path}.shape.${key}`);
				} catch (e) {
					if (!(e instanceof DefinitionError))
						throw new DefinitionError(`Fatal Error: Undefined Error thrown by Domain.fromJSON at ${path}.shape.${key}`);

					errors.push(e);
				}
			}

			if (errors.length > 0) {
				throw new DefinitionError(`Multiple Definition Errors detected at ${path}.shape (see cause)`, {cause: errors});
			}

			validatorInstance.shape(shape, `${path}.shape`);
		}

		return validatorInstance;
	}

	protected _nullable: Option<null> = Option.None();
	protected _min: Option<number> = Option.None();
	protected _max: Option<number> = Option.None();
	protected _every: Option<Validator> = Option.None();
	protected _shape: Option<{ [key: string]: Validator }> = Option.None();
	protected _exact: Option<null> = Option.None();


	public nullable<const F extends boolean = true>(flag?: F): ObjectValidator<T, S, TD, SD, F, E> {
		this._nullable = (flag ?? true) ? Option.Some(null) : Option.None();

		return this as unknown as ObjectValidator<T, S, TD, SD, F, E>;
	}

	public min(value: number, path: string = 'min'): this {
		if (this._max.isSome() && this._max.value < value)
			throw new DefinitionError(`Expected Minimum Rule to be smaller than or equal to Maximum Rule at Path ${path}`);

		if (this._shape.isSome() && value < Object.keys(this._shape.value).length)
			throw new DefinitionError(`Expected Minimum Rule to be larger than or equal to Shape Key Count at Path ${path}`);

		if (this._exact.isSome() && this._shape.isSome() && value > Object.keys(this._shape.value).length)
			throw new DefinitionError(`Expected Minimum Rule to be smaller than or equal to Shape Key Count due to Exact Rule at Path ${path}`);

		this._min = Option.Some(value);

		return this;
	}

	public max(value: number, path: string = 'max'): this {
		if (this._min.isSome() && this._min.value > value)
			throw new DefinitionError(`Expected Maximum Rule to be larger than or equal to Minimum Rule at Path ${path}`);

		if (this._shape.isSome() && value < Object.keys(this._shape.value).length)
			throw new DefinitionError(`Expected Maximum Rule to be larger than or equal to Shape Key Count at Path ${path}`);

		this._max = Option.Some(value);

		return this;
	}

	public every<V extends Validator>(validator: V): ObjectValidator<
		InferValidatorReturnType<V>,
		S,
		InferDefinitionType<V>,
		SD,
		N,
		E
	> {
		this._every = Option.Some(validator);

		return this as unknown as ObjectValidator<InferValidatorReturnType<V>, S, InferDefinitionType<V>, SD, N, E>;
	}

	public shape<S extends { [key: string]: Validator }>(value: S, path: string = 'shape'): ObjectValidator<
		T,
		InferObjectReturnType<S>,
		TD,
		InferObjectDefinitionType<S>,
		N,
		E
	> {
		const shapeKeyCount = Object.keys(value).length;

		if (this._min.isSome() && this._min.value < shapeKeyCount)
			throw new DefinitionError(`Expected Shape Key Count to be smaller than or equal to Minimum Rule at Path ${path}`);

		if (this._max.isSome() && this._max.value < shapeKeyCount)
			throw new DefinitionError(`Expected Shape Key Count to be smaller than or equal to Maximum Rule at Path ${path}`);

		if (this._exact.isSome() && this._min.isSome() && this._min.value > shapeKeyCount)
			throw new DefinitionError(`Expected Shape Key Count to be larger than or equal to Minimum Rule due to Exact Rule at Path ${path}`);

		if (this._exact.isSome() && this._max.isSome() && this._max.value < shapeKeyCount)
			throw new DefinitionError(`Expected Shape Key Count to be smaller than or equal to Maximum Rule due to Exact Rule at Path ${path}`);

		this._shape = Option.Some(value);

		return this as unknown as ObjectValidator<T, InferObjectReturnType<S>, TD, InferObjectDefinitionType<S>, N, E>;
	}

	public exact<const F extends boolean = true>(flag?: F, path: string = 'exact'): ObjectValidator<T, S, TD, SD, N, F> {
		if ((flag ?? true) && this._shape.isSome()) {
			const shapeKeyCount = Object.keys(this._shape.value).length;

			if (this._min.isSome() && this._min.value > shapeKeyCount)
				throw new DefinitionError(`Expected Exact Rule to be false due to Minimum Rule requiring more Properties than Shape defines at Path ${path}`);

			if (this._max.isSome() && this._max.value < shapeKeyCount)
				throw new DefinitionError(`Expected Exact Rule to be false due to Maximum Rule allowing fewer Properties than Shape defines at Path ${path}`);
		}

		this._exact = (flag ?? true) ? Option.Some(null) : Option.None();

		return this as unknown as ObjectValidator<T, S, TD, SD, N, F>;
	}

	public assert(data: unknown, path: string = "data"): asserts data is ApplyNullability<ObjectResult<T, S, E>, N> {
		if(JSON.isShallowObject(data)) {
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
		else if(JSON.isNull(data)) {
			if(!this._nullable.isSome())
				throw new AssertError(`Expected ${path} to be an Object${this._nullable.isSome() ? ' or Null' : ''}`);
		}
		else
			throw new AssertError(`Expected ${path} to be an Object${this._nullable.isSome() ? ' or Null' : ''}`);
	}

	public isSubset(other: Validator): boolean {
		if(other instanceof JSONValidator)
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