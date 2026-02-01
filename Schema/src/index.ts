export {Registry} from './Registry';
export {Validator} from './validators/Validator';

import {JSONValidator, JSONValidatorDefinition} from './validators/json/JSON';
import {BooleanValidator, BooleanValidatorDefinition} from './validators/json/Boolean';
import {NumberValidator, NumberValidatorDefinition} from './validators/json/Number';
import {StringValidator, StringValidatorDefinition} from './validators/json/String';
import {ArrayValidator, ArrayValidatorDefinition} from './validators/json/Array';
import {ObjectValidator, ObjectValidatorDefinition} from './validators/json/Object';

import {IntersectValidator, IntersectValidatorDefinition} from './validators/logic/Intersect';
import {UnionValidator, UnionValidatorDefinition} from './validators/logic/Union';

export const Validators = {
	JSON: {
		JSON: JSONValidator,
		Boolean: BooleanValidator,
		Number: NumberValidator,
		String: StringValidator,
		Array: ArrayValidator,
		Object: ObjectValidator
	},
	Logic: {
		Intersect: IntersectValidator,
		Union: UnionValidator
	}
} as const;

export namespace Definitions {
	export namespace JSON {
		export type JSON = JSONValidatorDefinition;
		export type Boolean = BooleanValidatorDefinition;
		export type Number = NumberValidatorDefinition;
		export type String = StringValidatorDefinition;
		export type Array = ArrayValidatorDefinition;
		export type Object = ObjectValidatorDefinition;
	}

	export namespace Logic {
		export type Intersect = IntersectValidatorDefinition;
		export type Union = UnionValidatorDefinition;
	}
}