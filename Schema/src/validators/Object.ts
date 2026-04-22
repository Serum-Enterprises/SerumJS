import {JSON} from '@serum-enterprises/json';
import {Validator, Definition, UnknownDefinition} from '../Validator';
import {AssertError, DefinitionError} from '../lib/errors';
import {
	InferDefinitionType, InferValidatorReturnType,
	InferObjectDefinitionType, InferObjectReturnType
} from '../lib/types';
import type {SchemaDomain} from '../SchemaDomain';
import {BoundaryValidator, BoundaryDefinition} from './BoundaryValidator';
import * as BoundaryHelper from './BoundaryValidator';

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
> extends Definition, BoundaryDefinition {
	type: 'object';
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
> extends BoundaryValidator<ObjectResult<T, S, E>> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = "definition",
		schemaDomain: SchemaDomain
	): ObjectValidator {
		const validatorInstance = new ObjectValidator();
		const {max, min} = BoundaryHelper.fromJSON(definition, path);

		validatorInstance._min = min;
		validatorInstance._max = max;

		if ("every" in definition)
			validatorInstance._every = schemaDomain.fromJSON(definition['every'], `${path}.every`);

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

			validatorInstance._shape = shape;
		}

		if ("exact" in definition) {
			if (!JSON.isBoolean(definition["exact"]))
				throw new DefinitionError(`Expected a Boolean`, `${path}.exact`);

			validatorInstance._exact = definition['exact'];
		}

		return validatorInstance;
	}

	protected _every: Validator | null = null;
	protected _shape: { [key: string]: Validator } | null = null;
	protected _exact: boolean = false;

	public every<V extends Validator>(validator: V): ObjectValidator<InferValidatorReturnType<V>, S, InferDefinitionType<V>, SD, E> {
		this._every = validator;

		return this as unknown as ObjectValidator<InferValidatorReturnType<V>, S, InferDefinitionType<V>, SD, E>;
	}

	public shape<S extends {
		[key: string]: Validator
	}>(value: S): ObjectValidator<T, InferObjectReturnType<S>, TD, InferObjectDefinitionType<S>, E> {
		this._shape = value;

		return this as unknown as ObjectValidator<T, InferObjectReturnType<S>, TD, InferObjectDefinitionType<S>, E>;
	}

	public exact<const F extends boolean = true>(flag?: F): ObjectValidator<T, S, TD, SD, F> {
		this._exact = flag ?? false;

		return this as unknown as ObjectValidator<T, S, TD, SD, F>;
	}

	public assert(data: unknown, path: string = "data"): asserts data is T {
		if (!JSON.isShallowObject(data))
			throw new AssertError(`Expected an Object`, path);

		const keys = Object.keys(data);

		if (this._min !== null && keys.length < this._min)
			throw new AssertError(`Expected at least ${this._min} properties`, path);

		if (this._max !== null && keys.length > this._max)
			throw new AssertError(`Expected at most ${this._max} properties`, path);

		const errors: AssertError[] = [];

		if (this._every !== null) {
			const validator: Validator = this._every;

			for (const key of keys) {
				try {
					validator.assert(data[key], `${path}.${key}`);
				} catch (e) {
					errors.push(e instanceof Error ? e : new Error(String(e), {cause: e}));
				}
			}
		}

		if (this._shape !== null) {
			for (const key of Object.keys(this._shape)) {
				try {
					const validator: Validator = this._shape[key]!;

					validator.assert(data[key], `${path}.${key}`);
				} catch (e) {
					errors.push(e instanceof Error ? e : new Error(String(e), {cause: e}));
				}
			}

			if (this._exact !== null) {
				for (const key of keys) {
					if (!(key in this._shape)) {
						errors.push(new AssertError(`Expected no additional Properties`, path));
					}
				}
			}
		}

		if (errors.length > 0)
			throw new AggregateError(errors);
	}

	private _isObjectValidator(other: Validator): other is ObjectValidator {
		return this.constructor === other.constructor;
	}

	public isEqual(other: Validator): other is this {
		if (!this._isObjectValidator(other))
			return false;

		let result = true;

		result &&= this._min === other._min && this._max === other._max && this._exact === other._exact;

		if (this._every === null || other._every === null)
			result &&= this._every === other._every;
		else
			result &&= this._every.isEqual(other._every);

		if (this._shape === null || other._shape === null) {
			result &&= this._shape === other._shape;
		}
		else {
			const thisKeys = Object.keys(this._shape);
			const otherKeys = Object.keys(other._shape);

			result &&= thisKeys.length === otherKeys.length;

			for (const key of thisKeys) {
				const left = this._shape[key];
				const right = other._shape[key];

				result &&= right !== undefined && left !== undefined && left.isEqual(right);
			}
		}

		return result;
	}

	public clone(): this {
		const validator = new ObjectValidator();

		validator._min = this._min;
		validator._max = this._max;
		validator._exact = this._exact;
		validator._every = this._every ? this._every.clone() : this._every;
		validator._shape = this._shape ? Object.fromEntries(Object.entries(this._shape)
			.map(([k, v]) => [k, v.clone()])) : this._shape;

		return validator as this;
	}

	public toJSON(): ObjectValidatorDefinition<TD, SD> {
		const schema: ObjectValidatorDefinition = {
			type: 'object',
			...BoundaryHelper.toJSON({min: this._min, max: this._max})
		};

		if (this._every !== null)
			schema.every = this._every.toJSON();

		if (this._shape !== null) {
			schema.shape = Object.fromEntries(
				Object.entries(this._shape).map(([k, s]) => [k, s.toJSON()])
			) as any;
		}

		if (this._exact !== null)
			schema.exact = true;

		return schema as ObjectValidatorDefinition<TD, SD>;
	}
}