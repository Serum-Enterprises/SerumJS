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

interface ObjectValidatorRules {
	min: number | null;
	max: number | null;
	every: Validator | null;
	shape: Readonly<Record<string, Validator>> | null;
	exact: boolean;
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
		const rules: ObjectValidatorRules = {
			min: null,
			max: null,
			every: null,
			shape: null,
			exact: false
		};

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

			rules.shape = shape;
		}

		if ('exact' in definition) {
			if (!JSON.isBoolean(definition['exact']))
				throw new DefinitionError(`Expected a Boolean`, `${path}.exact`);

			rules.exact = definition['exact'];
		}

		return new ObjectValidator(rules);
	}

	public constructor(
		public readonly rules: Readonly<ObjectValidatorRules> = {
			min: null,
			max: null,
			every: null,
			shape: null,
			exact: false
		}
	) {super();}

	public min(min: number): ObjectValidator<EVERY, SHAPE, EXACT, EVERYDEFINITION, SHAPEDEFINITION> {
		return new ObjectValidator<EVERY, SHAPE, EXACT, EVERYDEFINITION, SHAPEDEFINITION>({
			...this.rules,
			every: this.rules.every ? this.rules.every.clone(): this.rules.every,
			shape: this.rules.shape ?
				Object.fromEntries(Object.entries(this.rules.shape).map(([key, value]) => [key, value.clone()])) :
				this.rules.shape,
			min
		});
	}

	public max(max: number): ObjectValidator<EVERY, SHAPE, EXACT, EVERYDEFINITION, SHAPEDEFINITION> {
		return new ObjectValidator<EVERY, SHAPE, EXACT, EVERYDEFINITION, SHAPEDEFINITION>({
			...this.rules,
			every: this.rules.every ? this.rules.every.clone(): this.rules.every,
			shape: this.rules.shape ?
				Object.fromEntries(Object.entries(this.rules.shape).map(([key, value]) => [key, value.clone()])) :
				this.rules.shape,
			max
		});
	}

	public every<const V extends Validator>(
		every: V
	): ObjectValidator<
		InferValidatorReturnType<V>,
		SHAPE,
		EXACT,
		InferDefinitionType<V>,
		SHAPEDEFINITION
	> {
		return new ObjectValidator<
			InferValidatorReturnType<V>,
			SHAPE,
			EXACT,
			InferDefinitionType<V>,
			SHAPEDEFINITION
		>({
			...this.rules,
			every,
			shape: this.rules.shape ?
				Object.fromEntries(Object.entries(this.rules.shape).map(([key, value]) => [key, value.clone()])) :
				this.rules.shape,
		});
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
		return new ObjectValidator<
			EVERY,
			ShapeResult<S>,
			EXACT,
			EVERYDEFINITION,
			ShapeDefinition<S>
		>({
			...this.rules,
			every: this.rules.every ? this.rules.every.clone() : this.rules.every,
			shape,
		});
	}

	public exact(): ObjectValidator<
		EVERY,
		SHAPE,
		true,
		EVERYDEFINITION,
		SHAPEDEFINITION
	> {
		return new ObjectValidator<EVERY, SHAPE, true, EVERYDEFINITION, SHAPEDEFINITION>({
			...this.rules,
			exact: true,
			every: this.rules.every ? this.rules.every.clone(): this.rules.every,
			shape: this.rules.shape ?
				Object.fromEntries(Object.entries(this.rules.shape).map(([key, value]) => [key, value.clone()])) :
				this.rules.shape,
		});
	}

	public assert(data: unknown, path: string = 'data'): asserts data is ObjectResult<EVERY, SHAPE, EXACT> {
		if (!JSON.isShallowObject(data))
			throw new AssertError(`Expected an Object`, path);

		const keys = Object.keys(data);

		if (this.rules.min !== null && keys.length < this.rules.min)
			throw new AssertError(`Expected at least ${this.rules.min} properties`, path);

		if (this.rules.max !== null && keys.length > this.rules.max)
			throw new AssertError(`Expected at most ${this.rules.max} properties`, path);

		const errors: Error[] = [];

		if (this.rules.shape !== null) {
			for (const [key, validator] of Object.entries(this.rules.shape)) {
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

		if (this.rules.exact && this.rules.shape !== null) {
			for (const key of keys) {
				if (!(key in this.rules.shape))
					errors.push(new AssertError(`Unexpected property`, `${path}.${key}`));
			}
		}

		if (this.rules.every !== null) {
			for (const [key, value] of Object.entries(data)) {
				try {
					const everyValidator: Validator = this.rules.every;

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
		return new ObjectValidator<EVERY, SHAPE, EXACT, EVERYDEFINITION, SHAPEDEFINITION>({
			...this.rules,
			every: this.rules.every ? this.rules.every.clone(): this.rules.every,
			shape: this.rules.shape ?
				Object.fromEntries(Object.entries(this.rules.shape).map(([key, value]) => [key, value.clone()])) :
				this.rules.shape,
		}) as this;
	}

	public isEqual(other: Validator): other is this {
		if (!this.isSameValidator(other))
			return false;

		if (this.rules.min !== other.rules.min)
			return false;

		if (this.rules.max !== other.rules.max)
			return false;

		if (this.rules.exact !== other.rules.exact)
			return false;

		if (this.rules.every === null !== (other.rules.every === null))
			return false;

		if (this.rules.every !== null && other.rules.every !== null && !this.rules.every.isEqual(other.rules.every))
			return false;

		if (this.rules.shape === null !== (other.rules.shape === null))
			return false;

		if (this.rules.shape !== null && other.rules.shape !== null) {
			const leftKeys = Object.keys(this.rules.shape);
			const rightKeys = Object.keys(other.rules.shape);

			if (leftKeys.length !== rightKeys.length)
				return false;

			for (const key of leftKeys) {
				const left = this.rules.shape[key];
				const right = other.rules.shape[key];

				if (right === undefined || left === undefined)
					return false;

				if (!left.isEqual(right))
					return false;
			}
		}

		return true;
	}

	protected _effectiveMin(): number {
		const shapeMin = this.rules.shape !== null ? Object.keys(this.rules.shape).length : 0;

		if (this.rules.min === null)
			return shapeMin;

		return Math.max(this.rules.min, shapeMin);
	}

	protected _effectiveMax(): number | null {
		if (this.rules.exact && this.rules.shape !== null)
			return Object.keys(this.rules.shape).length;

		return this.rules.max;
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

	public merge(other: Validator, path: string = 'validator'): ObjectValidator<
		EVERY,
		SHAPE,
		EXACT,
		EVERYDEFINITION,
		SHAPEDEFINITION
	> {
		if (!this.isSameValidator(other))
			throw new MergeError(`Conflicting Validator Subclasses`, path, {
				cause: {left: this, right: other}
			});

		const rules: ObjectValidatorRules = {
			min: null,
			max: null,
			exact: false,
			every: null,
			shape: null
		}

		if (this.rules.min !== null && other.rules.min !== null)
			rules.min = Math.max(this.rules.min, other.rules.min);
		else
			rules.min = this.rules.min !== null ? this.rules.min : other.rules.min;

		if (this.rules.max !== null && other.rules.max !== null)
			rules.max = Math.min(this.rules.max, other.rules.max);
		else
			rules.max = this.rules.max !== null ? this.rules.max : other.rules.max;

		rules.exact = this.rules.exact || other.rules.exact;

		if (this.rules.every !== null && other.rules.every !== null)
			rules.every = this.rules.every.merge(other.rules.every, `${path}.every`);
		else
			rules.every = this.rules.every !== null
				? this.rules.every.clone()
				: other.rules.every !== null
					? other.rules.every.clone()
					: null;

		const shape: Record<string, Validator> = {};

		if (this.rules.shape !== null) {
			for (const [key, value] of Object.entries(this.rules.shape))
				shape[key] = value.clone();
		}

		if (other.rules.shape !== null) {
			for (const [key, value] of Object.entries(other.rules.shape)) {
				if (shape[key] !== undefined)
					shape[key] = shape[key].merge(value, `${path}.shape.${key}`);
				else
					shape[key] = value.clone();
			}
		}

		rules.shape = Object.keys(shape).length > 0 ? shape : null;

		return new ObjectValidator(rules);
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

		if (other.rules.exact) {
			if (!this.rules.exact)
				return false;

			const thisKeys = Object.keys(this.rules.shape ?? {});
			const otherKeys = Object.keys(other.rules.shape ?? {});

			if (thisKeys.length !== otherKeys.length)
				return false;

			for (const key of otherKeys) {
				if (!thisKeys.includes(key))
					return false;
			}
		}

		if (other.rules.shape !== null) {
			if (this.rules.shape === null)
				return false;

			for (const [key, otherValidator] of Object.entries(other.rules.shape)) {
				const thisValidator = this.rules.shape[key];

				if (thisValidator === undefined)
					return false;

				if (!thisValidator.isSubset(otherValidator))
					return false;
			}
		}

		if (other.rules.every !== null) {
			if (this.rules.every !== null) {
				if (!this.rules.every.isSubset(other.rules.every))
					return false;
			}
			else if (this.rules.exact && this.rules.shape !== null) {
				for (const validator of Object.values(this.rules.shape)) {
					if (!validator.isSubset(other.rules.every))
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

		if (this.rules.min !== null)
			definition.min = this.rules.min;

		if (this.rules.max !== null)
			definition.max = this.rules.max;

		if (this.rules.every !== null)
			definition.every = this.rules.every.toJSON();

		if (this.rules.shape !== null) {
			const shape: Record<string, Definition> = {};

			for (const [key, value] of Object.entries(this.rules.shape))
				shape[key] = value.toJSON();

			definition.shape = shape;
		}

		if (this.rules.exact)
			definition.exact = true;

		return definition as ObjectValidatorDefinition<EVERYDEFINITION, SHAPEDEFINITION>;
	}
}