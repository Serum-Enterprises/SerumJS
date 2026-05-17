import {Definition, UnknownDefinition} from "../lib/types";
import {Validator, AssertError, Domain} from '@serum-enterprises/schema';

export interface NullValidatorDefinition extends Definition {
	type: 'json.null'
}

export class NullValidator extends Validator<null> {
	public static fromJSON(
		_definition: UnknownDefinition,
		_path: string = 'definition',
		_schemaDomain: Domain
	): NullValidator {
		return new NullValidator();
	}

	public assert(data: unknown, path: string = 'data'): asserts data is null {
		if (data !== null)
			throw new AssertError(`Expected null`, path);
	}

	public clone(): this {
		return new NullValidator() as this;
	}

	public toJSON(): NullValidatorDefinition {
		return {
			type: 'json.null'
		};
	}
}
