import {JSON} from '@serum-enterprises/json';
import {Validator, Domain, DefinitionError, AssertError} from "@serum-enterprises/schema";
import {Definition, UnknownDefinition} from "../lib/types";

export interface StringValidatorDefinition extends Definition {
	type: 'json.string';
	min?: number;
	max?: number;
	equals?: string;
}

export class StringValidator<T extends string = string> extends Validator<T> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = 'definition',
		_schemaDomain: Domain
	): StringValidator {
		const rules: {
			min: number | null,
			max: number | null,
			equals: string | null
		} = {
			min: null,
			max: null,
			equals: null
		};

		if ('min' in definition) {
			if (!JSON.isNumber(definition['min']))
				throw new DefinitionError(`Expected a Number`, `${path}.min`);

			rules.min = definition['min'];
		}

		if ('max' in definition) {
			if (!JSON.isNumber(definition['max']))
				throw new DefinitionError(`Expected a Number`, `${path}.max`);

			rules.max = definition['max'];
		}

		if ('equals' in definition) {
			if (!JSON.isString(definition['equals']))
				throw new DefinitionError(`Expected a String`, `${path}.equals`);

			rules.equals = definition['equals'];
		}

		return new StringValidator(rules);
	}

	public constructor(
		public readonly rules: {
			readonly min: number | null,
			readonly max: number | null,
			readonly equals: string | null
		} = {min: null, max: null, equals: null}
	) { super(); }

	public min(min: number): StringValidator<T> {
		return new StringValidator<T>({...this.rules, min});
	}

	public max(max: number): StringValidator<T> {
		return new StringValidator<T>({...this.rules, max});
	}

	public equals<const V extends string>(equals: V): StringValidator<V> {
		return new StringValidator<V>({...this.rules, equals});
	}

	public assert(data: unknown, path: string = 'data'): asserts data is T {
		if (!JSON.isString(data))
			throw new AssertError(`Expected a String`, path);

		if (this.rules.min !== null && this.rules.min > data.length)
			throw new AssertError(`Expected at least ${this.rules.min} characters`, path);

		if (this.rules.max !== null && this.rules.max < data.length)
			throw new AssertError(`Expected at most ${this.rules.max} characters`, path);

		if (this.rules.equals !== null && this.rules.equals !== data)
			throw new AssertError(`Expected ${this.rules.equals}`, path);
	}

	public clone(): this {
		return new StringValidator({...this.rules}) as this;
	}

	public toJSON(): StringValidatorDefinition {
		const definition: StringValidatorDefinition = {
			type: 'json.string'
		};

		if (this.rules.min !== null)
			definition['min'] = this.rules.min;

		if (this.rules.max !== null)
			definition['max'] = this.rules.max;

		if (this.rules.equals !== null)
			definition['equals'] = this.rules.equals;

		return definition;
	}
}