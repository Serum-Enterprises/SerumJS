import type {SchemaDomain} from '../SchemaDomain';
import {type Definition, type UnknownDefinition, Validator} from '../Validator';

export interface NeverValidatorDefinition extends Definition {
	type: 'never'
}

export class NeverValidator extends Validator<never> {
	public static fromJSON(
		_definition: UnknownDefinition,
		_path: string = 'definition',
		_schemaDomain: SchemaDomain
	): NeverValidator {
		return new NeverValidator();
	}

	public isEqual(other: Validator): other is this {
		return this.isSameSubclass(other);
	}

	public clone(): this {
		return new NeverValidator() as this;
	}

	public toJSON(): NeverValidatorDefinition {
		return {
			type: 'never'
		};
	}
}