import {JSON} from '../../util/JSON';
import type {Registry} from '../../Registry';
import {Validator} from '../Validator';
import {
	Definition, ApplyNullability,
	InferDefinitionType, InferValidatorReturnType,
	InferObjectDefinitionType, InferObjectReturnType,
	AssertError, DefinitionError
} from '../../util';
import {Option} from "../../util/Option";

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
		path: string = "definition",
		registry: Registry
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

			validatorInstance.exact(definition["exact"]);
		}

		if ("min" in definition) {
			if (!JSON.isNumber(definition["min"]))
				throw new DefinitionError(`Expected ${path}.min to be a Number`);

			validatorInstance.min(definition["min"]);
		}

		if ("max" in definition) {
			if (!JSON.isNumber(definition["max"]))
				throw new DefinitionError(`Expected ${path}.max to be a Number`);

			validatorInstance.max(definition["max"]);
		}

		if ("every" in definition) {
			validatorInstance.every(registry.fromJSON(definition['every'], `${path}.every`));
		}

		if ("shape" in definition) {
			if (!JSON.isShallowObject(definition["shape"]))
				throw new DefinitionError(`Expected ${path}.shape to be an Object`);

			const shape: { [key: string]: Validator } = {};
			const errors: DefinitionError[] = [];

			for (const [key, value] of Object.entries(definition["shape"])) {
				try {
					shape[key] = registry.fromJSON(value, `${path}.shape.${key}`);
				} catch (e) {
					if (!(e instanceof DefinitionError))
						throw new DefinitionError(`Fatal Error: Undefined Error thrown by Domain.fromJSON at ${path}.shape.${key}`);

					errors.push(e);
				}
			}

			if (errors.length > 0) {
				throw new DefinitionError(`Multiple Definition Errors detected at ${path}.shape (see cause)`, {cause: errors});
			}

			validatorInstance.shape(shape);
		}

		return validatorInstance;
	}

	public constructor(
		protected _nullable: Option<null> = Option.None(),
		protected _exact: Option<null> = Option.None(),
		protected _shape: Option<{ [key: string]: Validator }> = Option.None(),
		protected _every: Option<Validator> = Option.None(),
		protected _min: Option<number> = Option.None(),
		protected _max: Option<number> = Option.None()
	) {
		super();
	}

	public nullable<const F extends boolean = true>(flag?: F): ObjectValidator<T, S, TD, SD, F, E> {
		this._nullable = (flag ?? true) ? Option.Some(null) : Option.None();
		return this as any;
	}

	public exact<const F extends boolean = true>(flag?: F): ObjectValidator<T, S, TD, SD, N, F> {
		this._exact = (flag ?? true) ? Option.Some(null) : Option.None();
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

	public every<V extends Validator>(validator: V): ObjectValidator<
		InferValidatorReturnType<V>,
		S,
		InferDefinitionType<V>,
		SD,
		N,
		E
	> {
		this._every = Option.Some(validator);
		return this as any;
	}

	public shape<S extends { [key: string]: Validator }>(value: S): ObjectValidator<
		T,
		InferObjectReturnType<S>,
		TD,
		InferObjectDefinitionType<S>,
		N,
		E
	> {
		this._shape = Option.Some(value);
		return this as any;
	}

	public assert(data: unknown, path: string = "data"): asserts data is ApplyNullability<ObjectResult<T, S, E>, N> {
		if (this._nullable.isSome() && JSON.isNull(data))
			return;

		if (!JSON.isObject(data))
			throw new AssertError(`Expected ${path} to be an Object${this._nullable.isSome() ? " or Null" : ""}`);

		const keys = Object.keys(data);

		if (this._min.isSome() && keys.length < this._min.value)
			throw new AssertError(`Expected ${path} to have at least ${this._min.value} Properties`);

		if (this._max.isSome() && keys.length > this._max.value)
			throw new AssertError(`Expected ${path} to have at most ${this._max.value} Properties`);

		const errors: AssertError[] = [];

		if (this._every.isSome()) {
			const validator: Validator = this._every.value;

			for (const key of keys) {
				try {
					validator.assert((data as any)[key], `${path}.${key}`);
				} catch (e) {
					if (!(e instanceof AssertError))
						throw new AssertError(`Fatal Error: Undefined Error thrown by an Assert Method at ${path}.${key}`);

					errors.push(e);
				}
			}
		}

		if (this._shape.isSome()) {
			for (const key of Object.keys(this._shape.value)) {
				try {
					const validator: Validator = this._shape.value[key]!;

					validator.assert((data as any)[key], `${path}.${key}`);
				} catch (e) {
					if (!(e instanceof AssertError))
						throw new AssertError(`Fatal Error: Undefined Error thrown by an Assert Method at ${path}.${key}`);

					errors.push(e);
				}
			}

			// 3) exact check last (only meaningful if shape is set)
			if (this._exact.isSome()) {
				for (const key of keys) {
					if (!(key in this._shape.value)) {
						errors.push(new AssertError(`Unexpected property ${path}.${key}`));
					}
				}
			}
		}

		if (errors.length > 0)
			throw new AssertError(`Multiple Errors while asserting ${path} (see cause)`, {cause: errors});
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