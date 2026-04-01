import {Validator} from './Validator';
import {fromJSON} from './lib/fromJSON';

export {Validator};

import {
	JSONValidatorDefinition,
	BooleanValidatorDefinition,
	NumberValidatorDefinition,
	StringValidatorDefinition,
	ArrayValidatorDefinition,
	ObjectValidatorDefinition
} from './Definitions';

import {
	JSONValidator,
	BooleanValidator,
	NumberValidator,
	StringValidator,
	ArrayValidator,
	ObjectValidator
} from './Validators';

import {
	JSONBuilder,
	BooleanBuilder,
	NumberBuilder,
	StringBuilder,
	ArrayBuilder,
	ObjectBuilder
} from './Builders';

export class Schema {
	// Static Factories for Builders
	static get JSON(): JSONBuilder {
		return new JSONBuilder();
	}

	static get Boolean(): BooleanBuilder {
		return new BooleanBuilder();
	}

	static get Number(): NumberBuilder {
		return new NumberBuilder();
	}

	static get String(): StringBuilder {
		return new StringBuilder();
	}

	static get Array(): ArrayBuilder {
		return new ArrayBuilder();
	}

	static get Object(): ObjectBuilder {
		return new ObjectBuilder();
	}

	// Static fromJSON. Returns a basic Validator with no Type Inference
	static fromJSON(definition: unknown, path: string = 'definition'): Validator {
		return fromJSON(definition, path);
	}

	// Utility Method for Checking if a variable holds a valid Definition
	static assertDefinition(definition: unknown, path: string = 'definition'): asserts definition is Definition {
		this.fromJSON(definition, path);
	}

	// Utility Method for validating a Definition
	static validateDefinition(definition: unknown, path: string = 'definition'): Definition {
		this.assertDefinition(definition, path);

		return definition;
	}

	// Utility Method for Type-Guarding a Definition
	static isDefinition(definition: unknown, path: string = 'definition'): definition is Definition {
		try {
			this.assertDefinition(definition, path);

			return true;
		} catch (e) {
			return false;
		}
	}
}

// Export all Definitions as a Namespace
export namespace Definitions {
	export type JSON = JSONValidatorDefinition;
	export type Boolean = BooleanValidatorDefinition;
	export type Number = NumberValidatorDefinition;
	export type String = StringValidatorDefinition;
	export type Array = ArrayValidatorDefinition;
	export type Object = ObjectValidatorDefinition;
}

// Utility Type describing all Definitions as a Union
export type Definition =
	JSONValidatorDefinition |
	BooleanValidatorDefinition |
	NumberValidatorDefinition |
	StringValidatorDefinition |
	ArrayValidatorDefinition |
	ObjectValidatorDefinition

// All Validators for re-use (for example, building custom Validators with these as a Basis)
export const Validators = {
	JSON: JSONValidator,
	Boolean: BooleanValidator,
	Number: NumberValidator,
	String: StringValidator,
	Array: ArrayValidator,
	Object: ObjectValidator
} as const;

// All Builders for re-use
export const Builders = {
	JSON: JSONBuilder,
	Boolean: BooleanBuilder,
	Number: NumberBuilder,
	String: StringBuilder,
	Array: ArrayBuilder,
	Object: ObjectBuilder
}

// Extra Utilities to infer a Definition Type or a Validator Return Type for statically defined Schemas
export {InferDefinitionType, InferValidatorReturnType} from './lib/util';