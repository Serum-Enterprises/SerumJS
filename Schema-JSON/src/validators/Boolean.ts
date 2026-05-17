import {JSON} from '@serum-enterprises/json';
import {Validator, AssertError, DefinitionError, Domain} from "@serum-enterprises/schema";
import {Definition, UnknownDefinition} from "../lib/types";

export interface BooleanValidatorDefinition extends Definition {
	type: 'json.boolean';
	equals?: boolean;
}

export class BooleanValidator<T extends boolean = boolean> extends Validator<T> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = 'definition',
		_schemaDomain: Domain
	): BooleanValidator {
		if ('equals' in definition) {
			if (!JSON.isBoolean(definition['equals']))
				throw new DefinitionError(`Expected a Boolean`, `${path}.equals`);

			return new BooleanValidator({equals: definition['equals']});
		}

		return new BooleanValidator({equals: null});
	}

	public constructor(
		public readonly rules: { readonly equals: boolean | null } = {equals: null}
	) { super(); }

	public equals<const V extends boolean>(equals: V): BooleanValidator<V> {
		return new BooleanValidator<V>({...this.rules, equals});
	}

	public assert(data: unknown, path: string = 'data'): asserts data is T {
		if (typeof data !== 'boolean')
			throw new AssertError(`Expected a Boolean`, path);

		if (this.rules.equals !== null && this.rules.equals !== data)
			throw new AssertError(`Expected ${this.rules.equals}`, path);
	}

	public clone(): this {
		return new BooleanValidator({...this.rules}) as this;
	}

	public toJSON(): BooleanValidatorDefinition {
		const definition: BooleanValidatorDefinition = {
			type: 'json.boolean'
		};

		if (this.rules.equals !== null)
			definition['equals'] = this.rules.equals;

		return definition;
	}
}