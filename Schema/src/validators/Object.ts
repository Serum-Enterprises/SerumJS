import {JSON} from '@serum-enterprises/json';
import {Validator, Definition, UnknownDefinition} from '../Validator';
import {AssertError, DefinitionError, MergeError} from '../lib/errors';
import {
	InferDefinitionType,
	InferValidatorReturnType
} from '../lib/types';
import type {SchemaDomain} from '../SchemaDomain';
import {NeverValidator} from './Never';

type ShapeResult<S> =
	S extends Record<string, Validator>
		? { [K in keyof S]: InferValidatorReturnType<S[K]> }
		: Record<string, unknown>;

type ObjectResult<EVERY, SHAPE, EXACT extends boolean> =
	EXACT extends true
		? ShapeResult<SHAPE>
		: ShapeResult<SHAPE> & Record<string, EVERY>;

type ShapeDefinition<S> =
	S extends Record<string, Validator>
		? { [K in keyof S]: InferDefinitionType<S[K]> }
		: Record<string, Definition>;

export interface ObjectValidatorDefinition<
	EVERYDEFINITION extends Definition = Definition,
	SHAPEDEFINITION extends Record<string, Definition> = Record<string, Definition>
> extends Definition {
	type: 'object';
	min?: number;
	max?: number;
	every?: EVERYDEFINITION;
	shape?: SHAPEDEFINITION;
	exact?: boolean;
}

export class ObjectValidator<
	EVERY = unknown,
	SHAPE = Record<string, unknown>,
	EXACT extends boolean = false,
	EVERYDEFINITION extends Definition = Definition,
	SHAPEDEFINITION extends Record<string, Definition> = Record<string, Definition>
> extends Validator<ObjectResult<EVERY, SHAPE, EXACT>> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = 'definition',
		schemaDomain: SchemaDomain
	): ObjectValidator {
		const validator = new ObjectValidator();

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

		if ('shape' in definition) {
			if (!JSON.isShallowObject(definition['shape']))
				throw new DefinitionError(`Expected an Object`, `${path}.shape`);

			const shape: Record<string, Validator> = {};
			const errors: DefinitionError[] = [];

			for (const [key, value] of Object.entries(definition['shape'])) {
				try {
					shape[key] = schemaDomain.fromJSON(value, `${path}.shape.${key}`);
				} catch (e) {
					errors.push(e instanceof Error ? e : new Error(String(e), {cause: e}));
				}
			}

			if (errors.length > 0)
				throw new AggregateError(errors);

			validator._shape = shape;
		}

		if ('exact' in definition) {
			if (!JSON.isBoolean(definition['exact']))
				throw new DefinitionError(`Expected a Boolean`, `${path}.exact`);

			validator._exact = definition['exact'];
		}

		return validator;
	}

	protected _min: number | null = null;
	protected _max: number | null = null;
	protected _every: Validator | null = null;
	protected _shape: Record<string, Validator> | null = null;
	protected _exact: boolean = false;

	public min(value: number): this {
		this._min = value;

		return this;
	}

	public max(value: number): this {
		this._max = value;

		return this;
	}

	public every<const V extends Validator>(
		validator: V
	): ObjectValidator<
		InferValidatorReturnType<V>,
		SHAPE,
		EXACT,
		InferDefinitionType<V>,
		SHAPEDEFINITION
	> {
		this._every = validator;

		return this as unknown as ObjectValidator<
			InferValidatorReturnType<V>,
			SHAPE,
			EXACT,
			InferDefinitionType<V>,
			SHAPEDEFINITION
		>;
	}

	public shape<const S extends Record<string, Validator>>(
		shape: S
	): ObjectValidator<
		EVERY,
		ShapeResult<S>,
		EXACT,
		EVERYDEFINITION,
		ShapeDefinition<S>
	> {
		this._shape = shape;

		return this as unknown as ObjectValidator<
			EVERY,
			ShapeResult<S>,
			EXACT,
			EVERYDEFINITION,
			ShapeDefinition<S>
		>;
	}

	public exact(): ObjectValidator<
		EVERY,
		SHAPE,
		true,
		EVERYDEFINITION,
		SHAPEDEFINITION
	> {
		this._exact = true;

		return this as unknown as ObjectValidator<
			EVERY,
			SHAPE,
			true,
			EVERYDEFINITION,
			SHAPEDEFINITION
		>;
	}

	public assert(data: unknown, path: string = 'data'): asserts data is ObjectResult<EVERY, SHAPE, EXACT> {
		if (!JSON.isShallowObject(data))
			throw new AssertError(`Expected an Object`, path);

		const keys = Object.keys(data);

		if (this._min !== null && keys.length < this._min)
			throw new AssertError(`Expected at least ${this._min} properties`, path);

		if (this._max !== null && keys.length > this._max)
			throw new AssertError(`Expected at most ${this._max} properties`, path);

		const errors: Error[] = [];

		if (this._shape !== null) {
			for (const [key, validator] of Object.entries(this._shape)) {
				if (!(key in data)) {
					errors.push(new AssertError(`Expected property`, `${path}.${key}`));
					continue;
				}

				try {
					const currentValidator: Validator = validator;

					currentValidator.assert(data[key], `${path}.${key}`);
				} catch (e) {
					errors.push(e instanceof Error ? e : new Error(String(e), {cause: e}));
				}
			}
		}

		if (this._exact && this._shape !== null) {
			for (const key of keys) {
				if (!(key in this._shape))
					errors.push(new AssertError(`Unexpected property`, `${path}.${key}`));
			}
		}

		if (this._every !== null) {
			for (const [key, value] of Object.entries(data)) {
				try {
					const everyValidator: Validator = this._every;

					everyValidator.assert(value, `${path}.${key}`);
				} catch (e) {
					errors.push(e instanceof Error ? e : new Error(String(e), {cause: e}));
				}
			}
		}

		if (errors.length > 0)
			throw new AggregateError(errors);
	}

	public isSameValidator(other: Validator): other is ObjectValidator {
		return this.constructor === other.constructor;
	}

	public clone(): this {
		const validator = new ObjectValidator() as this;

		validator._min = this._min;
		validator._max = this._max;
		validator._every = this._every ? this._every.clone() : null;
		validator._exact = this._exact;

		if (this._shape !== null) {
			validator._shape = {};

			for (const [key, value] of Object.entries(this._shape))
				validator._shape[key] = value.clone();
		}
		else {
			validator._shape = null;
		}

		return validator;
	}

	public isEqual(other: Validator): other is this {
		if (!this.isSameValidator(other))
			return false;

		if (this._min !== other._min)
			return false;

		if (this._max !== other._max)
			return false;

		if (this._exact !== other._exact)
			return false;

		if (this._every === null !== (other._every === null))
			return false;

		if (this._every !== null && other._every !== null && !this._every.isEqual(other._every))
			return false;

		if (this._shape === null !== (other._shape === null))
			return false;

		if (this._shape !== null && other._shape !== null) {
			const leftKeys = Object.keys(this._shape);
			const rightKeys = Object.keys(other._shape);

			if (leftKeys.length !== rightKeys.length)
				return false;

			for (const key of leftKeys) {
				const left = this._shape[key];
				const right = other._shape[key];

				if (right === undefined || left === undefined)
					return false;

				if (!left.isEqual(right))
					return false;
			}
		}

		return true;
	}

	protected _effectiveMin(): number {
		const shapeMin = this._shape !== null ? Object.keys(this._shape).length : 0;

		if (this._min === null)
			return shapeMin;

		return Math.max(this._min, shapeMin);
	}

	protected _effectiveMax(): number | null {
		if (this._exact && this._shape !== null)
			return Object.keys(this._shape).length;

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

	public merge(other: Validator, path: string = 'validator'): ObjectValidator {
		if (!this.isSameValidator(other))
			throw new MergeError(`Conflicting Validator Subclasses`, path, {
				cause: {left: this, right: other}
			});

		const validator = new ObjectValidator();

		if (this._min !== null && other._min !== null)
			validator._min = Math.max(this._min, other._min);
		else
			validator._min = this._min !== null ? this._min : other._min;

		if (this._max !== null && other._max !== null)
			validator._max = Math.min(this._max, other._max);
		else
			validator._max = this._max !== null ? this._max : other._max;

		validator._exact = this._exact || other._exact;

		if (this._every !== null && other._every !== null)
			validator._every = this._every.merge(other._every, `${path}.every`);
		else
			validator._every = this._every !== null
				? this._every.clone()
				: other._every !== null
					? other._every.clone()
					: null;

		const shape: Record<string, Validator> = {};

		if (this._shape !== null) {
			for (const [key, value] of Object.entries(this._shape))
				shape[key] = value.clone();
		}

		if (other._shape !== null) {
			for (const [key, value] of Object.entries(other._shape)) {
				if (shape[key] !== undefined)
					shape[key] = shape[key].merge(value, `${path}.shape.${key}`);
				else
					shape[key] = value.clone();
			}
		}

		validator._shape = Object.keys(shape).length > 0 ? shape : null;

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

		if (other._exact) {
			if (!this._exact)
				return false;

			const thisKeys = Object.keys(this._shape ?? {});
			const otherKeys = Object.keys(other._shape ?? {});

			if (thisKeys.length !== otherKeys.length)
				return false;

			for (const key of otherKeys) {
				if (!thisKeys.includes(key))
					return false;
			}
		}

		if (other._shape !== null) {
			if (this._shape === null)
				return false;

			for (const [key, otherValidator] of Object.entries(other._shape)) {
				const thisValidator = this._shape[key];

				if (thisValidator === undefined)
					return false;

				if (!thisValidator.isSubset(otherValidator))
					return false;
			}
		}

		if (other._every !== null) {
			if (this._every !== null) {
				if (!this._every.isSubset(other._every))
					return false;
			}
			else if (this._exact && this._shape !== null) {
				for (const validator of Object.values(this._shape)) {
					if (!validator.isSubset(other._every))
						return false;
				}
			}
			else {
				return false;
			}
		}

		return true;
	}

	public toJSON(): ObjectValidatorDefinition<EVERYDEFINITION, SHAPEDEFINITION> {
		const definition: ObjectValidatorDefinition = {
			type: 'object'
		};

		if (this._min !== null)
			definition.min = this._min;

		if (this._max !== null)
			definition.max = this._max;

		if (this._every !== null)
			definition.every = this._every.toJSON();

		if (this._shape !== null) {
			const shape: Record<string, Definition> = {};

			for (const [key, value] of Object.entries(this._shape))
				shape[key] = value.toJSON();

			definition.shape = shape;
		}

		if (this._exact)
			definition.exact = true;

		return definition as ObjectValidatorDefinition<EVERYDEFINITION, SHAPEDEFINITION>;
	}
}