import {Validator} from './Validator';
import {fromJSON} from './lib/fromJSON';

export {Validator};

import {JSONValidator} from './Validators/JSON';
import {BooleanValidator} from './Validators/Boolean';
import {NumberValidator} from './Validators/Number';
import {StringValidator} from './Validators/String';
import {ArrayValidator} from './Validators/Array';
import {ObjectValidator} from './Validators/Object';

import {
	JSONValidatorDefinition,
	BooleanValidatorDefinition,
	NumberValidatorDefinition,
	StringValidatorDefinition,
	ArrayValidatorDefinition,
	ObjectValidatorDefinition
} from './Definitions';

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

	static assertDefinition(definition: unknown, path: string = 'definition'): asserts definition is Definition {
		this.fromJSON(definition, path);
	}

	static validateDefinition(definition: unknown, path: string = 'definition'): Definition {
		this.assertDefinition(definition, path);

		return definition;
	}

	static isDefinition(definition: unknown, path: string = 'definition'): definition is Definition {
		try {
			this.assertDefinition(definition, path);

			return true;
		} catch (e) {
			return false;
		}
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