import type {SchemaDomain} from '../SchemaDomain';
import {type Definition, type UnknownDefinition, Validator} from '../Validator';

export interface NullValidatorDefinition extends Definition {
	type: 'null'
}

export class NullValidator extends Validator<null> {
	public static fromJSON(
		_definition: UnknownDefinition,
		_path: string = 'definition',
		_schemaDomain: SchemaDomain
	): NullValidator {
		return new NullValidator();
	}

	public isEqual(other: Validator): other is this {
		return this.isSameSubclass(other);
	}

	public clone(): this {
		return new NullValidator() as this;
	}

	public toJSON(): NullValidatorDefinition {
		return {
			type: 'null'
		};
	}
}