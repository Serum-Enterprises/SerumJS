import {JSON} from '@serum-enterprises/json';
import {Option} from '@serum-enterprises/option';
import {Validator, Definition, UnknownDefinition} from '../Validator';
import {AssertError, DefinitionError} from '../lib/errors';
import {
	InferDefinitionType, InferValidatorReturnType,
	InferObjectDefinitionType, InferObjectReturnType
} from '../lib/types';
import type {SchemaDomain} from '../SchemaDomain';

type ObjectResult<T, S, E extends boolean> =
	S extends { [key: string]: unknown }
		? E extends true
			? { [K in keyof S]: S[K] & T }
			: { [K in keyof S]: S[K] & T } & { [key: string]: T }
		: { [key: string]: T };

export interface ObjectValidatorDefinition<
	// Every & Shape Definitions (as E & S)
	E extends Definition = Definition,
	S extends Record<string, Definition> = Record<string, Definition>
> extends Definition {
	type: 'object';
	min?: number;
	max?: number;
	every?: E;
	shape?: S;
	exact?: boolean;
}

export class ObjectValidator<
	// Every (Type) & Shape Types (as T & S)
	T = unknown,
	S = unknown,
	// Every (Type) & Shape Definitions (as TD & SD)
	TD extends Definition = Definition,
	SD extends { [key: string]: Definition } = { [key: string]: Definition },
	// Exact Flag (as E)
	E extends boolean = false
> extends Validator<ObjectResult<T, S, E>> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = "definition",
		schemaDomain: SchemaDomain
	): ObjectValidator {
		const validatorInstance = new ObjectValidator();

		if ("min" in definition) {
			if (!JSON.isNumber(definition["min"]))
				throw new DefinitionError(`Expected a Number`, `${path}.min`);

			validatorInstance._min = Option.Some(definition['min']);
		}

		if ("max" in definition) {
			if (!JSON.isNumber(definition["max"]))
				throw new DefinitionError(`Expected a Number`, `${path}.max`);

			validatorInstance._max = Option.Some(definition['max']);
		}

		if ("every" in definition)
			validatorInstance._every = Option.Some(schemaDomain.fromJSON(definition['every'], `${path}.every`));

		if ("shape" in definition) {
			if (!JSON.isShallowObject(definition["shape"]))
				throw new DefinitionError(`Expected an Object`, `${path}.shape`);

			const shape: { [key: string]: Validator } = {};
			const errors: DefinitionError[] = [];

			for (const [key, value] of Object.entries(definition["shape"])) {
				try {
					shape[key] = schemaDomain.fromJSON(value, `${path}.shape.${key}`);
				} catch (e) {
					errors.push(e instanceof Error ? e : new Error(String(e), {cause: e}));
				}
			}

			if (errors.length > 0)
				throw new AggregateError(errors);

			validatorInstance._shape = Option.Some(shape);
		}

		if ("exact" in definition) {
			if (!JSON.isBoolean(definition["exact"]))
				throw new DefinitionError(`Expected a Boolean`, `${path}.exact`);

			if (definition['exact'])
				validatorInstance._exact = Option.Some(null);
		}

		return validatorInstance;
	}

	protected _min: Option<number> = Option.None();
	protected _max: Option<number> = Option.None();
	protected _every: Option<Validator> = Option.None();
	protected _shape: Option<{ [key: string]: Validator }> = Option.None();
	protected _exact: Option<null> = Option.None();

	public min(value: number): this {
		this._min = Option.Some(value);

		return this;
	}

	public max(value: number): this {
		this._max = Option.Some(value);

		return this;
	}

	public every<V extends Validator>(validator: V): ObjectValidator<InferValidatorReturnType<V>, S, InferDefinitionType<V>, SD, E> {
		this._every = Option.Some(validator);

		return this as unknown as ObjectValidator<InferValidatorReturnType<V>, S, InferDefinitionType<V>, SD, E>;
	}

	public shape<S extends { [key: string]: Validator }>(value: S): ObjectValidator<T, InferObjectReturnType<S>, TD, InferObjectDefinitionType<S>, E> {
		this._shape = Option.Some(value);

		return this as unknown as ObjectValidator<T, InferObjectReturnType<S>, TD, InferObjectDefinitionType<S>, E>;
	}

	public exact<const F extends boolean = true>(flag?: F): ObjectValidator<T, S, TD, SD, F> {
		this._exact = (flag ?? true) ? Option.Some(null) : Option.None();

		return this as unknown as ObjectValidator<T, S, TD, SD, F>;
	}

	public assert(data: unknown, path: string = "data"): asserts data is T {
		if (!JSON.isShallowObject(data))
			throw new AssertError(`Expected an Object`, path);

		const keys = Object.keys(data);

		if (this._min.isSome() && keys.length < this._min.value)
			throw new AssertError(`Expected at least ${this._min.value} properties`, path);

		if (this._max.isSome() && keys.length > this._max.value)
			throw new AssertError(`Expected at most ${this._max.value} properties`, path);

		const errors: AssertError[] = [];

		if (this._every.isSome()) {
			const validator: Validator = this._every.value;

			for (const key of keys) {
				try {
					validator.assert(data[key], `${path}.${key}`);
				} catch (e) {
					errors.push(e instanceof Error ? e : new Error(String(e), {cause: e}));
				}
			}
		}

		if (this._shape.isSome()) {
			for (const key of Object.keys(this._shape.value)) {
				try {
					const validator: Validator = this._shape.value[key]!;

					validator.assert(data[key], `${path}.${key}`);
				} catch (e) {
					errors.push(e instanceof Error ? e : new Error(String(e), {cause: e}));
				}
			}

			if (this._exact.isSome()) {
				for (const key of keys) {
					if (!(key in this._shape.value)) {
						errors.push(new AssertError(`Expected no additional Properties`, path));
					}
				}
			}
		}

		if (errors.length > 0)
			throw new AggregateError(errors);
	}

	public toJSON(): ObjectValidatorDefinition<TD, SD> {
		const schema: ObjectValidatorDefinition = {type: "object"};

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

		if (this._exact.isSome())
			schema.exact = true;

		return schema as ObjectValidatorDefinition<TD, SD>;
	}
}