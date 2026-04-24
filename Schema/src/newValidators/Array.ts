import {JSON} from '@serum-enterprises/json';
import type {SchemaDomain} from '../SchemaDomain';
import {type Definition, type UnknownDefinition, Validator} from '../Validator';
import {DefinitionError} from "../lib/errors";

type ArrayResult<EVERY, TUPLE> =
	TUPLE extends readonly unknown[]
		? [...{ [K in keyof TUPLE]: TUPLE[K] & EVERY }, ...EVERY[]]
		: EVERY[];

export interface ArrayValidatorDefinition<
	EVERYDEFINITION extends Definition = Definition,
	TUPLEDEFINITION extends readonly Definition[] = readonly Definition[]
> extends Definition {
	type: 'array',
	min?: number,
	max?: number,
	tuple?: TUPLEDEFINITION,
	every?: EVERYDEFINITION
}

export class ArrayValidator<
	EVERY = unknown,
	TUPLE extends readonly unknown[] = unknown[],
	EVERYDEFINITION extends Definition = Definition,
	TUPLEDEFINITION extends readonly Definition[] = Definition[]
> extends Validator<ArrayResult<EVERY, TUPLE>> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = 'definition',
		schemaDomain: SchemaDomain
	): Validator {
		const validator = new ArrayValidator();

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

		if ('tuple' in definition) {
			if (!JSON.isShallowArray(definition['tuple']))
				throw new DefinitionError(`Expected an Array`, `${path}.tuple`);

			const tupleSchemas: Validator[] = [];
			const errors: Error[] = [];

			definition['tuple'].forEach((definition, index) => {
				try {
					tupleSchemas.push(schemaDomain.fromJSON(definition, `${path}.tuple[${index}]`));
				} catch (e) {
					if (e instanceof Error)
						errors.push(e);
					else
						errors.push(new DefinitionError(`Unknown Error thrown`, `${path}.tuple[${index}]`, {cause: e}));
				}
			});

			if (errors.length > 0)
				throw new AggregateError(errors);

			validator._tuple = tupleSchemas;
		}

		return validator;
	}

	protected _min: number | null = null;
	protected _max: number | null = null;
	protected _every: Validator | null = null;
	protected _tuple: (readonly Validator[]) | null = null;

	public clone(): this {
		const validator = new ArrayValidator() as this;

		validator._min = this._min;
		validator._max = this._max;
		validator._every = this._every ? this._every.clone() : this._every;
		validator._tuple = this._tuple ? this._tuple.map(v => v.clone()) : this._tuple;

		return validator;
	}

	public toJSON(): ArrayValidatorDefinition<EVERYDEFINITION, TUPLEDEFINITION> {
		const definition: ArrayValidatorDefinition = {
			type: 'array'
		};

		if (this._min !== null)
			definition.min = this._min;

		if (this._max !== null)
			definition.max = this._max;

		if(this._every !== null)
			definition.every = this._every.toJSON() as EVERYDEFINITION;

		if(this._tuple !== null)
			definition.tuple = this._tuple.map(v => v.toJSON());

		return definition as ArrayValidatorDefinition<EVERYDEFINITION, TUPLEDEFINITION>;
	}
}