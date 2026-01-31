import * as JSON from '@serum-enterprises/json';
import type {Validator} from './validators/Validator';
import {Definition, DefinitionError} from './util';

import {JSONValidator} from './validators/json/JSON';
import {BooleanValidator} from './validators/json/Boolean';
import {NumberValidator} from './validators/json/Number';
import {StringValidator} from './validators/json/String';
import {ArrayValidator} from "./validators/json/Array";
import {ObjectValidator} from './validators/json/Object';
import {IntersectValidator} from './validators/logic/Intersect';
import {UnionValidator} from './validators/logic/Union';

export interface DeserializableValidator {
	fromJSON(definition: Definition & { [key: string]: unknown }, path: string, domain: Registry): Validator;
}

export class Registry {
	static readonly defaultRegistry = {
		json: JSONValidator,
		boolean: BooleanValidator,
		number: NumberValidator,
		string: StringValidator,
		array: ArrayValidator,
		object: ObjectValidator,
		intersect: IntersectValidator,
		union: UnionValidator
	};

	public constructor(
		private _registry: {[key: string]: DeserializableValidator} = Registry.defaultRegistry
	) { }

	public fromJSON(definition: unknown, path: string = 'definition'): Validator {
		if (!JSON.isShallowObject(definition))
			throw new DefinitionError(`Expected ${path} to be an Object`);

		if (!JSON.isString(definition['type']))
			throw new DefinitionError(`Expected ${path}.type to be a String`);

		const validator = this._registry[definition['type']];

		if (!validator)
			throw new DefinitionError(`Expected ${path}.type to be a registered Validator`);

		return validator.fromJSON(definition as Definition & { [key: string]: unknown }, path, this);
	}
}