import {Validator} from './Validator';
import {fromJSON} from './lib/fromJSON';

export {Validator};

import {JSONValidator, JSONValidatorDefinition} from './validators/JSON';
import {BooleanValidator, BooleanValidatorDefinition} from './validators/Boolean';
import {NumberValidator, NumberValidatorDefinition} from './validators/Number';
import {StringValidator, StringValidatorDefinition} from './validators/String';
import {ArrayValidator, ArrayValidatorDefinition} from './validators/Array';
import {ObjectValidator, ObjectValidatorDefinition} from './validators/Object';

export class Schema {
	static get JSON(): JSONValidator {
		return new JSONValidator();
	}

	static get Boolean(): BooleanValidator {
		return new BooleanValidator();
	}

	static get Number(): NumberValidator {
		return new NumberValidator();
	}

	static get String(): StringValidator {
		return new StringValidator();
	}

	static get Array(): ArrayValidator {
		return new ArrayValidator();
	}

	static get Object(): ObjectValidator {
		return new ObjectValidator();
	}

	static fromJSON(definition: unknown, path: string = 'definition'): Validator {
		return fromJSON(definition, path);
	}
}

export const Validators = {
	JSON: JSONValidator,
	Boolean: BooleanValidator,
	Number: NumberValidator,
	String: StringValidator,
	Array: ArrayValidator,
	Object: ObjectValidator
} as const;

export type Definition =
	JSONValidatorDefinition |
	BooleanValidatorDefinition |
	NumberValidatorDefinition |
	StringValidatorDefinition |
	ArrayValidatorDefinition |
	ObjectValidatorDefinition;

export namespace Definitions {
	export type JSON = JSONValidatorDefinition;
	export type Boolean = BooleanValidatorDefinition;
	export type Number = NumberValidatorDefinition;
	export type String = StringValidatorDefinition;
	export type Array = ArrayValidatorDefinition;
	export type Object = ObjectValidatorDefinition;
}

export {InferDefinitionType, InferValidatorReturnType} from './lib/util';