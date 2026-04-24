import {JSON} from '@serum-enterprises/json';
import {Validator, Definition, UnknownDefinition} from '../Validator';
import {DefinitionError} from '../lib/errors';
import type {SchemaDomain} from '../SchemaDomain';

type ObjectResult<TUPLE, SHAPE, EXACT extends boolean> =
	SHAPE extends { [key: string]: unknown }
		? EXACT extends true
			? { [K in keyof SHAPE]: SHAPE[K] & TUPLE }
			: { [K in keyof SHAPE]: SHAPE[K] & TUPLE } & { [key: string]: TUPLE }
		: { [key: string]: TUPLE };

export interface ObjectValidatorDefinition<
	// Every & Shape Definitions (as E & S)
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
	SHAPE = {readonly [key: string]: unknown},
	EVERYDEFINITION extends Definition = Definition,
	SHAPEDEFINITION extends { readonly [key: string]: Definition } = { [key: string]: Definition },
	EXACT extends boolean = false
> extends Validator<ObjectResult<EVERY, SHAPE, EXACT>> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = "definition",
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

			const shape: { [key: string]: Validator } = {};
			const errors: DefinitionError[] = [];

			for (const [key, value] of Object.entries(definition['shape'])) {
				try {
					shape[key] = schemaDomain.fromJSON(value, `${path}.shape.${key}`);
				} catch (e) {
					if (e instanceof Error)
						errors.push(e);
					else
						errors.push(new DefinitionError(`Unknown Error thrown`, `${path}.shape.${key}`, {cause: e}));
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
	protected _shape: { [key: string]: Validator } | null = null;
	protected _exact: boolean = false;

	public isEqual(other: Validator): other is this {
		if (!this.isSameSubclass(other))
			return false;

		let result = true;

		result = result && this._min === other._min && this._max === other._max && this._exact === other._exact;

		if (this._every === null || other._every === null)
			result = result && this._every === other._every;
		else
			result = result && this._every.isEqual(other._every);

		if (this._shape === null || other._shape === null) {
			result = result && this._shape === other._shape;
		}
		else {
			const thisKeys = Object.keys(this._shape);
			const otherKeys = Object.keys(other._shape);

			result = result && thisKeys.length === otherKeys.length;

			for (const key of thisKeys) {
				const left = this._shape[key];
				const right = other._shape[key];

				result = result && right !== undefined && left !== undefined && left.isEqual(right);
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

	public toJSON(): ObjectValidatorDefinition<EVERYDEFINITION, SHAPEDEFINITION> {
		const definition: ObjectValidatorDefinition = {
			type: 'object',
		};

		if (this._min !== null)
			definition.min = this._min;

		if (this._max !== null)
			definition.max = this._max;

		if (this._every !== null)
			definition.every = this._every.toJSON();

		if (this._shape !== null) {
			definition.shape = Object.fromEntries(
				Object.entries(this._shape).map(([k, s]) => [k, s.toJSON()])
			);
		}

		if (this._exact)
			definition.exact = this._exact;

		return definition as ObjectValidatorDefinition<EVERYDEFINITION, SHAPEDEFINITION>;
	}
}